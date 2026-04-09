/**
 * @deprecated Notifications are sent from Next.js (`/api/jobs/notify-application`)
 * using the user session and Resend. This stub remains so old deploys can be retired.
 */
Deno.serve(
  () =>
    new Response(
      JSON.stringify({
        ok: false,
        error: "deprecated",
        message: "Use POST /api/jobs/notify-application on the web app",
      }),
      { status: 410, headers: { "Content-Type": "application/json" } },
    ),
);
