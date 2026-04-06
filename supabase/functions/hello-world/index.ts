/**
 * Starter Edge Function (Supabase dashboard template).
 *
 * Deploy:
 *   supabase functions deploy hello-world --project-ref <YOUR_PROJECT_REF>
 *
 * Invoke (replace URL + anon key):
 *   curl -L -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/hello-world' \
 *     -H 'Authorization: Bearer <YOUR_ANON_KEY>' \
 *     --data '{"name":"Functions"}'
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let name = "World";
    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as { name?: unknown };
      if (typeof body.name === "string" && body.name.trim()) {
        name = body.name.trim();
      }
    }

    return new Response(
      JSON.stringify({
        message: `Hello ${name}!`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
