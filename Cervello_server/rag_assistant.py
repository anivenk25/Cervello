from fastapi import FastAPI, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from uuid import uuid4
import os
from openai import OpenAI
from dotenv import load_dotenv
import time

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
qdrant_url = os.getenv("QDRANT_HOST")
qdrant_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = "my_collection"

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
app = FastAPI()

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

    points=[]
    for que in q.question:
        embedding = embedding_model.encode([que])[0].tolist()
        points.append(
            PointStruct(
                id=str(uuid4()),
                vector=embedding,
                payload={"text": que, "id": que},
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
        timestamp = str(int(time.time()))
        time_id = timestamp
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