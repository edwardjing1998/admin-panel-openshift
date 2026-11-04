import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Chip,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import { searchEducation } from "../services/educationSearchService";
import EducationSearchResults from "./EducationSearchResults";
import { learningCourses, learningModes, suggestedQuestions } from "../config/learningAssistant";

export const welcomeMessage = {
  role: "assistant",
  content:
    "Hello! I can help answer questions about your investments. What would you like to know?",
};

function AiChatPanel({ conversation, onMessagesChange, onSubjectChange, onGradeChange, onLearningModeChange }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [messages, setMessages] = useState(conversation.messages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedSubject = conversation.subject || "legacy";
  const selectedGrade = conversation.grade || 3;
  const learningMode = conversation.learningMode || "resources";
  const isEducationCourse = learningCourses.some((course) => course.id === selectedSubject);
  const availableCourse = learningCourses.find((course) => course.id === selectedSubject);
  const exampleQuestions = suggestedQuestions[selectedSubject] || [];

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(conversation.messages);
    setInput("");
    setError("");
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const updateMessages = (nextMessages) => {
    setMessages(nextMessages);
    onMessagesChange(conversation.id, nextMessages);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    const history = messages.map(({ role, content }) => ({
      role,
      content:
        typeof content === "string"
          ? content
          : content?.content || JSON.stringify(content),
    }));

    const messagesWithQuestion = [
      ...messages,
      {
        role: "user",
        content: message,
      },
    ];

    updateMessages(messagesWithQuestion);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const apiResult = selectedSubject === "legacy"
        ? await sendAiMessage({ message, history })
        : await searchEducation({
            message,
            subject: selectedSubject,
            searchIntent: "auto",
            topK: 10,
          });

      /*
       * sendAiMessage might return either:
       *
       * 1. A string:
       *    "This is the AI answer"
       *
       * 2. An object:
       *    {
       *      content: "This is the AI answer",
       *      traceId: "...",
       *      intents: [],
       *      evidence: []
       *    }
       *
       * Normalize both formats before adding the assistant message.
       */
      const normalizedResult =
        typeof apiResult === "string"
          ? {
              content: apiResult,
              traceId: null,
              intents: [],
              evidence: [],
            }
          : apiResult || {};

      const answerContent =
        typeof normalizedResult.content === "string"
          ? normalizedResult.content
          : JSON.stringify(
              normalizedResult.content || "No answer was generated.",
              null,
              2
            );

      const assistantMessage = {
        role: "assistant",
        content: answerContent,
        traceId:
          typeof normalizedResult.traceId === "string"
            ? normalizedResult.traceId
            : null,
        intents: Array.isArray(normalizedResult.intents)
          ? normalizedResult.intents
          : [],
        evidence: Array.isArray(normalizedResult.evidence)
          ? normalizedResult.evidence
          : [],
        educationResults: Array.isArray(normalizedResult.results)
          ? normalizedResult.results
          : [],
        subject: selectedSubject,
        grade: isEducationCourse ? selectedGrade : null,
        learningMode: isEducationCourse ? learningMode : null,
      };

      updateMessages([
        ...messagesWithQuestion,
        assistantMessage,
      ]);
    } catch (requestError) {
      console.error("AI request failed:", requestError);

      setError(
        requestError?.message ||
          "The AI service is currently unavailable."
      );
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
        height: {
          xs: 560,
          md: 680,
        },
        minWidth: 0,
        maxWidth: "100%",
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
        <Avatar
          sx={{
            bgcolor: colors.greenAccent[600],
          }}
        >
          <SmartToyOutlinedIcon />
        </Avatar>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            noWrap
          >
            {conversation.title}
          </Typography>

          <Typography
            variant="body2"
            color={colors.grey[300]}
          >
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
          minWidth: 0,
          overflowX: "hidden",
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          /*
           * React cannot render a JavaScript object directly.
           * Convert unexpected content into a safe string.
           */
          const displayContent =
            typeof message.content === "string"
              ? message.content
              : typeof message.content?.content === "string"
              ? message.content.content
              : JSON.stringify(message.content, null, 2);

          return (
            <Box
              key={`${message.role}-${index}`}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                flexDirection: isUser
                  ? "row-reverse"
                  : "row",
                gap: 1,
                minWidth: 0,
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
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
                  minWidth: 0,
                  maxWidth: "78%",
                  px: 1.5,
                  py: 1.1,
                  overflow: "hidden",
                  borderRadius: isUser
                    ? "14px 4px 14px 14px"
                    : "4px 14px 14px 14px",
                  bgcolor: isUser
                    ? colors.blueAccent[700]
                    : colors.primary[500],
                }}
              >
                <Typography
                  component="div"
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    maxWidth: "100%",
                  }}
                >
                  {displayContent}
                </Typography>

                {!isUser && Array.isArray(message.educationResults) && (
                  <EducationSearchResults results={message.educationResults} />
                )}

                {!isUser &&
                  typeof message.traceId === "string" &&
                  message.traceId && (
                    <Typography
                      variant="caption"
                      color={colors.grey[400]}
                      sx={{
                        display: "block",
                        mt: 1,
                        overflowWrap: "anywhere",
                      }}
                    >
                      Trace ID: {message.traceId}
                    </Typography>
                  )}

                {!isUser &&
                  Array.isArray(message.evidence) &&
                  message.evidence.length > 0 && (
                    <Typography
                      variant="caption"
                      color={colors.grey[400]}
                      sx={{
                        display: "block",
                        mt: 0.5,
                      }}
                    >
                      Evidence sources: {message.evidence.length}
                    </Typography>
                  )}
              </Box>
            </Box>
          );
        })}

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CircularProgress
              size={20}
              color="secondary"
            />

            <Typography color={colors.grey[300]}>
              Thinking…
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 1.5,
          minWidth: 0,
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 130px" }, gap: 1.5, mb: 1.5 }}>
          <FormControl fullWidth size="small" disabled={isLoading}>
            <InputLabel id="ai-course-label">Course / service</InputLabel>
            <Select
              labelId="ai-course-label"
              label="Course / service"
              value={selectedSubject}
              onChange={(event) => onSubjectChange(conversation.id, event.target.value)}
            >
              {learningCourses.map((course) => (
                <MenuItem key={course.id} value={course.id} disabled={!course.searchEnabled}>
                  {course.label}{!course.searchEnabled ? " (coming soon)" : ""}
                </MenuItem>
              ))}
              <MenuItem disabled>Other existing services</MenuItem>
              <MenuItem value="legacy">AT&amp;T Billing / Policy</MenuItem>
              <MenuItem value="bible">Bible</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" disabled={isLoading || !isEducationCourse}>
            <InputLabel id="ai-grade-label">Grade</InputLabel>
            <Select
              labelId="ai-grade-label"
              label="Grade"
              value={selectedGrade}
              onChange={(event) => onGradeChange(conversation.id, Number(event.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <MenuItem key={grade} value={grade}>Grade {grade}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {isEducationCourse && (
          <>
            <FormControl fullWidth size="small" sx={{ mb: 1 }} disabled={isLoading}>
              <InputLabel id="ai-learning-mode-label">Learning mode</InputLabel>
              <Select
                labelId="ai-learning-mode-label"
                label="Learning mode"
                value={learningMode}
                onChange={(event) => onLearningModeChange(conversation.id, event.target.value)}
              >
                {learningModes.map((mode) => (
                  <MenuItem key={mode.id} value={mode.id}>{mode.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {learningMode !== "resources" && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Guided explanations and progressive hints are planned features. For now,
                this mode searches existing learning resources; it does not generate a personalized tutorial.
              </Alert>
            )}
            <Typography variant="caption" color={colors.grey[300]} sx={{ display: "block", mb: 1 }}>
              {availableCourse?.label} search is available. Grade {selectedGrade} is a display preference;
              grade-filtered retrieval is not enabled yet.
            </Typography>
            {exampleQuestions.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                {exampleQuestions.map((question) => (
                  <Chip
                    key={question}
                    label={question}
                    size="small"
                    onClick={() => setInput(question)}
                    disabled={isLoading}
                    variant="outlined"
                    sx={{ maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 1,
            }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            minWidth: 0,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
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
              flexShrink: 0,
              bgcolor: colors.greenAccent[600],
              color: colors.primary[900],
              "&:hover": {
                bgcolor: colors.greenAccent[500],
              },
            }}
          >
            <SendRoundedIcon />
          </IconButton>
        </Box>

        <Typography
          variant="caption"
          color={colors.grey[400]}
          sx={{
            display: "block",
            mt: 0.75,
          }}
        >
          Enter to send · Shift+Enter for a new line
        </Typography>
      </Box>
    </Paper>
  );
}

export default AiChatPanel;