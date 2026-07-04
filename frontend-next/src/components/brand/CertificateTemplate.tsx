import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const CertificateTemplate = () => {
  return (
    <div className="flex justify-center p-8 bg-slate-900 font-display">
      {/* Certificate Container */}
      <div className="w-[800px] h-[560px] bg-white relative shadow-2xl p-6">
        
        {/* Outer Navy Border */}
        <div className="absolute inset-0 border-[16px] border-navy pointer-events-none z-20 shadow-inner"></div>
        
        {/* Inner Gold Border */}
        <div className="absolute inset-6 border-[2px] border-[#CFAE00] pointer-events-none z-20"></div>

        {/* Faint Background Logo / Pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-[400px] h-[400px]">
             <path d="M50 90 L20 90 L60 20 L80 20 L70 40 L90 60 Z" fill="#1E68E5" />
             <path d="M80 20 L70 10 L80 30 Z" fill="#FFD700" />
          </svg>
        </div>

        {/* Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12 px-16 text-center">
          
          {/* Top Section */}
          <div className="flex flex-col items-center gap-6">
            <AkulDravinLogo width={48} height={48} showText={true} className="scale-110" />
            
            <div className="mt-4">
              <h1 className="text-3xl font-bold tracking-widest text-navy uppercase font-serif" style={{ fontFamily: 'Times New Roman, serif' }}>
                Certificate
              </h1>
              <h2 className="text-xl tracking-[0.2em] text-blue uppercase mt-2">
                Of Appreciation
              </h2>
            </div>
          </div>

          {/* Middle Section */}
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-widest uppercase text-slate-500">
              Proudly Presented To
            </p>
            
            <h3 className="text-5xl font-bold text-navy" style={{ fontFamily: 'Times New Roman, serif' }}>
              Amit Sharma
            </h3>
            
            <p className="text-sm leading-relaxed text-slate-600 max-w-md mx-auto font-medium">
              For outstanding leadership, innovation, and dedication<br/>
              towards building smarter workplaces.
            </p>
          </div>

          {/* Bottom Section */}
          <div className="w-full flex justify-between items-end px-12 mt-4">
            
            {/* Signature */}
            <div className="flex flex-col items-center">
              <div className="w-40 border-b border-navy mb-2 relative">
                {/* Simulated Signature */}
                <span className="absolute bottom-1 w-full text-center font-serif italic text-2xl text-blue opacity-80" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                  Amit Sharma
                </span>
              </div>
              <p className="text-[0.65rem] font-bold text-navy uppercase tracking-widest">Amit Sharma</p>
              <p className="text-[0.55rem] text-slate-500 uppercase tracking-widest mt-0.5">Chief Executive Officer</p>
            </div>

            {/* Golden Seal */}
            <div className="relative flex items-center justify-center">
              {/* Ribbon Tails */}
              <div className="absolute top-10 left-1 w-6 h-12 bg-[#B82B2B] transform rotate-12 -z-10 shadow-md"></div>
              <div className="absolute top-10 right-1 w-6 h-12 bg-[#B82B2B] transform -rotate-12 -z-10 shadow-md"></div>
              
              {/* Seal Body */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] via-[#CFAE00] to-[#9A7D00] shadow-xl flex items-center justify-center border-2 border-[#FFE866] relative z-10">
                <div className="w-16 h-16 rounded-full border border-dashed border-[#856500] flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[0.5rem] font-bold text-[#664D00] uppercase tracking-widest leading-none">Akul Dravin</span>
                    <span className="text-[0.4rem] font-bold text-[#664D00] uppercase tracking-widest leading-none mt-1">HRMS AI</span>
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
