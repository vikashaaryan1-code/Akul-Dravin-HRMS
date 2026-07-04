import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const VisitingCardTemplate = () => {
  return (
    <div className="flex flex-col gap-12 items-center p-12 bg-slate-100 font-display">
      
      {/* Front of Business Card */}
      <div className="w-[450px] h-[250px] bg-navy rounded-xl shadow-2xl relative overflow-hidden flex items-center justify-center border border-slate-700/50">
        
        {/* Abstract wavy lines */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0 80 Q25 90 50 70 T100 80" stroke="url(#cardGradBlue)" strokeWidth="0.5" fill="none" />
            <path d="M0 85 Q30 95 60 75 T100 85" stroke="url(#cardGradGold)" strokeWidth="0.5" fill="none" />
            <defs>
              <linearGradient id="cardGradBlue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1E68E5" />
                <stop offset="100%" stopColor="#00E5AB" />
              </linearGradient>
              <linearGradient id="cardGradGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#CFAE00" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue rounded-full filter blur-[80px] opacity-20"></div>

        {/* Logo */}
        <div className="z-10 scale-125">
          <AkulDravinLogo width={54} height={54} showText={true} />
        </div>
      </div>

      {/* Back of Business Card */}
      <div className="w-[450px] h-[250px] bg-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-8 border border-slate-200">
        
        {/* Background Watermark Arrow */}
        <div className="absolute -right-10 top-0 h-full opacity-5 pointer-events-none">
           <svg viewBox="0 0 100 100" className="h-full">
             <path d="M50 90 L20 90 L60 20 L80 20 L70 40 L90 60 Z" fill="#1E68E5" />
             <path d="M80 20 L70 10 L80 30 Z" fill="#FFD700" />
           </svg>
        </div>

        {/* Personal Details */}
        <div className="z-10">
          <h2 className="text-xl font-bold text-navy">Amit Sharma</h2>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-1">Chief Executive Officer</p>
        </div>

        {/* Contact & QR */}
        <div className="flex justify-between items-end z-10 w-full">
          <div className="space-y-3 text-[0.65rem] font-medium text-slate-600">
             <div className="flex items-center gap-3">
               <span className="text-blue w-3 text-center">📞</span>
               <span>+91 98765 43210</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-blue w-3 text-center">✉️</span>
               <span>amit@akuldravin.com</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-blue w-3 text-center">🌐</span>
               <span>www.akuldravin.com</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-blue w-3 text-center">📍</span>
               <span>Gurugram, Haryana, India</span>
             </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="w-16 h-16 bg-white p-1 shadow-sm border border-slate-200 rounded">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              {/* Very simplified QR pattern for demonstration */}
              <rect x="0" y="0" width="30" height="30" fill="currentColor"/>
              <rect x="5" y="5" width="20" height="20" fill="white"/>
              <rect x="10" y="10" width="10" height="10" fill="currentColor"/>
              
              <rect x="70" y="0" width="30" height="30" fill="currentColor"/>
              <rect x="75" y="5" width="20" height="20" fill="white"/>
              <rect x="80" y="10" width="10" height="10" fill="currentColor"/>

              <rect x="0" y="70" width="30" height="30" fill="currentColor"/>
              <rect x="5" y="75" width="20" height="20" fill="white"/>
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
