import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SmartToyIcon from "@mui/icons-material/SmartToy";

interface Message {
  type: "user" | "assistant";
  content: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newUserMessage: Message = { type: "user", content: input.trim() };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    // Simulated assistant reply
    setTimeout(() => {
      const assistantReply: Message = {
        type: "assistant",
        content: `You said: ${newUserMessage.content}`,
      };
      setMessages((prev) => [...prev, assistantReply]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#343541",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              mb: 3,
              alignItems: "flex-start",
              flexDirection: "row",
              bgcolor: msg.type === "user" ? "#343541" : "#444654",
              p: 2,
              borderRadius: 2,
            }}
          >
            <Box sx={{ mr: 2 }}>
              {msg.type === "user" ? (
                <AccountCircleIcon sx={{ color: "#dcdcdc" }} />
              ) : (
                <SmartToyIcon sx={{ color: "#10a37f" }} />
              )}
            </Box>
            <Typography
              variant="body1"
              sx={{ color: "#dcdcdc", whiteSpace: "pre-wrap" }}
            >
              {msg.content}
            </Typography>
          </Box>
        ))}

        {loading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#444654",
              p: 2,
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box sx={{ mr: 2 }}>
              <SmartToyIcon sx={{ color: "#10a37f" }} />
            </Box>
            <CircularProgress size={20} sx={{ color: "#dcdcdc" }} />
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #555",
          bgcolor: "#40414f",
        }}
      >
        <TextField
          fullWidth
          multiline
          placeholder="Send a message"
          variant="outlined"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSend}>
                <SendIcon sx={{ color: "#10a37f" }} />
              </IconButton>
            ),
            sx: {
              bgcolor: "#40414f",
              color: "#dcdcdc",
              border: "1px solid #555",
              borderRadius: 2,
              p: 1,
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "none",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Chatbot;
