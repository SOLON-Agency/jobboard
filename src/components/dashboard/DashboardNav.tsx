"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Stack,
  Paper,
  Drawer,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";
import ChatIcon from "@mui/icons-material/Chat";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import appSettings from "@/config/app.settings.json";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ArchiveIcon from "@mui/icons-material/Archive";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Profilul meu", href: "/dashboard/profile", icon: <PersonIcon /> },
  { label: "Companiile mele", href: "/dashboard/company", icon: <BusinessIcon /> },
  { label: "Anunțurile mele", href: "/dashboard/jobs", icon: <WorkIcon /> },
  { label: "Aplicațiile mele", href: "/dashboard/applications", icon: <DescriptionIcon /> },
  ...(appSettings.features.forms ? [{ label: "Formularele mele", href: "/dashboard/forms", icon: <EditDocumentIcon /> }] : []),
  ...(appSettings.features.messages ? [{ label: "Mesaje", href: "/dashboard/messages", icon: <ChatIcon /> }] : []),
  ...(appSettings.features.alerts ? [{ label: "Alerte", href: "/dashboard/alerts", icon: <NotificationsIcon /> }] : []),
  ...(appSettings.features.favouriteJobs ? [{ label: "Favorite", href: "/dashboard/favourite-jobs", icon: <BookmarkIcon /> }] : []),
  ...(appSettings.features.archiveJobs ? [{ label: "Arhivă", href: "/dashboard/archive", icon: <ArchiveIcon /> }] : []),
  ...(appSettings.features.edgeFunctions ? [{ label: "Test funcții Edge", href: "/dashboard/edge-functions", icon: <CloudQueueIcon /> }] : []),
];

// ── Shared nav list rendered in both sidebar and mobile drawer ────────────────

interface NavListProps {
  pathname: string;
  onNavigate?: () => void;
}

const NavList: React.FC<NavListProps> = ({ pathname, onNavigate }) => (
  <List disablePadding>
    {navItems.map((item) => {
      const isActive = pathname === item.href;
      return (
        <ListItem key={item.href} disablePadding>
          <ListItemButton
            component={Link}
            href={item.href}
            selected={isActive}
            onClick={onNavigate}
            sx={{
              "&.Mui-selected": {
                bgcolor: "action.selected",
                borderLeft: "3px solid",
                borderColor: "primary.main",
              },
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 40, color: isActive ? "primary.main" : "text.secondary" }}
            >
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
);

// ── Main component ────────────────────────────────────────────────────────────

export const DashboardNav: React.FC = () => {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = navItems.find((item) => item.href === pathname);

  return (
    <>
      {/* ── Desktop: sticky sidebar ───────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 88,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <NavList pathname={pathname} />
      </Box>

      {/* ── Mobile: inline breadcrumb-style banner ────────────────────────── */}
      <Paper
        variant="outlined"
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              display: "flex",
              color: "primary.main",
              "& svg": { fontSize: 18 },
            }}
          >
            {activeItem?.icon}
          </Box>
          <Typography variant="body2" fontWeight={600} color="primary.main">
            {activeItem?.label ?? "Dashboard"}
          </Typography>
        </Stack>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          size="small"
          aria-label="Deschide meniu navigare"
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* ── Mobile: slide-in drawer ───────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { md: "none" } }}
        PaperProps={{ sx: { width: 260 } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Navigare
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Închide meniu">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />
        <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </>
  );
};
