"use client";

import React from "react";
import { Typography, Paper, Box } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";

export default function MessagesPage() {
  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Messages
      </Typography>
      <Paper sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
        <ChatIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>
          No conversations yet
        </Typography>
        <Typography color="text.secondary">
          Messages with employers will appear here.
        </Typography>
      </Paper>
    </>
  );
}
