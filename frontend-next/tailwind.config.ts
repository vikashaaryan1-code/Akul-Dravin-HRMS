import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

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
      colors: {
        ink: {
          DEFAULT: '#111B2A',
          "950": '#020617', // Deep Obsidian
        },
        slateui: '#6E7B90',
        ember: '#E85A2A',
        amber: '#F2AA3B',
        mist: '#EEF3F7',
        aqua: '#0F8B8D',
        hologram: {
          blue: '#3b82f6',
          violet: '#8b5cf6',
          cyan: '#22d3ee',
        },
      },
      boxShadow: {
        panel: '0 10px 30px rgba(17,27,42,0.08)',
        'holo-sm': '0 0 10px rgba(59, 130, 246, 0.2)',
        'holo-lg': '0 0 25px rgba(139, 92, 246, 0.4)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'hologram-flicker': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
          '95%': { opacity: '1', filter: 'brightness(1.5)' },
        },
        'mesh-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.05)', opacity: '0.6' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        }
      },
      animation: {
        rise: 'rise 0.45s ease-out both',
        'hologram': 'hologram-flicker 4s linear infinite',
        'pulse-slow': 'mesh-pulse 8s ease-in-out infinite',
        'glitch-fast': 'glitch 0.2s linear infinite',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        /* CyberGlass Opacity Scale (Linear) */
        '.bg-glass-base': {
          'background-color': 'rgba(255, 255, 255, 0.05)',
        },
        '.bg-glass-elevated': {
          'background-color': 'rgba(255, 255, 255, 0.15)',
        },
        '.bg-glass-high': {
          'background-color': 'rgba(255, 255, 255, 0.25)',
        },
        
        /* CyberGlass Blur Scale (Exponential Clamped) */
        '.blur-glass-sm': {
          'backdrop-filter': 'blur(4px)',
        },
        '.blur-glass-md': {
          'backdrop-filter': 'blur(8px)',
        },
        '.blur-glass-lg': {
          'backdrop-filter': 'blur(16px)',
        },
        '.blur-glass-xl': {
          'backdrop-filter': 'blur(24px)', // GPU Hard Cap
        },

        /* CyberGlass Depth Scale (Linear-Log Hybrid) */
        '.depth-1': { 'transform': 'translateZ(5px)' },
        '.depth-2': { 'transform': 'translateZ(10px)' },
        '.depth-3': { 'transform': 'translateZ(20px)' },
        '.depth-4': { 'transform': 'translateZ(40px)' },
        '.depth-5': { 'transform': 'translateZ(80px)' }, // Spatial Hard Cap
        
        '.perspective-1000': {
          'perspective': '1000px',
        },
        
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
      })
    })
  ],
};

export default config;
