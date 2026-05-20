/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFAF5",
          100: "#FBF6EE",
          200: "#F5EBDC",
        },
        ink: {
          900: "#1B1B2E",
          700: "#3F3F5C",
          500: "#6B6B85",
          400: "#9B9BB0",
          300: "#C4C4D4",
          200: "#E5E5EC",
          100: "#F1F0F6",
        },
        brand: {
          50: "#F5F0FF",
          100: "#EADFFF",
          200: "#D4BFFF",
          300: "#B49CFF",
          400: "#9070FF",
          500: "#7445F5",
          600: "#5F2DD9",
          700: "#4B22AD",
          800: "#371880",
        },
        sunset: { 400: "#FB923C", 500: "#F97316", 600: "#EA580C", soft: "#FFE7D5" },
        sky:    { 400: "#38BDF8", 500: "#0EA5E9", 600: "#0284C7", soft: "#D4F0FB" },
        mint:   { 400: "#34D399", 500: "#10B981", 600: "#059669", soft: "#D1F5E5" },
        berry:  { 400: "#F472B6", 500: "#EC4899", 600: "#DB2777", soft: "#FCDCEB" },
        lilac:  { 400: "#C084FC", 500: "#A855F7", 600: "#9333EA", soft: "#EFDFFE" },
        citrus: { 400: "#A3E635", 500: "#84CC16", 600: "#65A30D", soft: "#E6F4C8" },
        good:   { 500: "#16A34A", 600: "#15803D", soft: "#D6F5E0" },
        warn:   { 500: "#F59E0B", soft: "#FFEDC2" },
        bad:    { 500: "#DC2626", soft: "#FCDCDC" },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Nunito", "system-ui", "sans-serif"],
      },
      fontWeight: {
        normal: "500",
        medium: "600",
        semibold: "700",
        bold: "800",
        black: "900",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27,27,46,0.04), 0 4px 16px rgba(27,27,46,0.06)",
        lift: "0 4px 8px rgba(27,27,46,0.05), 0 18px 36px rgba(27,27,46,0.10)",
        focus: "0 0 0 4px rgba(116,69,245,0.20)",
        innerSoft: "inset 0 2px 4px rgba(27,27,46,0.06)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      spacing: {
        "safe-t": "env(safe-area-inset-top)",
        "safe-b": "env(safe-area-inset-bottom)",
      },
      keyframes: {
        "scale-in": { "0%": { transform: "scale(0.85)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "fade-up":  { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        bounce2:    { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        "scale-in": "scale-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up":  "fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        bounce2:    "bounce2 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
