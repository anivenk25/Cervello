import os
import json
import uuid
import pdfplumber
from PIL import Image
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from docx import Document
import pytesseract

import pathway as pw
from pathway.stdlib.indexing import BruteForceKnnFactory, HybridIndexFactory
from pathway.stdlib.indexing.bm25 import TantivyBM25Factory
from pathway.udfs import DiskCache
from pathway.xpacks.llm import embedders, llms, parsers, splitters
from pathway.xpacks.llm.document_store import DocumentStore
from pathway.xpacks.llm.question_answering import BaseRAGQuestionAnswerer, RAGClient

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Qdrant setup
qdrant = QdrantClient(
    url="https://d91ad594-37e2-4e89-8010-be8495bea5e0.us-west-1-0.aws.cloud.qdrant.io:6333/",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.qxTbSwgYTXKgTrUckUEOr6XD1ieHln8PoqUf28Y2bHg",
)

collection_name = "my-embeddings"

# ---- Function to Extract Text from Different File Types ----
def extract_text_from_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or '' for page in pdf.pages)

    elif ext == ".docx":
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)

    elif ext in [".png", ".jpg", ".jpeg"]:
        img = Image.open(file_path)
        return pytesseract.image_to_string(img)

    else:
        raise ValueError(f"Unsupported file type: {ext}")

# ---- Embedding + Qdrant Flow ----
def process_file(file_path, source_url, author):
    text = extract_text_from_file(file_path)
    if not text.strip():
        print("No text found in the file.")
        return

    print("✅ Extracted text from file.")

    # Get embedding
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    embedding = response.data[0].embedding

    embedding_data = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "source_url": source_url,
        "author": author,
        "original_text": text,
        "embedding": embedding
    }

    # Create collection if not exists
    if not qdrant.collection_exists(collection_name):
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=len(embedding), distance=Distance.COSINE)
        )

    # Upsert
    qdrant.upsert(
        collection_name=collection_name,
        points=[
            PointStruct(
                id=embedding_data["id"],
                vector=embedding,
                payload={
                    "text": text,
                    "source_url": source_url,
                    "author": author,
                    "timestamp": embedding_data["timestamp"],
                    "Embedding": embedding
                }
            )
        ]
    )

    print(f"✅ Stored embedding in Qdrant under collection '{collection_name}'")

    # Search
    results = qdrant.search(
        collection_name=collection_name,
        query_vector=embedding,
        limit=5,
        with_payload=True,
        with_vectors=False
    )

    # Save results
    output = []
    for result in results:
        output.append({
            "id": result.id,
            "score": result.score,
            "text": result.payload.get("text"),
            "source_url": result.payload.get("source_url"),
            "author": result.payload.get("author"),
            "timestamp": result.payload.get("timestamp"),
            "embeddings": result.payload.get("Embedding")
        })

    output_path = "SPD.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"Results saved to {output_path}")

# ---- Document Parsing and Indexing with Pathway ----
DATA_PATH = "./data"

folder = pw.io.fs.read(
    path=f"{DATA_PATH}/*.txt",
    format="binary",
    with_metadata=True,
)

sources = [folder]
parser = parsers.UnstructuredParser()
text_splitter = splitters.TokenCountSplitter(min_tokens=150, max_tokens=450)
embedder = embedders.OpenAIEmbedder(cache_strategy=DiskCache())

# Check embedding generation
try:
    sample_embedding = embedder("This is a sample text.").result()
    print(f"Sample Embedding: {sample_embedding}")
except Exception as e:
    print(f"Error getting embedding: {e}")

index = HybridIndexFactory([
    TantivyBM25Factory(),
    BruteForceKnnFactory(embedder=embedder),
])

# ---- Optional File Processing Entry Point ----
def handle_file_upload(file_path, source_url, author):
    process_file(file_path, source_url, author)
    return {"status": "success", "file": file_path}

if __name__ == "__main__":
    file_path = "/content/sample.pdf"
    source_url = "https://example.com/myfile"
    author = "anshuman"
    handle_file_upload(file_path, source_url, author)
