"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/contexts/ToastContext";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { formatDate } from "@/lib/utils";

type ReleaseAnnouncement = {
  id: string;
  version: string;
  title: string;
  body_html: string;
  draft: boolean;
  created_at: string;
  sent_at: string | null;
};

export function AdminReleasesClient() {
  const supabase = useSupabase();
  const { showToast } = useToast();

  const [releases, setReleases] = useState<ReleaseAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ReleaseAnnouncement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const releasesTable = () => (supabase as any).from("app_release_announcements");

  const loadReleases = useCallback(async () => {
    setLoading(true);
    const { data, error } = (await releasesTable()
      .select("*")
      .order("created_at", { ascending: false })) as {
      data: ReleaseAnnouncement[] | null;
      error: { message: string } | null;
    };

    if (error) {
      showToast("Nu s-au putut încărca anunțurile.", "error", 5000);
    } else {
      setReleases(data ?? []);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, showToast]);

  useEffect(() => {
    void loadReleases();
  }, [loadReleases]);

  const handlePublish = async (release: ReleaseAnnouncement) => {
    setPublishingId(release.id);
    try {
      // Mark as published in DB
      const { error: updateError } = (await releasesTable()
        .update({ draft: false, sent_at: new Date().toISOString() })
        .eq("id", release.id)) as { error: { message: string } | null };

      if (updateError) {
        showToast(`Eroare la publicare: ${updateError.message}`, "error", 5000);
        return;
      }

      // Fetch all user IDs to notify
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .not("id", "is", null);

      const recipientIds = (profiles ?? []).map((p: { id: string }) => p.id);

      if (recipientIds.length > 0) {
        await dispatchNotification(supabase, {
          type: NOTIFICATION_TYPES.RELEASE_ANNOUNCEMENT,
          recipients: recipientIds,
          data: {
            version: release.version,
            title: release.title,
            body_html: release.body_html,
          },
          idempotencyKey: `release-announcement/${release.id}`,
        });
      }

      showToast(`Anunțul v${release.version} a fost publicat și trimis la ${recipientIds.length} utilizatori.`, "success");
      await loadReleases();
    } finally {
      setPublishingId(null);
    }
  };

  const openEdit = (release: ReleaseAnnouncement) => {
    setEditingRelease(release);
    setEditTitle(release.title);
    setEditBodyHtml(release.body_html);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingRelease) return;
    setEditSaving(true);
    const { error } = (await releasesTable()
      .update({ title: editTitle, body_html: editBodyHtml })
      .eq("id", editingRelease.id)) as { error: { message: string } | null };

    if (error) {
      showToast("Nu s-a putut salva.", "error", 5000);
    } else {
      showToast("Anunț actualizat.", "success");
      setEditDialogOpen(false);
      await loadReleases();
    }
    setEditSaving(false);
  };

  return (
    <>
      <DashboardPageHeader
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <CampaignOutlinedIcon color="primary" aria-hidden />
            <Typography variant="h3">Anunțuri noutăți platformă</Typography>
          </Stack>
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Acestea sunt draft-urile create automat de <code>notifications-release-detect</code> când
        detectează o nouă versiune a aplicației. Editează titlul și textul, apoi publică pentru a
        notifica toți utilizatorii.
      </Typography>

      <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : releases.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Niciun anunț de noutăți găsit. Acestea sunt generate automat la detecția unei noi versiuni.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table aria-label="Anunțuri noutăți">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Versiune</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Titlu</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stare</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Creat la</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trimis la</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {releases.map((release) => (
                  <TableRow key={release.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                        v{release.version}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {release.title || <em style={{ color: "gray" }}>Fără titlu</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={release.draft ? "Draft" : "Publicat"}
                        color={release.draft ? "default" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(release.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {release.sent_at ? formatDate(release.sent_at) : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          aria-label={`Editează anunțul v${release.version}`}
                          onClick={() => openEdit(release)}
                          disabled={!release.draft}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={
                            publishingId === release.id ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <SendOutlinedIcon fontSize="small" />
                            )
                          }
                          disabled={!release.draft || publishingId !== null}
                          onClick={() => void handlePublish(release)}
                          sx={{ minWidth: 100 }}
                        >
                          {publishingId === release.id ? "Se trimite…" : "Publică"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="edit-release-dialog-title"
      >
        <DialogTitle id="edit-release-dialog-title">
          Editează anunț {editingRelease && <code>v{editingRelease.version}</code>}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Titlu"
              fullWidth
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              inputProps={{ "aria-required": "true" }}
            />
            <TextField
              label="Conținut (HTML)"
              fullWidth
              multiline
              rows={10}
              value={editBodyHtml}
              onChange={(e) => setEditBodyHtml(e.target.value)}
              helperText="HTML valid. Poți folosi <p>, <ul>, <li>, <strong>, <a> etc."
            />
            {editBodyHtml && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Previzualizare:
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, maxHeight: 260, overflow: "auto", "& p": { mt: 0 } }}
                  dangerouslySetInnerHTML={{ __html: editBodyHtml }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editSaving}>
            Anulează
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleEditSave()}
            disabled={editSaving || !editTitle.trim()}
          >
            {editSaving ? "Se salvează…" : "Salvează"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
