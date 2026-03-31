import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildEmail,
  corsHeaders,
  createTransport,
  detailRow,
  errResponse,
  getSmtpConfig,
  infoTable,
  okResponse,
} from "../_shared/email.ts";

interface NotifyPayload {
  user_id: string;
}

const experienceLevelLabel: Record<string, string> = {
  entry: "Entry-level",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead / Principal",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id }: NotifyPayload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") ?? supabaseUrl;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Fetch user email + profile ───────────────────────────────────────────
    const [{ data: userData }, { data: profile }] = await Promise.all([
      supabase.auth.admin.getUserById(user_id),
      supabase
        .from("profiles")
        .select("full_name, headline, location, experience_level, is_public, slug")
        .eq("id", user_id)
        .single(),
    ]);

    const userEmail = userData?.user?.email;
    if (!userEmail) return okResponse({ emailsSent: false, reason: "no email" });

    const name = profile?.full_name ?? userEmail;
    const updatedAt = new Date().toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ── SMTP ─────────────────────────────────────────────────────────────────
    const smtp = getSmtpConfig();
    if (!smtp) {
      console.warn("SMTP not configured — skipping profile update email.");
      return okResponse({ emailsSent: false });
    }
    const transporter = createTransport(smtp);

    // ── Build detail rows ────────────────────────────────────────────────────
    const expLabel = Array.isArray(profile?.experience_level)
      ? profile.experience_level
          .map((l: string) => experienceLevelLabel[l] ?? l)
          .join(", ")
      : profile?.experience_level
      ? experienceLevelLabel[profile.experience_level] ?? profile.experience_level
      : null;

    const rows = [
      detailRow("Nume:", name),
      ...(profile?.headline ? [detailRow("Titlu profesional:", profile.headline)] : []),
      ...(profile?.location ? [detailRow("Locație:", profile.location)] : []),
      ...(expLabel ? [detailRow("Nivel experiență:", expLabel)] : []),
      detailRow(
        "Profil public:",
        profile?.is_public ? "Vizibil pentru toți" : "Ascuns"
      ),
      detailRow("Actualizat la:", updatedAt),
    ].join("");

    const publicProfileUrl =
      profile?.is_public && profile?.slug
        ? `${siteUrl}/users/${profile.slug}`
        : `${siteUrl}/dashboard/profile`;

    const bodyHtml = `
      <p>Salut, ${name},</p>
      <p>
        Profilul tău a fost actualizat cu succes. Iată un rezumat al informațiilor
        înregistrate momentan:
      </p>
      ${infoTable(rows)}
      <p style="font-size:13px;color:#6B7C70;">
        Dacă nu tu ai efectuat această modificare, te rugăm să îți schimbi imediat parola
        sau să ne contactezi.
      </p>
    `;

    await transporter.sendMail({
      from: smtp.from,
      to: userEmail,
      subject: "Profilul tău a fost actualizat",
      html: buildEmail({
        preheader: "Modificările profilului tău au fost salvate cu succes.",
        heading: "Profil actualizat cu succes",
        bodyHtml,
        ctaUrl: publicProfileUrl,
        ctaLabel: profile?.is_public ? "Vezi profilul tău public" : "Mergi la profil",
        siteUrl,
      }),
    });

    return okResponse({ emailsSent: true });
  } catch (err) {
    console.error("notify-profile-update error:", err);
    return errResponse(err);
  }
});
