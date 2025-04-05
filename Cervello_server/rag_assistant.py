# Real-time RAG Q&A Assistant using Pathway

# Assumptions:
# - Real-time data is streamed from a simulated support ticket system (CSV updates)
# - Vector store is in-memory using FAISS
# - LLM used is OpenAI (replace with other APIs if needed)
# - REST API built using FastAPI
# - Simple CLI or web interface

# Required libraries:
# pathway, fastapi, openai, faiss-cpu, pydantic, uvicorn, watchdog, sentence-transformers

# --- SETUP ---
import os
import openai
import faiss
import pathway as pw
import pandas as pd
import numpy as np
from fastapi import FastAPI, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from threading import Thread
import logging
import time

openai.api_key = os.getenv("OPENAI_API_KEY")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
vector_dim = 384  # depends on model

index = faiss.IndexFlatL2(vector_dim)
doc_store = []  # list of (text, metadata)

# --- PATHWAY INGESTION PIPELINE ---
class DataIngestor:
    def __init__(self):
        self.schema = pw.schema_builder({
            "text": pw.column_definition(dtype=str),
            "timestamp": pw.column_definition(dtype=int)
        })
        self.uploaded_data = pw.io.python.MemorySource()

    def process_data(self, row):
        text = row["text"]
        embedding = embedding_model.encode([text])[0]
        index.add(np.array([embedding]))
        doc_store.append((text, {"timestamp": row["timestamp"]}))
        logging.info(f"Processed and stored: {text[:30]}...")
        return "stored"

    def ingest_uploaded_file(self, file_content: bytes, filename: str):
        text = file_content.decode("utf-8", errors="ignore")
        timestamp = int(time.time())
        logging.info(f"Received file: {filename} with content: {text[:30]}...")
        self.uploaded_data.write({"text": text, "timestamp": timestamp})

    def start_ingestion(self):
        data_stream = self.uploaded_data.read(schema=self.schema)
        processed = data_stream.select(
            result=pw.apply(self.process_data, pw.this)
        )
        logging.info("Ingestion pipeline started.")
        pw.io.jsonlines.write(processed, "processed_output.jsonl")
        pw.run()

# Run Pathway pipeline in a background thread
ingestor = DataIngestor()

def run_pathway_stream():
    ingestor.start_ingestion()

thread = Thread(target=run_pathway_stream, daemon=True)
thread.start()

# --- FASTAPI SERVER ---
app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/query")
def query_llm(q: Query):
    question = q.question
    question_vec = embedding_model.encode([question])[0]
    D, I = index.search(np.array([question_vec]), k=3)
    context_chunks = [doc_store[i][0] for i in I[0] if i < len(doc_store)]
    context_text = "\n".join(context_chunks)

    prompt = f"Answer the question using only the context below:\n\n{context_text}\n\nQuestion: {question}\nAnswer:"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return {"answer": response['choices'][0]['message']['content'].strip()}
    except Exception as e:
        return {"error": str(e)}
    
# --- WATCHDOG FOR SIMULATED FILE STREAM (Optional) ---
# This can be used to simulate new data being added to CSV for testing
# In production, use real connectors to email, Slack, etc.

# --- FRONTEND (OPTIONAL) ---
# Simple CLI or React UI can call the `/query` endpoint
# Skipped here for brevity

# --- HOW TO RUN ---
# 1. Set OPENAI_API_KEY as env variable
# 2. Prepare `support_data.csv` with initial rows: id,text columns
# 3. Run: uvicorn <filename_without_py>.app --reload
# 4. POST to /query with {"question": "your question here"}
# 5. Add new rows to CSV to simulate real-time updates

# --- TODO ---
# - Add document deletion support in FAISS and Pathway
# - Use persistent vector DB (e.g., Qdrant, Weaviate)
# - Add Slack connector for input/output
# - Add fallback mechanism for OpenAI API failures
# - Deploy with Docker and include live demo video script
