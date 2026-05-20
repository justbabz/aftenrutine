import { ProfileColor, RoutineSlot } from "../data/types";

interface ColorTheme {
  bg: string;
  bgSoft: string;
  text: string;
  ring: string;
  gradient: string;
  shadow: string;
  border: string;
  done: string;
  doneText: string;
}

function theme(name: ProfileColor, rgbShadow: string): ColorTheme {
  return {
    bg: `bg-${name}-500`,
    bgSoft: `bg-${name}-soft`,
    text: `text-${name}-600`,
    ring: `ring-${name}-500`,
    gradient: `from-${name}-400 to-${name}-600`,
    shadow: `shadow-[0_18px_36px_rgba(${rgbShadow},0.25)]`,
    border: `border-${name}-500`,
    done: `bg-${name}-500`,
    doneText: "text-white",
  };
}

export const COLOR_THEMES: Record<ProfileColor, ColorTheme> = {
  ruby:   theme("ruby",   "239,68,68"),
  sunset: theme("sunset", "249,115,22"),
  amber:  theme("amber",  "245,158,11"),
  citrus: theme("citrus", "132,204,22"),
  mint:   theme("mint",   "16,185,129"),
  sky:    theme("sky",    "14,165,233"),
  ocean:  theme("ocean",  "37,99,235"),
  lilac:  theme("lilac",  "168,85,247"),
  plum:   theme("plum",   "124,58,237"),
  berry:  theme("berry",  "236,72,153"),
  cocoa:  theme("cocoa",  "133,77,63"),
  slate:  theme("slate",  "71,85,105"),
};

export function themeFor(color: ProfileColor): ColorTheme {
  return COLOR_THEMES[color];
}

export const SLOT_META: Record<RoutineSlot, { label: string; icon: string }> = {
  morning: { label: "Morgen", icon: "🌅" },
  evening: { label: "Aften", icon: "🌙" },
};

export function defaultSlotForNow(d: Date = new Date()): RoutineSlot {
  return d.getHours() < 14 ? "morning" : "evening";
}

/**
 * Time-of-day greeting:
 *  - 04:00–11:59 → "Godmorgen!"
 *  - 12:00–17:29 → "God eftermiddag"
 *  - 17:30–03:59 → "Godaften"
 */
export function greetingFor(d: Date = new Date()): string {
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes >= 4 * 60 && minutes < 12 * 60) return "Godmorgen!";
  if (minutes >= 12 * 60 && minutes < 17 * 60 + 30) return "God eftermiddag";
  return "Godaften";
}
