import type { Config } from "tailwindcss";

/**
 * LoexAI Tailwind config.
 *
 * Source of truth for tokens: DESIGN.md frontmatter + tasarimornegi/LandingPage.html
 * tailwind.config block. Both are mirrored verbatim here. Do not invent colors —
 * extend the token list in DESIGN.md first, then update this file.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tertiary: "#bec6e0",
        "inverse-primary": "#0054d6",
        background: "#031427",
        "tertiary-fixed-dim": "#bec6e0",
        "secondary-fixed": "#aeecff",
        primary: "#b3c5ff",
        "error-container": "#93000a",
        "on-secondary": "#003641",
        "tertiary-fixed": "#dae2fd",
        "surface-container-lowest": "#000f21",
        "surface-container-highest": "#26364a",
        "secondary-fixed-dim": "#00d9ff",
        "surface-tint": "#b3c5ff",
        "inverse-on-surface": "#213145",
        "on-surface": "#d3e4fe",
        "secondary-container": "#00d9ff",
        "inverse-surface": "#d3e4fe",
        "on-error-container": "#ffdad6",
        "on-background": "#d3e4fe",
        "on-tertiary-fixed": "#131b2e",
        "on-primary-fixed": "#001849",
        "surface-container-low": "#0b1c30",
        "surface-bright": "#2a3a4f",
        "on-primary": "#002b75",
        "on-tertiary-container": "#f7f7ff",
        error: "#ffb4ab",
        "surface-variant": "#26364a",
        "primary-container": "#0066ff",
        outline: "#8c90a1",
        "on-primary-fixed-variant": "#003fa4",
        "on-tertiary-fixed-variant": "#3f465c",
        "on-primary-container": "#f8f7ff",
        "surface-container": "#102034",
        "on-tertiary": "#283044",
        "surface-dim": "#031427",
        "surface-container-high": "#1b2b3f",
        surface: "#031427",
        "on-secondary-container": "#005b6c",
        "on-error": "#690005",
        "on-surface-variant": "#c2c6d8",
        "primary-fixed": "#dae1ff",
        "primary-fixed-dim": "#b3c5ff",
        secondary: "#aeecff",
        "on-secondary-fixed-variant": "#004e5d",
        "tertiary-container": "#697188",
        "on-secondary-fixed": "#001f26",
        "outline-variant": "#424656",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        "stack-lg": "24px",
        "stack-xl": "48px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        "container-max": "1440px",
        "stack-md": "16px",
        "stack-sm": "8px",
        unit: "4px",
        "stack-xs": "4px",
        gutter: "24px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        "title-md": ["var(--font-geist-sans)", "Geist"],
        "headline-lg": ["var(--font-geist-sans)", "Geist"],
        "headline-lg-mobile": ["var(--font-geist-sans)", "Geist"],
        "label-caps": ["var(--font-jetbrains-mono)", "JetBrains Mono"],
        "display-lg": ["var(--font-geist-sans)", "Geist"],
        "body-lg": ["var(--font-geist-sans)", "Geist"],
        "body-sm": ["var(--font-geist-sans)", "Geist"],
        "data-mono": ["var(--font-jetbrains-mono)", "JetBrains Mono"],
      },
      boxShadow: {
        ambient: "0px 8px 24px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "marquee-x": {
          from: { transform: "translateX(0%)" },
          to: { transform: "translateX(-50%)" },
        },
        "aurora-drift": {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
            opacity: "0.55",
          },
          "50%": {
            transform: "translate3d(2%, -3%, 0) scale(1.08)",
            opacity: "0.75",
          },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "marquee-x": "marquee-x 38s linear infinite",
        "marquee-x-slow": "marquee-x 62s linear infinite",
        "aurora-drift": "aurora-drift 14s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3.2s ease-in-out infinite",
        "ping-soft": "ping-soft 2.4s ease-out infinite",
        "float-y": "float-y 5s ease-in-out infinite",
        "spin-slow": "spin-slow 16s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
