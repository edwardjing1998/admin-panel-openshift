import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { tokens } from "../theme";
import { sendAiMessage } from "../services/aiChatService";

export const welcomeMessage = {
  role: "assistant",
  content:
    "Hello! I can help answer questions about your investments. What would you like to know?",
};

function AiChatPanel({ conversation, onMessagesChange }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [messages, setMessages] = useState(conversation.messages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(conversation.messages);
    setInput("");
    setError("");
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const updateMessages = (nextMessages) => {
    setMessages(nextMessages);
    onMessagesChange(conversation.id, nextMessages);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = input.trim();

    if (!message || isLoading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    const messagesWithQuestion = [
      ...messages,
      { role: "user", content: message },
    ];

    updateMessages(messagesWithQuestion);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const answer = await sendAiMessage({ message, history });
      updateMessages([
        ...messagesWithQuestion,
        { role: "assistant", content: answer },
      ]);
    } catch (requestError) {
      setError(requestError.message || "The AI service is unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: { xs: 560, md: 680 },
        overflow: "hidden",
        bgcolor: colors.primary[400],
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${colors.grey[700]}`,
        }}
      >
        <Avatar sx={{ bgcolor: colors.greenAccent[600] }}>
          <SmartToyOutlinedIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} noWrap>
            {conversation.title}
          </Typography>
          <Typography variant="body2" color={colors.grey[300]}>
            AI Assistant · {conversation.updatedAt}
          </Typography>
        </Box>
        <Tooltip title="Clear this conversation">
          <IconButton
            aria-label="Clear this conversation"
            onClick={() => updateMessages([welcomeMessage])}
            disabled={isLoading}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        aria-live="polite"
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <Box
              key={`${message.role}-${index}`}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                flexDirection: isUser ? "row-reverse" : "row",
                gap: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: isUser
                    ? colors.blueAccent[600]
                    : colors.greenAccent[700],
                }}
              >
                {isUser ? (
                  <PersonOutlineIcon fontSize="small" />
                ) : (
                  <SmartToyOutlinedIcon fontSize="small" />
                )}
              </Avatar>
              <Box
                sx={{
                  maxWidth: "78%",
                  px: 1.5,
                  py: 1.1,
                  borderRadius: isUser
                    ? "14px 4px 14px 14px"
                    : "4px 14px 14px 14px",
                  bgcolor: isUser
                    ? colors.blueAccent[700]
                    : colors.primary[500],
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {message.content}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} color="secondary" />
            <Typography color={colors.grey[300]}>Thinking…</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ p: 1.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question…"
            aria-label="Message AI assistant"
            disabled={isLoading}
            size="small"
          />
          <IconButton
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isLoading}
            sx={{
              bgcolor: colors.greenAccent[600],
              color: colors.primary[900],
              "&:hover": { bgcolor: colors.greenAccent[500] },
            }}
          >
            <SendRoundedIcon />
          </IconButton>
        </Box>
        <Typography
          variant="caption"
          color={colors.grey[400]}
          sx={{ display: "block", mt: 0.75 }}
        >
          Enter to send · Shift+Enter for a new line
        </Typography>
      </Box>
    </Paper>
  );
}

export default AiChatPanel;
