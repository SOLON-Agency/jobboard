import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

interface BlogSkeletonProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Skeleton variant="rounded" width={60} height={22} />
          <Skeleton variant="rounded" width={60} height={22} />
        </Stack>
        <Skeleton variant="text" sx={{ fontSize: "1.25rem", mb: 0.5 }} />
        <Skeleton variant="text" sx={{ fontSize: "1.25rem", width: "80%", mb: 1 }} />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="70%" />
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={100} />
          <Box flex={1} />
          <Skeleton variant="text" width={70} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function BlogSkeleton({ count = 9 }: BlogSkeletonProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "1fr 1fr 1fr",
        },
        gap: 3,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </Box>
  );
}
