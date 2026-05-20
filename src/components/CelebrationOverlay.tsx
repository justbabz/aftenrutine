import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { RoutineSlot, ProfileColor } from "../data/types";
import { themeFor } from "../styles/theme";

interface CelebrationOverlayProps {
  slot: RoutineSlot;
  color: ProfileColor;
  childName: string;
  onClose: () => void;
}

const PALETTE: Record<ProfileColor, string[]> = {
  lilac:  ["#A855F7", "#C084FC", "#7C3AED", "#F0ABFC"],
  berry:  ["#EC4899", "#F472B6", "#DB2777", "#FBCFE8"],
  sky:    ["#0EA5E9", "#38BDF8", "#0284C7", "#BAE6FD"],
  mint:   ["#10B981", "#34D399", "#059669", "#A7F3D0"],
  sunset: ["#F97316", "#FB923C", "#EA580C", "#FED7AA"],
  citrus: ["#84CC16", "#A3E635", "#65A30D", "#D9F99D"],
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function CelebrationOverlay({ slot, color, childName, onClose }: CelebrationOverlayProps) {
  const fired = useRef(false);
  const t = themeFor(color);
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (fired.current || reduced) return;
    fired.current = true;

    const colors = PALETTE[color];
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.85 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.85 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [color, reduced]);

  const emoji = slot === "morning" ? "☀️" : "⭐";
  const headline = slot === "morning" ? "God morgen!" : "Godt klaret!";
  const subline =
    slot === "morning"
      ? `Du er klar til dagen, ${childName}.`
      : `Du har lavet alt aften, ${childName}. Sov godt.`;

  return (
    <div className="fixed inset-0 z-50 bg-cream-50/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 p-6 pt-safe pb-safe animate-fade-up">
      <div className={`text-8xl ${reduced ? "" : "animate-bounce2"}`} aria-hidden>{emoji}</div>
      <h2 className="text-4xl font-black text-ink-900 text-center">{headline}</h2>
      <p className="text-ink-500 text-lg text-center max-w-xs">{subline}</p>
      <button
        onClick={onClose}
        className={`mt-4 ${t.bg} text-white font-bold text-lg px-8 py-4 rounded-3xl shadow-lift active:scale-95 transition-transform`}
      >
        Færdig
      </button>
    </div>
  );
}
