import { Container } from "@mui/material";
import { BlogSkeleton } from "@/components/blog/BlogSkeleton";

export default function BlogLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <BlogSkeleton count={9} />
    </Container>
  );
}
