import uuid
from qdrant_client.models import PointStruct
from database import qdrant_client, COLLECTION_NAME, get_embedding, init_vector_db

# 1. Sample Knowledge Base Data (Your "textbook")
MOCK_DATA = [
    {
        "title": "Remote Work and Hours of Operation",
        "content": "Our official operating hours are 9:00 AM to 6:00 PM EST. Core collaboration hours are 11:00 AM to 3:00 PM EST, during which all team members should be active and reachable on Slack. Remote work is fully permitted for all engineering roles as long as milestone expectations are met."
    },
    {
        "title": "Home Office Equipment Reimbursement",
        "content": "All full-time employees are eligible to request reimbursement for remote work/home office equipment up to $500 per calendar year. All expense claims must be submitted via the expense portal within 30 days of purchase and must include a legible, itemized receipt."
    },
    {
        "title": "Paid Time Off (PTO) and Vacation Allocations",
        "content": "All full-time employees receive 25 days of paid time off (PTO) annually, accrued monthly at a rate of 2.08 days. We support unlimited sick leave, but any medical absence extending beyond 3 consecutive business days requires a valid medical certificate uploaded to the HR portal."
    }
]

def run_ingestion():
    print("🚀 Starting the knowledge base ingestion process...")
    
    # Ensure the database collection exists before we try uploading to it
    init_vector_db()
    
    points = []
    
    try:
        for idx, doc in enumerate(MOCK_DATA):
            # We format the text nicely so the model has context of titles vs content
            text_to_embed = f"Document Title: {doc['title']}\nContent: {doc['content']}"
            print(f"🔄 Creating embedding for item {idx + 1}/{len(MOCK_DATA)}: '{doc['title']}'...")
            
            try:
                # Step A: Convert raw text to 768-dimensional vector numbers
                vector = get_embedding(text_to_embed, is_query=False)
                
                # Step B: Generate a unique ID (UUID) for this point in Qdrant
                point_id = str(uuid.uuid4())
                
                # Step C: Package the vector and text data
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=vector,
                        payload={
                            "title": doc["title"],
                            "content": doc["content"],
                            "full_text": text_to_embed
                        }
                    )
                )
            except Exception as e:
                print(f"❌ Failed to process '{doc['title']}': {e}")
                return
            
        # Step D: Upload everything to Qdrant
        print(f"📤 Uploading {len(points)} vector points to Qdrant '{COLLECTION_NAME}'...")
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            wait=True,
            points=points
        )
        print("✅ Ingestion complete! Your local Qdrant collection is fully populated.")

    finally:
        # Explicitly close the local Qdrant Client connection before exit.
        # This prevents the Python garbage collector from throwing a shutdown error.
        print("🔌 Closing database connection...")
        qdrant_client.close()

if __name__ == "__main__":
    run_ingestion()