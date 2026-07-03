import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/**
 * AKUL DRAVIN — Tailwind Configuration v3.0
 * Phase 2: Premium Light Theme + 3D Glass Finishing
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {

      // ── Colors ──────────────────────────────────────────────────────────
      colors: {
        // Light Theme Surface Scale
        void:    '#F8FAFC', // soft slate-50 background
        depth: {
          1: '#F1F5F9', // slate-100
          2: '#E2E8F0', // slate-200
          3: '#CBD5E1', // slate-300
          4: '#94A3B8', // slate-400
        },

        // Brand Accents (Based on Logo)
        gold:    '#F2AA3B',
        'gold-dim': '#C48A30',
        navy:    '#111B2A',
        aqua:    '#0F8B8D',
        cyan:    '#22D3EE',
        ember:   '#E85A2A',
        jade:    '#10B981',

        // Legacy compat tokens
        ink: {
          DEFAULT: '#111B2A',
          '950': '#020617',
        },
        amber:  '#F2AA3B',
        mist:   '#EEF3F7',
        slateui: '#6E7B90',

        // Hologram (legacy)
        hologram: {
          blue:   '#3b82f6',
          violet: '#8b5cf6',
          cyan:   '#22d3ee',
        },
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        'display-xl': ['clamp(4rem, 10vw, 10rem)', { lineHeight: '0.9',  letterSpacing: '-0.06em', fontWeight: '900' }],
        'display-lg': ['clamp(3rem, 7vw, 7rem)',   { lineHeight: '0.95', letterSpacing: '-0.05em', fontWeight: '900' }],
        'display-md': ['clamp(2.5rem, 5vw, 5rem)', { lineHeight: '1',    letterSpacing: '-0.04em', fontWeight: '800' }],
        'heading-xl': ['3rem',    { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'heading-lg': ['2rem',    { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-md': ['1.5rem',  { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.25', fontWeight: '700' }],
        'body-xl': ['1.25rem',   { lineHeight: '1.6' }],
        'body-lg': ['1.125rem',  { lineHeight: '1.65' }],
        'body-md': ['1rem',      { lineHeight: '1.65' }],
        'body-sm': ['0.875rem',  { lineHeight: '1.6' }],
        'body-xs': ['0.75rem',   { lineHeight: '1.5' }],
        'label-lg': ['0.75rem',   { lineHeight: '1', letterSpacing: '0.15em', fontWeight: '700' }],
        'label-sm': ['0.625rem',  { lineHeight: '1', letterSpacing: '0.35em', fontWeight: '800' }],
        'label-xs': ['0.5625rem', { lineHeight: '1', letterSpacing: '0.4em',  fontWeight: '900' }],
      },

      fontWeight: {
        black:      '900',
        extrabold:  '800',
        bold:       '700',
        semibold:   '600',
        medium:     '500',
        normal:     '400',
      },

      letterSpacing: {
        tightest: '-0.06em',
        tighter:  '-0.04em',
        tight:    '-0.02em',
        normal:   '0em',
        wide:     '0.08em',
        wider:    '0.15em',
        widest:   '0.4em',
      },

      // ── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        'none': '0px',
        'sm':   '8px',
        DEFAULT: '12px',
        'lg':   '16px',
        'xl':   '24px',
        '2xl':  '32px',
        '3xl':  '48px',
        '4xl':  '64px',
        'full': '9999px',
      },

      // ── Shadows (Light Theme 3D Glass) ───────────────────────────────────
      boxShadow: {
        'none':     'none',
        'sm':       '0 1px 3px rgba(17,27,42,0.05)',
        DEFAULT:    '0 4px 16px rgba(17,27,42,0.06)',
        'md':       '0 4px 16px rgba(17,27,42,0.06)',
        'lg':       '0 12px 32px rgba(15, 139, 141, 0.08)',
        'xl':       '0 20px 64px rgba(15, 139, 141, 0.1)',
        '2xl':      '0 32px 128px rgba(15, 139, 141, 0.12)',
        'panel':    '0 10px 40px rgba(17,27,42,0.04)',
        'glass':    '0 12px 40px rgba(15, 139, 141, 0.08), inset 0 1px 0 rgba(255,255,255,1)',

        // Light Theme Accent Glows
        'gold-sm':  '0 0 20px rgba(242,170,59,0.15)',
        'gold-md':  '0 10px 40px rgba(242,170,59,0.2)',
        'gold-lg':  '0 20px 80px rgba(242,170,59,0.25)',
        'aqua-sm':  '0 0 20px rgba(15,139,141,0.1)',
        'aqua-md':  '0 10px 40px rgba(15,139,141,0.15)',
        'aqua-lg':  '0 20px 80px rgba(15,139,141,0.2)',
      },

      // ── Max Width ────────────────────────────────────────────────────────
      maxWidth: {
        brand:   '1440px',
        content: '1200px',
        prose:   '720px',
        narrow:  '560px',
      },

      // ── Spacing Extensions ───────────────────────────────────────────────
      spacing: {
        '18':  '72px',
        '22':  '88px',
        '26':  '104px',
        '30':  '120px',
        '72':  '288px',
        '80':  '320px',
        '96':  '384px',
        '112': '448px',
        '128': '512px',
      },

      // ── Backdrop Blur ────────────────────────────────────────────────────
      backdropBlur: {
        'xs':   '4px',
        'sm':   '8px',
        DEFAULT: '12px',
        'md':   '16px',
        'lg':   '24px',
        'xl':   '32px',
        '2xl':  '48px',
        '3xl':  '64px',
      },

      // ── Z-Index ──────────────────────────────────────────────────────────
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
        'nav': '100',
        'modal': '200',
        'toast': '300',
        'tooltip': '400',
      },

      // ── Keyframes ────────────────────────────────────────────────────────
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-live': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
        },
        'mesh-pulse': {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.4' },
          '50%':       { transform: 'scale(1.05)', opacity: '0.6' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-4px)' },
        },
      },

      // ── Animations ───────────────────────────────────────────────────────
      animation: {
        'rise':          'rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':       'fade-in 0.4s ease-out both',
        'scale-in':      'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up':      'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down':    'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':       'shimmer 2s linear infinite',
        'ticker':        'ticker 30s linear infinite',
        'pulse-live':    'pulse-live 2s ease-in-out infinite',
        'pulse-slow':    'mesh-pulse 8s ease-in-out infinite',
        'spin-slow':     'spin-slow 20s linear infinite',
        'bounce-subtle': 'bounce-subtle 3s ease-in-out infinite',
      },

      // ── Transition Timing Functions ──────────────────────────────────────
      transitionTimingFunction: {
        'brand':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0, 0, 0.2, 1)',
      },

      // ── Transition Duration ──────────────────────────────────────────────
      transitionDuration: {
        '80':  '80ms',
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
    },
  },

  plugins: [
    plugin(function({ addUtilities, addComponents, theme }) {

      // ── 3D Light Glass Utilities ───────────────────────────────────────
      addUtilities({
        // Surface Scale for Light Theme
        '.surface-void':    { background: 'transparent' },
        '.surface-base':    { background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(17,27,42,0.04)' },
        '.surface-raised':  { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,1)', backdropFilter: 'blur(24px)', boxShadow: '0 12px 32px rgba(15,139,141,0.06), inset 0 1px 0 rgba(255,255,255,1)' },
        '.surface-high':    { background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,1)', backdropFilter: 'blur(32px)', boxShadow: '0 20px 64px rgba(15,139,141,0.1), inset 0 1px 0 rgba(255,255,255,1)' },
        '.surface-overlay': { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,1)', backdropFilter: 'blur(40px)', boxShadow: '0 32px 128px rgba(15,139,141,0.15)' },

        // Glass (Legacy compat overrides to match light theme)
        '.bg-glass-base':     { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
        '.bg-glass-elevated': { backgroundColor: 'rgba(255, 255, 255, 0.6)' },
        '.bg-glass-high':     { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
        '.blur-glass-sm':     { backdropFilter: 'blur(4px)' },
        '.blur-glass-md':     { backdropFilter: 'blur(8px)' },
        '.blur-glass-lg':     { backdropFilter: 'blur(16px)' },
        '.blur-glass-xl':     { backdropFilter: 'blur(24px)' },

        // 3D Depth Scale
        '.depth-1': { transform: 'translateZ(5px)' },
        '.depth-2': { transform: 'translateZ(10px)' },
        '.depth-3': { transform: 'translateZ(20px)' },
        '.depth-4': { transform: 'translateZ(40px)' },
        '.depth-5': { transform: 'translateZ(80px)' },

        // Perspective
        '.perspective-800':  { perspective: '800px' },
        '.perspective-1000': { perspective: '1000px' },
        '.perspective-1500': { perspective: '1500px' },
        '.preserve-3d':      { transformStyle: 'preserve-3d' },

        // Text Gradients
        '.text-gradient-gold': {
          background: 'linear-gradient(135deg, #F2AA3B 0%, #C48A30 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-aqua': {
          background: 'linear-gradient(135deg, #0F8B8D 0%, #22D3EE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-brand': {
          background: 'linear-gradient(135deg, #0F8B8D 0%, #F2AA3B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },

        // Container
        '.container-brand': {
          width: '100%',
          maxWidth: '1440px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'clamp(24px, 5vw, 80px)',
          paddingRight: 'clamp(24px, 5vw, 80px)',
        },

        // Noise
        '.noise-overlay': {
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          opacity: '0.04',
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
        },

        // Deterministic noise (legacy)
        '.deterministic-noise': {
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          opacity: '0.05',
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
        },

        // Status
        '.pulse-live': {
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10B981',
          animation: 'pulse-live 2s infinite',
        },

        // Component Tokens
        '.section-label': {
          fontSize: '0.625rem',
          fontWeight: '800',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          lineHeight: '1',
          color: '#0F8B8D',
        },

        '.border-subtle': {
          borderWidth: '1px',
          borderColor: 'rgba(15, 139, 141, 0.1)',
        },

        // Primary button
        '.btn-primary': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #0F8B8D 0%, #17A2B8 100%)',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: '900',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 8px 24px rgba(15, 139, 141, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        },

        // Secondary button
        '.btn-secondary': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(15, 139, 141, 0.2)',
          backdropFilter: 'blur(16px)',
          color: '#111B2A',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(17,27,42,0.03)',
        },
      });
    }),
  ],
};

export default config;
