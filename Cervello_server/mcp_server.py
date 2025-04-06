from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from qdrant_client.http.models import PointIdsList
from uuid import uuid4
from datetime import datetime
import os
from openai import OpenAI
from dotenv import load_dotenv
import time
import json
from typing import List, Dict, Any, Optional
from pymongo import MongoClient


load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "your-mongodb-connection-string")

# Environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")
qdrant_url = os.getenv("QDRANT_HOST")
qdrant_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = "my_collection"
SIMILARITY_THRESHOLD = 0.90

# Pydantic models
class Query(BaseModel):
    question: str

class PromptRequest(BaseModel):
    prompt: str

class DataItem(BaseModel):
    text: str
    id: Any

class UpdateRequest(BaseModel):
    text: str
    id: Optional[str] = None

class DeleteRequest(BaseModel):
    text: str

class AgentRequest(BaseModel):
    query: str
    context: Optional[str] = None

class ToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]

class AgentResponse(BaseModel):
    response: str
    tool_calls: Optional[List[ToolCall]] = None

# Initialize models and clients
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
vector_dim = 384  # for all-MiniLM-L6-v2

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

# Initialize OpenAI client
openai_client = OpenAI(api_key=openai_api_key)

# FastAPI app
app = FastAPI()

# Tool functions
def search_similar_embeddings(query_text: str, limit: int = 10):
    """Search for similar embeddings in the vector database."""
    query_vector = embedding_model.encode(query_text).tolist()
    search_result = qdrant_client.search(
        collection_name=qdrant_collection,
        query_vector=query_vector,
        limit=limit
    )
    return search_result

def add_embedding(text: str, custom_id: str = None):
    """Add a new embedding to the vector database."""
    vector = embedding_model.encode(text).tolist()
    point_id = str(uuid4())
    payload = {"text": text}
    if custom_id:
        payload["id"] = custom_id
    
    point = PointStruct(
        id=point_id,
        vector=vector,
        payload=payload
    )
    
    qdrant_client.upsert(
        collection_name=qdrant_collection,
        points=[point]
    )
    return point_id

def update_similar_embedding(text: str, custom_id: str = None):
    """Update the most similar embedding if similarity is above threshold."""
    vector = embedding_model.encode(text).tolist()
    results = qdrant_client.search(
        collection_name=qdrant_collection,
        query_vector=vector,
        limit=1,
        with_payload=True,
    )
    
    if not results:
        return {"status": "error", "message": "No similar entry found."}
    
    similarity = results[0].score
    old_id = results[0].id
    
    if similarity >= SIMILARITY_THRESHOLD:
        new_id = custom_id or str(uuid4())
        new_point = PointStruct(
            id=old_id,  # Keep the same ID to overwrite
            vector=vector,
            payload={"text": text, "id": new_id}
        )
        qdrant_client.upsert(collection_name=qdrant_collection, points=[new_point])
        return {
            "status": "success", 
            "message": "Entry updated.", 
            "old_id": old_id, 
            "new_id": new_id, 
            "similarity": similarity
        }
    else:
        return {
            "status": "error", 
            "message": "No similar entry above threshold.", 
            "similarity": similarity
        }

def delete_similar_embedding(text: str):
    """Delete the most similar embedding if similarity is above threshold."""
    vector = embedding_model.encode(text).tolist()
    results = qdrant_client.search(
        collection_name=qdrant_collection,
        query_vector=vector,
        limit=1,
        with_payload=True,
    )
    
    if not results:
        return {"status": "error", "message": "No similar entry found."}
    
    similarity = results[0].score
    target_id = results[0].id
    
    if similarity >= SIMILARITY_THRESHOLD:
        qdrant_client.delete(
            collection_name=qdrant_collection, 
            points_selector=PointIdsList(points=[target_id])
        )
        return {
            "status": "success", 
            "message": "Entry deleted.", 
            "id": target_id, 
            "similarity": similarity
        }
    else:
        return {
            "status": "error", 
            "message": "No similar entry above threshold.", 
            "similarity": similarity
        }

def bulk_upload_data(data_items: List[Dict[str, Any]]):
    """Upload multiple data points to the vector database."""
    points = []
    for item in data_items:
        embedding = embedding_model.encode([item["text"]])[0].tolist()
        points.append(
            PointStruct(
                id=str(uuid4()),
                vector=embedding,
                payload={"text": item["text"], "id": item.get("id", str(uuid4()))},
            )
        )
    
    qdrant_client.upsert(collection_name=qdrant_collection, points=points)
    return {"status": "success", "message": f"Uploaded {len(points)} items successfully."}

def query_with_context(query: str):
    """Query the LLM using context from the vector database."""
    # Fetch similar embeddings for context
    search_result = search_similar_embeddings(query, limit=3)
    context_chunks = [hit.payload["text"] for hit in search_result]
    context_text = "\n".join(context_chunks)
    
    # Create prompt with context
    prompt = f"Answer the question using only the context below:\n\n{context_text}\n\nQuestion: {query}\nAnswer:"
    
    # Call LLM
    response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    answer = response.choices[0].message.content.strip()
    
    # Store the query and answer as embeddings
    query_id = add_embedding(query)
    answer_id = add_embedding(answer)
    
    return {"answer": answer, "query_id": query_id, "answer_id": answer_id}

