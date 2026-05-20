export interface EmojiOption {
  emoji: string;
  label: string;
  keywords: string[];
}

export type EmojiCategory = "hygiejne" | "mad" | "tøj" | "søvn" | "leg" | "skole" | "udeliv" | "andet";

export const EMOJI_CATEGORIES: Record<EmojiCategory, string> = {
  hygiejne: "🧼 Hygiejne",
  mad: "🍎 Mad",
  tøj: "👕 Tøj",
  søvn: "😴 Søvn",
  leg: "🧸 Leg",
  skole: "📚 Skole",
  udeliv: "🌳 Udeliv",
  andet: "✨ Andet",
};

export const EMOJI_LIBRARY: Record<EmojiCategory, EmojiOption[]> = {
  hygiejne: [
    { emoji: "🪥", label: "Børste tænder", keywords: ["tand", "tandbørste"] },
    { emoji: "🚿", label: "Brusebad", keywords: ["bad", "brusebad"] },
    { emoji: "🛁", label: "I bad", keywords: ["bad", "kar"] },
    { emoji: "🧼", label: "Vaske hænder", keywords: ["vaske", "sæbe", "hænder"] },
    { emoji: "🚽", label: "Tisse af", keywords: ["toilet", "tis"] },
    { emoji: "🧻", label: "Tørre af", keywords: ["toilet", "papir"] },
    { emoji: "💆", label: "Vaske ansigt", keywords: ["ansigt", "vask"] },
    { emoji: "💇", label: "Rede hår", keywords: ["hår", "rede", "kæmme"] },
    { emoji: "✂️", label: "Klippe negle", keywords: ["negle"] },
  ],
  mad: [
    { emoji: "🥣", label: "Spise morgenmad", keywords: ["morgenmad", "havregryn"] },
    { emoji: "🍱", label: "Madpakke", keywords: ["madpakke", "frokost"] },
    { emoji: "🍽️", label: "Spise aftensmad", keywords: ["aftensmad", "tallerken"] },
    { emoji: "🍎", label: "Spise frugt", keywords: ["frugt", "æble"] },
    { emoji: "🥛", label: "Drikke mælk", keywords: ["mælk", "drikke"] },
    { emoji: "💧", label: "Drikke vand", keywords: ["vand", "drikke"] },
    { emoji: "🍪", label: "Snack", keywords: ["småkage", "mellemmåltid"] },
    { emoji: "🧁", label: "Kage", keywords: ["dessert"] },
  ],
  tøj: [
    { emoji: "👕", label: "Tøj på", keywords: ["t-shirt", "trøje"] },
    { emoji: "👖", label: "Bukser på", keywords: ["bukser"] },
    { emoji: "🧦", label: "Sokker på", keywords: ["sok"] },
    { emoji: "👟", label: "Sko på", keywords: ["sko"] },
    { emoji: "🩲", label: "Underbukser", keywords: ["under"] },
    { emoji: "🛌", label: "Nattøj på", keywords: ["pyjamas", "nattøj"] },
    { emoji: "🧥", label: "Jakke på", keywords: ["jakke", "frakke"] },
    { emoji: "🧢", label: "Hat/hue", keywords: ["hue", "kasket"] },
    { emoji: "🧤", label: "Vanter på", keywords: ["handsker", "vanter"] },
  ],
  søvn: [
    { emoji: "😴", label: "Sove", keywords: ["sove", "godnat"] },
    { emoji: "🛏️", label: "I seng", keywords: ["seng"] },
    { emoji: "🌙", label: "Godnat", keywords: ["godnat", "måne"] },
    { emoji: "💤", label: "Sov sødt", keywords: ["sov"] },
    { emoji: "⏰", label: "Vække tid", keywords: ["vække", "vågne"] },
  ],
  leg: [
    { emoji: "🧸", label: "Lege", keywords: ["leg", "bamse"] },
    { emoji: "🎨", label: "Tegne", keywords: ["tegne", "kunst"] },
    { emoji: "📖", label: "Læse bog", keywords: ["bog", "læse"] },
    { emoji: "🧩", label: "Puslespil", keywords: ["puslespil"] },
    { emoji: "🎵", label: "Høre musik", keywords: ["musik"] },
    { emoji: "📺", label: "Se tv", keywords: ["tv", "fjernsyn"] },
    { emoji: "🎮", label: "Spille", keywords: ["spil"] },
    { emoji: "🪀", label: "Lege ude", keywords: ["legetøj"] },
  ],
  skole: [
    { emoji: "🎒", label: "Pakke taske", keywords: ["skoletaske"] },
    { emoji: "🚌", label: "Tage bussen", keywords: ["bus", "skole"] },
    { emoji: "🏫", label: "Skole", keywords: ["skole"] },
    { emoji: "📝", label: "Lave lektier", keywords: ["lektier"] },
    { emoji: "🖊️", label: "Skrive", keywords: ["skrive"] },
    { emoji: "✏️", label: "Tegne", keywords: ["tegne"] },
  ],
  udeliv: [
    { emoji: "🚲", label: "Cykle", keywords: ["cykel"] },
    { emoji: "🏃", label: "Løbe", keywords: ["løbe"] },
    { emoji: "🌳", label: "Gå tur", keywords: ["gå", "tur"] },
    { emoji: "🐕", label: "Lufte hund", keywords: ["hund"] },
    { emoji: "⚽", label: "Fodbold", keywords: ["fodbold"] },
    { emoji: "🏊", label: "Svømme", keywords: ["svømme"] },
  ],
  andet: [
    { emoji: "🧹", label: "Rydde op", keywords: ["rydde", "oprydning"] },
    { emoji: "🛒", label: "Handle ind", keywords: ["handle"] },
    { emoji: "💊", label: "Tage medicin", keywords: ["medicin", "pille"] },
    { emoji: "🌡️", label: "Måle feber", keywords: ["feber"] },
    { emoji: "🤗", label: "Knus", keywords: ["kram", "knus"] },
    { emoji: "👋", label: "Sige farvel", keywords: ["farvel"] },
    { emoji: "🎁", label: "Gave", keywords: ["gave"] },
    { emoji: "❤️", label: "Kærlighed", keywords: ["hjerte"] },
  ],
};

export function flatEmojiOptions(): EmojiOption[] {
  return (Object.keys(EMOJI_LIBRARY) as EmojiCategory[]).flatMap((cat) => EMOJI_LIBRARY[cat]);
}
