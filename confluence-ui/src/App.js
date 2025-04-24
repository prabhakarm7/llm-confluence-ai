import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/pages")
      .then((res) => res.json())
      .then((data) => setPages(data))
      .catch(() => setError("Failed to load pages"));
  }, []);

  const extractPage = async () => {
    setLoadingExtract(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8001/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId })
      });
      if (!res.ok) throw new Error("Failed to extract page");
      setPageId("");
    } catch (err) {
      setError(err.message);
    }
    setLoadingExtract(false);
  };

  const askChatbot = async () => {
    setLoadingChat(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: chatQuery, k: 3 })  // Ensure `k` is sent as required
      });
      if (!res.ok) throw new Error("Failed to get chatbot response");
      const data = await res.json();
      setChatResponse(data.response);
    } catch (err) {
      setError(err.message);
    }
    setLoadingChat(false);
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <div className="row flex-grow-1">
        <nav className="col-md-3 bg-dark text-white sidebar p-3 d-flex flex-column">
          <h5 className="text-center border-bottom pb-2">Extracted Pages</h5>
          <ul className="list-group flex-grow-1 overflow-auto">
            {pages.map((page) => (
              <li key={page.id} className="list-group-item list-group-item-action bg-light mb-1">
                {page.title}
              </li>
            ))}
          </ul>
        </nav>

        <main className="col-md-9 p-4 d-flex flex-column align-items-center">
          {error && <div className="alert alert-danger w-75">{error}</div>}
          <div className="card w-75 p-4 shadow-sm mb-4">
            <h3 className="mb-3 text-primary">Extract Confluence Page</h3>
            <input 
              className="form-control mb-2" 
              placeholder="Enter Page ID" 
              value={pageId} 
              onChange={(e) => setPageId(e.target.value)}
            />
            <button 
              className="btn btn-primary w-100" 
              onClick={extractPage} 
              disabled={loadingExtract}
            >
              {loadingExtract ? "Extracting..." : "Extract"}
            </button>
          </div>
          
          <div className="card w-75 p-4 shadow-sm">
            <h3 className="mb-3 text-success">Chatbot</h3>
            <input 
              className="form-control mb-2" 
              placeholder="Ask a question" 
              value={chatQuery} 
              onChange={(e) => setChatQuery(e.target.value)}
            />
            <button 
              className="btn btn-success w-100" 
              onClick={askChatbot} 
              disabled={loadingChat}
            >
              {loadingChat ? "Loading..." : "Ask"}
            </button>
            <p className="mt-3 border rounded p-2 bg-light">{chatResponse}</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
