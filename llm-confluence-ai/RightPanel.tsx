import React from "react";
import {
  Box,
  TextField,
  IconButton,
  Stack,
  InputAdornment,
  Paper,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import MicIcon from "@mui/icons-material/Mic";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";

interface PromptContainerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const PromptContainer: React.FC<PromptContainerProps> = ({ value, onChange, onSubmit }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: "#121212",
        p: 2,
        borderRadius: 2,
      }}
    >
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { color: "#fff", flex: 1, mr: 2 },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onSubmit}>
                  <SendRoundedIcon sx={{ color: "#888" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        <Stack direction="row" spacing={1}>
          <IconButton><AttachFileIcon sx={{ color: "#aaa" }} /></IconButton>
          <IconButton><MicIcon sx={{ color: "#aaa" }} /></IconButton>
          <IconButton><ViewSidebarIcon sx={{ color: "#aaa" }} /></IconButton>
        </Stack>
      </Box>
    </Paper>
  );
};

export default PromptContainer;
