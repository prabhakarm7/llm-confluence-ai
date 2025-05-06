import requests

class OpenSearchClient:
    def __init__(self, base_url, index_name, embedder):
        self.base_url = base_url
        self.index_name = index_name
        self.embedder = embedder
        self.ensure_index()

    def ensure_index(self):
        response = requests.head(f"{self.base_url}/{self.index_name}")
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
            requests.put(f"{self.base_url}/{self.index_name}", json=mapping)

    def push_chunks(self, title, chunks, page_id, last_updated, space, url):
        for i, chunk in enumerate(chunks):
            embedding = self.embedder.get_embedding(chunk)
            doc = {
                "text": chunk,
                "page": title,
                "page_id": page_id,
                "last_updated": last_updated,
                "space": space,
                "url": url,
                "index": i,
                "embedding": embedding
            }
            requests.post(f"{self.base_url}/{self.index_name}/_doc", json=doc)

    def search(self, query, top_k):
        embedding = self.embedder.get_embedding(query)
        search_body = {
            "knn": {
                "field": "embedding",
                "query_vector": embedding,
                "k": top_k,
                "num_candidates": top_k * 2
            }
        }
        response = requests.post(f"{self.base_url}/{self.index_name}/_search", json=search_body)
        hits = response.json().get("hits", {}).get("hits", [])
        return [hit["_source"] for hit in hits]
