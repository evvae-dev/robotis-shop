import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111715",
        paper: "#f5f6f2",
        signal: "#c1f46b",
        line: "#daddd5",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
        mono: ["Consolas", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
