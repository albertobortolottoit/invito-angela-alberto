import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

type Rsvp = {
  id: string;
  name: string;
  email: string;
  attending: boolean;
  guests: number;
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
    if (error) toast.error(error.message);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm grid gap-4 bg-card border border-border p-8 rounded-sm">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="bg-background border border-input rounded-sm px-3 py-3 text-sm"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        className="bg-background border border-input rounded-sm px-3 py-3 text-sm"
      />
      <button
        disabled={loading}
        className="bg-sage-deep text-primary-foreground py-3 tracking-[0.25em] uppercase text-xs disabled:opacity-60"
      >
        {loading ? "…" : "Accedi"}
      </button>
      <p className="text-xs text-muted-foreground">
        Solo l'utente admin può accedere. Se non hai ancora un account chiedi
        a chi gestisce il sito di crearlo e assegnarti il ruolo admin.
      </p>
    </form>
  );
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
        <p className="text-sm text-destructive mb-3">
          Non hai i permessi per vedere le risposte. Il tuo account deve avere il ruolo <code>admin</code>.
        </p>
        <p className="text-xs text-muted-foreground mb-4">Dettaglio: {error}</p>
        <button onClick={onSignOut} className="text-xs underline text-muted-foreground">Esci</button>
      </div>
    );
  }

  if (!rows) return <div className="text-muted-foreground text-sm">Carico…</div>;

  const yes = rows.filter((r) => r.attending);
  const totalGuests = yes.reduce((acc, r) => acc + r.guests, 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Risposte" value={rows.length} />
        <Stat label="Confermati" value={yes.length} />
        <Stat label="Ospiti totali" value={totalGuests} />
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-widest text-sage-deep">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Risposta</th>
              <th className="text-left p-3">Ospiti</th>
              <th className="text-left p-3">Note</th>
              <th className="text-left p-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 text-muted-foreground">{r.email}</td>
                <td className="p-3">{r.attending ? "Sì" : "No"}</td>
                <td className="p-3">{r.guests}</td>
                <td className="p-3 text-muted-foreground text-xs">
                  {[r.dietary, r.message].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("it-IT")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Ancora nessuna risposta.</td></tr>
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
    <div className="bg-card border border-border p-5 rounded-sm">
      <div className="font-display text-3xl text-sage-deep">{value}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