# System prompt for the agent
SYSTEM_PROMPT = """
You are an AI assistant with access to a vector database. You can use the following tools to help answer questions:

1. search_similar_embeddings - Find similar entries in the database
2. query_with_context - Answer questions using context from the database
3. add_embedding - Add new information to the database
4. update_similar_embedding - Update existing information
5. delete_similar_embedding - Delete information
6. bulk_upload_data - Upload multiple data points at once

When you need to use a tool, respond with a tool call in this format:
{
  "tool_calls": [
    {
        "id": tool_call["id"],
        "type": "function",
        "function": {
            "name": tool_call["function"]["name"],
            "arguments": tool_call["function"]["arguments"]
        }
    } for tool_call in tool_calls
]
}

After using tools, provide a helpful response based on the tool results.
"""

# Tool definitions that will be provided to the LLM
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_similar_embeddings",
            "description": "Search for similar embeddings in the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query_text": {
                        "type": "string",
                        "description": "The text to search for"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return (optional)",
                        "default": 10
                    }
                },
                "required": ["query_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_embedding",
            "description": "Add a new embedding to the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text content to embed"
                    },
                    "custom_id": {
                        "type": "string",
                        "description": "Optional custom ID for the embedding"
                    }
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_similar_embedding",
            "description": "Update the most similar embedding if similarity is above threshold",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The new text content"
                    },
                    "custom_id": {
                        "type": "string",
                        "description": "Optional custom ID for the updated embedding"
                    }
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_similar_embedding",
            "description": "Delete the most similar embedding if similarity is above threshold",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to match for deletion"
                    }
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "bulk_upload_data",
            "description": "Upload multiple data points to the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "data_items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "text": {
                                    "type": "string",
                                    "description": "The text content"
                                },
                                "id": {
                                    "type": "string",
                                    "description": "Optional custom ID"
                                }
                            },
                            "required": ["text"]
                        },
                        "description": "Array of data items to upload"
                    }
                },
                "required": ["data_items"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_with_context",
            "description": "Query the LLM using context from the vector database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The question to answer"
                    }
                },
                "required": ["query"]
            }
        }
    }
]
 

# MCP endpoint
@app.post("/mcp/query", response_model=AgentResponse)
async def mcp_query(request: AgentRequest):
    """
    Main MCP endpoint that processes queries and manages tool calling
    """
    # Prepare messages
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    # Add context if provided
    if request.context:
        messages.append({"role": "user", "content": f"Context: {request.context}"})
    
    # Add the user query
    messages.append({"role": "user", "content": request.query})
    
    # Call the LLM with tool capabilities
    response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        tools=TOOL_DEFINITIONS,
        tool_choice="auto"
    )
    
    message = response.choices[0].message
    tool_calls = message.tool_calls
    
    # Process tool calls if any
    if tool_calls:
        # Add the assistant's response to messages
        messages.append({
            "role": "assistant",
            "content": message.content,
            "tool_calls": [
                {
                    "id": tool_call.id,
                    "type": "function",
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    }
                } for tool_call in tool_calls
            ]
        })
        
        # Process each tool call
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # Execute the corresponding function
            result = None
            if function_name == "search_similar_embeddings":
                search_results = search_similar_embeddings(**function_args)
                result = [{"score": hit.score, "payload": hit.payload} for hit in search_results]
            elif function_name == "add_embedding":
                result = add_embedding(**function_args)
            elif function_name == "update_similar_embedding":
                result = update_similar_embedding(**function_args)
            elif function_name == "delete_similar_embedding":
                result = delete_similar_embedding(**function_args)
            elif function_name == "bulk_upload_data":
                result = bulk_upload_data(**function_args)
            elif function_name == "query_with_context":
                result = query_with_context(**function_args)
            
            # Add the tool response to messages
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
        
        # Get the final response after tool use
        final_response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        
        final_content = final_response.choices[0].message.content
        
        # Return the response with tool calls
        return AgentResponse(
            response=final_content,
            tool_calls=[
                ToolCall(
                    name=tool_call.function.name,
                    arguments=json.loads(tool_call.function.arguments)
                ) for tool_call in tool_calls
            ]
        )
    
    # If no tool calls, just return the response
    return AgentResponse(response=message.content)

# Keep the original API endpoints for backward compatibility
@app.post("/llm-query")
async def fetch_with_context(request: PromptRequest):
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
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You're an assistant."},
                {"role": "user", "content": final_prompt},
            ]
        )

        # 5. Add new embedding to vector DB
        add_embedding(prompt)

        # 6. Return OpenAI-style response
        return {"response": response.choices[0].message.content.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_llm(q: Query):
    result = query_with_context(q.question)
    return result

@app.post("/upload")
async def upload_data(data: List[Dict[str, Any]]):
    result = bulk_upload_data(data)
    return result

@app.post("/update")
async def update_entry(new_data: UpdateRequest):
    result = update_similar_embedding(new_data.text, new_data.id)
    return result

@app.post("/delete")
async def delete_entry_by_similarity(data: DeleteRequest):
    result = delete_similar_embedding(data.text)
    return result

# ticket creation

@app.post("/myticket")
async def createTicket(req: CreateTicketRequest):
    ticket_id = str(uuid4())

    ticket_data = {
        "ticketId": ticket_id,
        "userId": req.userId,
        "promptHistory": [item.model_dump() for item in req.promptHistory],
        "status": "open",
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        "metadata": {
            "lowConfidenceReason": req.lowConfidenceReason,
            "createdBySystem": req.createdBySystem
        }
    }

    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        mongo_db = client["nitrous"]
        tickets_collection = mongo_db["tickets"]

        # Insert ticket into the database
        tickets_collection.insert_one(ticket_data)
        return {"message": "Ticket created", "ticketId": ticket_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
