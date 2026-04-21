'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Cpu,
  FileStack,
  LifeBuoy,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { PublicLandingPayload } from '@/lib/public-site';
import { LandingLeadHub } from './LandingLeadHub';

const serviceIcons: Record<string, LucideIcon> = {
  'people-ops': Users,
  revenue: CircleDollarSign,
  finance: FileStack,
  ops: LifeBuoy,
};

const moduleIcons: Record<string, LucideIcon> = {
  hrms: Users,
  crm: BriefcaseBusiness,
  finance: CircleDollarSign,
  marketplace: Building2,
  ai: Cpu,
};

const statusStyles: Record<string, string> = {
  ready: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  operational: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  guarded: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
};

type PremiumLandingPageProps = {
  data: PublicLandingPayload;
};

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber/80">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
    </div>
  );
}

export function PremiumLandingPage({ data }: PremiumLandingPageProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AKUL DRAVIN HRMS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: data.hero.description,
    offers: data.plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price === 'Custom' ? undefined : plan.price.replace(/[^\d.]/g, ''),
      priceCurrency: plan.price === 'Custom' ? undefined : 'USD',
    })),
  };

  const user = useAuthStore((state) => state.user);

  return (
    <main className="min-h-screen bg-[#04101f] text-white selection:bg-amber/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04101f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 lg:px-8">
          <Link href="#top" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ember via-amber to-aqua shadow-[0_10px_30px_rgba(242,170,59,0.2)]">
              <Rocket className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">AKUL DRAVIN</p>
              <p className="text-sm text-slate-400">Premium HRMS + Business OS</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {[
              ['Overview', '#overview'],
              ['A2Z', '/a2z'],
              ['Modules', '#modules'],
              ['Workflow', '#workflow'],
              ['Pricing', '#pricing'],
              ['FAQ', '#faq'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="text-sm text-slate-300 transition hover:text-white">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="hidden rounded-full border border-aqua/30 bg-aqua/10 px-4 py-2 text-sm font-bold text-aqua transition hover:bg-aqua/20 sm:inline-flex">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm text-slate-300 transition hover:text-white sm:inline-flex">
                Login
              </Link>
            )}
            <Link
              href="#contact"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#04101f] transition hover:scale-[1.02]"
            >
              Book demo
            </Link>
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden px-4 pb-20 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="absolute inset-0">
          <div className="absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full bg-amber/15 blur-3xl" />
          <div className="absolute right-[-4%] top-[10%] h-72 w-72 rounded-full bg-aqua/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[30%] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber/90">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {data.hero.badge}
            </div>

            <div className="space-y-5">
              <p className="max-w-2xl text-sm uppercase tracking-[0.22em] text-sky-100/75">{data.hero.announcement}</p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                {data.hero.title}
              </h1>
              <p className="max-w-2xl text-xl text-amber/90">{data.hero.subtitle}</p>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{data.hero.description}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href={data.hero.primaryCta.href}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(232,90,42,0.2)] transition hover:opacity-90"
              >
                {data.hero.primaryCta.label}
              </Link>
              <Link
                href={data.hero.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {data.hero.secondaryCta.label}
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {data.metrics.map((metric) => (
                <article key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <p className="text-3xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">{metric.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
              <div className="relative h-[280px] sm:h-[360px]">
                <Image
                  src="/images/landing/business-os.png"
                  alt="AKUL DRAVIN unified business platform"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04101f] via-[#04101f]/25 to-transparent" />
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Readiness</p>
                  <p className="mt-2 text-2xl font-semibold">{data.liveSignals.readinessPercent}%</p>
                  <p className="mt-2 text-sm text-slate-400">Paid-user scope aligned</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pipeline leads</p>
                  <p className="mt-2 text-2xl font-semibold">{data.liveSignals.pipelineLeads}</p>
                  <p className="mt-2 text-sm text-slate-400">Live CRM handoff ready</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Modules live</p>
                  <p className="mt-2 text-2xl font-semibold">{data.liveSignals.activeModules}</p>
                  <p className="mt-2 text-sm text-slate-400">Cross-functional stack</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[1.75rem] border border-white/10 bg-[#07192e] p-5 shadow-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">What is live now</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  {data.readiness.stabilityFocus.map((item) => (
                    <li key={item} className="flex gap-3">
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[1.75rem] border border-white/10 bg-[#07192e] p-5 shadow-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Recent inquiry signal</p>
                <p className="mt-4 text-lg font-medium text-white">
                  {data.liveSignals.recentInquiryAt
                    ? `Last request received on ${new Date(data.liveSignals.recentInquiryAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : 'No live inquiries yet in this runtime session.'}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Demo and newsletter actions on this page post directly into the backend public-site service.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="A2Z Services"
            title="Everything needed to run people, revenue, finance, and operations from one launch-ready website."
            description="This landing experience now reflects the full-stack platform behind it, with public content coming from the backend and conversion actions writing back into live services."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {data.serviceCards.map((service) => {
              const Icon = serviceIcons[service.id] ?? Workflow;

              return (
                <article
                  key={service.id}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 text-amber">
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                      {service.category}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{service.description}</p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {service.highlights.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-[#07192e] px-4 py-3 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {service.modules.map((moduleItem) => (
                      <span
                        key={moduleItem}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300"
                      >
                        {moduleItem}
                      </span>
                    ))}
                  </div>

                  <Link href={service.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber">
                    Explore this stack <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modules" className="bg-[#07192e] px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Live Module Readiness"
            title={`${data.readiness.product} is already structured as a premium modular platform.`}
            description={`${data.readiness.releaseTrack} mode keeps the platform focused on adoption-first workflows while preserving room to scale into enterprise depth.`}
          />

          <div className="mt-10 grid gap-5 xl:grid-cols-5">
            {data.readiness.modules.map((moduleItem) => {
              const Icon = moduleIcons[moduleItem.id] ?? ShieldCheck;
              return (
                <article key={moduleItem.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusStyles[moduleItem.status] ?? 'border-white/15 bg-white/10 text-white'}`}>
                      {moduleItem.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-white">{moduleItem.name}</h3>
                  <p className="mt-1 text-sm uppercase tracking-[0.18em] text-slate-400">{moduleItem.scope} scope</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{moduleItem.summary}</p>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-[#04101f] p-4">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Completion</span>
                      <span>{moduleItem.completionPercent}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber to-emerald-300"
                        style={{ width: `${moduleItem.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {moduleItem.functionalWorkflows.slice(0, 3).map((workflowItem) => (
                      <li key={workflowItem} className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                        <span>{workflowItem}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Operating Model"
              title="A premium journey from demand capture to everyday execution."
              description="The landing page now communicates the full product story in the same order companies actually adopt and run the platform."
            />

            <div className="space-y-5">
              {data.operatingModel.map((step) => (
                <article key={step.phase} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-ember to-amber px-4 py-3 text-sm font-semibold text-white">
                      {step.phase}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{step.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {step.deliverables.map((deliverable) => (
                          <span
                            key={deliverable}
                            className="rounded-full border border-white/10 bg-[#07192e] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300"
                          >
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <SectionIntro
              eyebrow="Role Experiences"
              title="International-grade dashboards for every stakeholder."
              description="Admins, managers, sales leaders, and employees all get a focused route into the same connected backend."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              {data.roleSnapshots.map((roleItem) => (
                <article key={roleItem.role} className="rounded-[1.75rem] border border-white/10 bg-[#07192e] p-5 shadow-xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber/80">{roleItem.role}</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{roleItem.label}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{roleItem.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {roleItem.modules.map((moduleItem) => (
                      <span key={moduleItem} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {moduleItem}
                      </span>
                    ))}
                  </div>
                  <Link href={roleItem.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
                    Open workspace <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#07192e] px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Marketplace + Talent"
              title="Public-facing credibility for jobs, recruiters, and enterprise buying teams."
              description="The website now tells a complete international story across recruitment, launch readiness, and platform trust."
            />
            <div className="grid gap-4">
              {data.marketplaceSpotlight.map((job) => (
                <article key={`${job.title}-${job.location}`} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {job.location} &middot; {job.type}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                      {job.department}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <SectionIntro
              eyebrow="Testimonials"
              title="Built to feel premium to buyers and practical to operators."
              description="These narratives support the international, enterprise-grade positioning the user asked for."
            />
            <div className="grid gap-4">
              {data.testimonials.map((item) => (
                <article key={item.name} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-base leading-8 text-slate-200">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">
                      {item.title}, {item.company}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Plans"
            title="Flexible commercial paths for startups, scale-ups, and enterprise rollouts."
            description="Pricing communication now aligns with the platform story and clearly supports phased adoption."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {data.plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[2rem] border p-6 shadow-2xl ${
                  plan.featured
                    ? 'border-amber/30 bg-gradient-to-b from-amber/15 to-white/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">{plan.name}</p>
                    <p className="mt-4 text-4xl font-semibold text-white">{plan.price}</p>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full border border-amber/40 bg-amber/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-amber">
                      Most adopted
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm font-medium text-sky-100/80">{plan.commitment}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>

                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="#contact"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? 'bg-gradient-to-r from-ember to-amber text-white hover:opacity-90'
                      : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#07192e] px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="FAQ"
            title="Clear answers for product, rollout, and adoption conversations."
            description="These are structured for buyers who want a confident, professional, and international presentation before requesting a demo."
          />

          <div className="mt-10 grid gap-4">
            {data.faq.map((item) => (
              <details key={item.question} className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <summary className="cursor-pointer list-none text-lg font-semibold text-white">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <SectionIntro
            eyebrow="Contact + Conversion"
            title="This website is now full-stack: public content loads from backend services and forms write back into live endpoints."
            description="Use the form below to capture demo requests, implementation discussions, or multi-module rollout inquiries directly from the landing page."
          />
          <LandingLeadHub />
        </div>
      </section>
    </main>
  );
}
