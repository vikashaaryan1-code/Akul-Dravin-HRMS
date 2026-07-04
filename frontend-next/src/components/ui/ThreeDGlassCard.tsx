'use client';

import React, { useRef, useState } from 'react';

interface ThreeDGlassCardProps {
 children: React.ReactNode;
 className?: string;
 intensity?: number;
}

export function ThreeDGlassCard({ children, className = '', intensity = 15 }: ThreeDGlassCardProps) {
 const cardRef = useRef<HTMLDivElement>(null);
 const [rotate, setRotate] = useState({ x: 0, y: 0 });

 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
 if (!cardRef.current) return;
 const rect = cardRef.current.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 const centerX = rect.width / 2;
 const centerY = rect.height / 2;
 
 const rotateX = ((y - centerY) / centerY) * -intensity;
 const rotateY = ((x - centerX) / centerX) * intensity;
 
 setRotate({ x: rotateX, y: rotateY });
 };

 const handleMouseLeave = () => {
 setRotate({ x: 0, y: 0 });
 };

 return (
 <div 
 ref={cardRef}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 className={`relative transition-all duration-200 ease-out preserve-3d ${className}`}
 style={{
 transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
 }}
 >
  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#1E68E5]/20 to-transparent blur-md -z-10 group-hover:from-[#00E5AB]/30 group-hover:blur-lg transition-all duration-500" />
  <div className="h-full w-full glass-3d-panel overflow-hidden border border-white/5 relative bg-[#051124]/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
  {/* Shine effect */}
  <div 
  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"
  style={{
  background: `radial-gradient(circle at ${rotate.y * 5 + 50}% ${rotate.x * -5 + 50}%, rgba(255,255,255,0.2) 0%, transparent 60%)`
  }}
  />
  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-screen pointer-events-none"></div>
  <div className="relative z-10 h-full w-full">
    {children}
  </div>
  </div>
 </div>
 );
}
