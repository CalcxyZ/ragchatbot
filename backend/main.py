import io
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from qdrant_client.models import PointStruct
from database import qdrant_client, COLLECTION_NAME, get_embedding, init_vector_db, ai_client

# Lazy import helpers to prevent backend startup crashes if libraries are missing
try:
    import pandas as pd
except ImportError:
    pd = None

app = FastAPI(title="RAG Chatbot API")

# Enable CORS for secure local/remote Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database collection on startup
init_vector_db()

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"status": "success", "message": "FastAPI RAG Backend is running and database is verified."}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    file_extension = filename.split(".")[-1].lower()
    
    if file_extension not in ["pdf", "csv", "xlsx", "xls"]:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file format. Please upload a PDF, CSV, or Excel file."
        )
    
    # Check if pandas is installed before attempting to process spreadsheets
    if file_extension in ["csv", "xlsx", "xls"] and pd is None:
        raise HTTPException(
            status_code=500,
            detail="Spreadsheet engines (pandas/openpyxl) are missing on the server. "
                   "Please run: 'pip install pandas openpyxl' in your terminal and restart the server."
        )
    
    try:
        contents = await file.read()
        chunks = []
        
        # --- PDF EXTRACTION ---
        if file_extension == "pdf":
            pdf_stream = io.BytesIO(contents)
            reader = PdfReader(pdf_stream)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            
            chunk_size = 1000
            overlap = 150
            for i in range(0, len(full_text), chunk_size - overlap):
                chunk = full_text[i:i + chunk_size].strip()
                if chunk:
                    chunks.append(chunk)

        # --- CSV / EXCEL EXTRACTION ---
        elif file_extension in ["csv", "xlsx", "xls"]:
            try:
                if file_extension == "csv":
                    df = pd.read_csv(io.BytesIO(contents))
                else:
                    df = pd.read_excel(io.BytesIO(contents))
            except ImportError as e:
                # This catches if openpyxl specifically is missing for Excel files
                raise HTTPException(
                    status_code=500,
                    detail="Excel engine is missing. Please run: 'pip install openpyxl' and restart the server."
                )
            
            df = df.fillna("")
            rows_per_chunk = 5
            temp_rows = []
            
            for index, row in df.iterrows():
                row_items = [f"{col}: {val}" for col, val in row.items() if str(val).strip()]
                row_str = f"Row {index + 1}: " + " | ".join(row_items)
                temp_rows.append(row_str)
                
                if len(temp_rows) >= rows_per_chunk:
                    chunks.append("\n".join(temp_rows))
                    temp_rows = []
            
            if temp_rows:
                chunks.append("\n".join(temp_rows))

        if not chunks:
            raise HTTPException(status_code=400, detail="The uploaded file contains no readable text or data.")

        # --- VECTORIZATION & INGESTION ---
        points = []
        for idx, chunk in enumerate(chunks):
            formatted_text = f"Source Document: {filename}\nContent:\n{chunk}"
            
            vector = get_embedding(formatted_text, is_query=False)
            point_id = str(uuid.uuid4())
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "title": filename,
                        "content": chunk,
                        "full_text": formatted_text
                    }
                )
            )

        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            wait=True,
            points=points
        )

        return {
            "status": "success",
            "filename": filename,
            "chunks_count": len(points)
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        query_vector = get_embedding(user_query, is_query=True)
        
        search_results = qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=4
        )
        
        retrieved_contexts = []
        for hit in search_results.points:
            context_text = f"Source: {hit.payload.get('title')}\nContent: {hit.payload.get('content')}"
            retrieved_contexts.append(context_text)
            
        context_block = "\n\n---\n\n".join(retrieved_contexts) if retrieved_contexts else "No relevant context found."
        
        system_instruction = (
            "You are a helpful company assistant chatbot. Your goal is to answer the user's question "
            "using ONLY the facts provided in the Context section below. Formulate your response in clean "
            "Markdown with headings, lists, bold text, or tables where appropriate to improve readability. "
            "If the answer cannot be found in the Context, reply exactly with: 'I am sorry, but I do not "
            "have that information in my knowledge base.'"
        )
        
        prompt = f"""
{system_instruction}

Context:
{context_block}

User Question: {user_query}
Answer:
"""

        response = ai_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )
        
        return {
            "answer": response.text,
            "sources": [
                {"title": hit.payload.get("title"), "score": hit.score, "content": hit.payload.get("content")}
                for hit in search_results.points
            ]
        }

    except Exception as e:
        print(f"Error during RAG Pipeline query processing: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")