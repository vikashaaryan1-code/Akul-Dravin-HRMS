'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';

type Props = { hero: PublicLandingPayload['hero'] };

const FEATURE_CARDS = [
  {
    icon: '🧠',
    title: 'AI-Powered Insights',
    description: 'Smart analytics for better decisions.',
  },
  {
    icon: '👤',
    title: 'Employee Lifecycle',
    description: 'Manage every stage efficiently.',
  },
  {
    icon: '⚙️',
    title: 'Automated Workflows',
    description: 'Save time. Reduce manual tasks.',
  },
  {
    icon: '🛡️',
    title: 'Secure & Scalable',
    description: 'Enterprise-grade security & scalability.',
  },
];

const TRUSTED_LOGOS = [
  'TechNova',
  'InnoTrace',
  'Brighta',
  'VoltEdge',
  'Nexora',
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col pt-32 pb-16 overflow-hidden bg-[#0A1E3A] font-display text-white"
    >
      {/* Abstract Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-blue rounded-full mix-blend-screen filter blur-[120px] opacity-20" />
        <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-aqua rounded-full mix-blend-screen filter blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-[10%] w-[500px] h-[500px] bg-[#0A1E3A]-light rounded-full mix-blend-screen filter blur-[100px] opacity-50" />
        
        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 flex-grow flex flex-col justify-between w-full gap-16">
        
        {/* Top Split Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center flex-grow pt-10">
          
          {/* Left: Typography & CTAs */}
          <div className="flex flex-col items-start text-left max-w-2xl gap-8">
            <motion.h1
              custom={0} variants={fadeUp} initial="hidden" animate="show"
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-tight leading-[1.1]"
            >
              The World's Most <br/>
              Powerful & Advanced <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue to-aqua">
                HRMS AI
              </span>
            </motion.h1>

            <motion.p
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="text-lg text-slate-300 max-w-lg leading-relaxed font-medium"
            >
              AI-Powered HR Management System for Smarter Decisions, Happier Teams & Stronger Organizations.
            </motion.p>

            <motion.div
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-gradient-to-r from-blue to-aqua text-white text-sm font-semibold shadow-[0_0_20px_rgba(30,104,229,0.3)] hover:shadow-[0_0_30px_rgba(0,229,171,0.4)] transition-all hover:-translate-y-1"
              >
                Request Demo
              </Link>
              <button
                className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-md border border-white/20 bg-white/5 hover:bg-white/5/10 text-white text-sm font-semibold transition-all backdrop-blur-md"
              >
                Explore Features
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-white">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </span>
              </button>
            </motion.div>
          </div>

          {/* Right: Giant 3D Logo on Pedestal */}
          <motion.div 
             custom={3} variants={fadeUp} initial="hidden" animate="show"
             className="relative flex justify-center lg:justify-end h-full min-h-[400px] items-center perspective-1000"
          >
             {/* Glowing Pedestal Base */}
             <div className="absolute bottom-0 w-[400px] h-[100px] rounded-[100%] border border-blue/30 bg-gradient-to-t from-blue/10 to-transparent shadow-[0_0_50px_rgba(30,104,229,0.3)] transform rotateX-60"></div>
             <div className="absolute bottom-4 w-[300px] h-[80px] rounded-[100%] border border-aqua/40 shadow-[0_0_40px_rgba(0,229,171,0.3)] transform rotateX-60"></div>
             
             {/* Giant SVG Logo */}
             <div className="relative w-[400px] h-[400px] -mt-16 transform transition-transform hover:scale-105 duration-700">
               <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl preserve-3d">
                 <defs>
                   <linearGradient id="glassBlueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#1E68E5" stopOpacity="0.9" />
                     <stop offset="50%" stopColor="#00E5AB" stopOpacity="0.8" />
                     <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                   </linearGradient>

                   <linearGradient id="deepGlassGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#0A1E3A" stopOpacity="0.85" />
                     <stop offset="100%" stopColor="#1E68E5" stopOpacity="0.75" />
                   </linearGradient>

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

                   <filter id="crystalGlass" x="-20%" y="-20%" width="140%" height="140%">
                     <feDropShadow dx="2" dy="6" stdDeviation="4" floodOpacity="0.3" floodColor="#000000" />
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

                 <path d="M48 20 L48 80 Q75 80 85 65 Q95 50 85 35 Q75 20 48 20 Z" fill="url(#deepGlassGrad)" filter="url(#crystalGlass)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                 
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

                 <path d="M48 20 L25 80 L38 80 L44 65 L54 65 L54 80 L65 80 L48 20 Z" fill="url(#glassBlueGrad)" filter="url(#crystalGlass)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                 
                 <g fill="url(#tealGrad)" transform="translate(18, 65) scale(0.6)">
                   <circle cx="25" cy="10" r="6" />
                   <path d="M15 25 Q25 15 35 25 L35 30 L15 30 Z" />
                   <circle cx="12" cy="15" r="4.5" opacity="0.8" />
                   <path d="M5 28 Q12 20 18 28 L18 30 L5 30 Z" opacity="0.8" />
                   <circle cx="38" cy="15" r="4.5" opacity="0.8" />
                   <path d="M32 28 Q38 20 45 28 L45 30 L32 30 Z" opacity="0.8" />
                 </g>

                 <path d="M20 55 Q40 55 60 40 L85 15 L85 30 L90 30 L90 10 L70 10 L70 15 L80 15 L55 45 Q35 62 20 62 Z" fill="url(#premiumGoldGrad)" filter="url(#goldGlow)" />
                 
                 <path d="M85 15 L78 22" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
               </svg>
             </div>
          </motion.div>
        </div>

        {/* Bottom Feature Cards */}
        <motion.div 
          custom={4} variants={fadeUp} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
        >
          {FEATURE_CARDS.map((card, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/5/10 hover:border-white/20 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-[#0A1E3A]-light rounded-xl flex items-center justify-center text-2xl mb-4 border border-white/5 group-hover:border-aqua/50 group-hover:shadow-[0_0_15px_rgba(0,229,171,0.2)] transition-all">
                {card.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">{card.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Trusted By Strip */}
        <motion.div 
          custom={5} variants={fadeUp} initial="hidden" animate="show"
          className="w-full flex flex-col items-center gap-6 mt-4 opacity-70"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Trusted by Forward-Thinking Organizations
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {TRUSTED_LOGOS.map((logo, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-400 font-bold text-lg grayscale hover:grayscale-0 hover:text-white transition-all cursor-pointer">
                {/* Abstract logo mark */}
                <div className="w-6 h-6 border-2 border-current rounded-sm rotate-45 flex items-center justify-center">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                </div>
                {logo}
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
