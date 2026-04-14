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
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import appSettings from "@/config/app.settings.json";

const CREAM = "#F0EBD8";
const CREAM_MUTED = "rgba(240, 235, 216, 0.65)";
const CREAM_HOVER = "rgba(240, 235, 216, 0.12)";

const navLinks = [
  { label: "Postează un anunț", href: "/anunt" },
  // { label: "Cum funcționează", href: "/how-it-works" },
  { label: "Vezi anunțuri", href: "/jobs" },
];

export const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
  const redirectToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    window.location.href = "/";
  };

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar
          sx={{
            maxWidth: 1200,
            width: "100%",
            mx: "auto",
            px: { xs: 2, md: 4 },
            minHeight: { xs: 60, md: 68 },
          }}
        >
          {/* Logo */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
              mr: 5,
              flexShrink: 0,
            }}
          >
            <WorkOutlineIcon sx={{ color: CREAM, fontSize: 22, opacity: 0.9 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: CREAM,
                letterSpacing: "0.06em",
                fontSize: "1rem",
                textTransform: "uppercase",
              }}
            >
              {appSettings.name}
            </Typography>
          </Box>

          {/* Desktop nav links */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 0.5, flexGrow: 1 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  disableRipple
                  sx={{
                    color: "white",
                    fontWeight: 400,
                    fontSize: "0.875rem",
                    letterSpacing: "0.01em",
                    px: 1.5,
                    py: 0.75,
                    minWidth: 0,
                    bgcolor: "transparent",
                    "&:hover": {
                      color: CREAM,
                      bgcolor: CREAM_HOVER,
                      cursor: "pointer",
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          {/* Desktop auth section */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {authLoading ? (
                <>
                  <Skeleton
                    variant="rounded"
                    width={110}
                    height={32}
                    sx={{ borderRadius: 5, bgcolor: "rgba(240,235,216,0.1)" }}
                  />
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    sx={{ bgcolor: "rgba(240,235,216,0.1)" }}
                  />
                </>
              ) : user ? (
                <>
                  <Button
                    component={Link}
                    href="/dashboard"
                    startIcon={<DashboardIcon sx={{ fontSize: "16px !important" }} />}
                    sx={{
                      color: "white",
                      fontWeight: 400,
                      fontSize: "0.875rem",
                      px: 1.5,
                      "&:hover": { color: CREAM, bgcolor: CREAM_HOVER },
                    }}
                  >
                    Dashboard
                  </Button>
                  {appSettings.features.notifications && <IconButton sx={{ color: CREAM_MUTED, "&:hover": { color: CREAM, bgcolor: CREAM_HOVER } }}>
                    <NotificationsOutlinedIcon />
                  </IconButton>}  
                  {appSettings.features.messages && <IconButton
                    component={Link}
                    href="/dashboard/messages"
                    size="small"
                    title="Mesaje"
                    sx={{ color: CREAM_MUTED, "&:hover": { color: CREAM, bgcolor: CREAM_HOVER } }}
                  >
                    <ChatIcon fontSize="small" />
                  </IconButton>}
                  <IconButton onClick={handleMenuOpen}>
                    <Avatar
                      src={avatarUrl ?? undefined}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "rgba(62,92,118,0.6)",
                        color: CREAM,
                        fontSize: 13,
                        fontWeight: 700,
                        border: "1.5px solid rgba(240,235,216,0.3)",
                      }}
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
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1,
                          bgcolor: "#03170C",
                          border: "1px solid rgba(240,235,216,0.12)",
                          color: CREAM,
                          "& .MuiMenuItem-root": {
                            color: CREAM_MUTED,
                            fontSize: "0.875rem",
                            "&:hover": { bgcolor: CREAM_HOVER, color: CREAM },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem component={Link} href="/dashboard/profile" onClick={handleMenuClose}>
                      <PersonIcon sx={{ mr: 1, fontSize: 18 }} /> Profil
                    </MenuItem>
                    <Divider sx={{ borderColor: "rgba(240,235,216,0.1)" }} />
                    <MenuItem onClick={handleSignOut}>
                      <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Deconectare
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/login"
                    sx={{
                      color: CREAM_MUTED,
                      fontWeight: 400,
                      fontSize: "0.875rem",
                      px: 1.5,
                      "&:hover": { color: CREAM, bgcolor: CREAM_HOVER },
                    }}
                  >
                    Conectare
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    variant="outlined"
                    size="small"
                    sx={{
                      color: CREAM,
                      borderColor: "rgba(240,235,216,0.45)",
                      borderRadius: 5,
                      px: 2.5,
                      py: 0.75,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      "&:hover": {
                        borderColor: CREAM,
                        bgcolor: CREAM_HOVER,
                      },
                    }}
                  >
                    Începe acum
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <>
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ color: CREAM, ml: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
            {user && ( <IconButton onClick={redirectToDashboard}>
              <Avatar
                src={avatarUrl ?? undefined}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "rgba(62,92,118,0.6)",
                  color: CREAM,
                  fontSize: 13,
                  fontWeight: 700,
                  border: "1.5px solid rgba(240,235,216,0.3)",
                }}
              >
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </Avatar>
            </IconButton>
            )}
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            pt: 2,
            bgcolor: "#03170C",
            color: CREAM,
            borderLeft: "1px solid rgba(240,235,216,0.08)",
          },
        }}
      >
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton
                component={Link}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  "&:hover": { bgcolor: CREAM_HOVER },
                  "& .MuiListItemText-primary": { color: CREAM_MUTED, fontSize: "0.9rem" },
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1, borderColor: "rgba(240,235,216,0.1)" }} />
          {authLoading ? (
            <ListItem>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1, bgcolor: "rgba(240,235,216,0.1)" }} />
                <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1, bgcolor: "rgba(240,235,216,0.1)" }} />
              </Box>
            </ListItem>
          ) : user ? (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ "&:hover": { bgcolor: CREAM_HOVER }, "& .MuiListItemText-primary": { color: CREAM_MUTED } }}
                >
                  <ListItemText primary="Tablou de bord" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/dashboard/messages"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ "&:hover": { bgcolor: CREAM_HOVER }, "& .MuiListItemText-primary": { color: CREAM_MUTED } }}
                >
                  <ListItemText primary="Mesaje" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleSignOut}
                  sx={{ "&:hover": { bgcolor: CREAM_HOVER }, "& .MuiListItemText-primary": { color: CREAM_MUTED } }}
                >
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
                  sx={{ "&:hover": { bgcolor: CREAM_HOVER }, "& .MuiListItemText-primary": { color: CREAM_MUTED } }}
                >
                  <ListItemText primary="Conectare" />
                </ListItemButton>
              </ListItem>
              <ListItem sx={{ pt: 1.5 }}>
                <Button
                  component={Link}
                  href="/register"
                  variant="outlined"
                  fullWidth
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    color: CREAM,
                    borderColor: "rgba(240,235,216,0.4)",
                    borderRadius: 5,
                    fontWeight: 500,
                    "&:hover": { borderColor: CREAM, bgcolor: CREAM_HOVER },
                  }}
                >
                  Începe acum
                </Button>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};
