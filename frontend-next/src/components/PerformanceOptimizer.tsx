'use client';

import { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Preconnect to API
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200';
    document.head.appendChild(link);

    // Prefetch critical resources
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Lazy load non-critical resources
      });
    }
  }, []);

  return null;
}
