import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { BackgroundMusic } from "@/components/BackgroundMusic";

import photo1 from "@/assets/photo-1.jpg";
import photoMain from "@/assets/photo-main.jpg";
import villaCeremony from "@/assets/villa-ceremony.jpg";
import photo2 from "@/assets/photo-2.jpg";
import photo3 from "@/assets/photo-3.jpg";
import photo4 from "@/assets/photo-4.jpg";
import photo7 from "@/assets/photo-7.jpg";
import photo8 from "@/assets/photo-8.jpg";
import photo9 from "@/assets/photo-9.jpg";
import villa1 from "@/assets/villa-1.jpg";
import villa2 from "@/assets/villa-2.jpg";
import villa3 from "@/assets/villa-3.jpg";
import villa4 from "@/assets/villa-4.jpg";

const WEDDING_DATE = new Date("2026-09-12T16:00:00+02:00");
const VENUE_NAME = "Villa Maria Teresa";
const VENUE_ADDRESS = "Viale Unità D'Italia, 61, 04023 Formia LT";
const COUPLE = { her: "Angela", him: "Alberto" };

// Configurable per deployment (overridable via VITE_ env vars at build time)
const IBAN_HOLDER = import.meta.env.VITE_IBAN_HOLDER || "Alberto Bortolotto";
const IBAN = import.meta.env.VITE_IBAN || "IT74 R030 6961 5651 0000 0002 077";

const photos = [
  { src: photo2, alt: "San Pietro a Natale" },
  { src: photo3, alt: "Escursione nei boschi" },
  { src: photo8, alt: "Festa con amici" },
  { src: photo4, alt: "Mercatini di Natale" },
  { src: photo7, alt: "Cena insieme" },
  { src: photo9, alt: "Un pomeriggio insieme" },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${COUPLE.her} & ${COUPLE.him} — 12 Settembre 2026` },
      {
        name: "description",
        content: `Ci sposiamo il 12 settembre 2026 a ${VENUE_NAME}. Conferma la tua presenza, scopri il programma e raggiungici per festeggiare con noi.`,
      },
      { property: "og:title", content: `${COUPLE.her} & ${COUPLE.him} — 12.09.2026` },
      { property: "og:description", content: `Il nostro matrimonio a ${VENUE_NAME}. Scopri i dettagli e conferma la presenza.` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: photo1 },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: photo1 },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          name: `Matrimonio ${COUPLE.her} & ${COUPLE.him}`,
          startDate: "2026-09-12T16:00:00+02:00",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: VENUE_NAME,
            address: VENUE_ADDRESS,
          },
        }),
      },
    ],
  }),
  component: WeddingPage,
});

function useCountdown(target: Date) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function WeddingPage() {
  const [entered, setEntered] = useState(false);

  function handleEnter() {
    setEntered(true);
    window.dispatchEvent(new CustomEvent("wedding:enter"));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <BackgroundMusic />
      {!entered && <SplashOverlay onEnter={handleEnter} />}
      <Nav />
      <Hero />
      <Storia />
      <Galleria />
      <Programma />
      <Mappa />
      <Regalo />
      <RSVP />
      <Footer />
    </div>
  );
}

function SplashOverlay({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center text-center px-8">
      <div
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `url(${villaCeremony})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <h1 className="font-display text-3xl sm:text-5xl md:text-7xl italic font-light leading-tight">
        Angela <span className="not-italic text-sage-deep">&amp;</span> Alberto
      </h1>
      <div className="divider-ornament my-8 max-w-[80px] mx-auto text-xs"><span>✦</span></div>
      <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-14">12 · 09 · 2026</p>
      <button
        type="button"
        onClick={onEnter}
        aria-label="Riproduci musica ed entra"
        className="group"
      >
        <span className="h-20 w-20 rounded-full border-2 border-sage-deep text-sage-deep flex items-center justify-center group-hover:bg-sage-deep group-hover:text-primary-foreground transition-colors shadow-lg">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
      </button>
    </div>
  );
}

