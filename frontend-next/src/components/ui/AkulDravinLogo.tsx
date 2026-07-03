// AKUL DRAVIN HRMS AI — Official Brand Logo Component
// Extracted from uploaded logo: Blue/Cyan gradient"A"with arrow, people icons, circuit AI pattern, Gold accent
/* Colors: Navy #1a2d5a | Cyan/Blue gradient #4bb8d4→#2a9d8f | Gold #C9A84C | Ice White bg */ import React from 'react'; interface AkulDravinLogoProps { variant?: 'full' | 'icon' | 'wordmark'; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; theme?: 'light' | 'dark' | 'auto'; className?: string;
} const SIZES = { xs: { icon: 24, text: 10, sub: 7 }, sm: { icon: 32, text: 13, sub: 9 }, md: { icon: 40, text: 16, sub: 10 }, lg: { icon: 56, text: 20, sub: 12 }, xl: { icon: 80, text: 28, sub: 14 },
}; export function AkulDravinLogo({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className = '',
}: AkulDravinLogoProps) {
  const s = SIZES[size];
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#1a2d5a';
  const subTextColor = isDark ? '#94b8d4' : '#4a7a9b';

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`} aria-label="Akul Dravin HRMS AI">
      {/* 3D Glass Premium Logo (from uploaded image) */}
      {(variant === 'full' || variant === 'icon') && (
        <div className="relative rounded-2xl overflow-hidden glass-3d-panel border-subtle shadow-gold-sm" style={{ width: s.icon, height: s.icon }}>
          <img 
            src="/logo.png" 
            alt="Akul Dravin HRMS Logo" 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}

      {/* Text lockup */}
      {(variant === 'full' || variant === 'wordmark') && (
        <div className="flex flex-col leading-none">
          <span
            style={{
              fontSize: s.text,
              color: textColor,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 800,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
            }}
          >
            AKUL DRAVIN
          </span>
          <span
            style={{
              fontSize: s.text * 0.8,
              color: '#4bb8d4',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              letterSpacing: '0.08em',
              lineHeight: 1.2,
            }}
          >
            HRMS AI
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span
              style={{
                fontSize: s.sub,
                color: subTextColor,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: '0.12em',
                marginTop: 2,
                textTransform: 'uppercase',
              }}
            >
              World's Most Powerful HRMS
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
} export default AkulDravinLogo;
