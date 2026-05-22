---
name: LoexAI Intelligence System
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#8c90a1'
  outline-variant: '#424656'
  surface-tint: '#b3c5ff'
  primary: '#b3c5ff'
  on-primary: '#002b75'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#0054d6'
  secondary: '#aeecff'
  on-secondary: '#003641'
  secondary-container: '#00d9ff'
  on-secondary-container: '#005b6c'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#697188'
  on-tertiary-container: '#f7f7ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#aeecff'
  secondary-fixed-dim: '#00d9ff'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5d'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
---

## Brand & Style

The design system is engineered for **LoexAI**, an AI-powered business intelligence platform. The brand personality is analytical, authoritative, and forward-leaning, designed to evoke confidence in data-driven decision-making. The target audience consists of entrepreneurs, analysts, and stakeholders who require high-density information presented with clarity.

The visual style is **Corporate Modern with a Tech Edge**, blending the reliability of enterprise software with the futuristic aesthetics of AI tools. It utilizes high-contrast interfaces, precision-engineered layouts, and subtle neon accents to signify "active intelligence." The UI should feel like a high-performance dashboard: responsive, deep, and meticulously organized.

## Colors

The palette is anchored by **Deep Navy (#0f172a)**, providing a stable, premium foundation for both dark and light modes. **Electric Blue (#0066ff)** serves as the primary engine for interaction, used for call-to-actions and critical focus states. **Cyan Accent (#00d9ff)** is reserved for data visualizations, AI-driven insights, and secondary highlights, creating a "glowing" effect against dark backgrounds.

- **Primary Actions:** Electric Blue gradients (Primary to Cyan).
- **Surface Tiers:** Use Slate Gray at varying opacities (5% - 15%) to create layered depth on top of the Deep Navy background.
- **Data Semantic:** Success Green, Amber, and Red are used strictly for opportunity scoring and status tracking to ensure immediate cognitive recognition of "Risk vs. Reward."

## Typography

This design system utilizes **Geist** for its core typography to achieve a clean, technical, and developer-friendly aesthetic. The typeface's geometric precision supports the "intelligence platform" narrative. 

For technical data points, opportunity scores, and metadata, **JetBrains Mono** is introduced to provide a distinct "code-like" feel that differentiates raw data from editorial content. 

- **Headlines:** Use tight letter-spacing for a modern, high-impact look.
- **Data Points:** Always use `data-mono` for numerical values to ensure tabular alignment in dashboards.
- **Hierarchy:** Use Slate Gray for secondary body text to maintain a clear visual stack.

## Layout & Spacing

The layout follows a **Dashboard-First Fluid Grid**. On desktop, the system utilizes a persistent 280px sidebar on the left with a fluid content area on the right. 

- **Grid:** A 12-column system for content areas, with 24px gutters to allow data-heavy tables and charts enough breathing room.
- **Breakpoints:** 
    - Desktop: 1200px+ (12 columns)
    - Tablet: 768px - 1199px (8 columns, sidebar collapses to icons)
    - Mobile: <767px (4 columns, sidebar becomes a bottom-nav or hamburger drawer).
- **Rhythm:** All spacing is derived from a 4px base unit to ensure mathematical precision across component alignments.

## Elevation & Depth

In dark mode, depth is communicated through **Tonal Layering** rather than heavy shadows. As elements "rise" in the Z-axis, they become lighter in color (moving from Deep Navy to a slightly lighter Slate-Navy).

- **Base Layer:** Deep Navy (#0f172a).
- **Cards/Containers:** Surface color with a 1px subtle stroke (#ffffff at 10% opacity) and a very soft, large-radius ambient shadow (0px 8px 24px rgba(0,0,0,0.5)).
- **Overlays/Modals:** Heavily blurred background (Backdrop Blur: 12px) with a semi-transparent surface to maintain the "Glassmorphism" feel without sacrificing legibility.
- **Active States:** Electric Blue "glow" or outer-glow (drop shadow with color) is used sparingly to indicate selection or AI-processing states.

## Shapes

The shape language is controlled and professional.
- **Buttons & Standard Inputs:** 8px radius (`rounded-md`) for a modern yet sturdy appearance.
- **Cards & Data Modules:** 12px radius (`rounded-lg`) to provide a clear container for complex information.
- **Badges/Chips:** Pill-shaped (full radius) to contrast against the structured grid and indicate "status" or "tags."
- **Focus States:** 2px solid Electric Blue offset by 2px from the element.

## Components

### Buttons
- **Primary:** Linear gradient from `primary` to `secondary` (45deg), white text, 8px radius.
- **Secondary:** Ghost style. Transparent background, 1px stroke of `primary`, or `primary` text.
- **Icon Buttons:** Square 1:1 aspect ratio with 8px radius, used primarily for dashboard actions.

### Cards
- Background: Lighter tint of Deep Navy or White (Mode dependent).
- Border: 1px subtle stroke.
- Padding: `stack-lg` (24px) for dashboard widgets.

### Sidebar
- Background: Solid Deep Navy (#0f172a).
- Icons: Slate Gray default; Electric Blue on hover/active.
- Active Indicator: A vertical 4px bar on the left edge of the active menu item.

### Input Fields
- Dark Mode: Deep Navy background with 1px Slate Gray border. 
- Focus: Border color changes to Electric Blue with a soft cyan outer glow.

### Opportunity Badges
- Pill-shaped. Background color at 15% opacity of the semantic color (Green/Amber/Red) with 100% opacity text for the label.

### Data Visualization
- Line charts should use the Cyan Accent with a gradient fill below the line.
- Progress bars: Electric Blue for "current," Slate Gray for "remaining."