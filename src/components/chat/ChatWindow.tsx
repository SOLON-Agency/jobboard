"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(input.trim());
      setInput("");
    } catch {
      /* handle error */
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: 500,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <Stack spacing={1.5}>
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    maxWidth: "70%",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: isMine ? "primary.dark" : "background.default",
                    border: "1px solid",
                    borderColor: isMine ? "primary.dark" : "divider",
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {timeAgo(msg.created_at)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          size="small"
          fullWidth
          multiline
          maxRows={3}
        />
        <IconButton onClick={handleSend} disabled={!input.trim() || sending} color="primary">
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};
