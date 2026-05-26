import { createAPIFileRoute } from "@tanstack/react-start/api";
import { z } from "zod";

const rsvpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  attending: z.boolean(),
  adults: z.number().int().min(0).max(20),
  children: z.number().int().min(0).max(20),
  dietary: z.string().trim().max(500).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

const SUPABASE_URL = "https://feniqdcvhanpajlnzbgu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbmlxZGN2aGFucGFqbG56Ymd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTY1MjAsImV4cCI6MjA5NTI5MjUyMH0.Vs3pJBplSYFQG2kUY8UpXpDRyiSWbyDtp4RwwOqHVxg";
const NOTIFY_EMAILS = ["alberto.bortolotto@gmail.com", "angelatar885@gmail.com"];

export const APIRoute = createAPIFileRoute("/api/rsvp")({
  POST: async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.message }), { status: 422 });
    }
    const data = parsed.data;

    // Insert into Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        attending: data.attending,
        adults: data.adults,
        children: data.children,
        dietary: data.dietary || null,
        message: data.message || null,
      }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }

    // Fire-and-forget: email notification
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const total = data.adults + data.children;
      const attendingText = data.attending ? "✅ Parteciperà" : "❌ Non parteciperà";
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Invito Angela & Alberto <onboarding@resend.dev>",
          to: NOTIFY_EMAILS,
          subject: `Nuova RSVP: ${data.name} — ${data.attending ? `Presente (${total} pers.)` : "Assente"}`,
          html: `<h2>Nuova risposta RSVP</h2>
            <p><b>Nome:</b> ${data.name}</p>
            <p><b>Email:</b> ${data.email}</p>
            <p><b>Presenza:</b> ${attendingText}</p>
            ${data.attending ? `<p><b>Adulti:</b> ${data.adults}</p><p><b>Bambini:</b> ${data.children}</p><p><b>Totale:</b> ${total}</p>` : ""}
            ${data.dietary ? `<p><b>Intolleranze:</b> ${data.dietary}</p>` : ""}
            ${data.message ? `<p><b>Messaggio:</b> ${data.message}</p>` : ""}`,
        }),
      }).catch(console.error);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  },
});
