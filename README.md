🏥 Healthcare Hybrid RAG System

A production-style Hybrid Retrieval-Augmented Generation (RAG) system for medical document search and question answering.

The system combines dense vector retrieval, keyword search, LLM generation, and evaluation metrics to produce accurate and explainable answers from healthcare documents.

🚀 Demo

Example workflow:

1️⃣ Upload medical PDF
2️⃣ Ask a question
3️⃣ System retrieves relevant chunks
4️⃣ LLM generates answer
5️⃣ Evaluation scores show answer quality

✨ Key Features
🔎 Hybrid Retrieval

Combines two retrieval methods:

Dense Retrieval → FAISS embeddings

Sparse Retrieval → PostgreSQL BM25 full-text search

Results are combined using Reciprocal Rank Fusion (RRF).

🧠 Query Rewriting

LLM expands queries into multiple variations to improve retrieval recall.

Example:

Original Query:
What are symptoms of hypertension?

Rewritten Queries:
Hypertension symptoms
Signs of high blood pressure
Clinical symptoms of hypertension
🤖 LLM Answer Generation

Answers are generated strictly from retrieved context to reduce hallucinations.

📊 Evaluation Layer

LLM evaluates responses based on:

Faithfulness → Is answer grounded in context?

Context Recall → Did retrieval fetch relevant info?

RAG Score → Combined reliability score

⚡ Redis Caching

Reduces latency and OpenAI costs by caching repeated queries.

📈 Metrics Endpoint

Monitor system performance:

GET /api/v1/metrics

Returns:

Total queries

Average faithfulness

Average recall

Average RAG score

             🏗 System Architecture

                    Internet
                       │
             External Load Balancer
                       │
              Web Server (Public)
        ┌──────────────────────────┐
        │                          │
    Nginx Reverse Proxy        Frontend
        │
        │ /api
        ▼
          Internal Load Balancer
                       │
               FastAPI Backend

               
            (Hybrid RAG Pipeline)
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     PostgreSQL       Redis          FAISS
       (RDS)       (ElastiCache)   Vector Index
       
                🧠 RAG Pipeline
                
                    User Query
                       │
                       ▼
                    Query Rewrite (LLM)
                       │
                       ▼
                    Hybrid Retrieval
                       │
                       ├── FAISS Vector Search
                       └── PostgreSQL BM25 Search
                       │
                       ▼
                    Reciprocal Rank Fusion
                       │
                       ▼
                    Top Context Chunks
                       │
                       ▼
                    LLM Answer Generation
                       │
                       ▼
                    Evaluation + Logging
                       │
                       ▼
                    Redis Cache
                    
🛠 Tech Stack
Backend

Python

FastAPI

Async SQLAlchemy

Retrieval

FAISS

PostgreSQL Full-Text Search

LLM

OpenAI API

Infrastructure

Docker

Nginx

AWS EC2

AWS RDS

AWS ElastiCache

AWS Load Balancer


📡 API Endpoints
Query RAG System
POST /api/v1/query

Example request

{
 "query": "What are symptoms of hypertension?"
}

Example response

{
 "answer": "...",
 "sources": [...],
 "evaluation": {
   "faithfulness": {...},
   "context_recall": {...},
   "rag_score": 1.0
 }
}
Upload Medical Document
POST /api/v1/ingest/pdf

Uploads documents into the knowledge base.

Metrics
GET /api/v1/metrics

Returns evaluation statistics.

⚙️ Local Setup
Clone Repository
git clone https://github.com/yourusername/healthcare-rag.git
cd healthcare-rag
Create Environment File
cp .env.example .env

Example:

POSTGRES_URL=postgresql://user:password@localhost:5432/db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key
ENVIRONMENT=development
Run With Docker
docker compose up --build

Backend:

http://localhost:8000

Swagger docs:

http://localhost:8000/docs
☁️ Deployment

The system is deployed using AWS 3-Tier Architecture.

Web Tier

Frontend container

Nginx reverse proxy

Application Tier

FastAPI RAG backend

Internal load balancer

Data Tier

PostgreSQL (RDS)

Redis (ElastiCache)

FAISS vector index

            Traffic flow:
            
            Frontend
               ↓
            Nginx Reverse Proxy
               ↓
            Internal Load Balancer
               ↓
            FastAPI Backend
            📂 Project Structure
            app
             ├── api
             ├── core
             ├── db
             ├── retrieval
             ├── services
             └── utils
            
            Dockerfile
            docker-compose.yml
            requirements.txt
            README.md
            
🔮 Future Improvements

Cross-encoder reranking

Streaming responses

pgvector support

monitoring dashboard

background ingestion pipeline

👨‍💻 Author

Divakar

AI / Machine Learning Engineer
Focused on LLM systems, AI infrastructure, and backend ML engineering

📜 License

MIT License

⭐ If you like this project

Give it a ⭐ on GitHub!
