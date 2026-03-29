"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Skeleton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import ChatIcon from "@mui/icons-material/Chat";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const navLinks = [
  { label: "Locuri de muncă", href: "/jobs" },
  { label: "Cum funcționează", href: "/how-it-works" },
];

export const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, loading: authLoading, signOut } = useAuth();
  const supabase = useSupabase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user, supabase]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    window.location.href = "/";
  };

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 2, md: 3 } }}>
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
              mr: 4,
            }}
          >
            <WorkOutlineIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              LegalJobs
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {authLoading ? (
                <>
                  <Skeleton variant="rounded" width={100} height={30} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="circular" width={32} height={32} />
                </>
              ) : user ? (
                <>
                  <Button
                    component={Link}
                    href="/dashboard"
                    startIcon={<DashboardIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Tablou de bord
                  </Button>
                  <NotificationBell />
                  <IconButton component={Link} href="/dashboard/messages" size="small" title="Mesaje" sx={{ color: "text.secondary" }}>
                    <ChatIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={handleMenuOpen} size="small">
                    <Avatar
                      src={avatarUrl ?? undefined}
                      sx={{ width: 32, height: 32, bgcolor: "primary.dark", fontSize: 14 }}
                    >
                      {user.email?.[0]?.toUpperCase() ?? "U"}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    <MenuItem component={Link} href="/dashboard/profile" onClick={handleMenuClose}>
                      <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Profil
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSignOut}>
                      <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Deconectare
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button component={Link} href="/login" sx={{ color: "text.secondary" }}>
                    Conectare
                  </Button>
                  <Button component={Link} href="/register" variant="contained" size="small">
                    Începe acum
                  </Button>
                </>
              )}
            </Box>
          )}

          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "text.primary" }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, pt: 2 } }}
      >
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton
                component={Link}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          {authLoading ? (
            <ListItem>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </ListItem>
          ) : user ? (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/dashboard"
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary="Tablou de bord" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/dashboard/messages"
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary="Mesaje" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={handleSignOut}>
                  <ListItemText primary="Deconectare" />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/login"
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary="Conectare" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/register"
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary="Începe acum" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};
