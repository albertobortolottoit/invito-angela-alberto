import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

const SUPABASE_URL = "https://wzwakveypwobmehvjupk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d2FrdmV5cHdvYm1laHZqdXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzcxOTMsImV4cCI6MjA5NzAxMzE5M30.cWmSiXugmUoHRS9RhJ2NLgjfpoqYs_FnELofqFn8lTc";
// angela disabled: Resend rejects entire request if any recipient is not the account owner
// re-enable once a custom domain is verified on resend.com
const NOTIFY_EMAILS = ["alberto.bortolotto@gmail.com"];

type CloudflareCtx = { waitUntil: (p: Promise<unknown>) => void };

async function handleRsvp(request: Request, env: Record<string, string>, ctx: CloudflareCtx): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { name, email, attending, adults, children, dietary, message } = body as Record<string, unknown>;
  if (!name || !email || typeof attending !== "boolean") return json({ error: "Missing required fields" }, 422);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      name, email, attending,
      adults: Number(adults) || 0,
      children: Number(children) || 0,
      dietary: dietary || null,
      message: message || null,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    return json({ error: msg }, 500);
  }

  // Fire-and-forget Google Sheets update
  // Google Apps Script returns 302 — must follow redirect manually keeping POST
  const sheetsUrl = env.SHEETS_WEBHOOK_URL;
  if (sheetsUrl) {
    const total = (Number(adults) || 0) + (Number(children) || 0);
    const sheetsBody = JSON.stringify({
      name, email,
      attending: attending ? true : false,
      adults: attending ? (Number(adults) || 0) : 0,
      children: attending ? (Number(children) || 0) : 0,
      total: attending ? total : 0,
      dietary: dietary || "",
      message: message || "",
    });
    const sheetsPromise = (async () => {
      try {
        // Use GET with URL params to avoid Google Apps Script POST redirect issue
        const sheetsData = JSON.parse(sheetsBody) as Record<string, unknown>;
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(sheetsData)) {
          params.set(k, String(v ?? ""));
        }
        const r = await fetch(`${sheetsUrl}?${params.toString()}`);
        if (!r.ok) console.error("Sheets error:", await r.text().catch(() => r.statusText));
      } catch (e) {
        console.error("Sheets fetch failed:", e);
      }
    })();
    ctx.waitUntil(sheetsPromise);
  }

  // Use ctx.waitUntil so Cloudflare keeps the Worker alive until the email is sent
  const apiKey = env.RESEND_API_KEY;
  if (apiKey) {
    const total = (Number(adults) || 0) + (Number(children) || 0);
    const emailPromise = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Invito Angela & Alberto <onboarding@resend.dev>",
        to: NOTIFY_EMAILS,
        subject: `Nuova RSVP: ${name} — ${attending ? `Presente (${total} pers.)` : "Assente"}`,
        html: `<h2>Nuova risposta RSVP</h2>
          <p><b>Nome:</b> ${name}</p><p><b>Email:</b> ${email}</p>
          <p><b>Presenza:</b> ${attending ? "✅ Parteciperà" : "❌ Non parteciperà"}</p>
          ${attending ? `<p><b>Adulti:</b> ${adults}</p><p><b>Bambini:</b> ${children}</p><p><b>Totale:</b> ${total}</p>` : ""}
          ${dietary ? `<p><b>Intolleranze:</b> ${dietary}</p>` : ""}
          ${message ? `<p><b>Messaggio:</b> ${message}</p>` : ""}`,
      }),
    }).then(r => { if (!r.ok) r.text().then(t => console.error("Resend error:", t)); })
      .catch(e => console.error("Resend fetch failed:", e));
    ctx.waitUntil(emailPromise);
  }

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const envMap = (env && typeof env === "object" ? env : {}) as Record<string, string>;

    // Map Cloudflare secrets/vars to process.env
    for (const [key, value] of Object.entries(envMap)) {
      if (typeof value === "string") process.env[key] = value;
    }

    // Handle RSVP API directly — bypasses TanStack routing
    const url = new URL(request.url);
    if (url.pathname === "/api/rsvp" && request.method === "POST") {
      return handleRsvp(request, envMap, ctx as CloudflareCtx);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
