/* eslint-disable */
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// We will try taking the RESEND_API_KEY from the frontend payload or the edge env

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, message, email, resendApiKey, personalEmail } = await req.json();

    // @ts-ignore
    const finalApiKey = resendApiKey || Deno.env.get("RESEND_API_KEY");
    if (!finalApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable. Add VITE_RESEND_API_KEY in your .env or Supabase Secrets");
    }

    if (!type || !message) {
      return new Response(JSON.stringify({ error: "Missing type or message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Try to get user email from authorization if possible
    const authHeader = req.headers.get('Authorization');
    
    const emailPayload: Record<string, unknown> = {
      from: "Acme <onboarding@resend.dev>", // replace with your verified domain in production
      // @ts-ignore
      to: [personalEmail || Deno.env.get("PERSONAL_EMAIL") || "delivered@resend.dev"], // set your personal email here
      subject: `New ${type.toUpperCase()} from Quadrant App`,
      html: `
        <h1>New ${type}</h1>
        <p><strong>From Auth Status:</strong> ${authHeader ? 'Authenticated User (Token provided)' : 'Anonymous'}</p>
        <p><strong>Sender Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${message}</blockquote>
      `,
    };

    if (email) {
      emailPayload.reply_to = email;
    }

    // Setup Resend email request
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${finalApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
        });
    } else {
        const errorData = await res.json();
        return new Response(JSON.stringify({ error: errorData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
