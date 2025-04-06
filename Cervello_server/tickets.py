from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from datetime import datetime
import dotenv
from pydantic import BaseModel
from typing import List
from uuid import uuid4
import os
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
dotenv.load_dotenv()

# class PromptRequest(BaseModel):
#     prompt: str

class PromptItem(BaseModel):
    message: str
    timestamp: str = str(datetime.now().isoformat())

class CreateTicketRequest(BaseModel):
    userId: str
    promptHistory: List[PromptItem]
    lowConfidenceReason: str = None



# MongoDB URI
MONGO_URI = os.getenv("MONGO_URI")

# FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.post("/create-ticket")
async def createTicket(req: CreateTicketRequest): ...

@app.get("/tickets")
async def getTickets(): ...

@app.get("/tickets/{userId}")
async def getTicketsByUserId(userId: str): ...

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)