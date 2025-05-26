import React from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const RightPanel: React.FC<{
  activeTab: number;
  setActiveTab: (index: number) => void;
  promptInfo: {
    description: string;
    frontend: string[];
    backend: string[];
    files: { name: string; content: string }[];
  };
}> = ({ activeTab, setActiveTab, promptInfo }) => {
  return (
    <Paper
      sx={{
        height: "100%",
        backgroundColor: "#161616",
        color: "#fff",
        borderLeft: "1px solid #2a2a2a",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newVal) => setActiveTab(newVal)}
        textColor="inherit"
        indicatorColor="primary"
      >
        <Tab label="App" />
        <Tab label="Prompt Architecture" />
        <Tab label="Code" />
      </Tabs>

      <Divider sx={{ my: 1, backgroundColor: "#333" }} />

      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        {activeTab === 0 && (
          <Box sx={{ height: "100%", border: "1px solid #333" }}>
            <iframe
              src="/preview"
              style={{ width: "100%", height: "100%", border: "none" }}
              title="App Preview"
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ color: "#00D2FF", mb: 1 }}>
              Project Description
            </Typography>
            <Typography sx={{ mb: 2 }}>{promptInfo.description}</Typography>

            <Typography variant="subtitle1" sx={{ color: "#FFAA00" }}>
              Frontend Features:
            </Typography>
            <ul>
              {promptInfo.frontend.map((f, i) => (
                <li key={i}><Typography>{f}</Typography></li>
              ))}
            </ul>

            <Typography variant="subtitle1" sx={{ color: "#FFAA00" }}>
              Backend Features:
            </Typography>
            <ul>
              {promptInfo.backend.map((f, i) => (
                <li key={i}><Typography>{f}</Typography></li>
              ))}
            </ul>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {promptInfo.files.map((file, idx) => (
              <Accordion key={idx} sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#aaa" }} />}>
                  {file.name}
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{file.content}</pre>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default RightPanel;
