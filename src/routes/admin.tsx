import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

type Rsvp = {
  id: string;
  name: string;
  email: string;
  attending: boolean;
  adults: number;
  children: number;
  dietary: string | null;
  message: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — RSVP" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <Toaster richColors position="top-center" />
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-4xl italic mb-2">Dashboard RSVP</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {userEmail ? `Connesso come ${userEmail}` : "Accedi per vedere le risposte."}
        </p>
        {userEmail ? <RsvpList onSignOut={() => supabase.auth.signOut()} /> : <SignIn />}
      </div>
    </div>
  );
}

function SignIn() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) toast.error("Credenziali non valide");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm grid gap-4 bg-card border border-border p-8 rounded-sm">
      <input name="email" type="email" required placeholder="Email"
        className="bg-background border border-input rounded-sm px-3 py-3 text-sm" />
      <input name="password" type="password" required placeholder="Password"
        className="bg-background border border-input rounded-sm px-3 py-3 text-sm" />
      <button disabled={loading}
        className="bg-sage-deep text-primary-foreground py-3 tracking-[0.25em] uppercase text-xs disabled:opacity-60">
        {loading ? "…" : "Accedi"}
      </button>
    </form>
  );
}

function downloadCsv(rows: Rsvp[]) {
  const header = ["Data", "Nome", "Email", "Presenza", "Adulti", "Bambini (<10)", "Totale", "Intolleranze", "Messaggio"];
  const lines = rows.map((r) => [
    new Date(r.created_at).toLocaleDateString("it-IT"),
    r.name,
    r.email,
    r.attending ? "Sì" : "No",
    r.attending ? r.adults : 0,
    r.attending ? r.children : 0,
    r.attending ? r.adults + r.children : 0,
    r.dietary ?? "",
    r.message ?? "",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));

  const csv = [header.join(";"), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rsvp-matrimonio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RsvpList({ onSignOut }: { onSignOut: () => void }) {
  const [rows, setRows] = useState<Rsvp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("rsvps")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data ?? []) as Rsvp[]);
      });
  }, []);

  if (error) {
    return (
      <div className="bg-card border border-border p-6 rounded-sm">
        <p className="text-sm text-destructive mb-3">Errore: {error}</p>
        <button onClick={onSignOut} className="text-xs underline text-muted-foreground">Esci</button>
      </div>
    );
  }

  if (!rows) return <div className="text-muted-foreground text-sm">Carico…</div>;

  const yes = rows.filter((r) => r.attending);
  const totAdults = yes.reduce((acc, r) => acc + (r.adults ?? 0), 0);
  const totChildren = yes.reduce((acc, r) => acc + (r.children ?? 0), 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Risposte" value={rows.length} />
        <Stat label="Presenti" value={yes.length} />
        <Stat label="Adulti" value={totAdults} />
        <Stat label="Bambini" value={totChildren} />
      </div>
      <div className="bg-sage-deep/10 border border-sage-deep/30 rounded-sm px-5 py-4 mb-8 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-sage-deep">Totale partecipanti: </span>
        <span className="font-display text-2xl text-sage-deep">{totAdults + totChildren}</span>
        <span className="text-xs text-muted-foreground ml-3">({totAdults} adulti + {totChildren} bambini)</span>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{rows.length} risposte totali</p>
        <button
          onClick={() => downloadCsv(rows)}
          className="px-5 py-2 border border-sage-deep text-sage-deep text-xs tracking-[0.2em] uppercase hover:bg-sage-deep hover:text-primary-foreground transition-colors"
        >
          Scarica CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-secondary text-xs uppercase tracking-widest text-sage-deep">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Presenza</th>
              <th className="text-left p-3">Adulti</th>
              <th className="text-left p-3">Bambini</th>
              <th className="text-left p-3">Totale</th>
              <th className="text-left p-3">Note</th>
              <th className="text-left p-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 font-medium">
                  {r.name}
                  <div className="text-xs text-muted-foreground font-normal">{r.email}</div>
                </td>
                <td className="p-3">
                  <span className={r.attending ? "text-green-700" : "text-red-600"}>
                    {r.attending ? "✅ Sì" : "❌ No"}
                  </span>
                </td>
                <td className="p-3 text-center">{r.attending ? (r.adults ?? 0) : "—"}</td>
                <td className="p-3 text-center">{r.attending ? (r.children ?? 0) : "—"}</td>
                <td className="p-3 text-center font-medium">
                  {r.attending ? (r.adults ?? 0) + (r.children ?? 0) : "—"}
                </td>
                <td className="p-3 text-muted-foreground text-xs max-w-[180px]">
                  {[r.dietary, r.message].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString("it-IT")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Ancora nessuna risposta.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <button onClick={onSignOut} className="mt-6 text-xs underline text-muted-foreground">Esci</button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border p-5 rounded-sm text-center">
      <div className="font-display text-3xl text-sage-deep">{value}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
