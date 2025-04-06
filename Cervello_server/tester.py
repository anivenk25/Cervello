from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.models import PointStruct, VectorParams, Distance, PointIdsList
from uuid import uuid4
import os
import time
import json
from functools import lru_cache
from openai import OpenAI
from dotenv import load_dotenv
import logging
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", 6333))
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION_NAME", "my_collection")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    VECTOR_DIM: int = 384  # for all-MiniLM-L6-v2
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", 0.90))
    DEFAULT_SEARCH_LIMIT: int = int(os.getenv("DEFAULT_SEARCH_LIMIT", 5))
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
    SYSTEM_PROMPT: str = os.getenv("SYSTEM_PROMPT", "You're a helpful assistant with access to relevant context. Answer user queries based on the provided context when available.")

@lru_cache()
def get_settings():
    return Settings()

# Initialize app
app = FastAPI(title="Enhanced RAG System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton pattern for clients
class Clients:
    _embedding_model = None
    _qdrant_client = None
    _openai_client = None
    
    @classmethod
    def get_embedding_model(cls, settings=Depends(get_settings)):
        if cls._embedding_model is None:
            logger.info(f"Initializing embedding model {settings.EMBEDDING_MODEL}")
            cls._embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return cls._embedding_model
    
    @classmethod
    def get_qdrant_client(cls, settings=Depends(get_settings)):
        if cls._qdrant_client is None:
            if settings.QDRANT_API_KEY:
                logger.info(f"Connecting to Qdrant at {settings.QDRANT_HOST}")
                cls._qdrant_client = QdrantClient(
                    url=settings.QDRANT_HOST,
                    api_key=settings.QDRANT_API_KEY,
                )
            else:
                logger.info(f"Connecting to local Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
                cls._qdrant_client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT
                )
                
            # Create collection if it doesn't exist
            if not cls._qdrant_client.collection_exists(settings.QDRANT_COLLECTION):
                logger.info(f"Creating collection {settings.QDRANT_COLLECTION}")
                cls._qdrant_client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION,
                    vectors_config=VectorParams(size=settings.VECTOR_DIM, distance=Distance.COSINE),
                )
        return cls._qdrant_client
    
    @classmethod
    def get_openai_client(cls, settings=Depends(get_settings)):
        if cls._openai_client is None:
            logger.info("Initializing OpenAI client")
            cls._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return cls._openai_client

# Request/Response Models
class PromptRequest(BaseModel):
    prompt: str
    include_history: bool = False
    conversation_id: Optional[str] = None
    search_limit: Optional[int] = None
    use_function_calling: bool = True

class DataItem(BaseModel):
    text: str
    id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class BatchDataUpload(BaseModel):
    data: List[DataItem]

class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=5, ge=1, le=100)
    filter: Optional[Dict[str, Any]] = None

class ConversationTurn(BaseModel):
    role: str
    content: str

class Conversation(BaseModel):
    conversation_id: str
    turns: List[ConversationTurn]

# Conversation storage (in-memory for demo, should use a proper DB in production)
conversations = {}

# Function calling definitions for OpenAI
FUNCTION_DESCRIPTIONS = [
    {
        "name": "search_knowledge_base",
        "description": "Search the vector database for relevant information",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "limit": {
                    "type": "integer",
                    "description": "Number of results to return",
                    "default": 3
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "store_information",
        "description": "Store new information in the knowledge base",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "The text to store"
                },
                "metadata": {
                    "type": "object",
                    "description": "Additional metadata about the text"
                }
            },
            "required": ["text"]
        }
    },
    {
        "name": "update_information",
        "description": "Update existing information in the knowledge base",
        "parameters": {
            "type": "object",
            "properties": {
                "search_text": {
                    "type": "string",
                    "description": "Text to find the information to update"
                },
                "new_text": {
                    "type": "string",
                    "description": "The updated text"
                },
                "metadata": {
                    "type": "object",
                    "description": "Additional metadata about the text"
                }
            },
            "required": ["search_text", "new_text"]
        }
    },
    {
        "name": "delete_information",
        "description": "Delete information from the knowledge base",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to find the information to delete"
                }
            },
            "required": ["text"]
        }
    }
]

