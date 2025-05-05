from fastapi import FastAPI, Query
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from langchain.text_splitter import RecursiveCharacterTextSplitter
import openai
import weaviate
from typing import List

app = FastAPI()

# === CONFIGURATION ===
CONFLUENCE_BASE_URL = "https://your-domain.atlassian.net"
AUTH = ("your_email", "your_api_token")
openai.api_key = "your_openai_key"
WEAVIATE_URL = "http://localhost:8080"
client = weaviate.Client(WEAVIATE_URL)

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

def push_chunks_to_weaviate(page_title, chunks, page_id, last_updated, space, url):
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        client.data_object.create({
            "text": chunk,
            "page": page_title,
            "page_id": page_id,
            "last_updated": last_updated,
            "space": space,
            "url": url,
            "index": i
        }, class_name="ConfluenceChunk", vector=embedding)

# === API ===
@app.post("/index-url")
def index_by_url(request: PageRequest):
    title, html, page_id, last_updated, space, url = fetch_confluence_page_by_url(request.url, AUTH)
    chunks = chunk_html_text(html)
    push_chunks_to_weaviate(title, chunks, page_id, last_updated, space, url)
    return {"status": "completed", "title": title, "chunks_indexed": len(chunks)}

@app.post("/search")
def search_chunks(request: SearchRequest):
    embedding = get_embedding(request.query)
    response = client.query.get("ConfluenceChunk", ["text", "page", "url", "last_updated", "index"]) \
        .with_near_vector({"vector": embedding}) \
        .with_limit(request.top_k) \
        .do()

    results = response["data"]["Get"]["ConfluenceChunk"]
    return {"results": results}
