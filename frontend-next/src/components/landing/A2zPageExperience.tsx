import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Map,
  Rocket,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import type { PublicA2zPayload } from '@/lib/public-site';
import { A2zWorkflowForm } from './A2zWorkflowForm';

const stepStyles: Record<string, string> = {
  ready: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
  active: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
  queued: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
};

type A2zPageExperienceProps = {
  data: PublicA2zPayload;
};

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber/80">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
    </div>
  );
}

export function A2zPageExperience({ data }: A2zPageExperienceProps) {
  return (
    <main className="min-h-screen bg-[#04101f] text-white selection:bg-amber/30">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04101f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ember via-amber to-aqua">
              <Rocket className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">AKUL DRAVIN</p>
              <p className="text-sm text-slate-400">A2Z Workflow Experience</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link href="#a2z-overview" className="text-sm text-slate-300 transition hover:text-white">
              Overview
            </Link>
            <Link href="#a2z-workflow" className="text-sm text-slate-300 transition hover:text-white">
              Workflow
            </Link>
            <Link href="#a2z-form" className="text-sm text-slate-300 transition hover:text-white">
              A2Z Form
            </Link>
          </nav>

          <Link href="#a2z-form" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#04101f]">
            Start workflow
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-20 pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="absolute inset-0">
          <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-amber/15 blur-3xl" />
          <div className="absolute right-[-4%] top-[10%] h-72 w-72 rounded-full bg-aqua/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber/90">
              <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
              {data.hero.badge}
            </div>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">{data.hero.title}</h1>
              <p className="max-w-3xl text-xl text-amber/90">{data.hero.subtitle}</p>
              <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{data.hero.description}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href={data.hero.primaryCta.href} className="rounded-full bg-gradient-to-r from-ember to-amber px-6 py-3 text-sm font-semibold text-white">
                {data.hero.primaryCta.label}
              </Link>
              <Link href={data.hero.secondaryCta.href} className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white">
                {data.hero.secondaryCta.label}
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#07192e] px-6 py-3 text-sm font-semibold text-white">
                Back to landing <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Implementation signals</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-white/10 bg-[#07192e] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active modules</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{data.implementationSignals.activeModules}</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-[#07192e] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Readiness</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{data.implementationSignals.readinessPercent}%</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-[#07192e] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">A2Z requests</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{data.implementationSignals.requestsReceived}</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-[#07192e] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Last request</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {data.implementationSignals.lastRequestAt
                      ? new Date(data.implementationSignals.lastRequestAt).toLocaleString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No requests yet'}
                  </p>
                </article>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#07192e] p-6 shadow-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">What this page does</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  <span>Combines A2Z services, A2Z form, and workflow next steps in one page.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  <span>Creates a CRM lead on submission and returns a visible implementation plan.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  <span>Gives buyers a premium discovery experience before demo or rollout discussion.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="a2z-overview" className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="A2Z Suites"
            title="Group every service into rollout-ready bundles."
            description="Each suite below represents a major business track, so teams can ask for one module or a complete A2Z transformation path."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {data.serviceSuites.map((suite) => (
              <article key={suite.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-2xl font-semibold text-white">{suite.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{suite.description}</p>
                <p className="mt-4 rounded-2xl border border-white/10 bg-[#07192e] p-4 text-sm leading-7 text-slate-200">{suite.valueProposition}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {suite.modules.map((moduleItem) => (
                    <span key={moduleItem} className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                      {moduleItem}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="a2z-workflow" className="bg-[#07192e] px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="A2Z Workflow"
            title="Workflow-first intake, not just another contact form."
            description="The page is structured around how real implementation moves: discovery, blueprinting, and delivery handoff."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {data.workflowSteps.map((step) => (
              <article key={step.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#04101f] text-amber">
                    <Workflow className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${stepStyles[step.status] ?? 'border-white/10 bg-white/10 text-white'}`}>
                    {step.status}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {step.owner} - {step.sla}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">{step.description}</p>

                <ul className="mt-5 space-y-2 text-sm text-slate-200">
                  {step.outputs.map((output) => (
                    <li key={output} className="flex gap-3">
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                      <span>{output}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Assurances"
              title="Designed for premium frontend presentation and backend follow-through."
              description="The A2Z page is not only polished; it is wired to real backend request handling so the workflow continues after submission."
            />

            <div className="space-y-4">
              {data.assurances.map((item) => (
                <article key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07192e] text-amber">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[#07192e] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">Best fit</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p className="flex gap-3">
                  <Map className="mt-1 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                  <span>Businesses launching multiple modules together.</span>
                </p>
                <p className="flex gap-3">
                  <Map className="mt-1 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                  <span>Companies needing rollout clarity before the first demo.</span>
                </p>
                <p className="flex gap-3">
                  <Map className="mt-1 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                  <span>Teams wanting A2Z services and workflow mapping in one place.</span>
                </p>
              </div>
            </div>
          </div>

          <A2zWorkflowForm options={data.formOptions} />
        </div>
      </section>
    </main>
  );
}
