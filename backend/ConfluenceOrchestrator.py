# backend/ingestion/orchestrator.py
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter
from .confluence_client import ConfluenceClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import AzureOpenAIEmbeddings
from langchain.vectorstores import OpenSearchVectorSearch
import uuid

# FastAPI request schema
class ConfluenceIngestRequest(BaseModel):
    url: str
    team_id: str

# Orchestrator class
class ConfluenceIngestionOrchestrator:
    def __init__(self, opensearch_url: str, azure_cfg: dict):
        self.vector_store = OpenSearchVectorSearch(
            index_name="answersherpa-docs",
            embedding=AzureOpenAIEmbeddings(**azure_cfg),
            opensearch_url=opensearch_url,
            http_auth=("admin", "admin-password"),
            use_ssl=True,
            verify_certs=True,
        )
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        self.azure_cfg = azure_cfg

    def ingest(self, url: str, team_id: str):
        # 1. Load page content from Confluence
        client = ConfluenceClient(url)
        document = client.load()

        # 2. Generate summary from full page
        from langchain.chat_models import AzureChatOpenAI
        chat = AzureChatOpenAI(**self.azure_cfg)
        summary = chat.predict(f"""
        Summarize this Confluence page in 3-4 lines for semantic chunking:

        {document.page_content}
        """).strip()

        # 3. Chunk
        chunks = self.splitter.create_documents([document.page_content], metadatas=[document.metadata])

        # 4. Add metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "doc_id": str(uuid.uuid4()),
                "team_id": team_id,
                "space_id": document.metadata.get("space", "na"),
                "context_summary": summary,
                "chunk_index": i
            })

        # 5. Store in OpenSearch
        self.vector_store.add_documents(chunks)


# FastAPI route
router = APIRouter()

@router.post("/ingest/confluence")
def ingest_confluence(request: ConfluenceIngestRequest):
    orchestrator = ConfluenceIngestionOrchestrator(
        opensearch_url="https://your-opensearch-url",
        azure_cfg={
            "deployment_name": "gpt-35-turbo",
            "openai_api_key": "YOUR_API_KEY",
            "openai_api_base": "https://YOUR_AZURE_ENDPOINT",
            "openai_api_version": "2023-05-15",
        },
    )
    orchestrator.ingest(request.url, request.team_id)
    return {"status": "success"}
