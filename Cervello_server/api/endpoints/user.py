from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Example user model
class User(BaseModel):
    id: str
    name: str
    role: str  # 'user', 'developer', 'assistant'

# Dummy DB
users_db = {}

@router.post("/user")
async def create_user(user: User):
    users_db[user.id] = user
    return {"message": "User created", "user": user}

@router.get("/user/{user_id}")
async def get_user(user_id: str):
    user = users_db.get(user_id)
    if not user:
        return {"error": "User not found"}
    return user
