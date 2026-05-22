/**
 * Structural design tokens — TypeScript mirror of DESIGN.md frontmatter.
 *
 * Use this when you need a token value *inside* JavaScript (e.g. Framer Motion
 * animation `from`/`to` color, a styled inline style, a chart axis color).
 *
 * Tailwind classes already cover 99% of usage — reach for this file only when
 * a class name is not viable. Keep it in sync with `tailwind.config.ts` and
 * `globals.css` CSS variables. All three sources MUST agree on hex values.
 */

export const colors = {
  // Surface tiers
  surface: "#031427",
  surfaceDim: "#031427",
  surfaceBright: "#2a3a4f",
  surfaceContainerLowest: "#000f21",
  surfaceContainerLow: "#0b1c30",
  surfaceContainer: "#102034",
  surfaceContainerHigh: "#1b2b3f",
  surfaceContainerHighest: "#26364a",
  surfaceVariant: "#26364a",

  // On-surface text
  onSurface: "#d3e4fe",
  onSurfaceVariant: "#c2c6d8",
  onBackground: "#d3e4fe",

  // Primary
  primary: "#b3c5ff",
  onPrimary: "#002b75",
  primaryContainer: "#0066ff",
  onPrimaryContainer: "#f8f7ff",

  // Secondary
  secondary: "#aeecff",
  onSecondary: "#003641",
  secondaryContainer: "#00d9ff",
  onSecondaryContainer: "#005b6c",

  // Tertiary
  tertiary: "#bec6e0",
  onTertiary: "#283044",
  tertiaryContainer: "#697188",
  onTertiaryContainer: "#f7f7ff",

  // Error
  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",

  // Outline
  outline: "#8c90a1",
  outlineVariant: "#424656",

  // Background
  background: "#031427",
} as const;

export const radius = {
  sm: "0.25rem",
  DEFAULT: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  full: "9999px",
} as const;

export const spacing = {
  unit: "4px",
  containerMax: "1440px",
  gutter: "24px",
  marginDesktop: "40px",
  marginMobile: "16px",
  stackXs: "4px",
  stackSm: "8px",
  stackMd: "16px",
  stackLg: "24px",
  stackXl: "48px",
} as const;

export const typography = {
  displayLg: {
    fontFamily: "Geist",
    fontSize: "48px",
    fontWeight: "700",
    lineHeight: "56px",
    letterSpacing: "-0.02em",
  },
  headlineLg: {
    fontFamily: "Geist",
    fontSize: "32px",
    fontWeight: "600",
    lineHeight: "40px",
    letterSpacing: "-0.01em",
  },
  headlineLgMobile: {
    fontFamily: "Geist",
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "32px",
  },
  titleMd: {
    fontFamily: "Geist",
    fontSize: "20px",
    fontWeight: "600",
    lineHeight: "28px",
  },
  bodyLg: {
    fontFamily: "Geist",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: "24px",
  },
  bodySm: {
    fontFamily: "Geist",
    fontSize: "14px",
    fontWeight: "400",
    lineHeight: "20px",
  },
  labelCaps: {
    fontFamily: "JetBrains Mono",
    fontSize: "12px",
    fontWeight: "500",
    lineHeight: "16px",
    letterSpacing: "0.05em",
  },
  dataMono: {
    fontFamily: "JetBrains Mono",
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "20px",
  },
} as const;

export type ColorToken = keyof typeof colors;
export type RadiusToken = keyof typeof radius;
export type SpacingToken = keyof typeof spacing;
export type TypographyToken = keyof typeof typography;
