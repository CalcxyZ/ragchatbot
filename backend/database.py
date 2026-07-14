import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load sensitive environment variables
load_dotenv()

# Initialize the official Google GenAI Client
ai_client = genai.Client()

# Smart client initialization with automatic Cloud fallback
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

if qdrant_url and qdrant_api_key:
    # Connects to your online cloud instance (runs 24/7)
    print("☁️ Connecting to Qdrant Cloud Cluster...")
    qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
else:
    # Falls back to local offline mode if credentials aren't set
    print("💾 Connecting to local Qdrant database...")
    qdrant_client = QdrantClient(path="./qdrant_db")

COLLECTION_NAME = "my_knowledge_base"

def init_vector_db():
    """Verifies or creates the collection using standard 768 dimensions."""
    if not qdrant_client.collection_exists(collection_name=COLLECTION_NAME):
        print(f"Creating fresh collection: {COLLECTION_NAME}")
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                # We target exactly 768 dimensions by truncating our gemini-embedding-001 output
                size=768,
                distance=Distance.CO_SINE if hasattr(Distance, 'CO_SINE') else Distance.COSINE
            )
        )
    else:
        print(f"Collection '{COLLECTION_NAME}' already exists and is ready.")

def get_embedding(text: str, is_query: bool = False) -> list[float]:
    """Generates a 768-dimensional vector using the robust gemini-embedding-001 model."""
    task = "RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT"
    
    # We switch back to gemini-embedding-001 and explicitly request 768-dimensional output
    response = ai_client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task,
            output_dimensionality=768
        )
    )
    
    return response.embeddings[0].values