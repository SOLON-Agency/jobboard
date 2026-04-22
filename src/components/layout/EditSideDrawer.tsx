"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Alert,
  Divider,
  type DrawerProps,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Message {
  type: "success" | "error";
  text: string;
}

interface EditSideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  message?: Message | null;
  onMessageClose?: () => void;
  width?: number | string;
  slotProps?: {
    drawer?: Partial<DrawerProps>;
  };
}

export function EditSideDrawer({
  open,
  onClose,
  title,
  children,
  message,
  onMessageClose,
  width = 480,
  slotProps,
}: EditSideDrawerProps) {
  return (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    {...slotProps?.drawer}
    PaperProps={{
      sx: {
        width: { xs: "100%", sm: width },
        maxWidth: "100vw",
        ...slotProps?.drawer?.PaperProps?.sx,
      },
      ...slotProps?.drawer?.PaperProps,
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 3, py: 2, flexShrink: 0 }}
    >
      <Typography variant="h5" fontWeight={700}>
        {title}
      </Typography>
      <IconButton onClick={onClose} size="small" aria-label="Close drawer">
        <CloseIcon />
      </IconButton>
    </Stack>

    <Divider />

    <Box sx={{ flex: 1, overflow: "auto", px: 3, py: 3 }}>
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2.5 }}
          onClose={onMessageClose}
        >
          {message.text}
        </Alert>
      )}
      {children}
    </Box>
  </Drawer>
);
}