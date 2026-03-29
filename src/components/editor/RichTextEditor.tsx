"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Box,
  IconButton,
  Divider,
  Stack,
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
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
}

const ToolbarButton: React.FC<{
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, active = false, disabled = false, onClick, children }) => (
  <Tooltip title={title} arrow>
    <span>
      <IconButton
        size="small"
        onClick={onClick}
        disabled={disabled}
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

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  error = false,
  helperText,
  minHeight = 220,
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return null;

  const btn = (
    title: string,
    active: boolean,
    action: () => void,
    icon: React.ReactNode,
    disabled = false
  ) => (
    <ToolbarButton key={title} title={title} active={active} onClick={action} disabled={disabled}>
      {icon}
    </ToolbarButton>
  );

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
          {btn("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <FormatBoldIcon sx={{ fontSize: 18 }} />)}
          {btn("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <FormatItalicIcon sx={{ fontSize: 18 }} />)}
          {btn("Underline", editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <FormatUnderlinedIcon sx={{ fontSize: 18 }} />)}
          {btn("Code", editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <CodeIcon sx={{ fontSize: 18 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Bullet list", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <FormatListBulletedIcon sx={{ fontSize: 18 }} />)}
          {btn("Ordered list", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <FormatListNumberedIcon sx={{ fontSize: 18 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Align left", editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <FormatAlignLeftIcon sx={{ fontSize: 18 }} />)}
          {btn("Align center", editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <FormatAlignCenterIcon sx={{ fontSize: 18 }} />)}
          {btn("Align right", editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <FormatAlignRightIcon sx={{ fontSize: 18 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Horizontal rule", false, () => editor.chain().focus().setHorizontalRule().run(), <HorizontalRuleIcon sx={{ fontSize: 18 }} />)}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {btn("Undo", false, () => editor.chain().focus().undo().run(), <UndoIcon sx={{ fontSize: 18 }} />, !editor.can().undo())}
          {btn("Redo", false, () => editor.chain().focus().redo().run(), <RedoIcon sx={{ fontSize: 18 }} />, !editor.can().redo())}
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
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "text.primary",
              "& p": { my: 0.5 },
              "& h1,h2,h3": { mt: 1.5, mb: 0.5, fontWeight: 700 },
              "& ul,ol": { pl: 3, my: 0.5 },
              "& code": {
                bgcolor: "action.hover",
                borderRadius: 0.5,
                px: 0.5,
                fontFamily: "monospace",
                fontSize: "0.8rem",
              },
              "& hr": { borderColor: "divider", my: 1.5 },
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
          sx={{ mt: 0.5, ml: 1.75, display: "block", color: error ? "error.main" : "text.secondary" }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};
