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
 <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent blur-sm -z-10 group-hover:blur-md transition-all" />
 <div className="h-full w-full glass-3d-panel overflow-hidden">
 {/* Shine effect */}
 <div 
 className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
 style={{
 background: `radial-gradient(circle at ${rotate.y * 5 + 50}% ${rotate.x * -5 + 50}%, rgba(255,255,255,0.15) 0%, transparent 80%)`
 }}
 />
 {children}
 </div>
 </div>
 );
}
