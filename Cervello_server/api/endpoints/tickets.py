from fastapi import APIRouter, HTTPException
from db.db import tickets_collection  # ✅ updated import
from uuid import uuid4
from datetime import datetime
from pydantic import BaseModel
from typing import List

router = APIRouter()

class PromptItem(BaseModel):
    message: str
    role: str  # "user" or "assistant"
    timestamp: str

class CreateTicketRequest(BaseModel):
    userId: str
    promptHistory: List[PromptItem]
    lowConfidenceReason: str = None
    createdBySystem: bool = False

@router.post("/create-ticket")
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

# write a function to get all tickets

@router.get("/tickets")
def get_tickets():
    try:
        tickets = list(tickets_collection.find({}))
        return {"tickets": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
# write a function to get a ticket by id
@router.get("/ticket/{ticket_id}")
def get_ticket(ticket_id: str):
    try:
        ticket = tickets_collection.find_one({"ticketId": ticket_id})
        if ticket:
            return ticket
        else:
            raise HTTPException(status_code=404, detail="Ticket not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
