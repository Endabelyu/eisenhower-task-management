// @ts-ignore - Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore - Deno environment
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const start = Date.now();

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime_ms: Date.now() - start,
    checks: {
      // @ts-ignore - Deno environment
      resend_key_configured: !!Deno.env.get("RESEND_API_KEY"),
      // @ts-ignore - Deno environment
      personal_email_configured: !!Deno.env.get("PERSONAL_EMAIL"),
    },
  };

  const allHealthy = Object.values(health.checks).every(Boolean);

  return new Response(JSON.stringify(health), {
    status: allHealthy ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
