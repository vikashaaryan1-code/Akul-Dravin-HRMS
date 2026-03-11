'use client';

import { useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';

export default function WhiteLabelPage() {
  const [branding, setBranding] = useState({
    partnerName: '',
    subdomain: '',
    customDomain: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#1a73e8',
    secondaryColor: '#34a853',
    accentColor: '#fbbc04',
    companyName: '',
    supportEmail: '',
    supportPhone: '',
  });

  const handleSave = async () => {
    const response = await fetch('http://localhost:4200/api/v1/white-label/partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding),
    });
    const data = await response.json();
    alert('Partner created successfully!');
  };

  return (
    <div className="space-y-5 px-4 sm:px-0">
      <PageTitle title="White Label Configuration" description="Configure partner branding and settings" />

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Partner Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Partner Name"
            value={branding.partnerName}
            onChange={(e) => setBranding({ ...branding, partnerName: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            placeholder="Subdomain"
            value={branding.subdomain}
            onChange={(e) => setBranding({ ...branding, subdomain: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            placeholder="Custom Domain"
            value={branding.customDomain}
            onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            placeholder="Company Name"
            value={branding.companyName}
            onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Branding</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Logo URL"
            value={branding.logoUrl}
            onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
          <input
            type="text"
            placeholder="Favicon URL"
            value={branding.faviconUrl}
            onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
          <div>
            <label className="block text-sm mb-1">Primary Color</label>
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
              className="w-full h-10 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Secondary Color</label>
            <input
              type="color"
              value={branding.secondaryColor}
              onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
              className="w-full h-10 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Accent Color</label>
            <input
              type="color"
              value={branding.accentColor}
              onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
              className="w-full h-10 rounded"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Support Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Support Email"
            value={branding.supportEmail}
            onChange={(e) => setBranding({ ...branding, supportEmail: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
          <input
            type="tel"
            placeholder="Support Phone"
            value={branding.supportPhone}
            onChange={(e) => setBranding({ ...branding, supportPhone: e.target.value })}
            className="border rounded px-3 py-2 text-base"
          />
        </div>
      </GlassCard>

      <button
        onClick={handleSave}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 touch-manipulation"
      >
        Save Configuration
      </button>
    </div>
  );
}
