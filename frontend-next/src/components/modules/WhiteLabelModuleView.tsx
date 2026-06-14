'use client';

import { useState } from 'react';
import { Palette, Globe, Mail, Image, Sliders, Save, RefreshCw, Eye } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { FieldGroup, ModalInput, ModalSelect, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';

type WhiteLabelConfig = {
  brandName: string; primaryColor: string; secondaryColor: string; accentColor: string;
  customDomain: string; fromEmail: string; fromName: string; loginTagline: string;
  smtpHost: string; smtpPort: string; smtpUser: string; smtpPassword: string;
};

const FEATURE_TOGGLES = [
  { key: 'ai_hub', label: 'AI Hub', description: 'Enable AI assistant for this tenant' },
  { key: 'recruiter_marketplace', label: 'Recruiter Marketplace', description: 'Enable external recruiter access' },
  { key: 'white_label_login', label: 'White-label Login', description: 'Show custom branding on login page' },
  { key: 'custom_emails', label: 'Custom Email Branding', description: 'Send emails from tenant domain' },
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Enable BI-level analytics dashboards' },
  { key: 'api_access', label: 'API Access', description: 'Allow tenant to use REST APIs' },
];

export function WhiteLabelModuleView() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    brandName: 'Akul Dravin HRMS', primaryColor: '#3b82f6', secondaryColor: '#8b5cf6', accentColor: '#22d3ee',
    customDomain: '', fromEmail: '', fromName: 'Akul Dravin Platform', loginTagline: 'Enterprise HR for growing teams',
    smtpHost: '', smtpPort: '587', smtpUser: '', smtpPassword: '',
  });
  const [toggles, setToggles] = useState<Record<string, boolean>>({ ai_hub: true, white_label_login: true, advanced_analytics: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'email' | 'features' | 'domain'>('branding');

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const TABS = [
    { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" /> },
    { id: 'domain', label: 'Domain', icon: <Globe className="h-4 w-4" /> },
    { id: 'email', label: 'Email / SMTP', icon: <Mail className="h-4 w-4" /> },
    { id: 'features', label: 'Features', icon: <Sliders className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex items-start justify-between">
        <PageTitle title="White-label Config" description="Customize branding, domain, email delivery and feature access per tenant." />
        <div className="flex gap-2">
          <SecondaryButton className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Preview</SecondaryButton>
          <PrimaryButton loading={saving} onClick={handleSave} className={saved ? '!bg-emerald-600' : ''}>
            {saved ? <><RefreshCw className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
          </PrimaryButton>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Brand Identity</p>
            <div className="space-y-4">
              <FieldGroup label="Brand Name"><ModalInput value={config.brandName} onChange={e => setConfig({...config, brandName: e.target.value})} /></FieldGroup>
              <FieldGroup label="Login Page Tagline"><ModalInput value={config.loginTagline} onChange={e => setConfig({...config, loginTagline: e.target.value})} /></FieldGroup>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Primary Color', key: 'primaryColor' as const },
                  { label: 'Secondary Color', key: 'secondaryColor' as const },
                  { label: 'Accent Color', key: 'accentColor' as const },
                ].map(({ label, key }) => (
                  <FieldGroup key={key} label={label}>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config[key]} onChange={e => setConfig({...config, [key]: e.target.value})}
                        className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" />
                      <ModalInput value={config[key]} onChange={e => setConfig({...config, [key]: e.target.value})} className="font-mono text-xs" />
                    </div>
                  </FieldGroup>
                ))}
              </div>
              <FieldGroup label="Logo URL"><ModalInput placeholder="https://cdn.company.com/logo.png" /></FieldGroup>
              <FieldGroup label="Favicon URL"><ModalInput placeholder="https://cdn.company.com/favicon.ico" /></FieldGroup>
            </div>
          </GlassCard>

          {/* Live preview */}
          <GlassCard>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Live Preview</p>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              {/* Sidebar preview */}
              <div className="flex h-36">
                <div className="w-10 flex flex-col items-center py-2 gap-1.5" style={{ backgroundColor: config.primaryColor }}>
                  {[...Array(5)].map((_,i) => <div key={i} className="h-2 w-6 rounded-sm bg-white/30" />)}
                </div>
                <div className="flex-1 bg-white dark:bg-slate-900 p-3">
                  <div className="h-4 rounded-md mb-2" style={{ backgroundColor: config.primaryColor, width: '60%' }} />
                  <div className="space-y-1.5">
                    {[...Array(4)].map((_,i) => <div key={i} className="h-2.5 rounded bg-slate-100 dark:bg-slate-800" style={{width:`${70-i*10}%`}} />)}
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 text-center text-xs font-semibold" style={{ backgroundColor: config.secondaryColor, color: 'white' }}>
                {config.brandName}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400 text-center italic">"{config.loginTagline}"</p>
          </GlassCard>
        </div>
      )}

      {/* Domain Tab */}
      {activeTab === 'domain' && (
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Custom Domain Configuration</p>
          <div className="space-y-4 max-w-md">
            <FieldGroup label="Custom Domain" error={config.customDomain && !config.customDomain.includes('.') ? 'Enter a valid domain' : undefined}>
              <ModalInput placeholder="hrms.yourcompany.com" value={config.customDomain} onChange={e => setConfig({...config, customDomain: e.target.value})} />
            </FieldGroup>
            {config.customDomain && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-2">DNS Configuration Required:</p>
                <p className="font-mono">CNAME {config.customDomain} → platform.akulhrmssaas.com</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Email / SMTP Configuration</p>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <FieldGroup label="From Name"><ModalInput value={config.fromName} onChange={e => setConfig({...config, fromName: e.target.value})} /></FieldGroup>
            <FieldGroup label="From Email"><ModalInput type="email" placeholder="noreply@company.com" value={config.fromEmail} onChange={e => setConfig({...config, fromEmail: e.target.value})} /></FieldGroup>
            <FieldGroup label="SMTP Host"><ModalInput placeholder="smtp.gmail.com" value={config.smtpHost} onChange={e => setConfig({...config, smtpHost: e.target.value})} /></FieldGroup>
            <FieldGroup label="SMTP Port"><ModalInput placeholder="587" value={config.smtpPort} onChange={e => setConfig({...config, smtpPort: e.target.value})} /></FieldGroup>
            <FieldGroup label="SMTP Username"><ModalInput placeholder="user@company.com" value={config.smtpUser} onChange={e => setConfig({...config, smtpUser: e.target.value})} /></FieldGroup>
            <FieldGroup label="SMTP Password"><ModalInput type="password" placeholder="••••••••" value={config.smtpPassword} onChange={e => setConfig({...config, smtpPassword: e.target.value})} /></FieldGroup>
          </div>
        </GlassCard>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Feature Toggles</p>
          <div className="space-y-3">
            {FEATURE_TOGGLES.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{feature.label}</p>
                  <p className="text-xs text-slate-500">{feature.description}</p>
                </div>
                <button
                  onClick={() => setToggles(prev => ({ ...prev, [feature.key]: !prev[feature.key] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${toggles[feature.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${toggles[feature.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
