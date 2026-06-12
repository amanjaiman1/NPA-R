import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Two-token black & white system. Everything else is composed
        // from these via opacity, so the palette is theme-agnostic.
        ink: "rgb(var(--ink) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        // A calm accent + muted semantic palette layered on top.
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",
        positive: "rgb(var(--positive) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        // Legacy aliases kept for safety
        background: "rgb(var(--ink) / <alpha-value>)",
        foreground: "rgb(var(--paper) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        snugg: "-0.02em",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.3)",
        glow: "0 0 0 1px rgb(var(--paper) / 0.06), 0 20px 60px -20px rgb(0 0 0 / 0.6)",
        ring: "0 0 0 1px rgb(var(--paper) / 0.1)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgb(var(--paper)/0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--paper)/0.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgb(var(--paper)/0.08), transparent 70%)",
        "radial-accent":
          "radial-gradient(ellipse 70% 55% at 50% -8%, rgb(var(--accent)/0.16), transparent 72%)",
        "radial-accent-2":
          "radial-gradient(ellipse 50% 50% at 100% 0%, rgb(var(--info)/0.10), transparent 60%)",
        shine:
          "linear-gradient(110deg, transparent 35%, rgb(var(--paper)/0.12) 50%, transparent 65%)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--paper)/0.35)" },
          "70%": { boxShadow: "0 0 0 8px rgb(var(--paper)/0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(var(--paper)/0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in-fast": "fade-in-fast 0.3s ease-out both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
