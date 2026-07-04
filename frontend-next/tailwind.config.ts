import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/**
 * AKUL DRAVIN — Tailwind Configuration v4.0
 * Phase 2: Premium Dark Navy + 3D Glass Finishing (Enterprise Level)
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
        // Dark Theme Surface Scale
        void:    '#0A1E3A', // deep navy background
        depth: {
          1: '#11284A', // raised 1
          2: '#1A365D', // raised 2
          3: '#2A4365', // raised 3
          4: '#4A5568', // raised 4
        },

        // Brand Accents (Premium Enterprise)
        gold:    '#FFD700',
        'gold-dim': '#CFAE00',
        navy:    '#0A1E3A',
        'navy-light': '#11284A',
        'navy-dark': '#051124',
        blue:    '#1E68E5',
        aqua:    '#00E5AB',
        cyan:    '#22D3EE',
        ember:   '#E85A2A',
        jade:    '#10B981',

        // Legacy compat tokens
        ink: {
          DEFAULT: '#0A1E3A',
          '950': '#020617',
        },
        amber:  '#FFD700',
        mist:   '#FFFFFF',
        slateui: '#94A3B8',

        // Hologram (Legacy)
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
        serif:   ['Times New Roman', 'Playfair Display', 'serif'], // For Certificates/Letters
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

      // ── Shadows (Dark Theme 3D Glass) ───────────────────────────────────
      boxShadow: {
        'none':     'none',
        'sm':       '0 1px 3px rgba(0,0,0,0.2)',
        DEFAULT:    '0 4px 16px rgba(0,0,0,0.3)',
        'md':       '0 8px 24px rgba(0,0,0,0.4)',
        'lg':       '0 12px 32px rgba(0,0,0,0.5)',
        'xl':       '0 20px 64px rgba(0,0,0,0.6)',
        '2xl':      '0 32px 128px rgba(0,0,0,0.7)',
        'panel':    '0 10px 40px rgba(0,0,0,0.5)',
        'glass':    '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)',

        // Dark Theme Accent Glows
        'gold-sm':  '0 0 20px rgba(255, 215, 0, 0.15)',
        'gold-md':  '0 10px 40px rgba(255, 215, 0, 0.25)',
        'gold-lg':  '0 20px 80px rgba(255, 215, 0, 0.35)',
        'aqua-sm':  '0 0 20px rgba(0, 229, 171, 0.15)',
        'aqua-md':  '0 10px 40px rgba(0, 229, 171, 0.25)',
        'aqua-lg':  '0 20px 80px rgba(0, 229, 171, 0.35)',
        'blue-lg':  '0 20px 80px rgba(30, 104, 229, 0.35)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 229, 171, 0.4)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(0, 229, 171, 0)' },
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
    plugin(function({ addUtilities }) {
      // ── 3D Dark Glass Utilities ───────────────────────────────────────
      addUtilities({
        // Surface Scale for Dark Theme
        '.surface-void':    { background: 'transparent' },
        '.surface-base':    { background: 'rgba(17, 40, 74, 0.4)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
        '.surface-raised':  { background: 'rgba(17, 40, 74, 0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', boxShadow: '0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' },
        '.surface-high':    { background: 'rgba(17, 40, 74, 0.8)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(32px)', boxShadow: '0 20px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' },
        '.surface-overlay': { background: 'rgba(17, 40, 74, 0.95)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(48px)', boxShadow: '0 32px 128px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2)' },
        '.surface-holographic': { 
          background: 'linear-gradient(135deg, rgba(30,104,229,0.1) 0%, rgba(10,30,58,0.8) 50%, rgba(0,229,171,0.1) 100%)', 
          border: '1px solid rgba(255,255,255,0.15)', 
          backdropFilter: 'blur(32px)', 
          boxShadow: '0 20px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 32px rgba(0,229,171,0.05)' 
        },

        // Glass
        '.bg-glass-base':     { backgroundColor: 'rgba(17, 40, 74, 0.4)' },
        '.bg-glass-elevated': { backgroundColor: 'rgba(17, 40, 74, 0.6)' },
        '.bg-glass-high':     { backgroundColor: 'rgba(17, 40, 74, 0.8)' },
        '.blur-glass-sm':     { backdropFilter: 'blur(8px)' },
        '.blur-glass-md':     { backdropFilter: 'blur(16px)' },
        '.blur-glass-lg':     { backdropFilter: 'blur(24px)' },
        '.blur-glass-xl':     { backdropFilter: 'blur(32px)' },

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
          background: 'linear-gradient(135deg, #FFD700 0%, #CFAE00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-aqua': {
          background: 'linear-gradient(135deg, #1E68E5 0%, #00E5AB 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-brand': {
          background: 'linear-gradient(135deg, #00E5AB 0%, #FFD700 100%)',
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
          opacity: '0.08',
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        },

        // Status
        '.pulse-live': {
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00E5AB',
          animation: 'pulse-live 2s infinite',
        },

        // Component Tokens
        '.section-label': {
          fontSize: '0.625rem',
          fontWeight: '800',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          lineHeight: '1',
          color: '#00E5AB',
        },

        '.border-subtle': {
          borderWidth: '1px',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        },

        // Buttons
        '.btn-primary': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #1E68E5 0%, #00E5AB 100%)',
          color: '#ffffff',
          fontSize: '0.875rem',
          fontWeight: '800',
          letterSpacing: '0.05em',
          transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 8px 24px rgba(30, 104, 229, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        },

        '.btn-secondary': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          borderRadius: '9999px',
          background: 'rgba(17, 40, 74, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          color: '#ffffff',
          fontSize: '0.875rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
          transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
    }),
  ],
};

export default config;
