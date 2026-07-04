import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const CertificateTemplate = () => {
  return (
    <div className="flex justify-center p-12 bg-transparent font-display perspective-1500">
      {/* Certificate Container */}
      <div className="w-[800px] h-[560px] rounded-xl relative flex items-center justify-center transform-style-3d hover:scale-[1.02] transition-all duration-700 shadow-[0_32px_128px_rgba(0,0,0,0.8)]">
        
        {/* Deep Glass Background Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#051124] via-[#0A1E3A] to-[#020617] rounded-xl border border-white/5 overflow-hidden">
          
          {/* Subtle Glows */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue rounded-full filter blur-[120px] opacity-10 -translate-x-1/2 -translate-y-1/2 mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold rounded-full filter blur-[120px] opacity-10 translate-x-1/4 translate-y-1/4 mix-blend-screen pointer-events-none"></div>
          
          {/* Noise / Crystal Texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-screen pointer-events-none"></div>
        </div>

        {/* Outer Premium Border Frame */}
        <div className="absolute inset-4 border border-white/10 rounded-lg pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"></div>
        
        {/* Inner Gold glowing border */}
        <div className="absolute inset-6 border border-[#CFAE00]/40 rounded pointer-events-none z-20 shadow-[0_0_15px_rgba(255,215,0,0.1),inset_0_0_15px_rgba(255,215,0,0.1)]">
          <div className="absolute inset-0 border border-gold/20 m-1"></div>
        </div>

        {/* Huge Faint Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none transform scale-150 rotate-12 mix-blend-screen">
          <AkulDravinLogo width={600} height={600} showText={false} />
        </div>

        {/* Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col items-center py-12 px-20 text-center transform translate-z-20">
          
          {/* Top Section */}
          <div className="flex flex-col items-center gap-4">
            <AkulDravinLogo width={54} height={54} showText={true} className="scale-110" />
            
            <div className="mt-8 flex flex-col items-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-white uppercase font-serif drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                Certificate
              </h1>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent my-3"></div>
              <h2 className="text-lg md:text-xl tracking-[0.3em] text-aqua uppercase font-medium drop-shadow-[0_0_10px_rgba(0,229,171,0.3)]">
                Of Appreciation
              </h2>
            </div>
          </div>

          {/* Middle Section */}
          <div className="mt-12 space-y-8 w-full flex-1 flex flex-col justify-center">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-slate-400">
              Is Proudly Presented To
            </p>
            
            <h3 className="text-5xl md:text-6xl font-bold text-gold font-serif drop-shadow-[0_4px_20px_rgba(255,215,0,0.2)]">
              Amit Sharma
            </h3>
            
            <p className="text-sm leading-loose text-slate-300 max-w-lg mx-auto font-medium font-body">
              For outstanding leadership, breakthrough AI innovation, and unwavering dedication 
              towards building the <span className="text-white font-bold tracking-wide">world's most advanced HRMS</span> platform.
            </p>
          </div>

          {/* Bottom Section */}
          <div className="w-full flex justify-between items-end px-12 mt-8 pb-4">
            
            {/* Signature Area */}
            <div className="flex flex-col items-center pt-8">
              <div className="w-48 border-b border-white/20 mb-3 relative flex justify-center">
                {/* Simulated Signature glowing */}
                <span className="absolute bottom-1 w-full text-center font-serif italic text-3xl text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                  Amit Sharma
                </span>
              </div>
              <p className="text-[0.65rem] font-bold text-white uppercase tracking-[0.2em]">Amit Sharma</p>
              <p className="text-[0.55rem] text-aqua uppercase tracking-[0.2em] mt-1 font-semibold">Chief Executive Officer</p>
            </div>

            {/* Premium 3D Golden Seal */}
            <div className="relative flex items-center justify-center transform hover:scale-110 transition-transform duration-500 cursor-default group">
              {/* Ribbon Tails */}
              <div className="absolute top-10 left-1.5 w-6 h-14 bg-gradient-to-b from-[#8B0000] to-[#4A0000] transform rotate-[15deg] -z-10 shadow-[2px_4px_10px_rgba(0,0,0,0.5)] group-hover:rotate-[20deg] transition-all"></div>
              <div className="absolute top-10 right-1.5 w-6 h-14 bg-gradient-to-b from-[#8B0000] to-[#4A0000] transform -rotate-[15deg] -z-10 shadow-[-2px_4px_10px_rgba(0,0,0,0.5)] group-hover:-rotate-[20deg] transition-all"></div>
              
              {/* Seal Body (Deep 3D Gold) */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFF4CC] via-[#FFD700] to-[#9A7D00] shadow-[0_10px_30px_rgba(255,215,0,0.3),inset_0_-4px_10px_rgba(0,0,0,0.4),inset_0_4px_10px_rgba(255,255,255,0.8)] flex items-center justify-center border-2 border-[#FFE866] relative z-10 overflow-hidden">
                {/* Sunburst effect */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.4)_10deg,transparent_20deg)] animate-[spin-slow_10s_linear_infinite]"></div>
                
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#856500]/50 bg-gradient-to-tr from-[#FFD700] to-[#FFF4CC] flex items-center justify-center shadow-inner relative z-10">
                  <div className="flex flex-col items-center">
                    <span className="text-[0.55rem] font-black text-[#664D00] uppercase tracking-widest leading-none drop-shadow-sm">Akul Dravin</span>
                    <span className="text-[0.45rem] font-bold text-[#664D00] uppercase tracking-widest leading-none mt-1">HRMS AI</span>
                    <div className="w-4 h-px bg-[#856500]/30 mt-1.5"></div>
                    <span className="text-[0.35rem] font-bold text-[#856500] uppercase tracking-widest leading-none mt-1">Certified</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