# Helper classes and functions
class VectorDBManager:
    """Centralized management of vector database operations"""
    
    @staticmethod
    def get_embedding(text: str, embedding_model=None):
        """Generate embedding for text"""
        if embedding_model is None:
            embedding_model = Clients.get_embedding_model()
        return embedding_model.encode(text).tolist()
    
    @staticmethod
    def search(
        query_vector: List[float], 
        limit: int = 5,
        filter_condition: Optional[Dict] = None,
        qdrant_client=None,
        collection_name=None
    ):
        """Search for similar vectors"""
        if qdrant_client is None:
            qdrant_client = Clients.get_qdrant_client()
        
        if collection_name is None:
            collection_name = get_settings().QDRANT_COLLECTION
            
        search_params = {
            "collection_name": collection_name,
            "query_vector": query_vector,
            "limit": limit,
            "with_payload": True
        }
        
        if filter_condition:
            search_params["query_filter"] = models.Filter(**filter_condition)
        
        return qdrant_client.search(**search_params)
    
    @staticmethod
    def store(
        text: str, 
        vector: List[float] = None, 
        id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        qdrant_client=None,
        collection_name=None
    ):
        """Store text and its embedding"""
        if qdrant_client is None:
            qdrant_client = Clients.get_qdrant_client()
            
        if collection_name is None:
            collection_name = get_settings().QDRANT_COLLECTION
            
        point_id = id if id else str(uuid4())
        
        if vector is None:
            vector = VectorDBManager.get_embedding(text)
        
        payload = {"text": text}
        if metadata:
            payload.update(metadata)
        
        point = PointStruct(
            id=point_id,
            vector=vector,
            payload=payload
        )
        
        qdrant_client.upsert(
            collection_name=collection_name,
            points=[point]
        )
        
        return point_id
    
    @staticmethod
    def delete(
        id: str = None,
        text: str = None,
        force: bool = False,
        qdrant_client=None,
        collection_name=None
    ):
        """Delete entry by ID or by finding similar text"""
        if qdrant_client is None:
            qdrant_client = Clients.get_qdrant_client()
            
        if collection_name is None:
            collection_name = get_settings().QDRANT_COLLECTION
            
        settings = get_settings()
        
        # Delete by ID
        if id:
            qdrant_client.delete(
                collection_name=collection_name,
                points_selector=PointIdsList(points=[id])
            )
            return {"status": "deleted", "id": id}
        
        # Find by text similarity
        if text:
            vector = VectorDBManager.get_embedding(text)
            results = VectorDBManager.search(
                query_vector=vector,
                limit=1,
                qdrant_client=qdrant_client,
                collection_name=collection_name
            )
            
            if not results:
                return {"status": "not_found"}
                
            similarity = results[0].score
            target_id = results[0].id
            
            if similarity >= settings.SIMILARITY_THRESHOLD or force:
                qdrant_client.delete(
                    collection_name=collection_name,
                    points_selector=PointIdsList(points=[target_id])
                )
                return {"status": "deleted", "id": target_id, "similarity": similarity}
            else:
                return {
                    "status": "below_threshold", 
                    "similarity": similarity,
                    "id": target_id
                }
        
        return {"status": "error", "message": "Either id or text must be provided"}

class ConversationManager:
    """Manage conversation history"""
    
    @staticmethod
    def get_history(conversation_id: str) -> str:
        """Get formatted conversation history"""
        if conversation_id not in conversations:
            return ""
        
        history = conversations[conversation_id].turns
        formatted_history = ""
        for turn in history:
            formatted_history += f"{turn.role.capitalize()}: {turn.content}\n"
        
        return formatted_history
    
    @staticmethod
    def add_turn(conversation_id: str, role: str, content: str):
        """Add a new turn to conversation"""
        if conversation_id not in conversations:
            conversations[conversation_id] = Conversation(
                conversation_id=conversation_id,
                turns=[]
            )
        
        conversations[conversation_id].turns.append(
            ConversationTurn(role=role, content=content)
        )
        
        return conversations[conversation_id]

