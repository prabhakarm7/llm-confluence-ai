from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from clients.confluence import ConfluenceClient
from clients.text_processor import TextProcessor
from clients.embedding import EmbeddingClient
from clients.opensearch_client import OpenSearchClient

# === CONFIG ===
CONFLUENCE_BASE_URL = "https://your-domain.atlassian.net"
AUTH = ("your_email", "your_api_token")
OPENAI_API_KEY = "your_openai_key"
OPENSEARCH_URL = "http://your-opensearch-url:9200"
INDEX_NAME = "confluence-rag"

# === INIT ===
app = FastAPI()
confluence = ConfluenceClient(CONFLUENCE_BASE_URL, AUTH)
text_processor = TextProcessor()
embedder = EmbeddingClient(OPENAI_API_KEY)
opensearch = OpenSearchClient(OPENSEARCH_URL, INDEX_NAME, embedder)

# === MODELS ===
class PageRequest(BaseModel):
    url: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

# === API ===
@app.post("/index-url")
def index_by_url(request: PageRequest):
    title, html, page_id, last_updated, space, url = confluence.fetch_page(request.url)
    chunks = text_processor.chunk_html(html)
    opensearch.push_chunks(title, chunks, page_id, last_updated, space, url)
    return {"status": "completed", "title": title, "chunks_indexed": len(chunks)}

@app.post("/search")
def search_chunks(request: SearchRequest):
    results = opensearch.search(request.query, request.top_k)
    return {"results": results}
