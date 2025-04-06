from fastapi import FastAPI, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from uuid import uuid4
from datetime import datetime
import os
from openai import OpenAI
from dotenv import load_dotenv
import time
from fastapi import HTTPException
from qdrant_client.http.models import PointIdsList
from controllers import fetch_context
from fastapi import FastAPI
# from api.endpoints.tickets import create_ticket
# from api.endpoints.tickets import router as tickets_router  # Import the router
from pymongo import MongoClient
from typing import List


# initiate server
app = FastAPI()


load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
qdrant_url = os.getenv("QDRANT_HOST")
qdrant_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = "my_collection"

# mongo setup
MONGO_URI = os.getenv("MONGO_URI", "your-mongodb-connection-string")

# --- MongoDB Setup ---
client = MongoClient(MONGO_URI)
mongo_db = client["nitrous"]
tickets_collection = mongo_db["tickets"]


# --- Models ---
from pydantic import BaseModel

class PromptRequest(BaseModel):
    prompt: str

class PromptItem(BaseModel):
    message: str
    role: str  # "user" or "assistant"
    timestamp: str

class CreateTicketRequest(BaseModel):
    userId: str
    promptHistory: List[PromptItem]
    lowConfidenceReason: str = None
    createdBySystem: bool = False


# --- EMBEDDING MODEL ---
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
vector_dim = 384  # for all-MiniLM-L6-v2

# --- QDRANT SETUP ---
qdrant_client = QdrantClient(
    url=qdrant_url,
    api_key=qdrant_key,
)

# Create the collection if it doesn't exist
if not qdrant_client.collection_exists(qdrant_collection):
    qdrant_client.create_collection(
        collection_name=qdrant_collection,
        vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
    )



# --- FASTAPI SERVER ---

from fastapi import HTTPException


