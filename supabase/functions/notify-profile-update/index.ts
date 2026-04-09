/**
 * @deprecated Use POST /api/profile/notify-updated on the Next.js app.
 */
Deno.serve(
  () =>
    new Response(
      JSON.stringify({
        ok: false,
        error: "deprecated",
        message: "Use POST /api/profile/notify-updated on the web app",
      }),
      { status: 410, headers: { "Content-Type": "application/json" } },
    ),
);
