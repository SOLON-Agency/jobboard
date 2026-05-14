"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useToast } from "@/contexts/ToastContext";
import { togglePublish, deletePost } from "@/app/dashboard/blog/actions";
import { formatDate } from "@/lib/blog/markdown";
import type { BlogPost } from "@/services/blog.service";

const STATUS_LABELS: Record<string, { label: string; color: "default" | "success" | "warning" | "error" }> = {
  published: { label: "Publicat", color: "success" },
  draft:     { label: "Ciornă",   color: "warning" },
  archived:  { label: "Arhivat",  color: "default" },
};

interface Props {
  initialPosts: BlogPost[];
  subscriberCount: number;
}

export function BlogAdminClient({ initialPosts, subscriberCount }: Props) {
  const { showToast } = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const handleTogglePublish = (post: BlogPost) => {
    startTransition(async () => {
      const result = await togglePublish(post.id, post.status);
      if (result.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, status: p.status === "published" ? "draft" : "published" }
              : p
          )
        );
        showToast(
          post.status === "published" ? "Articol trecut la ciornă." : "Articol publicat.",
          "info"
        );
      } else {
        showToast(result.error ?? "Eroare la schimbarea statusului.", "error", 5000);
      }
    });
  };

  const handleDelete = (post: BlogPost) => {
    setDeleteTarget(post);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, slug } = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await deletePost(id, slug);
      if (result.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast("Articol șters.", "info");
      } else {
        showToast(result.error ?? "Eroare la ștergere.", "error", 5000);
      }
    });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={700}>
            Gestionare Blog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {posts.length} articole &middot; {subscriberCount} abonați newsletter
          </Typography>
        </Stack>
        <Button
          component={Link}
          href="/dashboard/blog/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ minHeight: 44 }}
        >
          Articol nou
        </Button>
      </Stack>

      {posts.length === 0 ? (
        <Alert severity="info">
          Nu există articole. Creează primul articol folosind butonul de mai sus.
        </Alert>
      ) : (
        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table aria-label="Tabel articole blog">
            <TableHead>
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell sx={{ fontWeight: 700 }}>Titlu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Publicat</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lectură</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Acțiuni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => {
                const statusCfg = STATUS_LABELS[post.status] ?? STATUS_LABELS.draft;
                return (
                  <TableRow key={post.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>
                          {post.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          /blog/{post.slug}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusCfg.label}
                        color={statusCfg.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {post.published_at ? formatDate(post.published_at) : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {post.reading_time_minutes ? `${post.reading_time_minutes} min` : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        {post.status === "published" && (
                          <Tooltip title="Vizualizează pe site">
                            <IconButton
                              component="a"
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              aria-label={`Vizualizează ${post.title}`}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip
                          title={post.status === "published" ? "Trece la ciornă" : "Publică"}
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleTogglePublish(post)}
                              disabled={isPending || post.status === "archived"}
                              aria-label={
                                post.status === "published"
                                  ? `Trece ${post.title} la ciornă`
                                  : `Publică ${post.title}`
                              }
                            >
                              {post.status === "published" ? (
                                <UnpublishedIcon fontSize="small" />
                              ) : (
                                <PublishIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Editează">
                          <IconButton
                            component={Link}
                            href={`/dashboard/blog/${post.id}/edit`}
                            size="small"
                            aria-label={`Editează ${post.title}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Șterge">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(post)}
                            disabled={isPending}
                            aria-label={`Șterge ${post.title}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {isPending && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <DialogTitle id="delete-dialog-title">Șterge articolul?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-desc">
            Articolul <strong>{deleteTarget?.title}</strong> va fi șters definitiv. Această
            acțiune nu poate fi anulată.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Anulează</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Șterge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
