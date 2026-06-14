'use client';

import { useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { TwoFactorSetupView } from '@/components/modules/TwoFactorSetupView';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { canPerformAction } from '@/utils/action-permissions';
import { toRoleLabel } from '@/utils/platform-config';
import {
  User, Shield, Bell, Plug, CreditCard, Camera, Save,
  Mail, MessageSquare, Smartphone, Sun, Moon,
  LogOut, ChevronRight, CheckCircle2,
  Zap, RefreshCw
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security & 2FA', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing', icon: CreditCard },
] as const;

type TabId = typeof TABS[number]['id'];

// --- Profile Tab ---
function ProfileTab({ user }: { user: any }) {
  const [form, setForm] = useState({
    fullName: user?.fullName ?? 'Akul Dravin',
    email: user?.email ?? 'admin@akuldravin.com',
    phone: '+91 98765 43210',
    bio: 'Platform Administrator — managing enterprise HRMS operations.',
    avatarUrl: user?.avatarUrl ?? '',
    timezone: 'Asia/Calcutta',
    language: 'en-IN',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <GlassCard>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt={form.fullName} className="h-full w-full object-cover" />
              ) : (
                form.fullName.charAt(0).toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{form.fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{form.email}</p>
            <div className="mt-3 flex gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                <Camera className="h-3.5 w-3.5" /> Upload Photo
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm(prev => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
                }} />
              </label>
              <button onClick={() => setForm(prev => ({...prev, avatarUrl: ''}))} className="inline-flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Personal Info */}
      <GlassCard>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Personal Information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
            <input
              value={form.fullName}
              onChange={e => setForm(prev => ({...prev, fullName: e.target.value}))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({...prev, email: e.target.value}))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(prev => ({...prev, phone: e.target.value}))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(prev => ({...prev, timezone: e.target.value}))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
            >
              <option value="Asia/Calcutta">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={e => setForm(prev => ({...prev, bio: e.target.value}))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition resize-none"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Saved!</span>}
        </div>
      </GlassCard>
    </div>
  );
}

// --- Notifications Tab ---
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    email_alerts: true,
    email_digest: true,
    sms_alerts: false,
    push_payroll: true,
    push_leave: true,
    push_hr: true,
    push_system: false,
    push_compliance: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const categories = [
    {
      title: 'Email Notifications',
      icon: Mail,
      items: [
        { key: 'email_alerts' as const, label: 'Critical Alerts', description: 'Immediate email for system issues and compliance flags' },
        { key: 'email_digest' as const, label: 'Daily Digest', description: 'Summary of daily activities and pending approvals' },
      ]
    },
    {
      title: 'SMS Notifications',
      icon: Smartphone,
      items: [
        { key: 'sms_alerts' as const, label: 'Urgent Alerts', description: 'SMS for payroll failures or critical actions' },
      ]
    },
    {
      title: 'In-App Push Notifications',
      icon: Bell,
      items: [
        { key: 'push_payroll' as const, label: 'Payroll Events', description: 'Salary processed, payslips ready' },
        { key: 'push_leave' as const, label: 'Leave Requests', description: 'New requests and approval updates' },
        { key: 'push_hr' as const, label: 'HR Actions', description: 'New hires, terminations, org changes' },
        { key: 'push_compliance' as const, label: 'Compliance Alerts', description: 'Regulatory and compliance reminders' },
        { key: 'push_system' as const, label: 'System Updates', description: 'Platform maintenance and feature releases' },
      ]
    }
  ];

  return (
    <div className="space-y-5">
      {categories.map(cat => {
        const Icon = cat.icon;
        return (
          <GlassCard key={cat.title}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cat.title}</p>
            </div>
            <div className="space-y-3">
              {cat.items.map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              ))}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// --- Integrations Tab ---
function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    google: true,
    slack: false,
    whatsapp: false,
    zoom: true,
    jira: false,
    zapier: false,
  });

  const integrations = [
    { id: 'google', name: 'Google Workspace', desc: 'Calendar, Drive, and Meet sync', icon: '🟦', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'slack', name: 'Slack', desc: 'Team notifications and alerts', icon: '🟪', color: 'bg-violet-50 dark:bg-violet-900/20' },
    { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Employee messaging and alerts', icon: '🟩', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'zoom', name: 'Zoom', desc: 'Video interview integration', icon: '🟦', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'jira', name: 'Jira', desc: 'Project and task tracking sync', icon: '🟧', color: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'zapier', name: 'Zapier', desc: 'Workflow automation triggers', icon: '🟠', color: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <GlassCard>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Connected Integrations</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {integrations.map(integration => (
          <div key={integration.id} className={`p-4 rounded-xl border ${connected[integration.id] ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'} transition`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${integration.color} flex items-center justify-center text-lg`}>
                  {integration.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{integration.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{integration.desc}</p>
                </div>
              </div>
              {connected[integration.id] && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />}
            </div>
            <button
              onClick={() => setConnected(prev => ({...prev, [integration.id]: !prev[integration.id]}))}
              className={`mt-3 w-full rounded-lg py-1.5 text-xs font-semibold transition ${connected[integration.id] ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {connected[integration.id] ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// --- Billing Tab ---
function BillingTab({ accessToken }: { accessToken: string | null }) {
  const plans = [
    { name: 'Starter', price: '₹999', seats: '10', modules: '5', active: false },
    { name: 'Growth', price: '₹4,999', seats: '50', modules: '15', active: true },
    { name: 'Enterprise', price: 'Custom', seats: 'Unlimited', modules: 'All', active: false },
  ];

  return (
    <div className="space-y-5">
      <GlassCard>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Current Plan</p>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border border-blue-200 dark:border-blue-800">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Growth Plan</p>
            <p className="text-xs text-slate-500 mt-0.5">Renews on June 1, 2026 · ₹4,999/month</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-[67%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
              </div>
              <span className="text-xs text-slate-500">33 / 50 seats</span>
            </div>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition">
            Upgrade
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Available Plans</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map(plan => (
            <div key={plan.name} className={`p-4 rounded-xl border transition ${plan.active ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{plan.name}</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{plan.price}<span className="text-xs font-normal text-slate-500">/mo</span></p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <li>👥 {plan.seats} seats</li>
                <li>🧩 {plan.modules} modules</li>
              </ul>
              {plan.active ? (
                <div className="mt-3 text-center text-xs font-semibold text-blue-600 dark:text-blue-400">Current Plan</div>
              ) : (
                <button className="mt-3 w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  Switch Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Recent Invoices</p>
        <div className="space-y-2">
          {[
            { month: 'May 2026', amount: '₹4,999', status: 'Paid' },
            { month: 'Apr 2026', amount: '₹4,999', status: 'Paid' },
            { month: 'Mar 2026', amount: '₹4,999', status: 'Paid' },
          ].map(inv => (
            <div key={inv.month} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{inv.month}</p>
                <p className="text-xs text-slate-500">{inv.amount}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-semibold">{inv.status}</span>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Download</button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// --- Main Settings Component ---
export function SettingsModuleView() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const activeRole = useUIStore((state) => state.activeRole);
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const canUpdatePreferences = canPerformAction(activeRole, 'settings.update-preferences');

  return (
    <div className="space-y-5">
      <PageTitle
        title="Settings"
        description="Manage your account profile, security settings, notification preferences, and integrations."
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-0 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <TwoFactorSetupView />
          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Appearance</p>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Theme Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">Currently: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
              </div>
              <button
                onClick={toggleTheme}
                disabled={!canUpdatePreferences}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Switch to {theme === 'light' ? 'Dark' : 'Light'}
              </button>
            </div>
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Session Management</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-900/10">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Current Session</p>
                    <p className="text-xs text-slate-500">Chrome on Windows · Active now</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
              </div>
              <p className="text-xs text-slate-500">Connected as: {user?.email ?? 'demo@akuldravin.com'}</p>
              <button
                onClick={clearSession}
                className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
              >
                <LogOut className="h-4 w-4" /> Sign Out All Devices
              </button>
            </div>
          </GlassCard>
        </div>
      )}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'integrations' && <IntegrationsTab />}
      {activeTab === 'billing' && <BillingTab accessToken={accessToken} />}
    </div>
  );
}
