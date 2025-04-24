from opensearchpy import OpenSearch
import numpy as np
import json

# 🔹 OpenSearch connection details
HOST = "localhost"
PORT = 9200
AUTH = ("admin", "Docker@2025image")  # Change if you've set a different password

# 🔹 Connect to OpenSearch
client = OpenSearch(
    hosts=[{"host": HOST, "port": PORT}],
    http_auth=AUTH,
    use_ssl=False,
    verify_certs=False
)

# 🔹 Load embeddings
embedding = np.load("confluence_embeddings.npy").tolist()

# 🔹 Load extracted text & tables
with open("confluence_text.txt", "r", encoding="utf-8") as f:
    confluence_text = f.read()

# 🔹 Create an OpenSearch index
INDEX_NAME = "confluence_data"

if not client.indices.exists(INDEX_NAME):
    client.indices.create(
        INDEX_NAME,
        body={
            "settings": {"index": {"number_of_shards": 1, "number_of_replicas": 1}},
            "mappings": {
                "properties": {
                    "text": {"type": "text"},
                    "embedding": {"type": "dense_vector", "dims": len(embedding)}
                }
            }
        }
    )

# 🔹 Store data in OpenSearch
doc = {
    "text": confluence_text,
    "embedding": embedding
}

client.index(index=INDEX_NAME, body=doc)
print("✅ Data stored in OpenSearch!")
