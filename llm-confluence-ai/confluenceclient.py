import requests

class ConfluenceClient:
    def __init__(self, base_url, auth):
        self.base_url = base_url
        self.auth = auth

    def fetch_page(self, url):
        page_id = url.rstrip('/').split('/')[-1]
        lookup_url = f"{self.base_url}/wiki/rest/api/content/{page_id}?expand=body.storage,version,space"
        response = requests.get(lookup_url, auth=self.auth)
        data = response.json()
        return (
            data.get("title", "Untitled"),
            data["body"]["storage"]["value"],
            data.get("id"),
            data.get("version", {}).get("when", "unknown"),
            data.get("space", {}).get("key", "unknown"),
            url
        )
