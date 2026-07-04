import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const LetterTemplate = () => {
  return (
    <div className="w-[800px] min-h-[1000px] bg-white text-slate-800 p-12 mx-auto shadow-2xl relative overflow-hidden font-display">
      {/* Background Graphic Accent */}
      <div className="absolute -right-20 top-1/2 opacity-5 pointer-events-none transform -translate-y-1/2">
        <svg viewBox="0 0 100 100" className="w-[600px] h-[600px]">
           <path d="M50 90 L20 90 L60 20 L80 20 L70 40 L90 60 Z" fill="#1E68E5" />
           <path d="M80 20 L70 10 L80 30 Z" fill="#FFD700" />
        </svg>
      </div>
      
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-10 relative z-10">
        <div>
           {/* Need to ensure logo text is visible on white background, logo currently forces white text for Dark Theme. We will override it slightly or use an alternate */}
           <div className="flex items-center gap-3">
              <AkulDravinLogo showText={false} width={48} height={48} />
              <div className="flex flex-col justify-center">
                <h1 className="text-xl font-bold tracking-tight text-navy leading-none mb-1">
                  AKUL DRAVIN
                </h1>
                <p className="text-xs font-semibold tracking-[0.2em] text-blue">
                  HRMS AI
                </p>
                <p className="text-[0.6rem] text-slate-500 mt-1 uppercase tracking-wider">World's Most Powerful & Advanced</p>
              </div>
           </div>
        </div>
        <div className="text-right text-sm text-slate-500 font-medium">
          May 27, 2026
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-sm leading-relaxed space-y-6">
        <div>
          <p>To,</p>
          <p className="font-semibold text-navy">Mr. Rajesh Kumar</p>
          <p>HR Director</p>
          <p>TechNova Solutions Pvt. Ltd.</p>
          <p>Gurugram, Haryana, India</p>
        </div>

        <div className="font-bold text-navy">
          Subject: Transforming HR with AI-Powered Intelligence
        </div>

        <div>
          <p>Dear Mr. Rajesh,</p>
        </div>

        <div className="space-y-4">
          <p>
            At Akul Dravin HRMS AI, we are committed to redefining the way organizations manage their most valuable asset — their people. Our AI-powered HRMS platform brings intelligence, automation, and analytics together to drive better decisions and business growth.
          </p>
          <p>
            We look forward to partnering with you on this journey.
          </p>
        </div>

        <div className="pt-12 pb-24">
          <p>Warm Regards,</p>
          <div className="mt-8">
            <p className="font-bold text-navy text-base">Amit Sharma</p>
            <p className="text-slate-500 text-xs font-medium">Chief Executive Officer</p>
            <p className="text-blue text-xs font-semibold">Akul Dravin HRMS AI</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full border-t border-slate-200 bg-slate-50 p-6 flex justify-between items-center text-xs text-slate-500 z-10">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <span className="text-blue">📞</span> +91 98765 43210
          </span>
          <span className="flex items-center gap-2">
            <span className="text-blue">✉️</span> info@akuldravin.com
          </span>
          <span className="flex items-center gap-2">
            <span className="text-blue">🌐</span> www.akuldravin.com
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue">📍</span> Gurugram, Haryana, India
        </div>
      </div>
    </div>
  );
};
