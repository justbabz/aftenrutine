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

export const COLOR_THEMES: Record<ProfileColor, ColorTheme> = {
  lilac: {
    bg: "bg-lilac-500",
    bgSoft: "bg-lilac-soft",
    text: "text-lilac-600",
    ring: "ring-lilac-500",
    gradient: "from-lilac-400 to-lilac-600",
    shadow: "shadow-[0_18px_36px_rgba(168,85,247,0.25)]",
    border: "border-lilac-500",
    done: "bg-lilac-500",
    doneText: "text-white",
  },
  berry: {
    bg: "bg-berry-500",
    bgSoft: "bg-berry-soft",
    text: "text-berry-600",
    ring: "ring-berry-500",
    gradient: "from-berry-400 to-berry-600",
    shadow: "shadow-[0_18px_36px_rgba(236,72,153,0.25)]",
    border: "border-berry-500",
    done: "bg-berry-500",
    doneText: "text-white",
  },
  sky: {
    bg: "bg-sky-500",
    bgSoft: "bg-sky-soft",
    text: "text-sky-600",
    ring: "ring-sky-500",
    gradient: "from-sky-400 to-sky-600",
    shadow: "shadow-[0_18px_36px_rgba(14,165,233,0.25)]",
    border: "border-sky-500",
    done: "bg-sky-500",
    doneText: "text-white",
  },
  mint: {
    bg: "bg-mint-500",
    bgSoft: "bg-mint-soft",
    text: "text-mint-600",
    ring: "ring-mint-500",
    gradient: "from-mint-400 to-mint-600",
    shadow: "shadow-[0_18px_36px_rgba(16,185,129,0.25)]",
    border: "border-mint-500",
    done: "bg-mint-500",
    doneText: "text-white",
  },
  sunset: {
    bg: "bg-sunset-500",
    bgSoft: "bg-sunset-soft",
    text: "text-sunset-600",
    ring: "ring-sunset-500",
    gradient: "from-sunset-400 to-sunset-600",
    shadow: "shadow-[0_18px_36px_rgba(249,115,22,0.25)]",
    border: "border-sunset-500",
    done: "bg-sunset-500",
    doneText: "text-white",
  },
  citrus: {
    bg: "bg-citrus-500",
    bgSoft: "bg-citrus-soft",
    text: "text-citrus-600",
    ring: "ring-citrus-500",
    gradient: "from-citrus-400 to-citrus-600",
    shadow: "shadow-[0_18px_36px_rgba(132,204,22,0.25)]",
    border: "border-citrus-500",
    done: "bg-citrus-500",
    doneText: "text-white",
  },
};

export function themeFor(color: ProfileColor): ColorTheme {
  return COLOR_THEMES[color];
}

export const SLOT_META: Record<RoutineSlot, { label: string; icon: string; subtitle: string }> = {
  morning: { label: "Morgen", icon: "🌅", subtitle: "Godmorgen!" },
  evening: { label: "Aften", icon: "🌙", subtitle: "Godnat snart" },
};

export function defaultSlotForNow(d: Date = new Date()): RoutineSlot {
  return d.getHours() < 14 ? "morning" : "evening";
}
