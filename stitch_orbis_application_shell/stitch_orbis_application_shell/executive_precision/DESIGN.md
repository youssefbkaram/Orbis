---
name: Executive Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141c2b'
  on-primary-container: '#7c8497'
  inverse-primary: '#bfc6db'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00201c'
  on-tertiary-container: '#009485'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe2f8'
  primary-fixed-dim: '#bfc6db'
  on-primary-fixed: '#141c2b'
  on-primary-fixed-variant: '#3f4758'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies high-agency digital architecture for demanding personal and professional workflows. Built around the ethos of clarity, rigorous order, and quiet confidence, it targets operators, executives, and knowledge workers who view life management as an exact discipline.

The visual style is **Corporate / Modern** crossed with high-performance **Minimalism**. It pairs deep foundational contrast against pristine negative space. The aesthetic rejects unnecessary visual ornamentation, relying on strict structural alignment, whisper-thin borders, and decisive color accents to convey status, progress, and operational intelligence.

## Colors

The palette establishes an authoritative hierarchy engineered for long-session readability:

- **Primary (`#101827` - Midnight Navy):** Serves as the bedrock of structural weight, primary typographical hierarchy, high-emphasis icons, and deep navigational elements.
- **Secondary (`#2563EB` - Electric Blue):** Drives primary calls-to-action, focus indicators, interactive highlights, and active operational states.
- **Tertiary (`#14B8A6` - Teal):** Dedicated strictly to machine intelligence indicators, system insights, health telemetry, and resolved/completed operational milestones.
- **Neutral (`#64748B` - Slate):** Anchors secondary body text, disabled interfaces, subtle iconography, and boundary dividers.
- **Canvas Base (`#F8FAFC` - Cloud White):** Establishes a neutral, glare-free working surface that recedes behind content layers.
- **Attention / Warning (`#F59E0B` - Amber):** Utilized for friction points, upcoming deadlines, pending decisions, and system alerts.

## Typography

The type system prioritizes micro-legibility and metric consistency using **Inter**. Letter tracking is kept neutral to slightly tight on display headlines to reinforce confidence, while micro-labels utilize open tracking for clarity at glanceable scales. 

Tabular figures (`tnum`) should be enabled globally for timestamps, operational metrics, financial indicators, and progress percentages to prevent layout shifting across state transitions.

## Layout & Spacing

A strictly managed 12-column layout grid structures desktop and wide views, condensing to 8 columns on tablet and 4 columns on mobile devices. 

- **Desktop (1024px+):** Sidebar persistence allows dedicated multi-pane density. Content containers use fixed maximum bounds to protect reading length without leaving awkward side gutters.
- **Tablet (768px - 1023px):** Secondary metadata drawers collapse into slide-over panels; grid columns transition fluidly.
- **Mobile (< 768px):** Single-column stack with standardized bottom-dock navigation bars.

Internal layout rhythm adheres to a consistent 4px/8px incremental base unit. Dense tabular and dashboard layouts strictly leverage `space-xs` and `space-sm` for element coupling, while container envelopes use `space-lg` and `space-xl` to establish clear structural separation.

## Elevation & Depth

Visual hierarchy avoids heavy drop shadows, instead utilizing **low-contrast outlines** paired with subtle, highly diffused **ambient shadows**.

- **Ground Level (Canvas):** Set at `#F8FAFC`. Provides zero elevation.
- **Base Surfaces (Cards, Modules):** Flat white (`#FFFFFF`) with a 1px border defined by `#E2E8F0`. Layered with an ambient, tinted contact shadow: `0px 1px 3px rgba(16, 24, 39, 0.04)`.
- **Floating Overlays (Dropdowns, Popovers):** Pure white (`#FFFFFF`) with a 1px outline in `#CBD5E1` and a refined depth shadow: `0px 8px 24px -4px rgba(16, 24, 39, 0.08)`.
- **Modals & Drawers:** High-layer containment supported by an optical backdrop veil rendered in `#101827` at 35% opacity with an ultra-light 4px background blur.

## Shapes

The design system maintains a structured, architectural geometry with **Soft** corner radiuses (`0.25rem` / 4px base). 

This controlled rounding avoids juvenile playfulness while softening raw edges for a sleek, tool-grade feel:
- **Buttons, Text Inputs, Chips:** 4px to 6px border radius.
- **Structural Cards, Panels, Modals:** 8px (`rounded-lg`) border radius.
- **Tags, System Status Dots, Pill Badges:** Full-rounded pill treatment only when contextual tagging requires distinct visual isolation from actionable buttons.

## Components

### Buttons
- **Primary:** Filled `#101827` with `#FFFFFF` text. Hover state translates to `#1E293B`. Active press scales subtly (`0.98`).
- **Accent Action:** Filled `#2563EB` with `#FFFFFF` text. Used exclusively for top-tier calls-to-action (e.g., "Create Plan", "Commit Changes").
- **Secondary / Outline:** `#FFFFFF` background with 1px `#E2E8F0` border, `#101827` label. Hover shifts to `#F1F5F9`.
- **Ghost:** Transparent background with `#64748B` label, transitioning to `#F1F5F9` on hover.

### Inputs & Selectors
- Background: `#FFFFFF`. Border: 1px `#E2E8F0`. 
- Placeholder text in `#94A3B8`. Primary value text in `#101827`.
- Focus state: Outline switches to `#2563EB` with a crisp 1px ring (`0 0 0 1px #2563EB`) and no fuzzy exterior glows.
- Validation: Amber (`#F59E0B`) highlights for warning thresholds; crisp error red (`#EF4444`) for hard syntax faults.

### Cards & Modules
- Pure white background framed with 1px `#E2E8F0` hairline borders.
- Structured with crisp header dividers (1px bottom border in `#F1F5F9`).
- Card headers pair uppercase `label-md` tracking in `#64748B` with contextual quick-action buttons.

### Chips & Badges
- **Status / Metric:** Subdued tint background (e.g., `#14B8A6` at 10% opacity) paired with high-contrast text (`#0F766E`) and an optional 4px solid status dot.
- **Intelligence Badges:** Teal accents (`#14B8A6`) reserved for automated recommendations, synced calendars, and algorithmic insights.
- **Filter Chips:** 1px border `#E2E8F0`, transitioning to solid `#2563EB` fill when toggled active.

### Checkboxes & Toggle Switches
- Checkboxes: 4px rounded rectangles with 1px `#CBD5E1` border; selected state fills `#2563EB` with white check mark.
- Switches: Sleek 20px height capsule track. Unchecked in `#E2E8F0`, checked in `#2563EB`, thumb rendered in `#FFFFFF`.

### Data Tables & Life Stream Lists
- Alternating subtle row hover: `#F8FAFC`.
- Grid separation via 1px `#F1F5F9` horizontal lines; no vertical border lines.
- Compact cell paddings aligned with `space-sm` vertically and `space-md` horizontally.