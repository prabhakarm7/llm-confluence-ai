from sentence_transformers import SentenceTransformer
import pandas as pd
import json

# 🔹 Load extracted text
with open("confluence_text.txt", "r", encoding="utf-8") as f:
    confluence_text = f.read()

# 🔹 Load extracted tables
table_data = []
for i in range(5):  # Assuming max 5 tables
    try:
        df = pd.read_csv(f"confluence_table_{i+1}.csv")
        table_data.append(df.to_json(orient="records"))  # Convert DataFrame to JSON format
    except FileNotFoundError:
        break

# 🔹 Combine text and tables for embedding
combined_data = {"text": confluence_text, "tables": table_data}

# 🔹 Convert to string
combined_data_str = json.dumps(combined_data)

# 🔹 Load Sentence Transformer model
model = SentenceTransformer("all-MiniLM-L6-v2")

# 🔹 Generate embeddings
embedding = model.encode(combined_data_str)

# 🔹 Save embeddings
import numpy as np
np.save("confluence_embeddings.npy", embedding)

print("✅ Embeddings generated and saved!")
