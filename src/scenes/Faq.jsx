import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AiChatPanel, { welcomeMessage } from "../components/AiChatPanel";
import Header from "../components/Header";
import initialChatHistories from "../data/chatHistoryData.json";
import { tokens } from "../theme";

const historyGroupOrder = ["Today", "Yesterday", "Previous 7 days"];

function Faq() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [conversations, setConversations] = useState(initialChatHistories);
  const [selectedId, setSelectedId] = useState(initialChatHistories[0].id);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ||
    conversations[0];

  const groupedConversations = useMemo(
    () =>
      historyGroupOrder
        .map((group) => ({
          group,
          conversations: conversations.filter((item) => item.group === group),
        }))
        .filter((section) => section.conversations.length > 0),
    [conversations]
  );

  const handleNewChat = () => {
    const newConversation = {
      id: `new-${Date.now()}`,
      title: "New conversation",
      updatedAt: "Just now",
      group: "Today",
      messages: [welcomeMessage],
    };

    setConversations((current) => [newConversation, ...current]);
    setSelectedId(newConversation.id);
  };

  const handleMessagesChange = (conversationId, messages) => {
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const firstUserMessage = messages.find(
          (message) => message.role === "user"
        )?.content;

        return {
          ...conversation,
          title:
            conversation.title === "New conversation" && firstUserMessage
              ? firstUserMessage.slice(0, 38)
              : conversation.title,
          updatedAt: "Just now",
          messages,
        };
      })
    );
  };

  return (
    <Box m="0.5rem 1rem 1.5rem">
      <Header
        title="AI CHAT"
        subtitle="Continue a previous conversation or start a new one"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
          gap: 2,
          alignItems: "start",
          mt: 1.5,
        }}
      >
        <Paper
          elevation={2}
          component="nav"
          aria-label="Chat history"
          sx={{
            height: { xs: 310, md: 680 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<AddCommentOutlinedIcon />}
              onClick={handleNewChat}
            >
              New chat
            </Button>
          </Box>
          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 0.5 }}>
            {groupedConversations.map((section) => (
              <Box key={section.group} sx={{ mb: 1 }}>
                <Typography
                  variant="overline"
                  color={colors.grey[300]}
                  sx={{ display: "block", px: 1.25, pt: 1 }}
                >
                  {section.group}
                </Typography>
                <List disablePadding>
                  {section.conversations.map((conversation) => (
                    <ListItemButton
                      key={conversation.id}
                      selected={conversation.id === selectedId}
                      onClick={() => setSelectedId(conversation.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        alignItems: "flex-start",
                        "&.Mui-selected": {
                          bgcolor: colors.greenAccent[800],
                        },
                        "&.Mui-selected:hover": {
                          bgcolor: colors.greenAccent[700],
                        },
                      }}
                    >
                      <ChatBubbleOutlineIcon
                        fontSize="small"
                        sx={{ mt: 0.65, mr: 1, flexShrink: 0 }}
                      />
                      <ListItemText
                        primary={conversation.title}
                        secondary={conversation.updatedAt}
                        primaryTypographyProps={{ noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        </Paper>

        <AiChatPanel
          conversation={selectedConversation}
          onMessagesChange={handleMessagesChange}
        />
      </Box>
    </Box>
  );
}

export default Faq;
