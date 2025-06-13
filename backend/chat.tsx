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
        bgcolor: "#343541",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 2, sm: 4 },
          pb: "160px",
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
              maxWidth: "768px",
              mx: "auto",
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
              maxWidth: "768px",
              mx: "auto",
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
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: "#343541",
          borderTop: "1px solid #555",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "768px",
            display: "flex",
            alignItems: "center",
            bgcolor: "#40414f",
            borderRadius: 2,
            px: 2,
          }}
        >
          <TextField
            fullWidth
            multiline
            placeholder="Send a message"
            variant="standard"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            InputProps={{
              disableUnderline: true,
              sx: {
                color: "#dcdcdc",
                py: 1.2,
              },
            }}
            sx={{
              mr: 1,
            }}
          />
          <IconButton onClick={handleSend}>
            <SendIcon sx={{ color: "#10a37f" }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
const theme = createTheme({
    typography: {
      fontFamily: `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    },
  });
export default Chatbot;
/Users/prabhakarmudliyar/Downloads/genially_6838b1981bcbde8cf3c96d30_images 2/002_INDEX.jpg /Users/prabhakarmudliyar/Downloads/genially_6838b1981bcbde8cf3c96d30_images 2/004_OURVISION.jpg