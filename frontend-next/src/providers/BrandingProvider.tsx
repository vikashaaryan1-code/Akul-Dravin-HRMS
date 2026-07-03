'use client';

import React, { useEffect, useState } from 'react';

interface WhiteLabelConfig {
 brandName?: string;
 primaryColor?: string;
 secondaryColor?: string;
 accentColor?: string;
 logoUrl?: string;
 faviconUrl?: string;
 sidebarBg?: string;
 customCss?: string;
 fontFamily?: string;
}

export const BrandingProvider = ({
 domain,
 children,
}: {
 domain: string;
 children: React.ReactNode;
}) => {
 const [config, setConfig] = useState<WhiteLabelConfig | null>(null);

 useEffect(() => {
 /* Fetch branding config from public endpoint */ const fetchBranding = async () => {
 try {
 const res = await fetch(`http://localhost:4000/admin/white-label/public/${domain}`);
 if (res.ok) {
 const data = await res.json();
 if (data.config) {
 setConfig(data.config);
 applyBranding(data.config);
 }
 }
 } catch (err) {
 console.error('Failed to fetch white label config:', err);
 }
 };
 
 // In a real production setup, the API URL would use an env variable like process.env.NEXT_PUBLIC_API_URL
 fetchBranding();
 }, [domain]);

 const applyBranding = (c: WhiteLabelConfig) => {
 const root = document.documentElement;
 if (c.primaryColor) root.style.setProperty('--primary', c.primaryColor);
 if (c.secondaryColor) root.style.setProperty('--secondary', c.secondaryColor);
 if (c.accentColor) root.style.setProperty('--accent', c.accentColor);
 if (c.sidebarBg) root.style.setProperty('--sidebar-bg', c.sidebarBg);
 if (c.fontFamily) root.style.setProperty('--font-inter', c.fontFamily); // Overriding base font variable as an example

 if (c.faviconUrl) {
 const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
 link.type = 'image/x-icon';
 link.rel = 'shortcut icon';
 link.href = c.faviconUrl;
 document.getElementsByTagName('head')[0].appendChild(link);
 }
 
 if (c.customCss) {
 const style = document.createElement('style');
 style.innerHTML = c.customCss;
 document.head.appendChild(style);
 }
 };

 return <>{children}</>;
};
