import type { Metadata } from "next";
import { Typography, Paper } from "@mui/material";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import ChatIcon from "@mui/icons-material/Chat";

export const metadata: Metadata = {
  title: "Mesaje",
  robots: { index: false },
};

export default function MessagesPage() {
  return (
    <>
      <DashboardPageHeader title={<Typography variant="h3">Messages</Typography>} />
      <Paper sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
        <ChatIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>
          No conversations yet
        </Typography>
        <Typography color="text.secondary">
          Messages with employers will appear here.
        </Typography>
      </Paper>
    </>
  );
}
