from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "your-mongodb-connection-string")
client = MongoClient(MONGO_URI)
mongo_db = client["rag_assistant"]
tickets_collection = mongo_db["tickets"]
