import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const rsvpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  attending: z.boolean(),
  adults: z.number().int().min(0).max(20),
  children: z.number().int().min(0).max(20),
  dietary: z.string().trim().max(500).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

const NOTIFY_EMAILS = ["alberto.bortolotto@gmail.com", "angelatar885@gmail.com"];

async function sendRsvpNotification(data: z.infer<typeof rsvpSchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const attendingText = data.attending ? "✅ Parteciperà" : "❌ Non parteciperà";
  const total = data.adults + data.children;

  const html = `
    <h2>Nuova risposta RSVP — Matrimonio Angela &amp; Alberto</h2>
    <table cellpadding="8" style="border-collapse:collapse">
      <tr><td><strong>Nome</strong></td><td>${data.name}</td></tr>
      <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
      <tr><td><strong>Presenza</strong></td><td>${attendingText}</td></tr>
      ${data.attending ? `
      <tr><td><strong>Adulti</strong></td><td>${data.adults}</td></tr>
      <tr><td><strong>Bambini (&lt;10 anni)</strong></td><td>${data.children}</td></tr>
      <tr><td><strong>Totale partecipanti</strong></td><td><strong>${total}</strong></td></tr>
      ` : ""}
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
      subject: `Nuova RSVP: ${data.name} — ${data.attending ? `Presente (${total} pers.)` : "Assente"}`,
      html,
    }),
  });
}

async function sendToGoogleSheets(data: z.infer<typeof rsvpSchema>) {
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;

  const total = data.adults + data.children;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      attending: data.attending,
      adults: data.attending ? data.adults : 0,
      children: data.attending ? data.children : 0,
      total: data.attending ? total : 0,
      dietary: data.dietary || "",
      message: data.message || "",
    }),
  });
}

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => rsvpSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("rsvps").insert({
      name: data.name,
      email: data.email,
      attending: data.attending,
      adults: data.adults,
      children: data.children,
      dietary: data.dietary || null,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);

    sendRsvpNotification(data).catch(console.error);
    sendToGoogleSheets(data).catch(console.error);

    return { ok: true };
  });
