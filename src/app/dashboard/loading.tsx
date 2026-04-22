import { Box, CircularProgress } from "@mui/material";

export default function DashboardLoading() {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}
      role="status"
      aria-label="Se încarcă..."
    >
      <CircularProgress />
    </Box>
  );
}
