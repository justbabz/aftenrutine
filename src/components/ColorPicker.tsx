import { PROFILE_COLORS, ProfileColor } from "../data/types";
import { themeFor } from "../styles/theme";

const COLOR_LABELS: Record<ProfileColor, string> = {
  ruby: "Rød",
  sunset: "Orange",
  amber: "Gul",
  citrus: "Limegrøn",
  mint: "Grøn",
  sky: "Lyseblå",
  ocean: "Mørkeblå",
  lilac: "Lilla",
  plum: "Mørklilla",
  berry: "Pink",
  cocoa: "Brun",
  slate: "Grå",
};

interface ColorPickerProps {
  value: ProfileColor;
  onChange: (color: ProfileColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {PROFILE_COLORS.map((color) => {
        const t = themeFor(color);
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={COLOR_LABELS[color]}
            aria-pressed={selected}
            className={`aspect-square w-full rounded-full ${t.bg} transition-all duration-150 active:scale-90
              ${selected ? `ring-4 ring-offset-2 ring-offset-cream-50 ${t.ring} shadow-lift` : "shadow-soft"}`}
          />
        );
      })}
    </div>
  );
}
