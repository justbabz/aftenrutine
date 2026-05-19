import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface CelebrationOverlayProps {
  onReset: () => void;
}

export function CelebrationOverlay({ onReset }: CelebrationOverlayProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const end = Date.now() + 3000;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#a855f7", "#ec4899", "#f59e0b", "#10b981"],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#a855f7", "#ec4899", "#f59e0b", "#10b981"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 bg-purple-600/90 flex flex-col items-center justify-center gap-8 z-50 p-6">
      <div className="text-8xl animate-bounce">⭐</div>
      <h2 className="text-white text-4xl font-bold text-center drop-shadow">
        Godt klaret!
      </h2>
      <p className="text-purple-100 text-xl text-center">
        Du har gjort alle dine ting.
      </p>
      <button
        onClick={onReset}
        className="mt-4 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
      >
        Start forfra i morgen
      </button>
    </div>
  );
}
