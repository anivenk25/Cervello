from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
import os
import openai
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

load_dotenv()

router = APIRouter()
openai.api_key = os.getenv("OPENAI_API_KEY")

qdrant_collection = os.getenv("QDRANT_COLLECTION_NAME", "my_collection")
qdrant_client = QdrantClient("localhost", port=6333)
model = SentenceTransformer("all-MiniLM-L6-v2")  # or whatever you're using

class PromptRequest(BaseModel):
    prompt: str

@router.post("/llm-query")
def fetch_with_context(request: PromptRequest):
    try:
        prompt = request.prompt
        prompt_vector = model.encode(prompt).tolist()

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
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You're an assistant."},
                {"role": "user", "content": final_prompt},
            ],
        )

        # 5. Add new embedding to vector DB
        qdrant_client.upsert(
            collection_name=qdrant_collection,
            points=[
                models.PointStruct(
                    id=None,  # auto id
                    vector=prompt_vector,
                    payload={"text": prompt}
                )
            ]
        )

        # 6. Return OpenAI-style response
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
