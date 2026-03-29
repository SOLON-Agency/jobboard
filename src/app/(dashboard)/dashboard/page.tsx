import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Typography, Paper, Stack } from "@mui/material";
import { GradientText } from "@/components/dashboard/GradientText";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { count: applicationCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: favoriteCount } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const stats = [
    { label: "Aplicații", value: applicationCount ?? 0 },
    { label: "Locuri de muncă salvate", value: favoriteCount ?? 0 },
  ];

  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Bine ai revenit{profile?.full_name ? `, ${profile.full_name}` : ""}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Paper
            key={stat.label}
            sx={{
              p: 3,
              flex: 1,
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <GradientText variant="h2">
              {stat.value}
            </GradientText>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Acțiuni rapide
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completează profilul, răsfoiește locuri de muncă și setează alerte pentru a fi la curent cu noile oportunități.
        </Typography>
      </Paper>
    </>
  );
}
