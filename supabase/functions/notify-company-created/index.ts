/**
 * @deprecated Use POST /api/companies/notify-created on the Next.js app.
 */
Deno.serve(
  () =>
    new Response(
      JSON.stringify({
        ok: false,
        error: "deprecated",
        message: "Use POST /api/companies/notify-created on the web app",
      }),
      { status: 410, headers: { "Content-Type": "application/json" } },
    ),
);
