import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
  opacity?: number;
}

export const AkulDravinLogo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 64, 
  height = 64, 
  showText = true,
  opacity = 1
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ opacity }}>
      {/* 3D Glass Logo Graphic */}
      <div 
        style={{ width, height }} 
        className="relative flex-shrink-0 flex items-center justify-center drop-shadow-2xl perspective-1000"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg preserve-3d">
          <defs>
            {/* Dark Navy / Blue Premium Tone */}
            <linearGradient id="glassBlueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E68E5" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00E5AB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
            </linearGradient>

            {/* Deep Glass for back elements */}
            <linearGradient id="deepGlassGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0A1E3A" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1E68E5" stopOpacity="0.75" />
            </linearGradient>

            {/* Premium Gold Accent for Arrow */}
            <linearGradient id="premiumGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9A7D00" />
              <stop offset="30%" stopColor="#CFAE00" />
              <stop offset="70%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFF4CC" />
            </linearGradient>

            <linearGradient id="tealGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F8B8D" />
              <stop offset="100%" stopColor="#00E5AB" />
            </linearGradient>

            {/* 3D Glass & Bevel Filters */}
            <filter id="crystalGlass" x="-20%" y="-20%" width="140%" height="140%">
              {/* Drop Shadow */}
              <feDropShadow dx="2" dy="6" stdDeviation="4" floodOpacity="0.3" floodColor="#000000" />
              {/* Inner Bevel for 3D Edge */}
              <feSpecularLighting surfaceScale="2" specularConstant="1" specularExponent="30" lightingColor="#FFFFFF" in="SourceAlpha" result="specOut">
                <fePointLight x="20" y="20" z="100" />
              </feSpecularLighting>
              <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut2" />
              <feComposite in="SourceGraphic" in2="specOut2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
            </filter>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.4" floodColor="#9A7D00" />
            </filter>
          </defs>

          {/* BACKGROUND LAYER: The "D" Bowl & A Right Leg */}
          <path d="M48 20 L48 80 Q75 80 85 65 Q95 50 85 35 Q75 20 48 20 Z" fill="url(#deepGlassGrad)" filter="url(#crystalGlass)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          
          {/* AI Circuit Pattern inside the D bowl */}
          <g opacity="0.8">
            <circle cx="70" cy="40" r="2.5" fill="#00E5AB" />
            <path d="M70 40 L60 50 L52 50" stroke="#00E5AB" strokeWidth="1.5" fill="none" />
            <circle cx="50" cy="50" r="1.5" fill="#00E5AB" />

            <circle cx="75" cy="55" r="2" fill="#00E5AB" />
            <path d="M75 55 L65 65 L55 65" stroke="#00E5AB" strokeWidth="1.5" fill="none" />
            <circle cx="53" cy="65" r="1.5" fill="#00E5AB" />
            
            <circle cx="62" cy="70" r="1.5" fill="#00E5AB" />
            <path d="M62 70 L55 75 L48 75" stroke="#00E5AB" strokeWidth="1" fill="none" />
          </g>

          {/* FRONT LAYER: The "A" Left Leg & Base */}
          <path d="M48 20 L25 80 L38 80 L44 65 L54 65 L54 80 L65 80 L48 20 Z" fill="url(#glassBlueGrad)" filter="url(#crystalGlass)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          
          {/* The Human Icons (Bottom Left) */}
          <g fill="url(#tealGrad)" transform="translate(18, 65) scale(0.6)">
            {/* Center Human */}
            <circle cx="25" cy="10" r="6" />
            <path d="M15 25 Q25 15 35 25 L35 30 L15 30 Z" />
            {/* Left Human */}
            <circle cx="12" cy="15" r="4.5" opacity="0.8" />
            <path d="M5 28 Q12 20 18 28 L18 30 L5 30 Z" opacity="0.8" />
            {/* Right Human */}
            <circle cx="38" cy="15" r="4.5" opacity="0.8" />
            <path d="M32 28 Q38 20 45 28 L45 30 L32 30 Z" opacity="0.8" />
          </g>

          {/* TOP LAYER: The Swooping Growth Arrow (Gold) */}
          <path d="M20 55 Q40 55 60 40 L85 15 L85 30 L90 30 L90 10 L70 10 L70 15 L80 15 L55 45 Q35 62 20 62 Z" fill="url(#premiumGoldGrad)" filter="url(#goldGlow)" />
          
          {/* Subtle Light Reflection on Arrow */}
          <path d="M85 15 L78 22" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none mb-1 font-display">
            AKUL DRAVIN
          </h1>
          <p className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-aqua to-blue leading-none">
            HRMS AI
          </p>
        </div>
      )}
    </div>
  );
};
