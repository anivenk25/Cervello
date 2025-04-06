# Cervello 🔍 AI-Powered Real-Time RAG System with Ticketing and Multimodal Support

This project is a real-time Retrieval-Augmented Generation (RAG) system, powered by OpenAI's LLMs, integrated with a FastAPI backend and a multimodal ingestion pipeline. It enables users to interact with enterprise knowledge through document upload, querying, and support ticketing, all while leveraging vector search via Qdrant.

---

## 🧠 Key Features

- **RAG (Retrieval-Augmented Generation)** using OpenAI and Qdrant
- **Multimodal ingestion pipeline**: Supports `.pdf`, `.docx`, `.png`
- **OpenAI Agent + Tool integration** to dynamically call backend services
- **FastAPI microservices** for RAG & ticketing
- **Support ticketing system** with MongoDB
- **Semantic vector search** using OpenAI embeddings
- **Client endpoints** for interacting with the system in real-time

---

## 🧱 Architecture Overview

This system is composed of several interconnected services:

### 1. 📦 RAG API (FastAPI Server)
Endpoints to:
- `/query`: Search and retrieve knowledge with OpenAI + Qdrant
- `/upload`: Bulk upload documents
- `/update`: Update existing vector entries
- `/delete`: Delete documents
- `/llm-query`: Basic LLM RAG
- `/mcp/query`: OpenAI Agent-based query routing with tools

### 2. 🧾 Ticketing API (FastAPI Microservice)
Endpoints to:
- `/create-ticket`: Submit a new support request
- `/tickets`: View all tickets
- `/tickets/{userId}`: View user-specific tickets

### 3. 🧰 OpenAI Agent & Tools
Uses:
- `search_docs`: Queries knowledge base
- `add_docs`: Uploads new documents
- `update_doc`: Updates vectorized entries
- `delete_doc`: Removes documents from the vector DB

### 4. 🔗 Multimodal Ingestion Pipeline
Handles file ingestion and embedding:
- Text extraction (`pytesseract`, `python-docx`)
- Embedding with `text-embedding-3-small`
- Insertion into Qdrant
- Result logging to JSON

### 5. 🧠 Databases
- **Qdrant Cloud**: Vector database for storing embeddings
- **MongoDB Atlas**: Stores tickets and user interactions

---

## 🚀 Getting Started

### 1. 📥 Clone the Repo
```bash
git clone https://github.com/<your-org>/rag-multimodal-assistant.git
cd rag-multimodal-assistant
