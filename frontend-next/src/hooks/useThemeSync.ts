'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';

export const useThemeSync = () => {
 const theme = useUIStore((state) => state.theme);

 useEffect(() => {
 const root = document.documentElement;
 root.classList.remove('light', 'dark');
 root.classList.add(theme);
 }, [theme]);
};
