"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";
import ChatIcon from "@mui/icons-material/Chat";
import NotificationsIcon from "@mui/icons-material/Notifications";
import appSettings from "@/config/app.settings.json";
import EditDocumentIcon from "@mui/icons-material/EditDocument";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Profilul meu", href: "/dashboard/profile", icon: <PersonIcon /> },
  { label: "Companiile mele", href: "/dashboard/company", icon: <BusinessIcon /> },
  { label: "Anunțurile mele", href: "/dashboard/jobs", icon: <WorkIcon /> },
  { label: "Aplicațiile mele", href: "/dashboard/applications", icon: <DescriptionIcon /> },
  
  ...(appSettings.features.forms ? [{ label: "Formularele mele", href: "/dashboard/forms", icon: <EditDocumentIcon /> }] : []),
  ...(appSettings.features.messages ? [{ label: "Mesaje", href: "/dashboard/messages", icon: <ChatIcon /> }] : []),
  ...(appSettings.features.alerts ? [{ label: "Alerte", href: "/dashboard/alerts", icon: <NotificationsIcon /> }] : []),
];

export const DashboardNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <List disablePadding>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                    borderLeft: "3px solid",
                    borderColor: "primary.main",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? "primary.main" : "text.secondary" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "primary.main" : "text.primary",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};
