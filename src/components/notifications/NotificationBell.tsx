"use client";

import React, { useState } from "react";
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Box,
  Divider,
  type SxProps,
  type Theme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/utils";

interface NotificationBellProps {
  sx?: SxProps<Theme>;
}

export function NotificationBell({ sx }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const unread = notifications.filter((n) => !n.read_at);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        aria-label={unreadCount > 0 ? `Notificări (${unreadCount} necitite)` : "Notificări"}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        sx={sx}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 480, overflow: "auto" },
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Notificări</Typography>
          {unread.length > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Marchează toate ca citite
            </Button>
          )}
        </Box>
        <Divider />
        {unread.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Nicio notificare necitită
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {unread.map((n) => (
              <ListItem
                key={n.id}
                onClick={() => markAsRead(n.id)}
                sx={{
                  cursor: "pointer",
                  bgcolor: "action.hover",
                  "&:hover": { bgcolor: "action.selected" },
                }}
              >
                <ListItemText
                  primary={n.title}
                  secondary={
                    <>
                      {n.body && (
                        <Typography variant="caption" color="text.secondary" component="span">
                          {n.body}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }}>
                        {timeAgo(n.created_at)}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 600,
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