@app.post("/llm-query")
def fetch_with_context(request: PromptRequest):
    try:
        prompt = request.prompt
        prompt_vector = embedding_model.encode(prompt).tolist()

        # 1. Search top 10 similar embeddings
        search_result = qdrant_client.search(
            collection_name=qdrant_collection,
            query_vector=prompt_vector,
            limit=10
        )

        # 2. Build context
        context_snippets = [hit.payload.get("text", "") for hit in search_result]
        context = "\n".join(context_snippets)

        # 3. Final prompt
        final_prompt = f"{context}\n\nUser: {prompt}\nAssistant:"

        # 4. Call OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You're an assistant."},
                {"role": "user", "content": final_prompt},
            ]
        )

        # 5. Add new embedding to vector DB
        qdrant_client.upsert(
            collection_name=qdrant_collection,
            points=[
                PointStruct(
                    id=str(uuid4()),
                    vector=prompt_vector,
                    payload={"text": prompt}
                )
            ]
        )

        # 6. Return OpenAI-style response
        return {"response": response.choices[0].message.content.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# app.include_router(fetch_context.router)
# app.include_router(tickets_router, prefix="/api/tickets")

class Query(BaseModel):
    question: str

client = OpenAI(api_key=openai_api_key)

@app.post("/query")
def query_llm(q: Query):
    question = q.question
    question_vec = embedding_model.encode([question])[0].tolist()

    # Search in Qdrant
    search_result = qdrant_client.search(
        collection_name=qdrant_collection,
        query_vector=question_vec,
        limit=3,
    )

    # Extract context from search results
    context_chunks = [hit.payload["text"] for hit in search_result]
    context_text = "\n".join(context_chunks)

    # Prepare prompt for OpenAI
    prompt = f"Answer the question using only the context below:\n\n{context_text}\n\nQuestion: {question}\nAnswer:"
    timestamp = str(int(time.time()))
    time_id = timestamp
    points=[]
    embedding = embedding_model.encode([q.question])[0].tolist()
    points.append(
        PointStruct(
            id=str(uuid4()),
            vector=embedding,
            payload={"text": q.question, "id": time_id},
        )
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        required_ans=response.choices[0].message.content.strip()
        ans_points=[]

        embedding = embedding_model.encode([required_ans])[0].tolist()
        
        ans_points.append(
            PointStruct(
                id=str(uuid4()),
                vector=embedding,
                payload={"text": required_ans, "id": time_id},
            )
        )
        # print(ans_points)
        qdrant_client.upsert(collection_name=qdrant_collection, points=ans_points)
        return {"answer": required_ans, "points": ans_points, "text":required_ans, "id": time_id}
    except Exception as e:
        return {"error": str(e)}

# testing endpoint
@app.post("/upload")
def upload_data(data: list[dict]):
    """
    Upload data to Qdrant collection.
    Expected input: [{"text": "sample text", "id": 1}, ...]
    """
    points = []
    for item in data:
        embedding = embedding_model.encode([item["text"]])[0].tolist()
        points.append(
            PointStruct(
                id=str(uuid4()),
                vector=embedding,
                payload={"text": item["text"], "id": item["id"]},
            )
        )
    # print(points)
    qdrant_client.upsert(collection_name=qdrant_collection, points=points)
    return {"message": "Data uploaded successfully."}


# Similarity threshold for update/delete
SIMILARITY_THRESHOLD = 0.90

@app.post("/update")
def update_entry(new_data: dict):
    """
    Update the closest existing entry in Qdrant if similarity > threshold.
    Input: {"text": "new text", "id": "optional_custom_id"}
    """
    new_text = new_data["text"]
    new_id = new_data.get("id", str(uuid4()))
    new_vec = embedding_model.encode([new_text])[0].tolist()

    # Search for similar entry
    results = qdrant_client.search(
        collection_name=qdrant_collection,
        query_vector=new_vec,
        limit=1,
        with_vectors=False,
        with_payload=True,
    )

    if not results:
        raise HTTPException(status_code=404, detail="No similar entry found.")

    similarity = results[0].score
    old_id = results[0].id

    if similarity >= SIMILARITY_THRESHOLD:
        # Update by replacing the old point with new payload/vector
        new_point = PointStruct(
            id=old_id,  # Keep the same ID to overwrite
            vector=new_vec,
            payload={"text": new_text, "id": new_id}
        )
        qdrant_client.upsert(collection_name=qdrant_collection, points=[new_point])
        return {"message": "Entry updated.", "old_id": old_id, "new_id": new_id, "similarity": similarity}
    else:
        return {"message": "No similar entry above threshold.", "similarity": similarity}

@app.post("/delete")
def delete_entry_by_similarity(data: dict):
    """
    Delete the most similar entry to the input if similarity > threshold.
    Input: {"text": "text to match and delete"}
    """
    text = data["text"]
    vec = embedding_model.encode([text])[0].tolist()

    results = qdrant_client.search(
        collection_name=qdrant_collection,
        query_vector=vec,
        limit=1,
        with_vectors=False,
        with_payload=True,
    )

    if not results:
        raise HTTPException(status_code=404, detail="No similar entry found.")

    similarity = results[0].score
    target_id = results[0].id

    if similarity >= SIMILARITY_THRESHOLD:
        qdrant_client.delete(collection_name=qdrant_collection, points_selector=PointIdsList(points=[target_id]))
        return {"message": "Entry deleted.", "id": target_id, "similarity": similarity}
    else:
        return {"message": "No similar entry above threshold.", "similarity": similarity}


# --- Ticket Creation Endpoint ---
@app.post("/create-ticket")
def create_ticket(payload: CreateTicketRequest):
    ticket_id = str(uuid4())

    ticket_data = {
        "ticketId": ticket_id,
        "userId": payload.userId,
        "promptHistory": [item.model_dump() for item in payload.promptHistory],
        "status": "open",
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        "metadata": {
            "lowConfidenceReason": payload.lowConfidenceReason,
            "createdBySystem": payload.createdBySystem
        }
    }

    try:
        tickets_collection.insert_one(ticket_data)
        return {"message": "Ticket created", "ticketId": ticket_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# --- Example Endpoint to Fetch Tickets ---
@app.get("/tickets")
def get_tickets():
    try:
        tickets = list(tickets_collection.find({}, {"_id": 0}))  # Exclude MongoDB's internal `_id` field
        return {"tickets": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")