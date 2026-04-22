import { Box, CircularProgress } from "@mui/material";

export default function JobDetailLoading() {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}
      role="status"
      aria-label="Se încarcă anunțul..."
    >
      <CircularProgress />
    </Box>
  );
}
