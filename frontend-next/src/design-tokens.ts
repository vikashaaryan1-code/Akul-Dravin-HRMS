/**
 * AKUL DRAVIN — Design Tokens v1.0
 * Phase 1: Brand Identity + Global Design System
 * 
 * Single source of truth for all design values.
 * Import this file wherever type-safe tokens are needed.
 */

/* ── Color Tokens ────────────────────────────────────────────────────────────── */ export const color = {
 // Depth Scale (Dark Mode Surfaces)
 void: '#02060f', // Page background — deepest
 depth1: '#070f1e', // Section backgrounds
 depth2: '#0d1a30', // Card surfaces
 depth3: '#142138', // Elevated cards
 depth4: '#1e2d47', // Hover / active states

 // Brand Accents
 gold: '#F2AA3B', // Primary CTA, emphasis
 goldDim: '#b07a1a', // Muted gold, supporting text
 ember: '#E85A2A', // Danger, alerts, destructive
 aqua: '#0F8B8D', // Secondary links, info
 jade: '#10B981', // Success, live, operational

 // Text Hierarchy
 textPrimary: '#FFFFFF',
 textSecondary: '#94A3B8',
 textTertiary: '#475569',
 textMuted: '#1E293B',
 textInverse: '#02060f',

 // Glass Surfaces (as rgba strings)
 glassVoid: 'rgba(255, 255, 255, 0)',
 glassBase: 'rgba(255, 255, 255, 0.02)',
 glassRaised: 'rgba(255, 255, 255, 0.05)',
 glassHigh: 'rgba(255, 255, 255, 0.10)',
 glassOverlay: 'rgba(2, 6, 15, 0.85)',

 // Glass Borders
 borderBase: 'rgba(255, 255, 255, 0.04)',
 borderRaised: 'rgba(255, 255, 255, 0.08)',
 borderHigh: 'rgba(255, 255, 255, 0.12)',
 borderOverlay: 'rgba(255, 255, 255, 0.06)',
} as const;

export type ColorToken = keyof typeof color;


/* ── Typography Tokens ───────────────────────────────────────────────────────── */ export const typography = {
 fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
 fontBody: '"Inter", system-ui, -apple-system, sans-serif',
 fontMono: '"JetBrains Mono", "Fira Code", Consolas, monospace',

 // Fluid display sizes
 displayXl: 'clamp(4rem, 10vw, 10rem)',
 displayLg: 'clamp(3rem, 7vw, 7rem)',
 displayMd: 'clamp(2.5rem, 5vw, 5rem)',

 // Fixed heading sizes
 headingXl: '3rem',
 headingLg: '2rem',
 headingMd: '1.5rem',
 headingSm: '1.25rem',

 // Body sizes
 bodyXl: '1.25rem',
 bodyLg: '1.125rem',
 bodyMd: '1rem',
 bodySm: '0.875rem',
 bodyXs: '0.75rem',

 // Label sizes
 labelLg: '0.75rem',
 labelSm: '0.625rem',
 labelXs: '0.5rem',

 // Font weights
 weightBlack: 900,
 weightExtraBold: 800,
 weightBold: 700,
 weightSemiBold: 600,
 weightMedium: 500,
 weightRegular: 400,

 // Tracking (letter-spacing)
 trackingTightest: '-0.06em',
 trackingTighter: '-0.04em',
 trackingTight: '-0.02em',
 trackingNormal: '0em',
 trackingWide: '0.08em',
 trackingWider: '0.15em',
 trackingWidest: '0.4em',

 // Line heights
 leadingNone: '1',
 leadingTight: '1.1',
 leadingSnug: '1.25',
 leadingNormal: '1.5',
 leadingRelaxed: '1.65',
} as const;


/* ── Spacing Tokens ──────────────────────────────────────────────────────────── */ export const spacing = {
 px: '1px',
 0: '0px',
 1: '4px',
 2: '8px',
 3: '12px',
 4: '16px',
 5: '20px',
 6: '24px',
 7: '28px',
 8: '32px',
 10: '40px',
 12: '48px',
 14: '56px',
 16: '64px',
 20: '80px',
 24: '96px',
 28: '112px',
 32: '128px',
 40: '160px',
 48: '192px',
} as const;


/* ── Border Radius Tokens ────────────────────────────────────────────────────── */ export const radius = {
 none: '0px',
 sm: '8px',
 md: '12px',
 lg: '16px',
 xl: '24px',
 '2xl': '32px',
 '3xl': '48px',
 full: '9999px',
} as const;


/* ── Shadow Tokens ───────────────────────────────────────────────────────────── */ export const shadow = {
 none: 'none',
 sm: '0 1px 3px rgba(0,0,0,0.3)',
 md: '0 4px 16px rgba(0,0,0,0.4)',
 lg: '0 8px 32px rgba(0,0,0,0.5)',
 xl: '0 16px 64px rgba(0,0,0,0.6)',
 '2xl': '0 32px 128px rgba(0,0,0,0.7)',
 goldSm: '0 0 20px rgba(242,170,59,0.15)',
 goldMd: '0 10px 40px rgba(242,170,59,0.25)',
 goldLg: '0 20px 80px rgba(242,170,59,0.35)',
 aquaSm: '0 0 20px rgba(15,139,141,0.2)',
 aquaMd: '0 10px 40px rgba(15,139,141,0.3)',
 emberSm: '0 0 20px rgba(232,90,42,0.2)',
 emberMd: '0 10px 40px rgba(232,90,42,0.3)',
 glass: '0 8px 32px rgba(0,0,0,0.37), inset 0 1px 0 rgba(255,255,255,0.05)',
} as const;


/* ── Motion Tokens ───────────────────────────────────────────────────────────── */ export const motion = {
 // Easing
 easeBrand: 'cubic-bezier(0.16, 1, 0.3, 1)',
 easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
 easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
 easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

 // Duration (in ms)
 durationInstant: 80,
 durationFast: 150,
 durationNormal: 250,
 durationMedium: 400,
 durationSlow: 600,
 durationReveal: 800,
} as const;


/* ── Breakpoints ─────────────────────────────────────────────────────────────── */ export const breakpoint = {
 sm: '640px',
 md: '768px',
 lg: '1024px',
 xl: '1280px',
 '2xl': '1440px',
 '3xl': '1920px',
} as const;


/* ── Layout ──────────────────────────────────────────────────────────────────── */ export const layout = {
 maxWidth: '1440px',
 sectionPaddingXSm: '24px',
 sectionPaddingXMd: '40px',
 sectionPaddingXLg: '80px',
 sectionPaddingYSm: '64px',
 sectionPaddingYMd: '96px',
 sectionPaddingYLg: '160px',
 navHeight: '72px',
 sidebarCollapsed: '72px',
 sidebarExpanded: '280px',
} as const;


/* ── Composite Export ────────────────────────────────────────────────────────── */ export const tokens = {
 color,
 typography,
 spacing,
 radius,
 shadow,
 motion,
 breakpoint,
 layout,
} as const;

export type Tokens = typeof tokens;
export default tokens;
