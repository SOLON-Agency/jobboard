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
  Skeleton,
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
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ArchiveIcon from "@mui/icons-material/Archive";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import appSettings from "@/config/app.settings.json";
import { useRole } from "@/hooks/useRole";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactElement;
}

// ── Shared nav list ────────────────────────────────────────────────────────────

interface NavListProps {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}

function NavList({ items, pathname, onNavigate }: NavListProps) {
  return (
    <List disablePadding>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
}

// ── Nav item sets per role ─────────────────────────────────────────────────────

function useNavItems(): NavItem[] {
  const {
    role,
    loading,
    hasArchivedApplications,
    isAtLeastEmployer,
    isAdmin,
  } = useRole();

  if (loading) return [];

  // ── Base items (all roles) ─────────────────────────────────────────────────
  const items: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
    { label: "Profilul meu", href: "/dashboard/profile", icon: <PersonIcon /> },
    { label: "Aplicațiile mele", href: "/dashboard/applications", icon: <DescriptionIcon /> },
  ];

  // ── Employer+ items ────────────────────────────────────────────────────────
  if (isAtLeastEmployer) {
    items.push(
      { label: "Companiile mele", href: "/dashboard/company", icon: <BusinessIcon /> },
      { label: "Anunțurile mele", href: "/dashboard/jobs", icon: <WorkIcon /> },
      ...(appSettings.features.forms
        ? [{ label: "Formularele mele", href: "/dashboard/forms", icon: <EditDocumentIcon /> }]
        : []),
      { label: "Toți candidații", href: "/dashboard/candidates", icon: <PeopleAltOutlinedIcon /> }
    );
  }

  // ── Messages / Alerts (feature-flagged) ───────────────────────────────────
  if (appSettings.features.messages) {
    items.push({ label: "Mesaje", href: "/dashboard/messages", icon: <ChatIcon /> });
  }
  if (appSettings.features.alerts) {
    items.push({ label: "Alerte", href: "/dashboard/alerts", icon: <NotificationsIcon /> });
  }

  // ── Favourites ─────────────────────────────────────────────────────────────
  if (appSettings.features.favourites) {
    items.push({ label: "Favorite", href: "/dashboard/favourites", icon: <BookmarkIcon /> });
  }

  // ── Archive ────────────────────────────────────────────────────────────────
  // Employer+: always visible (they can archive companies, jobs, forms, applications).
  // Regular user: visible only after they have archived at least one application.
  if (appSettings.features.archiveJobs) {
    if (isAtLeastEmployer || hasArchivedApplications) {
      items.push({ label: "Arhivă", href: "/dashboard/archive", icon: <ArchiveIcon /> });
    }
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (isAdmin) {
    items.push(
      { label: "Test funcții Edge", href: "/dashboard/edge-functions", icon: <CloudQueueIcon /> },
      { label: "Utilizatori", href: "/dashboard/admin/users", icon: <GroupOutlinedIcon /> },
      { label: "Competențe", href: "/dashboard/admin/skills", icon: <PsychologyOutlinedIcon /> }
    );
  }

  return items;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DashboardNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useRole();
  const items = useNavItems();

  const activeItem = items.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {/* ── Desktop: sticky sidebar ───────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 88,
          borderRadius: 2,
          border: "1px solid rgba(3, 23, 12, 0.1)",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Stack spacing={0.5} sx={{ p: 1 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: 1 }} />
            ))}
          </Stack>
        ) : (
          <NavList items={items} pathname={pathname} />
        )}
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
          {activeItem && (
            <Box sx={{ display: "flex", color: "primary.main", "& svg": { fontSize: 18 } }}>
              {activeItem.icon}
            </Box>
          )}
          <Typography variant="body2" fontWeight={600} color="primary.main">
            {activeItem?.label ?? "Dashboard"}
          </Typography>
        </Stack>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          size="small"
          aria-label="Deschide meniu navigare"
          aria-expanded={drawerOpen}
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
          <IconButton
            onClick={() => setDrawerOpen(false)}
            size="small"
            aria-label="Închide meniu"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />
        <NavList items={items} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </>
  );
}