function Nav() {
  const items = [
    ["storia", "Storia"],
    ["gallery", "Galleria"],
    ["programma", "Programma"],
    ["mappa", "Mappa"],
    ["regalo", "Regalo"],
    ["rsvp", "RSVP"],
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur bg-background/70 border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#top" className="font-display text-lg tracking-wide">A &amp; A</a>
        <ul className="hidden md:flex gap-7 text-sm text-muted-foreground">
          {items.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:text-foreground transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Hero() {
  const c = useCountdown(WEDDING_DATE);
  return (
    <header id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.972 0.014 85 / 0.4), oklch(0.972 0.014 85 / 0.85)), url(${villaCeremony})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="text-center px-6 py-24 max-w-3xl">
        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl leading-tight italic font-light">
          {COUPLE.her} <span className="not-italic text-sage-deep">&amp;</span> {COUPLE.him}
        </h1>
        <div className="my-10">
          <p className="text-xs tracking-[0.4em] uppercase text-sage-deep mb-2">Wedding Date</p>
          <p className="font-display text-2xl md:text-3xl font-bold tracking-[0.15em]">12 · 09 · 2026</p>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto mb-10 italic font-display text-xl">
          {VENUE_NAME} — Formia
        </p>

        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          {[
            ["Giorni", c.d],
            ["Ore", c.h],
            ["Min", c.m],
            ["Sec", c.s],
          ].map(([label, v]) => (
            <div key={label as string} className="bg-card/80 border border-border rounded-sm py-4">
              <div className="font-display text-3xl text-sage-deep">{String(v).padStart(2, "0")}</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        <a
          href="#rsvp"
          className="inline-block mt-12 px-10 py-3 border border-sage-deep text-sage-deep hover:bg-sage-deep hover:text-primary-foreground transition-colors tracking-[0.2em] uppercase text-xs"
        >
          Conferma presenza
        </a>
      </div>
    </header>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`py-24 md:py-32 px-6 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          {eyebrow && (
            <p className="text-xs tracking-[0.4em] uppercase text-sage-deep mb-4">{eyebrow}</p>
          )}
          <h2 className="font-display text-4xl md:text-5xl italic font-light">{title}</h2>
          <div className="divider-ornament max-w-[80px] mx-auto mt-6"><span className="text-xs">✦</span></div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Storia() {
  return (
    <section id="storia" className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
      <blockquote className="text-center mb-16">
        <p className="font-display text-2xl md:text-3xl italic font-light text-foreground leading-snug max-w-2xl mx-auto">
          "Una splendida storia non finisce mai più,<br />
          la metà della mela mi sa che sei tu"
        </p>
        <footer className="mt-5 text-xs tracking-[0.3em] uppercase text-sage-deep">— Luciano Ligabue</footer>
      </blockquote>
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div
          className="aspect-[4/5] rounded-sm bg-cover bg-center shadow-lg"
          style={{ backgroundImage: `url(${villaCeremony})` }}
        />
        <div className="space-y-5 text-muted-foreground leading-relaxed">
          <p>
            ...e così abbiamo deciso di dirci SI! Siamo felici di festeggiare
            questo giorno con voi, che avete fatto parte della nostra storia
            e che porteremo con noi da qui in avanti.
          </p>
          <p className="font-display italic text-foreground text-lg">
            Che aspettate!!! Scorrete giù e confermate la vostra presenza!
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}

function Programma() {
  const steps = [
    ["16:30", "Arrivo degli ospiti"],
    ["17:30", "Cerimonia"],
    ["18:30", "Aperitivo in giardino"],
    ["20:00", "Cena"],
    ["22:00", "Taglio della torta"],
    ["22:30", "Musica e balli"],
  ];
  return (
    <Section id="programma" eyebrow="Programma" title="Come si svolgerà">
      <ol className="relative border-l border-border max-w-md mx-auto pl-8">
        {steps.map(([time, label]) => (
          <li key={time} className="mb-8 last:mb-0 relative">
            <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-sage-deep ring-4 ring-background" />
            <div className="text-sage-deep tracking-widest text-sm">{time}</div>
            <div className="font-display text-xl">{label}</div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Mappa() {
  const [active, setActive] = useState<number | null>(null);
  const q = encodeURIComponent("Viale Unità D'Italia 61 Formia LT");
  return (
    <Section id="mappa" eyebrow="La location" title={VENUE_NAME} className="bg-secondary/40">
      {/* Villa photos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
        {villaPhotos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted focus:outline-none focus:ring-2 focus:ring-sage-deep"
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {active !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setActive(null)}
        >
          <img
            src={villaPhotos[active].src}
            alt={villaPhotos[active].alt}
            className="max-h-full max-w-full object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Come arrivare */}
      <p className="text-xs tracking-[0.4em] uppercase text-sage-deep text-center mb-4">Come arrivare</p>
      <p className="text-center text-muted-foreground mb-8">{VENUE_ADDRESS}</p>
      <div className="aspect-[16/9] border border-border rounded-sm overflow-hidden bg-muted">
        <iframe
          title={`Mappa di ${VENUE_NAME} — Formia`}
          src={`https://www.google.com/maps?q=${q}&output=embed`}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="text-center mt-6">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm tracking-[0.2em] uppercase text-sage-deep underline underline-offset-4"
        >
          Apri in Google Maps
        </a>
      </div>
    </Section>
  );
}

function Galleria() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <Section id="gallery" eyebrow="Noi due" title="Galleria">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {photos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className="group relative aspect-square overflow-hidden rounded-sm bg-muted focus:outline-none focus:ring-2 focus:ring-sage-deep"
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {active !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setActive(null)}
        >
          <img
            src={photos[active].src}
            alt={photos[active].alt}
            className="max-h-full max-w-full object-contain shadow-2xl"
          />
        </div>
      )}
    </Section>
  );
}

const villaPhotos = [
  { src: villa1, alt: "Villa Maria Teresa — piscina e giardino" },
  { src: villa2, alt: "Villa Maria Teresa — ingresso e scalinata" },
  { src: villa3, alt: "Villa Maria Teresa — vista notturna" },
  { src: villa4, alt: "Villa Maria Teresa — terrazza a bordo piscina" },
];

function Regalo() {
  return (
    <Section id="regalo" eyebrow="Regalo di nozze" title="Un pensiero per noi">
      <div className="max-w-md mx-auto text-center">
        <p className="text-muted-foreground mb-10 leading-relaxed">
          La vostra presenza è già il regalo più grande che potessimo chiedere.
          Se desiderate farci un dono, vi lasciamo le nostre coordinate bancarie.
        </p>
        <div className="bg-card border border-border rounded-sm p-8 text-left space-y-4">
          <p className="text-xs tracking-[0.4em] uppercase text-sage-deep text-center mb-6">Bonifico bancario</p>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-muted-foreground min-w-[90px]">Intestato a</span>
              <span className="font-medium">{IBAN_HOLDER}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground min-w-[90px]">IBAN</span>
              <span className="font-mono font-medium tracking-wider">{IBAN}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground min-w-[90px]">Causale</span>
              <span className="font-medium">Regalo matrimonio Angela e Alberto</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-8 italic">
          Grazie di cuore per il vostro affetto.
        </p>
      </div>
    </Section>
  );
}

function RSVP() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          attending: fd.get("attending") === "yes",
          adults: Number(fd.get("adults") || 1),
          children: Number(fd.get("children") || 0),
          dietary: String(fd.get("dietary") || "") || null,
          message: String(fd.get("message") || "") || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      setDone(true);
      toast.success("Grazie! La tua risposta è stata registrata.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Errore: ${msg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Section id="rsvp" eyebrow="RSVP" title="Grazie di cuore">
        <p className="text-center text-muted-foreground max-w-md mx-auto">
          Abbiamo ricevuto la tua risposta. Non vediamo l'ora di
          festeggiare con te il 12 settembre 2026.
        </p>
      </Section>
    );
  }

  return (
    <Section id="rsvp" eyebrow="RSVP" title="Sarai con noi?">
      <p className="text-center text-muted-foreground mb-10 max-w-md mx-auto">
        Ti chiediamo di confermare la presenza entro il <strong>1 luglio 2026</strong>.
      </p>
      <form onSubmit={onSubmit} className="grid gap-5 max-w-xl mx-auto">
        <Field name="name" label="Nome e cognome" required />
        <Field name="email" label="Email" type="email" required />

        <div>
          <Label>Parteciperai?</Label>
          <select
            name="attending"
            required
            defaultValue="yes"
            className="w-full mt-2 bg-card border border-input rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="yes">Sì, ci sarò</option>
            <option value="no">Purtroppo no</option>
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field name="adults" label="Adulti (incluso te)" type="number" defaultValue="1" min={0} max={20} />
          <Field name="children" label="Bambini sotto i 10 anni" type="number" defaultValue="0" min={0} max={20} />
        </div>

        <Field name="dietary" label="Intolleranze o allergie (opzionale)" />
        <div>
          <Label>Messaggio per gli sposi (opzionale)</Label>
          <textarea
            name="message"
            rows={4}
            maxLength={1000}
            className="w-full mt-2 bg-card border border-input rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 px-10 py-4 bg-sage-deep text-primary-foreground tracking-[0.25em] uppercase text-xs hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {loading ? "Invio in corso…" : "Invia conferma"}
        </button>
      </form>
    </Section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs tracking-[0.2em] uppercase text-sage-deep">{children}</label>;
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className="w-full mt-2 bg-card border border-input rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-14 px-6 text-center border-t border-border">
      <div className="font-display italic text-2xl mb-2">
        {COUPLE.her} &amp; {COUPLE.him}
      </div>
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
        12 Settembre 2026 · Formia
      </p>
    </footer>
  );
}
