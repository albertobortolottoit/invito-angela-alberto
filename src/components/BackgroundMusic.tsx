import { useEffect, useRef, useState } from "react";

const TRACK_SRC = "/new-soul.mp3";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const a = new Audio(TRACK_SRC);
    a.loop = true;
    a.volume = 0.35;
    a.preload = "auto";
    a.addEventListener("error", () => setAvailable(false));
    audioRef.current = a;
    // attempt autoplay; browsers may block it until user interaction
    a.play().then(() => setPlaying(true)).catch(() => {
      // autoplay blocked — user will use the button
    });
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setAvailable(false);
      }
    }
  }

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Metti in pausa la musica" : "Riproduci musica di sottofondo"}
      title={playing ? "Pausa musica" : "Riproduci musica"}
      className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-card/90 backdrop-blur border border-border text-sage-deep shadow-lg flex items-center justify-center hover:bg-card transition-colors"
    >
      {playing ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      )}
    </button>
  );
}
