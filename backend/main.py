import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from opensearchpy import OpenSearch
from sentence_transformers import SentenceTransformer
import openai
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from bs4 import BeautifulSoup

# Initialize FastAPI app
app = FastAPI()

# Allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# OpenSearch connection
host = "localhost"
port = 9200
auth = ("admin", "Dream@2025image")  # Change password if needed

client = OpenSearch(
    hosts=[{"host": host, "port": port}],
    http_auth=auth,
    use_ssl=False,
    verify_certs=False
)

# Sentence Transformer model (for embeddings)
model = SentenceTransformer("all-MiniLM-L6-v2")  # Small, fast transformer model

# OpenSearch index name
INDEX_NAME = "confluence_embeddings"



# 🔹 Replace with your details
CONFLUENCE_URL = "https://akashmudliyar.atlassian.net/wiki/"
USERNAME = "akashmudliyar@gmail.com"
API_TOKEN='atalssian token'
# Store status updates
status_tracker: Dict[str, str] = {}

class PageRequest(BaseModel):
    page_id: str

# 🔹 Extract text from HTML
def extract_text(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ")

@app.post("/process_page")
async def process_page(request: PageRequest, background_tasks: BackgroundTasks):
    """ Starts the Confluence extraction and storage process """
    page_id = request.page_id
    status_tracker[page_id] = "🔄 Extracting data..."
    background_tasks.add_task(extract_store_page, page_id)
    return {"message": "Processing started!", "status": status_tracker[page_id]}

@app.get("/status/{page_id}")
async def get_status(page_id: str):
    """ Check the status of a page processing task """
    return {"status": status_tracker.get(page_id, "No record found.")}

def extract_store_page(page_id: str):
    """ Extracts data from Confluence, generates embeddings, and stores in OpenSearch """
    try:
        # Step 1: Extract data from Confluence
        api_endpoint = f"{CONFLUENCE_URL}/rest/api/content/{page_id}?expand=body.storage"
        response = requests.get(api_endpoint, auth=(USERNAME, API_TOKEN), headers={"Accept": "application/json"})
        
        if response.status_code != 200:
            status_tracker[page_id] = "❌ Failed to fetch data"
            return

        page_data = response.json()
        html_content = page_data["body"]["storage"]["value"]
        text_content = BeautifulSoup(html_content, "html.parser").get_text(separator=" ")
        page_data = response.json()
        html_content = page_data["body"]["storage"]["value"]

        # 🔹 Extract page text
        page_text = extract_text(html_content)

        # 🔹 Extract tables from HTML
        tables = pd.read_html(html_content) if "<table" in html_content else []

        status_tracker[page_id] = "✅ Data extracted"

        # Step 2: Generate embeddings (Mocked here, replace with real embeddings)
        # 🔹 Combine text and tables for embedding
        combined_data = {"text": page_text, "tables": tables}

        # 🔹 Convert to string
        combined_data_str = json.dumps(combined_data)

        # 🔹 Generate embeddings
        embedding = model.encode(combined_data_str)
        status_tracker[page_id] = "✅ Embeddings generated"

        # Step 3: Store in OpenSearch
        # Create OpenSearch index if not exists
        index_body = {
            "settings": {"index": {"knn": True}},
            "mappings": {
                "properties": {
                    "embedding": {"type": "knn_vector", "dimension": len(embedding)},  # Adjust for your model
                    "text": {"type": "text"}
                }
            }
        }

        if not client.indices.exists(index=INDEX_NAME):
            client.indices.create(index=INDEX_NAME, body=index_body)
        doc = {"text": text_content, "embedding": embedding}
        client.index(index=INDEX_NAME, body=doc)
        status_tracker[page_id] = "✅ Data stored in OpenSearch"

    except Exception as e:
        status_tracker[page_id] = f"❌ Error: {str(e)}"




# Define request model
class ConfluenceText(BaseModel):
    text: str

# Endpoint to store text & embeddings
@app.post("/store")
def store_embedding(data: ConfluenceText):
    try:
        # Generate embedding
        embedding = model.encode(data.text).tolist()
        
        # Store in OpenSearch
        doc = {
            "text": data.text,
            "embedding": embedding
        }

        doc = {
            "page_id": data.page_id,
            "title": data.title,
            "text": data.text,
            "embedding": data.embedding,
            "tables": [{"table_data": table} for table in data.tables],
            "timestamp": datetime.datetime.utcnow()
        }
        response = client.index(index=INDEX_NAME, body=doc)
        return {"message": "Stored successfully!", "doc_id": response["_id"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    

# OpenAI API Key (Make sure to set this as an environment variable instead of hardcoding)

OPEN_API_KEY = 'tokebn'
class OpenAISearchQuery(BaseModel):
    query: str
    k: int = 3  # Number of top results to return

@app.post("/chat")
def search_and_summarize(query: OpenAISearchQuery):
    try:
        # Convert query to embedding
        query_embedding = model.encode(query.query).tolist()

        # Perform k-NN search in OpenSearch
        search_body = {
            "size": query.k,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": query.k
                    }
                }
            }
        }

        response = client.search(index=INDEX_NAME, body=search_body)

        # Extract relevant text
        retrieved_texts = [hit["_source"]["text"] for hit in response["hits"]["hits"]]
        
        # Combine results into a single context for OpenAI
        context = "\n".join(retrieved_texts)

        # Query OpenAI GPT for summarization (Updated for OpenAI v1.0+)
        llm_client = openai.OpenAI(api_key=OPENAI_API_KEY)

        # Query OpenAI GPT for summarization
        gpt_response = llm_client.chat.completions.create(
            model="gpt-3.5-turbo",  # Use "gpt-3.5-turbo" if needed
            messages=[
                {"role": "system", "content": "You are an AI assistant that summarizes search results."},
                {"role": "user", "content": f"Summarize the following information and answer the question: '{query.query}'\n\n{context}"}
            ]
        )

        # Extract GPT response
        summary = gpt_response["choices"][0]["message"]["content"]

        return {"query": query.query, "summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))