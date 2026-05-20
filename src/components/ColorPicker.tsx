import { PROFILE_COLORS, ProfileColor } from "../data/types";

const COLOR_STYLES: Record<ProfileColor, { bg: string; ring: string; soft: string; label: string }> = {
  lilac:  { bg: "bg-lilac-500",  ring: "ring-lilac-500",  soft: "bg-lilac-soft",  label: "Lilla" },
  berry:  { bg: "bg-berry-500",  ring: "ring-berry-500",  soft: "bg-berry-soft",  label: "Pink" },
  sky:    { bg: "bg-sky-500",    ring: "ring-sky-500",    soft: "bg-sky-soft",    label: "Blå" },
  mint:   { bg: "bg-mint-500",   ring: "ring-mint-500",   soft: "bg-mint-soft",   label: "Mint" },
  sunset: { bg: "bg-sunset-500", ring: "ring-sunset-500", soft: "bg-sunset-soft", label: "Orange" },
  citrus: { bg: "bg-citrus-500", ring: "ring-citrus-500", soft: "bg-citrus-soft", label: "Limegrøn" },
};

export function colorStyles(color: ProfileColor) {
  return COLOR_STYLES[color];
}

interface ColorPickerProps {
  value: ProfileColor;
  onChange: (color: ProfileColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {PROFILE_COLORS.map((color) => {
        const styles = COLOR_STYLES[color];
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={styles.label}
            aria-pressed={selected}
            className={`w-12 h-12 rounded-full ${styles.bg} transition-all duration-150 active:scale-90
              ${selected ? `ring-4 ring-offset-2 ring-offset-cream-50 ${styles.ring} shadow-lift` : "shadow-soft"}`}
          />
        );
      })}
    </div>
  );
}
