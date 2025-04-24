import requests
import pandas as pd
from bs4 import BeautifulSoup
from atlassian import Confluence

# 🔹 Replace with your details
CONFLUENCE_URL = "https://akashmudliyar.atlassian.net/wiki/"
USERNAME = "akashmudliyar@gmail.com"
API_ENDPOINT = 'added token atlassian token'
PAGE_ID = "98553"  # Replace with your actual Confluence Page ID

# 🔹 API endpoint
API_ENDPOINT = f"{CONFLUENCE_URL}/rest/api/content/{PAGE_ID}?expand=body.storage"

## 🔹 Fetch page content
response = requests.get(
    API_ENDPOINT,
    auth=(USERNAME, API_TOKEN),
    headers={"Accept": "application/json"}
)

# 🔹 Extract HTML content if request is successful
if response.status_code == 200:
    page_data = response.json()
    html_content = page_data["body"]["storage"]["value"]
    print("✅ Successfully retrieved Confluence page data")
else:
    print("❌ Failed to fetch data:", response.text)
    exit()

# 🔹 Extract text from HTML
def extract_text(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ")

page_text = extract_text(html_content)

# 🔹 Extract tables from HTML
tables = pd.read_html(html_content)  # Convert HTML tables to Pandas DataFrames

# 🔹 Display extracted data
print("\n📌 Extracted Page Text:\n", page_text[:500])  # Print first 500 chars of text
print("\n📌 Extracted Tables:")
for i, df in enumerate(tables):
    print(f"\nTable {i+1}:")
    print(df)

# Save extracted data
with open("confluence_text.txt", "w", encoding="utf-8") as f:
    f.write(page_text)

for i, df in enumerate(tables):
    df.to_csv(f"confluence_table_{i+1}.csv", index=False)

print("\n✅ Data extracted and saved!")