async def execute_function_call(function_call, openai_client, embedding_model, qdrant_client, settings):
    """Execute function called by the LLM"""
    function_name = function_call["name"]
    arguments = json.loads(function_call["arguments"])
    
    if function_name == "search_knowledge_base":
        query = arguments["query"]
        limit = arguments.get("limit", settings.DEFAULT_SEARCH_LIMIT)
        
        query_vector = VectorDBManager.get_embedding(query, embedding_model)
        search_results = VectorDBManager.search(
            query_vector=query_vector,
            limit=limit,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        return {
            "function": function_name,
            "results": [{"text": hit.payload.get("text", ""), "score": hit.score} for hit in search_results]
        }
        
    elif function_name == "store_information":
        text = arguments["text"]
        metadata = arguments.get("metadata", {})
        
        point_id = VectorDBManager.store(
            text=text,
            metadata=metadata,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        return {
            "function": function_name,
            "id": point_id,
            "status": "stored"
        }
        
    elif function_name == "update_information":
        search_text = arguments["search_text"]
        new_text = arguments["new_text"]
        metadata = arguments.get("metadata", {})
        
        # Find the entry
        search_vector = VectorDBManager.get_embedding(search_text, embedding_model)
        results = VectorDBManager.search(
            query_vector=search_vector,
            limit=1,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        if not results:
            return {
                "function": function_name,
                "status": "not_found",
                "message": "No matching entry found to update"
            }
            
        # Update with new content
        target_id = results[0].id
        VectorDBManager.store(
            text=new_text,
            id=target_id,
            metadata=metadata,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        return {
            "function": function_name,
            "id": target_id,
            "status": "updated"
        }
        
    elif function_name == "delete_information":
        text = arguments["text"]
        
        result = VectorDBManager.delete(
            text=text,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        result["function"] = function_name
        return result
    
    return {"function": function_name, "status": "unknown_function"}

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Enhanced RAG System API", "version": "2.0"}

@app.post("/query")
async def query_llm(
    request: PromptRequest,
    embedding_model=Depends(Clients.get_embedding_model),
    qdrant_client=Depends(Clients.get_qdrant_client),
    openai_client=Depends(Clients.get_openai_client),
    settings=Depends(get_settings)
):
    """
    Unified query endpoint that handles both simple RAG and function calling approaches
    """
    try:
        # Initialize query parameters
        prompt = request.prompt
        conversation_id = request.conversation_id or str(uuid4())
        search_limit = request.search_limit or settings.DEFAULT_SEARCH_LIMIT
        
        # Start timing for performance monitoring
        start_time = time.time()
        
        # Step 1: Get conversation history if requested
        conversation_context = ""
        if request.include_history and request.conversation_id:
            conversation_context = ConversationManager.get_history(conversation_id)
        
        # Step 2: Encode query and search for context
        query_vector = VectorDBManager.get_embedding(prompt, embedding_model)
        search_results = VectorDBManager.search(
            query_vector=query_vector,
            limit=search_limit,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        # Step 3: Build context from search results
        context_snippets = [hit.payload.get("text", "") for hit in search_results]
        context = "\n\n".join([f"Context {i+1}: {snippet}" for i, snippet in enumerate(context_snippets)])
        
        # Step 4: Prepare messages for LLM
        messages = [
            {"role": "system", "content": settings.SYSTEM_PROMPT}
        ]
        
        if conversation_context:
            messages.append({"role": "system", "content": f"Previous conversation:\n{conversation_context}"})
            
        if context:
            messages.append({"role": "system", "content": f"Relevant information:\n{context}"})
            
        messages.append({"role": "user", "content": prompt})
        
        # Step 5: Generate response (with or without function calling)
        response_args = {
            "model": settings.LLM_MODEL,
            "messages": messages,
        }
        
        if request.use_function_calling:
            response_args["tools"] = [{"type": "function", "function": func} for func in FUNCTION_DESCRIPTIONS]
            response_args["tool_choice"] = "auto"
        
        response = openai_client.chat.completions.create(**response_args)
        message = response.choices[0].message
        content = message.content or ""
        
        # Step 6: Handle any function calls
        function_call_info = None
        if request.use_function_calling and hasattr(message, 'tool_calls') and message.tool_calls:
            # Execute function call
            function_call = message.tool_calls[0].function
            function_result = await execute_function_call(
                function_call,
                openai_client,
                embedding_model,
                qdrant_client,
                settings
            )
            
            function_call_info = {
                "function": function_call["name"],
                "arguments": json.loads(function_call["arguments"]),
                "result": function_result
            }
            
            # Get final response with function results
            final_response = openai_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    *messages,
                    {"role": "assistant", "content": None, "tool_calls": message.tool_calls},
                    {"role": "tool", "tool_call_id": message.tool_calls[0].id, "content": json.dumps(function_result)}
                ]
            )
            
            content = final_response.choices[0].message.content
        
        # Step 7: Store query and response in vector DB
        query_metadata = {
            "type": "query",
            "timestamp": time.time(),
            "conversation_id": conversation_id
        }
        
        response_metadata = {
            "type": "response",
            "timestamp": time.time(),
            "conversation_id": conversation_id
        }
        
        VectorDBManager.store(
            text=prompt,
            vector=query_vector,
            metadata=query_metadata,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        response_vector = VectorDBManager.get_embedding(content, embedding_model)
        VectorDBManager.store(
            text=content,
            vector=response_vector,
            metadata=response_metadata,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        # Step 8: Add to conversation history
        ConversationManager.add_turn(conversation_id, "user", prompt)
        ConversationManager.add_turn(conversation_id, "assistant", content)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Construct the response
        result = {
            "response": content,
            "conversation_id": conversation_id,
            "retrieved_context": context_snippets[:3] if context_snippets else [],
            "processing_time_seconds": round(processing_time, 2)
        }
        
        if function_call_info:
            result["function_call"] = function_call_info
            
        return result
        
    except Exception as e:
        logger.error(f"Error in query_llm: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_data(
    request: BatchDataUpload,
    embedding_model=Depends(Clients.get_embedding_model),
    qdrant_client=Depends(Clients.get_qdrant_client),
    settings=Depends(get_settings)
):
    """Upload multiple data items to the vector database"""
    try:
        results = []
        
        for item in request.data:
            text = item.text
            item_id = item.id or str(uuid4())
            metadata = item.metadata or {}
            
            point_id = VectorDBManager.store(
                text=text,
                id=item_id,
                metadata=metadata,
                qdrant_client=qdrant_client,
                collection_name=settings.QDRANT_COLLECTION
            )
            
            results.append({"id": point_id, "status": "stored"})
        
        return {"message": f"Successfully uploaded {len(results)} items.", "items": results}
        
    except Exception as e:
        logger.error(f"Error in upload_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_data(
    request: SearchRequest,
    embedding_model=Depends(Clients.get_embedding_model),
    qdrant_client=Depends(Clients.get_qdrant_client),
    settings=Depends(get_settings)
):
    """Search for similar data in the vector database"""
    try:
        query_vector = VectorDBManager.get_embedding(request.query, embedding_model)
        
        results = VectorDBManager.search(
            query_vector=query_vector,
            limit=request.limit,
            filter_condition=request.filter,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        return {
            "results": [
                {
                    "id": hit.id,
                    "text": hit.payload.get("text", ""),
                    "score": hit.score,
                    "metadata": {k: v for k, v in hit.payload.items() if k != "text"}
                }
                for hit in results
            ]
        }
        
    except Exception as e:
        logger.error(f"Error in search_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update")
async def update_data(
    request: DataItem,
    embedding_model=Depends(Clients.get_embedding_model),
    qdrant_client=Depends(Clients.get_qdrant_client),
    settings=Depends(get_settings)
):
    """Update existing data in the vector database"""
    try:
        text = request.text
        
        # If ID is provided, update directly
        if request.id:
            VectorDBManager.store(
                text=text,
                id=request.id,
                metadata=request.metadata,
                qdrant_client=qdrant_client,
                collection_name=settings.QDRANT_COLLECTION
            )
            
            return {"message": "Entry updated.", "id": request.id}
        
        # Otherwise, search for similar entry
        vector = VectorDBManager.get_embedding(text, embedding_model)
        results = VectorDBManager.search(
            query_vector=vector,
            limit=1,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        if not results:
            return {"message": "No similar entry found. Use /upload to create a new entry."}
            
        similarity = results[0].score
        old_id = results[0].id
        
        if similarity >= settings.SIMILARITY_THRESHOLD:
            VectorDBManager.store(
                text=text,
                id=old_id,
                metadata=request.metadata,
                qdrant_client=qdrant_client,
                collection_name=settings.QDRANT_COLLECTION
            )
            
            return {
                "message": "Entry updated.",
                "id": old_id,
                "similarity": similarity
            }
        else:
            return {
                "message": "No similar entry above threshold.",
                "similarity": similarity
            }
            
    except Exception as e:
        logger.error(f"Error in update_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete")
async def delete_data(
    id: Optional[str] = None,
    text: Optional[str] = None,
    force: bool = False,
    qdrant_client=Depends(Clients.get_qdrant_client),
    embedding_model=Depends(Clients.get_embedding_model),
    settings=Depends(get_settings)
):
    """Delete data from the vector database"""
    try:
        if not id and not text:
            raise HTTPException(status_code=400, detail="Either id or text must be provided")
            
        result = VectorDBManager.delete(
            id=id,
            text=text,
            force=force,
            qdrant_client=qdrant_client,
            collection_name=settings.QDRANT_COLLECTION
        )
        
        if result["status"] == "not_found":
            raise HTTPException(status_code=404, detail="No entry found")
            
        if result["status"] == "below_threshold":
            return {
                "message": "No similar entry above threshold. Use force=true to delete anyway.",
                "similarity": result["similarity"],
                "id": result["id"]
            }
            
        return {
            "message": "Entry deleted.",
            "id": result["id"]
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/llm-query")
async def fetch_with_context(
    request: PromptRequest,
    embedding_model=Depends(Clients.get_embedding_model),
    qdrant_client=Depends(Clients.get_qdrant_client),
    openai_client=Depends(Clients.get_openai_client),
    settings=Depends(get_settings)
):
    """Legacy endpoint for backward compatibility"""
    # Create a new request with function calling disabled
    modified_request = PromptRequest(
        prompt=request.prompt,
        include_history=request.include_history,
        conversation_id=request.conversation_id,
        use_function_calling=False
    )
    
    # Reuse the main query endpoint
    return await query_llm(
        modified_request, 
        embedding_model, 
        qdrant_client, 
        openai_client, 
        settings
    )

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversations[conversation_id]

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    del conversations[conversation_id]
    return {"message": "Conversation deleted"}

@app.get("/status")
async def check_status(
    qdrant_client=Depends(Clients.get_qdrant_client),
    settings=Depends(get_settings)
):
    """Check system status"""
    try:
        collection_info = qdrant_client.get_collection(settings.QDRANT_COLLECTION)
        point_count = collection_info.points_count
        
        return {
            "status": "ok",
            "collection": settings.QDRANT_COLLECTION,
            "vectors_count": point_count,
            "vector_size": settings.VECTOR_DIM
        }
    except Exception as e:
        logger.error(f"Error checking status: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)