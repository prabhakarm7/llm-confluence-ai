import React from "react";
import { Box, TextField, IconButton, Button, Stack, Paper, InputAdornment } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import MicIcon from "@mui/icons-material/Mic";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";

const suggestions = [
  "Create a blog post about HeroUI",
  "Give me 10 ideas for my next blog post",
  "Compare HeroUI with other UI libraries",
  "Write a text message to my friend",
];

const PromptContainer: React.FC = () => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        backgroundColor: "#121212",
        borderRadius: "16px",
        maxWidth: 800,
        mx: "auto",
      }}
    >
      <Stack spacing={2}>
        {/* Suggestion Chips */}
        <Box display="flex" flexWrap="wrap" gap={1}>
          {suggestions.map((text, idx) => (
            <Button
              key={idx}
              variant="outlined"
              size="small"
              sx={{
                color: "#fff",
                borderColor: "#333",
                textTransform: "none",
                fontWeight: 400,
                backgroundColor: "#1e1e1e",
                "&:hover": { backgroundColor: "#2a2a2a" },
              }}
            >
              {text}
            </Button>
          ))}
        </Box>

        {/* Prompt Input Area */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#1e1e1e",
            borderRadius: 2,
            px: 2,
            py: 1,
            border: "1px solid #333",
          }}
        >
          <TextField
            placeholder="Enter a prompt here"
            multiline
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: { color: "#fff", flex: 1, mr: 2 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SendRoundedIcon sx={{ color: "#888" }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
          />

          {/* Attachments, Voice, Templates */}
          <Stack direction="row" spacing={1}>
            <IconButton>
              <AttachFileIcon sx={{ color: "#aaa" }} />
            </IconButton>
            <IconButton>
              <MicIcon sx={{ color: "#aaa" }} />
            </IconButton>
            <IconButton>
              <ViewSidebarIcon sx={{ color: "#aaa" }} />
            </IconButton>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default PromptContainer;
