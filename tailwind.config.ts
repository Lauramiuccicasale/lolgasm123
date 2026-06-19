import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#1B3A6B",
          light: "#EEF2F9",
          dark: "#15305A",
        },
        eligible: { DEFAULT: "#2D7D5A", bg: "#EAF5EF" },
        negotiable: { DEFAULT: "#C07400", bg: "#FFF5E0" },
        ineligible: { DEFAULT: "#B03030", bg: "#FAEAEA" },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FAFAF9",
          base: "#F7F6F3",
        },
        border: "#E2DDD6",
        text: {
          primary: "#111827",
          secondary: "#374151",
          tertiary: "#6B7280",
          muted: "#9CA3AF",
        },
      },
      borderRadius: {
        card: "8px",
        input: "6px",
        pill: "6px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
