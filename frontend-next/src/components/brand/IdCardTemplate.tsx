import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const IdCardTemplate = () => {
  return (
    <div className="flex gap-12 justify-center p-12 bg-transparent font-display perspective-1500">
      
      {/* Front of ID Card */}
      <div className="w-[280px] h-[450px] rounded-2xl relative overflow-hidden flex flex-col items-center p-6 transform-style-3d hover:scale-105 transition-all duration-700 hover:rotate-y-12">
        {/* Holographic 3D Glass Layer */}
        <div className="absolute inset-0 bg-[#051124] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden pointer-events-none">
          {/* Background Waves & Holographic Mesh */}
          <div className="absolute bottom-0 left-0 w-full h-48 opacity-40 mix-blend-screen">
            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 50 L0 20 Q25 40 50 20 T100 20 L100 50 Z" fill="url(#aquaGradCard)" />
              <path d="M0 50 L0 35 Q30 50 60 30 T100 35 L100 50 Z" fill="url(#goldGradCard)" opacity="0.8"/>
              <defs>
                <linearGradient id="aquaGradCard" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E68E5" />
                  <stop offset="100%" stopColor="#00E5AB" />
                </linearGradient>
                <linearGradient id="goldGradCard" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0A1E3A" />
                  <stop offset="100%" stopColor="#00E5AB" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Noise */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-screen pointer-events-none"></div>
        </div>

        {/* Clip UI (Lanyard hole) */}
        <div className="absolute top-0 w-24 h-6 bg-gradient-to-b from-white/10 to-transparent rounded-b-xl shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)] z-20 backdrop-blur-md border-x border-b border-white/10">
          <div className="w-10 h-2 bg-black/50 mx-auto mt-2 rounded-full shadow-inner border border-white/5"></div>
        </div>

        {/* Logo */}
        <div className="mt-8 mb-6 flex flex-col items-center z-10 transform translate-z-10">
           <AkulDravinLogo width={36} height={36} showText={false} />
           <div className="text-center mt-3">
             <h2 className="text-white font-bold text-[0.8rem] leading-none tracking-widest">AKUL DRAVIN</h2>
             <p className="text-transparent bg-clip-text bg-gradient-to-r from-aqua to-blue text-[0.55rem] font-bold tracking-[0.25em] mt-1">HRMS AI</p>
           </div>
        </div>

        {/* Photo (Glass Frame) */}
        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-blue via-aqua to-gold relative z-10 mb-4 transform translate-z-20 shadow-[0_10px_30px_rgba(0,229,171,0.3)]">
           <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#051124] bg-slate-800 relative">
             <img src="https://ui-avatars.com/api/?name=Amit+Sharma&background=0A1E3A&color=00E5AB&size=256&bold=true" alt="Profile" className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
             {/* Scanner overlay effect */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aqua/20 to-transparent -translate-y-full animate-[shimmer_3s_infinite]"></div>
           </div>
        </div>

        {/* Details */}
        <div className="text-center z-10 text-white w-full transform translate-z-10">
          <h3 className="text-lg font-bold mb-1 tracking-wide">Amit Sharma</h3>
          <p className="text-[0.65rem] text-aqua mb-4 uppercase tracking-[0.15em] font-bold">Chief Executive Officer</p>
          
          <div className="inline-block bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 px-5 py-2 mt-2 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
             <p className="text-[0.55rem] text-slate-400 uppercase tracking-[0.2em] mb-0.5 font-semibold">EMP ID</p>
             <p className="text-sm font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-wider">AD-0001</p>
          </div>
        </div>
      </div>

      {/* Back of ID Card */}
      <div className="w-[280px] h-[450px] rounded-2xl relative overflow-hidden flex flex-col items-center p-6 transform-style-3d hover:scale-105 transition-all duration-700 hover:-rotate-y-12">
        
        {/* Holographic 3D Glass Layer */}
        <div className="absolute inset-0 bg-[#051124] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue rounded-full filter blur-[60px] opacity-20 mix-blend-screen"></div>
        </div>

        {/* Clip UI */}
        <div className="absolute top-0 w-24 h-6 bg-gradient-to-b from-white/10 to-transparent rounded-b-xl shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)] z-20 backdrop-blur-md border-x border-b border-white/10">
          <div className="w-10 h-2 bg-black/50 mx-auto mt-2 rounded-full shadow-inner border border-white/5"></div>
        </div>

        <div className="mt-10 flex flex-col items-center z-10 transform translate-z-10 w-full border-b border-white/10 pb-4">
           <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Signature</p>
           {/* Simulated Signature */}
           <div className="mt-3 w-32 h-8 relative flex items-center justify-center">
             <span className="font-serif italic text-lg text-white/80" style={{ fontFamily: 'Brush Script MT, cursive' }}>Authorized</span>
           </div>
        </div>

        <div className="w-full text-left z-10 text-white mt-6 space-y-5 transform translate-z-10 flex-1">
          <div>
            <p className="text-[0.55rem] text-aqua uppercase tracking-[0.15em] mb-1 font-bold">Emergency Contact</p>
            <p className="text-xs font-mono tracking-wider">+91 99999 88888</p>
          </div>
          <div>
            <p className="text-[0.55rem] text-aqua uppercase tracking-[0.15em] mb-1 font-bold">Blood Group</p>
            <p className="text-xs font-bold text-rose-400 bg-rose-400/10 inline-block px-2 py-0.5 rounded border border-rose-400/20">O+</p>
          </div>
          <div>
            <p className="text-[0.55rem] text-aqua uppercase tracking-[0.15em] mb-1 font-bold">Property Of</p>
            <p className="text-[0.65rem] text-slate-300 leading-relaxed font-medium">
              This card is the property of Akul Dravin HRMS AI. If found, please return to:<br/>
              <span className="text-white mt-1 block">TechNova Solutions Pvt. Ltd.<br/>Gurugram, Haryana</span>
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 text-center w-full left-0 z-10 transform translate-z-10 flex flex-col items-center gap-2">
          <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <p className="text-[0.55rem] text-slate-400 tracking-[0.25em] font-bold uppercase">www.akuldravin.com</p>
        </div>
      </div>
    </div>
  );
};
