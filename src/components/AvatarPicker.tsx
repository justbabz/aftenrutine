const AVATAR_EMOJIS = [
  "🐶", "🐱", "🐰", "🦊",
  "🐻", "🐼", "🦁", "🐯",
  "🐸", "🐧", "🦄", "🐙",
  "🌟", "🌈", "🚀", "🦖",
] as const;

interface AvatarPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-sm mx-auto">
      {AVATAR_EMOJIS.map((emoji) => {
        const selected = value === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            aria-label={`Vælg ${emoji}`}
            aria-pressed={selected}
            className={`aspect-square rounded-3xl flex items-center justify-center text-4xl transition-all duration-150 active:scale-95
              ${selected
                ? "bg-brand-100 ring-4 ring-brand-500 shadow-lift"
                : "bg-white shadow-soft active:bg-cream-100"}`}
          >
            <span aria-hidden>{emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

export { AVATAR_EMOJIS };
