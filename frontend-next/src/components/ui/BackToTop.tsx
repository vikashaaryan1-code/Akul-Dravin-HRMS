'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BackToTop() {
 const [visible, setVisible] = useState(false);

 useEffect(() => {
 const handleScroll = () => {
 setVisible(window.scrollY > 300);
 };
 
 window.addEventListener('scroll', handleScroll, { passive: true });
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 const scrollToTop = () => {
 window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 return (
 <button
 onClick={scrollToTop}
 className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:bg-blue-700 hover:scale-110 active:scale-95 ${
 visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'
 }`}
 aria-label="Back to top"
 >
 <ArrowUp size={20} strokeWidth={2.5} />
 </button>
 );
}
