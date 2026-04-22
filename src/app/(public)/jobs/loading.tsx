import { Box, CircularProgress } from "@mui/material";

export default function JobsLoading() {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}
      role="status"
      aria-label="Se încarcă joburile..."
    >
      <CircularProgress />
    </Box>
  );
}
