import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Akul Dravin HRMS AI',
  description:
    'Akul Dravin Terms of Service. Understand your rights and responsibilities when using our enterprise HRMS AI platform.',
  alternates: { canonical: 'https://hrms.akuldravin.com/terms' },
  robots: { index: true, follow: true },
};

const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using the Akul Dravin HRMS AI platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

These Terms are effective as of the date you first use the Service. If you do not agree to these Terms, you must not use the Service.`,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: `Akul Dravin HRMS AI is a Software-as-a-Service (SaaS) platform providing:

• Human Resource Management System (HRMS) functionality
• AI-powered workforce analytics and predictions
• Payroll computation and compliance tools (Indian statutory compliance)
• Applicant Tracking System (ATS) and recruitment management
• Employee lifecycle management (onboarding to offboarding)
• Performance management and OKR tracking
• Multi-tenant enterprise infrastructure

The Service is provided "as-is" subject to the terms herein. Features may be updated, added, or removed with reasonable notice.`,
  },
  {
    id: 'accounts',
    title: '3. Account Registration & Security',
    content: `**Account Requirements:** You must provide accurate, complete registration information and maintain its accuracy throughout your subscription.

**Security Responsibilities:** You are responsible for:
• Maintaining the confidentiality of your credentials
• All activities that occur under your account
• Implementing appropriate access controls for your employees
• Promptly reporting any unauthorized access to security@akuldravin.com

**Account Suspension:** We reserve the right to suspend accounts for Terms violations, suspected security breaches, or non-payment.`,
  },
  {
    id: 'data-ownership',
    title: '4. Data Ownership & Processing',
    content: `**Your Data:** You retain full ownership of all employee data, company data, and content you input into the Service.

**Our Role:** We are a "data processor" — we process your data only as instructed by you and as described in our Privacy Policy and Data Processing Agreement.

**Data Processing Agreement (DPA):** Enterprise customers may request a formal DPA. Contact legal@akuldravin.com.

**No AI Training:** Your organizational data is never used to train our AI models without explicit written consent.`,
  },
  {
    id: 'subscriptions',
    title: '5. Subscriptions & Billing',
    content: `**Billing Cycle:** Subscriptions are billed monthly or annually in advance.

**Upgrades/Downgrades:** Plan changes take effect at the next billing cycle.

**Cancellation:** You may cancel at any time. Service continues until the end of the paid period.

**Refunds:** Refunds are not provided for partial months. Annual plans may receive prorated refunds at our discretion within 30 days.

**Price Changes:** We provide 30 days notice for price increases. Existing subscribers are protected for the remainder of their current billing period.`,
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use Policy',
    content: `You agree NOT to:

• Violate any applicable laws or regulations
• Upload malware, viruses, or malicious code
• Attempt to gain unauthorized access to our systems or other users' data
• Use the Service to store or transmit illegal content
• Reverse engineer or attempt to extract our source code
• Use automated tools to scrape data beyond authorized API limits
• Impersonate other users or organizations
• Use the AI features to generate discriminatory hiring decisions

Violation of this policy may result in immediate account suspension.`,
  },
  {
    id: 'ip',
    title: '7. Intellectual Property',
    content: `**Our IP:** The Service, including all software, designs, and documentation, is protected by copyright, trademark, and other laws. We grant you a limited, non-exclusive license to use the Service during your subscription.

**Your IP:** You retain all intellectual property rights in your data and content.

**Feedback:** Any suggestions or feedback you provide may be incorporated into our Service without compensation.`,
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• The Service is provided "AS IS" without warranty of any kind
• We are not liable for indirect, incidental, or consequential damages
• Our total liability shall not exceed the amounts paid by you in the 12 months preceding the claim
• We are not responsible for third-party services or integrations

PAYROLL COMPLIANCE DISCLAIMER: While our payroll engine is designed for Indian statutory compliance (PF, ESIC, TDS), you are solely responsible for verifying regulatory compliance. Consult a qualified CA/accountant for official filings.`,
  },
  {
    id: 'termination',
    title: '9. Termination',
    content: `Either party may terminate this agreement with 30 days written notice.

We may terminate immediately for:
• Material breach of these Terms
• Non-payment for more than 14 days after due date
• Illegal activity or security threats

Upon termination, you have 30 days to export your data. After this period, data is permanently deleted per our Privacy Policy.`,
  },
  {
    id: 'governing-law',
    title: '10. Governing Law & Disputes',
    content: `These Terms are governed by the laws of India, without regard to conflict of law principles.

Any disputes shall be resolved by:
1. Good-faith negotiation (30 days)
2. Mediation
3. Binding arbitration under the Arbitration and Conciliation Act, 1996

Jurisdiction: Courts of competent jurisdiction in India.`,
  },
];

export default function TermsPage() {
  return (
    <main role="main" className="min-h-screen bg-[#0A1E3A]">
      {/* Header */}
      <section className="relative py-20 overflow-hidden border-b border-white/5">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-[#FFD700]/5 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-4 py-2 mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFD700]">
              Legal
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Terms of Service</h1>
          <p className="mt-4 text-slate-400">
            Last updated:{' '}
            <time dateTime="2025-01-01">January 1, 2025</time>
          </p>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before using the Akul Dravin HRMS AI platform.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Quick Nav */}
        <nav
          aria-label="Terms of service sections"
          className="mb-12 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-6"
        >
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Table of Contents
          </p>
          <ul className="space-y-2">
            {TERMS_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-[#FFD700] hover:text-white transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          {TERMS_SECTIONS.map((section) => (
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
              <div>
                {section.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-bold text-white mt-4 mb-2 first:mt-0 text-sm">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('• ') || (line.match(/^\d+\./))) {
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

        {/* Contact */}
        <div className="mt-16 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-8 text-center">
          <p className="text-white font-bold text-lg">Questions about these Terms?</p>
          <p className="mt-2 text-slate-400 text-sm">
            Our legal team is available to clarify any aspect of these Terms.
          </p>
          <a
            href="mailto:legal@akuldravin.com"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 px-6 py-3 text-sm font-bold text-[#FFD700] hover:bg-[#FFD700]/20 transition-colors"
          >
            legal@akuldravin.com
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          See also:{' '}
          <Link href="/privacy" className="text-[#FFD700] hover:text-white transition-colors">
            Privacy Policy
          </Link>{' '}
          ·{' '}
          <Link href="/" className="text-[#FFD700] hover:text-white transition-colors">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
