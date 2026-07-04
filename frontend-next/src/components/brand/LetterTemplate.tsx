import React from 'react';
import { AkulDravinLogo } from './AkulDravinLogo';

export const LetterTemplate = () => {
  return (
    <div className="flex justify-center p-12 bg-transparent font-display perspective-1500">
      <div className="w-[800px] min-h-[1000px] rounded-xl relative overflow-hidden transform-style-3d hover:scale-[1.01] transition-transform duration-700 shadow-[0_32px_128px_rgba(0,0,0,0.8)]">
        
        {/* Dark Navy Glass Base for Digital Letter */}
        <div className="absolute inset-0 bg-[#051124] rounded-xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden pointer-events-none">
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-32 top-1/4 w-96 h-96 bg-blue rounded-full filter blur-[120px] opacity-10 mix-blend-screen pointer-events-none"></div>
          <div className="absolute -left-32 bottom-1/4 w-96 h-96 bg-aqua rounded-full filter blur-[120px] opacity-10 mix-blend-screen pointer-events-none"></div>
          {/* Crystal Noise */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-screen pointer-events-none"></div>
        </div>

        {/* Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col p-16">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-white/10 pb-8 mb-12">
            <div className="flex items-center gap-4">
              <AkulDravinLogo showText={false} width={56} height={56} />
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold tracking-widest text-white leading-none mb-1">
                  AKUL DRAVIN
                </h1>
                <p className="text-xs font-bold tracking-[0.25em] text-aqua uppercase">
                  HRMS AI
                </p>
                <p className="text-[0.6rem] text-slate-400 mt-1.5 uppercase tracking-wider font-semibold">World's Most Advanced Enterprise Platform</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded backdrop-blur-md">
                <span className="text-xs text-slate-300 font-mono tracking-wider">REF: AD-HR-2026-042</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-3 tracking-wider uppercase">
                May 27, 2026
              </div>
            </div>
          </div>

          {/* Letter Body */}
          <div className="text-sm leading-relaxed space-y-8 flex-1 text-slate-300">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">To,</p>
              <p className="font-bold text-white text-base">Mr. Rajesh Kumar</p>
              <p className="font-medium text-slate-400">Chief Human Resources Officer</p>
              <p className="font-medium text-slate-400">TechNova Solutions Pvt. Ltd.</p>
              <p className="font-medium text-slate-400">Gurugram, Haryana, India</p>
            </div>

            <div className="p-4 bg-white/5 border-l-2 border-aqua rounded-r-lg backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <span className="text-xs uppercase tracking-widest text-aqua font-bold mr-3">Subject:</span>
              <span className="font-bold text-white tracking-wide">Transforming Enterprise HR with AI-Powered Intelligence</span>
            </div>

            <div className="space-y-6 text-slate-300 font-body text-base">
              <p>
                Dear Mr. Rajesh,
              </p>
              <p>
                At Akul Dravin HRMS AI, we are committed to redefining the way global enterprises manage their most valuable asset — their people. As organizations transition into the AI-first era, legacy HR platforms can no longer provide the predictive intelligence required to scale effectively.
              </p>
              <p>
                Our AI-powered platform brings deep automation, predictive analytics, and enterprise-grade security together, ensuring your workforce data is not only managed but actively leveraged to drive business growth and operational excellence.
              </p>
              <p>
                We have reviewed your requirements and are thrilled to partner with TechNova Solutions. The enclosed proposal details the deployment architecture, security compliance, and integration milestones.
              </p>
              <p>
                We look forward to embarking on this transformative journey with you.
              </p>
            </div>

            <div className="pt-16 pb-20">
              <p className="text-slate-400 italic mb-6">Sincerely,</p>
              
              <div className="w-48 border-b border-white/20 mb-3 relative flex justify-start">
                <span className="absolute bottom-1 w-full text-left font-serif italic text-3xl text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                  Amit Sharma
                </span>
              </div>
              <div className="mt-2">
                <p className="font-bold text-white text-base tracking-wide">Amit Sharma</p>
                <p className="text-aqua text-xs font-bold uppercase tracking-[0.15em] mt-1">Chief Executive Officer</p>
                <p className="text-slate-500 text-[0.65rem] font-bold uppercase tracking-widest mt-0.5">Akul Dravin HRMS AI</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center text-[0.65rem] text-slate-400 font-semibold tracking-wider">
            <div className="flex gap-8">
              <span className="flex items-center gap-2">
                <span className="text-aqua">📞</span> +91 98765 43210
              </span>
              <span className="flex items-center gap-2">
                <span className="text-aqua">✉️</span> info@akuldravin.com
              </span>
              <span className="flex items-center gap-2">
                <span className="text-aqua">🌐</span> www.akuldravin.com
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-aqua">📍</span> Gurugram, India
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
