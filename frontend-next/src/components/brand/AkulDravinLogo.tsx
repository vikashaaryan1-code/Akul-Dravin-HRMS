import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export const AkulDravinLogo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 64, 
  height = 64, 
  showText = true 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 3D Glass Logo Graphic */}
      <div 
        style={{ width, height }} 
        className="relative flex-shrink-0 flex items-center justify-center drop-shadow-2xl"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#11284A" />
              <stop offset="50%" stopColor="#1E68E5" />
              <stop offset="100%" stopColor="#00E5AB" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CFAE00" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glass" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Left Leg of A (Blue/Aqua gradient) */}
          <path d="M40 85 L15 85 L45 20 L55 20 Z" fill="url(#blueGrad)" filter="url(#glass)" />
          
          {/* Circuit Lines on the left leg */}
          <circle cx="28" cy="70" r="2.5" fill="#00E5AB" />
          <path d="M28 70 L35 60 L40 60" stroke="#00E5AB" strokeWidth="1.5" fill="none" />
          <circle cx="41" cy="60" r="1.5" fill="#00E5AB" />

          {/* Golden Arrow (Right Leg of A + Ascending Arrow) */}
          <path d="M60 85 L35 85 L65 20 L85 20 L75 35 L85 45 Z" fill="url(#goldGrad)" filter="url(#glow)" />
          <path d="M85 20 L70 15 L75 30 Z" fill="#FFD700" />

          {/* Intersecting crossbar */}
          <path d="M30 65 L70 65 L65 50 L38 50 Z" fill="url(#blueGrad)" filter="url(#glass)" opacity="0.9" />

          {/* Glowing dot in center */}
          <circle cx="50" cy="58" r="4" fill="#FFFFFF" filter="url(#glow)" opacity="0.8" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none mb-1 font-display">
            AKUL DRAVIN
          </h1>
          <p className="text-xs md:text-sm font-semibold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            HRMS AI
          </p>
        </div>
      )}
    </div>
  );
};
