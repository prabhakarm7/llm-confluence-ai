from fastapi import FastAPI, Query
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from langchain.text_splitter import RecursiveCharacterTextSplitter
import openai
from typing import List

app = FastAPI()

# === CONFIGURATION ===
CONFLUENCE_BASE_URL = "https://your-domain.atlassian.net"
AUTH = ("your_email", "your_api_token")
openai.api_key = "your_openai_key"
OPENSEARCH_URL = "http://your-opensearch-url:9200"
INDEX_NAME = "confluence-rag"

# === MODELS ===
class PageRequest(BaseModel):
    url: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

# === UTILITIES ===
def fetch_confluence_page_by_url(url, auth):
    page_id = url.rstrip('/').split('/')[-1]  # Assumes last part is page ID or title
    lookup_url = f"{CONFLUENCE_BASE_URL}/wiki/rest/api/content/{page_id}?expand=body.storage,version,space"
    response = requests.get(lookup_url, auth=auth)
    data = response.json()
    title = data.get("title", "Untitled")
    html = data["body"]["storage"]["value"]
    page_id = data.get("id")
    last_updated = data.get("version", {}).get("when", "unknown")
    space = data.get("space", {}).get("key", "unknown")
    return title, html, page_id, last_updated, space, url

def chunk_html_text(text):
    soup = BeautifulSoup(text, 'html.parser')
    clean_text = soup.get_text()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_text(clean_text)

def get_embedding(text):
    response = openai.Embedding.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response["data"][0]["embedding"]

def ensure_index():
    response = requests.head(f"{OPENSEARCH_URL}/{INDEX_NAME}")
    if response.status_code != 200:
        mapping = {
            "settings": {"index": {"knn": True}},
            "mappings": {
                "properties": {
                    "text": {"type": "text"},
                    "embedding": {"type": "knn_vector", "dimension": 1536},
                    "page": {"type": "keyword"},
                    "url": {"type": "keyword"},
                    "page_id": {"type": "keyword"},
                    "last_updated": {"type": "date"},
                    "space": {"type": "keyword"},
                    "index": {"type": "integer"}
                }
            }
        }
        requests.put(f"{OPENSEARCH_URL}/{INDEX_NAME}", json=mapping)

def push_chunks_to_opensearch(page_title, chunks, page_id, last_updated, space, url):
    ensure_index()
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        doc = {
            "text": chunk,
            "page": page_title,
            "page_id": page_id,
            "last_updated": last_updated,
            "space": space,
            "url": url,
            "index": i,
            "embedding": embedding
        }
        requests.post(f"{OPENSEARCH_URL}/{INDEX_NAME}/_doc", json=doc)

# === API ===
@app.post("/index-url")
def index_by_url(request: PageRequest):
    title, html, page_id, last_updated, space, url = fetch_confluence_page_by_url(request.url, AUTH)
    chunks = chunk_html_text(html)
    push_chunks_to_opensearch(title, chunks, page_id, last_updated, space, url)
    return {"status": "completed", "title": title, "chunks_indexed": len(chunks)}

@app.post("/search")
def search_chunks(request: SearchRequest):
    embedding = get_embedding(request.query)
    search_body = {
        "knn": {
            "field": "embedding",
            "query_vector": embedding,
            "k": request.top_k,
            "num_candidates": request.top_k * 2
        }
    }
    response = requests.post(f"{OPENSEARCH_URL}/{INDEX_NAME}/_search", json=search_body)
    hits = response.json().get("hits", {}).get("hits", [])
    return {"results": [hit["_source"] for hit in hits]}
