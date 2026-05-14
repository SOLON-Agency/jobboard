"use client";

import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  Box,
  Button,
  IconButton,
  Divider,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import CodeIcon from "@mui/icons-material/Code";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
}

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          aria-label={title}
          aria-pressed={active}
          sx={{
            borderRadius: 1,
            color: active ? "primary.main" : "text.secondary",
            bgcolor: active ? "action.selected" : "transparent",
            "&:hover": { bgcolor: "action.hover" },
            width: 28,
            height: 28,
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/**
 * Markdown-native TipTap editor.
 * Uses `tiptap-markdown` to keep state as Markdown and emit clean Markdown on change.
 * Heading levels are restricted to H2/H3 (H1 is reserved for the post title).
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Scrie conținutul articolului...",
  error = false,
  helperText,
  minHeight = 400,
}: MarkdownEditorProps) {
  const [linkAnchor, setLinkAnchor] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        underline: false,
        // StarterKit bundles link-like behaviour; disable to use explicit Link extension
        horizontalRule: {},
        code: {},
        codeBlock: {},
        blockquote: {},
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        html: false,
        tightLists: true,
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange((e.storage as any).markdown.getMarkdown() as string);
    },
  });

  if (!editor) return null;

  const btn = (
    title: string,
    active: boolean,
    action: () => void,
    icon: React.ReactNode,
    disabled = false
  ) => (
    <ToolbarButton
      key={title}
      title={title}
      active={active}
      disabled={disabled}
      onClick={action}
    >
      {icon}
    </ToolbarButton>
  );

  const openLinkPopover = (anchor: HTMLElement) => {
    const existing = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(existing ?? "https://");
    setLinkAnchor(anchor);
  };

  const applyLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed || trimmed === "https://") {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkAnchor(null);
  };

  return (
    <Box>
      <Box
        sx={{
          border: "1px solid",
          borderColor: error ? "error.main" : "divider",
          borderRadius: 1,
          overflow: "hidden",
          "&:focus-within": {
            borderColor: error ? "error.main" : "primary.main",
            boxShadow: (t) =>
              `0 0 0 2px ${error ? t.palette.error.main : t.palette.primary.main}22`,
          },
        }}
      >
        {/* Toolbar */}
        <Stack
          component="div"
          role="toolbar"
          aria-label="Editor de text"
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={0.5}
          sx={{
            px: 1,
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          {/* Headings */}
          {btn(
            "Titlu H2",
            editor.isActive("heading", { level: 2 }),
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            <Typography component="span" sx={{ fontWeight: 700, fontSize: 12, lineHeight: 1 }}>H2</Typography>
          )}
          {btn(
            "Titlu H3",
            editor.isActive("heading", { level: 3 }),
            () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            <Typography component="span" sx={{ fontWeight: 700, fontSize: 11, lineHeight: 1 }}>H3</Typography>
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <FormatBoldIcon sx={{ fontSize: 18 }} />)}
          {btn("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <FormatItalicIcon sx={{ fontSize: 18 }} />)}
          {btn("Subliniat", editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <FormatUnderlinedIcon sx={{ fontSize: 18 }} />)}
          {btn("Cod inline", editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <CodeIcon sx={{ fontSize: 18 }} />)}
          {btn("Citat", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <FormatQuoteIcon sx={{ fontSize: 18 }} />)}

          {/* Link button */}
          <Tooltip title="Hyperlink" arrow>
            <span>
              <IconButton
                size="small"
                onClick={(e) => openLinkPopover(e.currentTarget)}
                aria-label="Adaugă hyperlink"
                aria-pressed={editor.isActive("link")}
                sx={{
                  borderRadius: 1,
                  color: editor.isActive("link") ? "primary.main" : "text.secondary",
                  bgcolor: editor.isActive("link") ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  width: 28,
                  height: 28,
                }}
              >
                <LinkIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Listă", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <FormatListBulletedIcon sx={{ fontSize: 18 }} />)}
          {btn("Listă numerotată", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <FormatListNumberedIcon sx={{ fontSize: 18 }} />)}
          {btn("Bloc de cod", editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), <CodeIcon sx={{ fontSize: 18, opacity: 0.7 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Aliniere stânga", editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <FormatAlignLeftIcon sx={{ fontSize: 18 }} />)}
          {btn("Aliniere centru", editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <FormatAlignCenterIcon sx={{ fontSize: 18 }} />)}
          {btn("Aliniere dreapta", editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <FormatAlignRightIcon sx={{ fontSize: 18 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Linie orizontală", false, () => editor.chain().focus().setHorizontalRule().run(), <HorizontalRuleIcon sx={{ fontSize: 18 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Anulează", false, () => editor.chain().focus().undo().run(), <UndoIcon sx={{ fontSize: 18 }} />, !editor.can().undo())}
          {btn("Refă", false, () => editor.chain().focus().redo().run(), <RedoIcon sx={{ fontSize: 18 }} />, !editor.can().redo())}
        </Stack>

        {/* Editor area */}
        <Box
          sx={{
            minHeight,
            px: 2,
            py: 1.5,
            cursor: "text",
            "& .ProseMirror": {
              outline: "none",
              minHeight,
              fontSize: "0.9375rem",
              lineHeight: 1.8,
              color: "text.primary",
              "& p": { my: 0.75 },
              "& h2": { mt: 2.5, mb: 1, fontWeight: 700, fontSize: "1.25rem" },
              "& h3": { mt: 2, mb: 0.75, fontWeight: 600, fontSize: "1.1rem" },
              "& ul, & ol": { pl: 3, my: 0.5 },
              "& blockquote": {
                borderLeft: "3px solid",
                borderColor: "primary.main",
                pl: 1.5,
                ml: 0,
                color: "text.secondary",
                fontStyle: "italic",
              },
              "& code": {
                bgcolor: "action.hover",
                borderRadius: 0.5,
                px: 0.5,
                fontFamily: "monospace",
                fontSize: "0.85em",
              },
              "& pre": {
                bgcolor: "grey.100",
                p: 1.5,
                borderRadius: 1,
                overflowX: "auto",
                "& code": { bgcolor: "transparent" },
              },
              "& hr": { borderColor: "divider", my: 2 },
              "& a": {
                color: "primary.main",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              },
            },
            "& .ProseMirror p.is-editor-empty:first-child::before": {
              content: "attr(data-placeholder)",
              color: "text.disabled",
              pointerEvents: "none",
              float: "left",
              height: 0,
            },
          }}
          onClick={() => editor.commands.focus()}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            ml: 1.75,
            display: "block",
            color: error ? "error.main" : "text.secondary",
          }}
          role={error ? "alert" : undefined}
        >
          {helperText}
        </Typography>
      )}

      {/* Link popover */}
      <Popover
        open={Boolean(linkAnchor)}
        anchorEl={linkAnchor}
        onClose={() => setLinkAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, borderRadius: 2, width: 320, mt: 0.5 } } }}
      >
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Adaugă un hyperlink
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); applyLink(); }
            if (e.key === "Escape") setLinkAnchor(null);
          }}
          placeholder="https://exemplu.com"
          autoFocus
          sx={{ mb: 1.5 }}
          inputProps={{ "aria-label": "URL hyperlink" }}
        />
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => { editor.chain().focus().unsetLink().run(); setLinkAnchor(null); }}
            disabled={!editor.isActive("link")}
            startIcon={<LinkOffIcon sx={{ fontSize: 15 }} />}
            sx={{ fontSize: "0.75rem" }}
          >
            Elimină
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={applyLink}
            startIcon={<LinkIcon sx={{ fontSize: 15 }} />}
            sx={{ fontSize: "0.75rem" }}
          >
            Aplică
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
}
