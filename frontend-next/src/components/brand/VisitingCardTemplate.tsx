import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const VisitingCardTemplate = () => {
  return (
    <div className="flex flex-col gap-12 items-center p-12 bg-transparent font-display perspective-1500">
      
      {/* Front of Business Card */}
      <div className="w-[450px] h-[250px] rounded-xl relative flex items-center justify-center transform-style-3d hover:scale-105 transition-all duration-700 hover:rotate-y-12">
        {/* Holographic 3D Glass Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#051124] to-[#0A1E3A] rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden">
          
          {/* Abstract wavy lines & Holographic Mesh */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full mix-blend-screen">
              <path d="M0 80 Q25 90 50 70 T100 80" stroke="url(#cardGradBlue)" strokeWidth="0.5" fill="none" filter="url(#glowMesh)" />
              <path d="M0 85 Q30 95 60 75 T100 85" stroke="url(#cardGradGold)" strokeWidth="0.5" fill="none" filter="url(#glowMesh)" />
              <defs>
                <linearGradient id="cardGradBlue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E68E5" />
                  <stop offset="100%" stopColor="#00E5AB" />
                </linearGradient>
                <linearGradient id="cardGradGold" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#CFAE00" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
                <filter id="glowMesh" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
            </svg>
          </div>

          {/* Central AI Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-[#1E68E5] to-[#00E5AB] rounded-full blur-[80px] opacity-20 mix-blend-screen"></div>
          
          {/* Noise / Crystal Texture Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-screen pointer-events-none"></div>
        </div>

        {/* Logo */}
        <div className="z-10 scale-125 transform translate-z-10">
          <AkulDravinLogo width={54} height={54} showText={true} />
        </div>
      </div>

      {/* Back of Business Card */}
      <div className="w-[450px] h-[250px] rounded-xl relative overflow-hidden flex flex-col justify-between p-8 transform-style-3d hover:scale-105 transition-all duration-700 hover:-rotate-y-12">
        
        {/* Holographic 3D Glass Layer */}
        <div className="absolute inset-0 bg-[#051124] rounded-xl border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden">
          {/* Subtle Background Watermark Logo (Abstracted) */}
          <div className="absolute -right-16 -top-16 h-[150%] opacity-5 pointer-events-none transform rotate-12 blur-sm mix-blend-screen">
             <AkulDravinLogo width={300} height={300} showText={false} />
          </div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold/10 blur-[100px] rounded-full"></div>
        </div>

        {/* Personal Details */}
        <div className="z-10 transform translate-z-10">
          <h2 className="text-xl font-bold text-white tracking-wide">Amit Sharma</h2>
          <p className="text-[0.65rem] text-aqua font-bold tracking-[0.2em] uppercase mt-1">Chief Executive Officer</p>
          <div className="w-12 h-px bg-gradient-to-r from-gold to-transparent mt-4"></div>
        </div>

        {/* Contact & QR */}
        <div className="flex justify-between items-end z-10 w-full transform translate-z-10">
          <div className="space-y-3 text-[0.65rem] font-medium text-slate-300">
             <div className="flex items-center gap-3">
               <span className="text-blue w-4 h-4 rounded-full bg-blue/10 flex items-center justify-center border border-blue/20">📞</span>
               <span>+91 98765 43210</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-blue w-4 h-4 rounded-full bg-blue/10 flex items-center justify-center border border-blue/20">✉️</span>
               <span>amit@akuldravin.com</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-blue w-4 h-4 rounded-full bg-blue/10 flex items-center justify-center border border-blue/20">🌐</span>
               <span>www.akuldravin.com</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-blue w-4 h-4 rounded-full bg-blue/10 flex items-center justify-center border border-blue/20">📍</span>
               <span>Gurugram, Haryana, India</span>
             </div>
          </div>

          {/* Premium QR Code Holder */}
          <div className="w-16 h-16 p-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
            {/* Holographic Sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
            <svg viewBox="0 0 100 100" className="w-full h-full text-white/80">
              <rect x="0" y="0" width="30" height="30" fill="currentColor"/>
              <rect x="5" y="5" width="20" height="20" fill="transparent" stroke="currentColor" strokeWidth="2"/>
              <rect x="10" y="10" width="10" height="10" fill="currentColor"/>
              
              <rect x="70" y="0" width="30" height="30" fill="currentColor"/>
              <rect x="75" y="5" width="20" height="20" fill="transparent" stroke="currentColor" strokeWidth="2"/>
              <rect x="80" y="10" width="10" height="10" fill="currentColor"/>

              <rect x="0" y="70" width="30" height="30" fill="currentColor"/>
              <rect x="5" y="75" width="20" height="20" fill="transparent" stroke="currentColor" strokeWidth="2"/>
              <rect x="10" y="80" width="10" height="10" fill="currentColor"/>

              <rect x="40" y="40" width="20" height="20" fill="currentColor"/>
              <rect x="70" y="50" width="10" height="10" fill="currentColor"/>
              <rect x="50" y="70" width="15" height="15" fill="currentColor"/>
              <rect x="85" y="85" width="15" height="15" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
