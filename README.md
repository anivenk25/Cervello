
# Cerevello : AI-Powered Real-Time RAG System with Ticketing and Multimodal Support

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
git clone https://github.com/anivenk25/Cervello.git
cd Cervello_server
```

### 2. 📦 Install Dependencies

We use `uv` for virtual env management.

> Ensure Python >= 3.10 is installed.

- For macOs/Linux
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
- For windows
```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
- Using pip
```bash
pip install uv
```

### 3. 🔐 Setup Environment Variables

Create a `.env` file in the root and configure: (refer to env.local

```env
OPENAI_API_KEY=your_openai_key
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=https://your-qdrant-url
MONGO_URI=mongodb+srv://...
```

### 4. 🔐 Activate virtual env
- For windows
```bash
.venv\Scripts\activate
```
- For Linux
```bash
source .venv/bin/activate
```

### 5. Install dependencies

```bash
uv pip install -r requirements.txt
```

### 5. Run the venv
1. To run the server for queries and db updation/deletion

```bash
uvicorn mcp_server:app --reload --log-level debug
```
1. To run the server for ticketing

```bash
uvicorn tickets:app --reload --log-level debug
```

---

## 📂 Directory Structure

```
.
├── main_app/
│   ├── app.py                 # FastAPI RAG endpoints
│   ├── ingestion/             # File parsing and embedding
│   └── agents/                # OpenAI agent tools
|   └── tickets.py
|   └── mcp_server.py 
├── tickets/
│   └── tickets.py             # Ticketing FastAPI service
├── examples/
│   └── gpt_4o_multimodal_rag/ # Demo apps and workflows
├── .env                       # Environment variables
├── pyproject.toml             # Poetry config
└── README.md
```

---

## 🧪 How to Use

### ➕ Upload Documents

- Send `.pdf`, `.docx`, or `.png` files to the `/upload` endpoint.
- Text will be extracted and embedded via OpenAI.
- Stored in Qdrant for semantic retrieval.

### 🔍 Search with RAG

- Hit `/query` with a natural language question.
- Top-k relevant documents retrieved from Qdrant.
- OpenAI responds with a generated answer.

### 🧠 Agent Mode

- Use `/mcp/query` for enhanced query with tool calling.
- OpenAI auto-selects appropriate tool like upload/search/update.

### 🎫 Create Tickets

- The system may suggest creating a ticket.
- User can edit and submit via `/create-ticket`.
- Stored in MongoDB and retrievable anytime.

---

## 📌 Requirements

- Python ≥ 3.10
- Poetry
- MongoDB Atlas account
- Qdrant Cloud account
- OpenAI API Key

---

## 🛠️ Tech Stack

| Component           | Technology                   |
|---------------------|------------------------------|
| API Backend         | FastAPI                      |
| Vector Store        | Qdrant                       |
| Embeddings          | OpenAI `text-embedding-3-small` |
| Agent LLM           | OpenAI GPT-3.5/GPT-4o        |
| Database            | MongoDB Atlas                |
| Text Parsing        | Pathway, pytesseract, python-docx |
| Frontend Client     | (Optional) Chat interface or Postman |

---

## 👥 Contributing

We welcome PRs, feedback, and issues. Please:

1. Fork this repo
2. Create a new branch
3. Push your changes
4. Open a Pull Request

---

## 📄 License

MIT License

---

## 📫 Contact

Feel free to reach out with questions or collaboration requests:

- [Anirudh Venkateswaran](anirudhvenk25@gmail.com)
- [Srishty M](https://github.com/Srish-ty)
- [Rishi Das](rishikakalidas@gmail.com)
- Organization: Cerevello
