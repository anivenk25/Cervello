from pymongo import MongoClient
import os
from dotenv import load_dotenv
from uuid import uuid4
from datetime import datetime

# Load environment variables
load_dotenv()

# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI", "your-mongodb-connection-string")
ticket_id = str(uuid4())
user_id = "new_user"+str(uuid4())
try:
	# Connect to MongoDB
	client = MongoClient(MONGO_URI)
	mongo_db = client["nitrous"]
	tickets_collection = mongo_db["tickets"]

	# Test the connection by inserting a test document
	test_ticket = {
		"ticketId": ticket_id,
		"userId": user_id,
		"status": "open",
		"createdAt": datetime.now(),
		"updatedAt": datetime.now(),
		"metadata": {
			"lowConfidenceReason": "Testing connection",
			"createdBySystem": True
		}
	}

	# Insert the test document
	result = tickets_collection.insert_one(test_ticket)
	print(f"Test document inserted with ID: {result.inserted_id}")

	# Fetch the inserted document
	fetched_ticket = tickets_collection.find_one({"ticketId": "test123"})
	print("Fetched document:", fetched_ticket)

	# Clean up by deleting the test document
	#tickets_collection.delete_one({"ticketId": "test123"})
	print("Test document deleted successfully.")

except Exception as e:
	print(f"Error connecting to MongoDB: {e}")