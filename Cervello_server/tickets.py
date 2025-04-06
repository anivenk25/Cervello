from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from datetime import datetime
import dotenv
from pydantic import BaseModel
from typing import List
from uuid import uuid4
import os

# Load environment variables from .env file
dotenv.load_dotenv()

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



# MongoDB URI
MONGO_URI = os.getenv("MONGO_URI")

# FastAPI app
app = FastAPI()

@app.post("/create-ticket")
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

# write endpoint to get all tickets
from bson import ObjectId

def serialize_ticket(ticket):
    ticket["_id"] = str(ticket["_id"])

@app.get("/tickets")
async def getTickets():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        mongo_db = client["nitrous"]
        tickets_collection = mongo_db["tickets"]

        # Get all tickets from the database
        tickets = list(tickets_collection.find())
        serialized_tickets = [serialize_ticket(ticket) for ticket in tickets]  # Serialize tickets
        return {"tickets": serialized_tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
# get tickets by userId
@app.get("/tickets/{userId}")
async def getTicketsByUserId(userId: str):
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        mongo_db = client["nitrous"]
        tickets_collection = mongo_db["tickets"]

        # Get tickets by userId from the database
        tickets = list(tickets_collection.find({"userId": userId}))
        serialized_tickets = [serialize_ticket(ticket) for ticket in tickets]  # Serialize tickets
        return {"tickets": serialized_tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Run the FastAPI app
    uvicorn.run(app, host="127.0.0.1", port=5000)