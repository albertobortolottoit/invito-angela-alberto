import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const rsvpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  attending: z.boolean(),
  guests: z.number().int().min(0).max(10),
  dietary: z.string().trim().max(500).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

const NOTIFY_EMAILS = ["alberto.bortolotto@gmail.com", "angelatar885@gmail.com"];

async function sendRsvpNotification(data: z.infer<typeof rsvpSchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // skip silently if not configured

  const attendingText = data.attending ? "✅ Parteciperà" : "❌ Non parteciperà";
  const guestsText = data.attending ? `Ospiti aggiuntivi: ${data.guests}` : "";
  const dietaryText = data.dietary ? `Intolleranze/allergie: ${data.dietary}` : "";
  const messageText = data.message ? `Messaggio: ${data.message}` : "";

  const html = `
    <h2>Nuova risposta RSVP — Matrimonio Angela &amp; Alberto</h2>
    <table cellpadding="8" style="border-collapse:collapse">
      <tr><td><strong>Nome</strong></td><td>${data.name}</td></tr>
      <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
      <tr><td><strong>Presenza</strong></td><td>${attendingText}</td></tr>
      ${data.attending ? `<tr><td><strong>Ospiti aggiuntivi</strong></td><td>${data.guests}</td></tr>` : ""}
      ${data.dietary ? `<tr><td><strong>Intolleranze</strong></td><td>${data.dietary}</td></tr>` : ""}
      ${data.message ? `<tr><td><strong>Messaggio</strong></td><td>${data.message}</td></tr>` : ""}
    </table>
  `.trim();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Invito Angela & Alberto <noreply@resend.dev>",
      to: NOTIFY_EMAILS,
      subject: `Nuova RSVP: ${data.name} — ${data.attending ? "Presente" : "Assente"}`,
      html,
    }),
  });
}

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => rsvpSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("rsvps").insert({
      name: data.name,
      email: data.email,
      attending: data.attending,
      guests: data.guests,
      dietary: data.dietary || null,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);

    // fire-and-forget: don't block the response if email fails
    sendRsvpNotification(data).catch(console.error);

    return { ok: true };
  });
