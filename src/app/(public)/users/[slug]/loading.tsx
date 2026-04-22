import { Box, CircularProgress } from "@mui/material";

export default function UserProfileLoading() {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}
      role="status"
      aria-label="Se încarcă profilul..."
    >
      <CircularProgress />
    </Box>
  );
}
