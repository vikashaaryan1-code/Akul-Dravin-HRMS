import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Akul Dravin HRMS AI',
  description:
    'Akul Dravin Privacy Policy. Learn how we collect, use, protect, and process your data in compliance with GDPR, India DPDPA, and global privacy regulations.',
  alternates: { canonical: 'https://hrms.akuldravin.com/privacy' },
  robots: { index: true, follow: true },
};

const SECTIONS = [
  {
    id: 'data-collection',
    title: '1. Data We Collect',
    content: `We collect information necessary to provide our HRMS services:

**Account Information:** Company name, administrator email, billing details, and authentication credentials.

**Employee Data (Processed on behalf of your organization):** Names, contact details, employment records, attendance data, payroll information, performance records, and documents uploaded by your HR team.

**Usage Data:** Log files, session data, feature usage metrics, and error reports to improve platform performance.

**Technical Data:** IP addresses, browser type, device identifiers, and cookies necessary for platform security and functionality.`,
  },
  {
    id: 'data-use',
    title: '2. How We Use Your Data',
    content: `We use collected data exclusively to:

• **Provide Services:** Operate, maintain, and improve the HRMS platform.
• **Security:** Detect, prevent, and respond to fraud, abuse, and security threats.
• **Compliance:** Meet legal obligations under applicable laws.
• **Support:** Respond to support requests and technical issues.
• **Analytics:** Generate anonymized, aggregate insights to improve platform features.

We do not sell, rent, or trade your personal data to third parties.`,
  },
  {
    id: 'data-protection',
    title: '3. Data Protection & Security',
    content: `We implement enterprise-grade security measures:

• **Encryption:** All data encrypted in transit (TLS 1.3) and at rest (AES-256).
• **Access Controls:** Role-based access with principle of least privilege.
• **Audit Trails:** Immutable logs of all data access and modifications.
• **Infrastructure:** Hosted on SOC 2 compliant cloud infrastructure.
• **Regular Security Audits:** OWASP Top 10 compliance checks and penetration testing.
• **GDPR Compliance:** Data Processing Agreements available for enterprise customers.
• **India DPDPA:** Compliant with India's Digital Personal Data Protection Act, 2023.`,
  },
  {
    id: 'data-retention',
    title: '4. Data Retention',
    content: `We retain data as follows:

• **Active Accounts:** For the duration of your subscription.
• **Post-Cancellation:** Data retained for 30 days, then permanently deleted (or exported on request).
• **Legal Requirements:** Some data may be retained longer to comply with applicable laws.
• **Backup Data:** Encrypted backups retained for 7 days, then purged.

You may request data deletion at any time via our DPO at privacy@akuldravin.com.`,
  },
  {
    id: 'your-rights',
    title: '5. Your Rights',
    content: `Under GDPR, India DPDPA, and applicable laws, you have the right to:

• **Access:** Request a copy of your personal data.
• **Rectification:** Correct inaccurate or incomplete data.
• **Erasure:** Request deletion of your data ("Right to be Forgotten").
• **Portability:** Export your data in machine-readable format.
• **Objection:** Object to specific processing activities.
• **Restriction:** Request limitation of data processing.

To exercise these rights, contact our Data Protection Officer at: **privacy@akuldravin.com**`,
  },
  {
    id: 'cookies',
    title: '6. Cookies & Tracking',
    content: `We use cookies for:

• **Essential Cookies:** Session management and security (cannot be disabled).
• **Analytics Cookies:** Anonymized usage metrics (optional, can be declined).
• **No Third-Party Advertising:** We do not use advertising tracking cookies.

Manage cookie preferences in your account Settings → Privacy.`,
  },
  {
    id: 'third-parties',
    title: '7. Third-Party Services',
    content: `We use carefully vetted sub-processors:

• **Cloud Infrastructure:** SOC 2 certified providers
• **Email Delivery:** For transactional system notifications only
• **Payment Processing:** PCI-DSS compliant payment processors
• **Error Monitoring:** Anonymized error tracking

A full list of sub-processors is available to enterprise customers upon request.`,
  },
  {
    id: 'contact',
    title: '8. Contact & DPO',
    content: `**Data Protection Officer**
Akul Dravin Technologies Pvt Ltd
Email: privacy@akuldravin.com
Response Time: Within 72 hours

**Registered Address:**
Akul Dravin Technologies Pvt Ltd
India

For grievances under India's DPDPA, contact our Grievance Officer at the same email.`,
  },
];

export default function PrivacyPage() {
  return (
    <main role="main" className="min-h-screen bg-[#0A1E3A]">
      {/* Header */}
      <section className="relative py-20 overflow-hidden border-b border-white/5">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-[#1E68E5]/8 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1E68E5]/30 bg-[#1E68E5]/10 px-4 py-2 mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1E68E5]">
              Legal
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
          <p className="mt-4 text-slate-400">
            Last updated:{' '}
            <time dateTime="2025-01-01">January 1, 2025</time>
          </p>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto leading-relaxed">
            We are committed to protecting your privacy and handling your data with transparency,
            security, and respect. This policy explains everything.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Quick Nav */}
        <nav
          aria-label="Privacy policy sections"
          className="mb-12 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-6"
        >
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Table of Contents
          </p>
          <ul className="space-y-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-[#00E5AB] hover:text-white transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`heading-${section.id}`}
              className="scroll-mt-8"
            >
              <h2
                id={`heading-${section.id}`}
                className="text-xl font-black text-white mb-4 pb-3 border-b border-white/8"
              >
                {section.title}
              </h2>
              <div className="prose-custom">
                {section.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-bold text-white mt-4 mb-2 first:mt-0">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('• ')) {
                    return (
                      <p key={i} className="text-slate-400 text-sm leading-relaxed pl-4">
                        {line}
                      </p>
                    );
                  }
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return (
                    <p key={i} className="text-slate-400 text-sm leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Contact Box */}
        <div className="mt-16 rounded-2xl border border-[#00E5AB]/20 bg-[#00E5AB]/5 p-8 text-center">
          <p className="text-white font-bold text-lg">Have a privacy question?</p>
          <p className="mt-2 text-slate-400 text-sm">
            Contact our Data Protection Officer for any privacy-related requests or concerns.
          </p>
          <a
            href="mailto:privacy@akuldravin.com"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00E5AB]/10 border border-[#00E5AB]/30 px-6 py-3 text-sm font-bold text-[#00E5AB] hover:bg-[#00E5AB]/20 transition-colors"
          >
            privacy@akuldravin.com
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          See also:{' '}
          <Link href="/terms" className="text-[#00E5AB] hover:text-white transition-colors">
            Terms of Service
          </Link>{' '}
          ·{' '}
          <Link href="/" className="text-[#00E5AB] hover:text-white transition-colors">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
