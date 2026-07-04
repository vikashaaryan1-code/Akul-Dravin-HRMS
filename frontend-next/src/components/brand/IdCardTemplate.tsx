import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const IdCardTemplate = () => {
  return (
    <div className="flex gap-8 justify-center p-8 bg-slate-100 font-display">
      {/* Front of ID Card */}
      <div className="w-[280px] h-[450px] bg-navy rounded-2xl shadow-2xl relative overflow-hidden flex flex-col items-center p-6 border border-slate-700/50">
        {/* Clip UI */}
        <div className="absolute top-0 w-24 h-6 bg-gradient-to-b from-slate-200 to-slate-400 rounded-b-xl shadow-inner z-20">
          <div className="w-8 h-2 bg-slate-800 mx-auto mt-2 rounded-full opacity-50"></div>
        </div>

        {/* Background Waves */}
        <div className="absolute bottom-0 left-0 w-full h-32 opacity-80">
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0 50 L0 20 Q25 40 50 20 T100 20 L100 50 Z" fill="url(#aquaGrad)" />
            <path d="M0 50 L0 35 Q30 50 60 30 T100 35 L100 50 Z" fill="url(#goldGrad)" opacity="0.8"/>
            <defs>
              <linearGradient id="aquaGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1E68E5" />
                <stop offset="100%" stopColor="#00E5AB" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0A1E3A" />
                <stop offset="100%" stopColor="#00E5AB" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Logo */}
        <div className="mt-8 mb-6 flex flex-col items-center z-10">
           <AkulDravinLogo width={36} height={36} showText={false} />
           <div className="text-center mt-2">
             <h2 className="text-white font-bold text-sm leading-none">AKUL DRAVIN</h2>
             <p className="text-blue text-[0.6rem] font-semibold tracking-widest mt-0.5">HRMS AI</p>
           </div>
        </div>

        {/* Photo */}
        <div className="w-28 h-28 rounded-full bg-slate-300 border-4 border-white/10 overflow-hidden shadow-xl z-10 mb-4">
           {/* Placeholder for user photo */}
           <img src="https://ui-avatars.com/api/?name=Amit+Sharma&background=random&size=256" alt="Profile" className="w-full h-full object-cover" />
        </div>

        {/* Details */}
        <div className="text-center z-10 text-white w-full">
          <h3 className="text-lg font-bold mb-1">Amit Sharma</h3>
          <p className="text-xs text-slate-300 mb-4 uppercase tracking-wider font-medium">Chief Executive Officer</p>
          
          <div className="inline-block bg-white/10 backdrop-blur-md rounded border border-white/20 px-4 py-1.5 mt-2">
             <p className="text-[0.65rem] text-slate-300 uppercase tracking-wider mb-0.5">EMP ID</p>
             <p className="text-sm font-mono font-bold text-aqua">AD001</p>
          </div>
        </div>
      </div>

      {/* Back of ID Card */}
      <div className="w-[280px] h-[450px] bg-navy rounded-2xl shadow-2xl relative overflow-hidden flex flex-col items-center p-6 border border-slate-700/50">
        {/* Clip UI */}
        <div className="absolute top-0 w-24 h-6 bg-gradient-to-b from-slate-200 to-slate-400 rounded-b-xl shadow-inner z-20">
          <div className="w-8 h-2 bg-slate-800 mx-auto mt-2 rounded-full opacity-50"></div>
        </div>

        <div className="mt-8 mb-6 flex flex-col items-center z-10">
           <AkulDravinLogo width={32} height={32} showText={false} opacity={0.5} />
           <div className="text-center mt-2">
             <h2 className="text-white/70 font-bold text-xs leading-none">AKUL DRAVIN</h2>
             <p className="text-blue/70 text-[0.5rem] font-semibold tracking-widest mt-0.5">HRMS AI</p>
           </div>
        </div>

        <div className="w-full text-left z-10 text-white mt-4 space-y-6">
          <div>
            <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-1">Emergency Contact</p>
            <p className="text-sm font-semibold">+91 99999 88888</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-1">Blood Group</p>
            <p className="text-sm font-bold text-rose-400">O+</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-1">If found, please return to:</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Akul Dravin HRMS AI<br/>
              TechNova Solutions Pvt. Ltd.<br/>
              Gurugram, Haryana, India
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 text-center w-full left-0 z-10">
          <p className="text-[0.65rem] text-aqua tracking-widest">www.akuldravin.com</p>
        </div>

         {/* Subtle background glow */}
         <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue rounded-full filter blur-[80px] opacity-20"></div>
      </div>
    </div>
  );
};
