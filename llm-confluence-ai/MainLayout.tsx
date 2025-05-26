import React, { useState } from "react";
import { Box } from "@mui/material";
import PromptContainer from "./PromptContainer";
import RightPanel from "./RightPanel";

const MainLayout = () => {
  const [prompt, setPrompt] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  const promptInfo = {
    description: "This app allows users to enter a prompt and generate code using Aider.",
    frontend: ["React UI", "MUI components", "Prompt entry", "Tabbed result view"],
    backend: ["FastAPI server", "Aider CLI integration", "File generation", "API for code retrieval"],
    files: [
      { name: "App.tsx", content: "export default function App() { return <div>Hello</div>; }" },
      { name: "main.py", content: "from fastapi import FastAPI\napp = FastAPI()" },
    ],
  };

  const handleSubmit = () => {
    // Call your FastAPI backend here
    console.log("Submitted:", prompt);
  };

  return (
    <Box display="flex" height="100vh" bgcolor="#0d0d0d">
      {/* Left side - 60% */}
      <Box width="60%" p={2} display="flex" flexDirection="column" justifyContent="flex-end">
        <PromptContainer
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
        />
      </Box>

      {/* Right side - 40% */}
      <Box width="40%" borderLeft="1px solid #222">
        <RightPanel
          activeTab={tabIndex}
          setActiveTab={setTabIndex}
          promptInfo={promptInfo}
        />
      </Box>
    </Box>
  );
};

export default MainLayout;
