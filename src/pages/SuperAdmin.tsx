import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: "Starter" | "Growth" | "Enterprise";
  employees: number;
  mrr: number;
  status: "active" | "trial" | "churned";
  joined: string;
  nps: number;
};

type ContactLead = {
  name: string;
  email: string;
  company: string;
  size: string;
  date: string;
  status: "new" | "demo" | "proposal" | "closed";
};

type PlanCategory = "hr" | "recruitment" | "combined";

type SubscriptionPlan = {
  name: string;
  price: number;
  billingNote: string;
  maxEmployees: string;
  features: string[];
  status: "active" | "popular" | "enterprise";
};

type WhiteLabelPartner = {
  id: string;
  name: string;
  domain: string;
  clients: number;
  mrr: number;
  status: "active" | "pending";
  joined: string;
};

// ─── Static Data ──────────────────────────────────────────────────────────────
const TENANTS: Tenant[] = [
  { id: "1", name: "Akul Dravin Corp",   slug: "akul",     plan: "Enterprise", employees: 247, mrr: 148200, status: "active",  joined: "Jun 2024", nps: 72 },
  { id: "2", name: "Starfield Dynamics", slug: "starfield", plan: "Growth",    employees: 89,  mrr: 26700,  status: "active",  joined: "Sep 2024", nps: 61 },
  { id: "3", name: "NovaTech Solutions", slug: "novatech",  plan: "Starter",   employees: 34,  mrr: 6800,   status: "trial",   joined: "Feb 2026", nps: 45 },
  { id: "4", name: "Pinnacle Analytics", slug: "pinnacle",  plan: "Growth",    employees: 121, mrr: 36300,  status: "active",  joined: "Nov 2024", nps: 68 },
  { id: "5", name: "BlueWave Media",     slug: "bluewave",  plan: "Starter",   employees: 22,  mrr: 4400,   status: "active",  joined: "Jan 2026", nps: 52 },
  { id: "6", name: "Vertex Capital",     slug: "vertex",    plan: "Enterprise", employees: 310, mrr: 186000, status: "active",  joined: "Mar 2024", nps: 78 },
  { id: "7", name: "Crestline Pharma",   slug: "crestline", plan: "Growth",    employees: 67,  mrr: 20100,  status: "churned", joined: "Jul 2024", nps: 28 },
];

const LEADS: ContactLead[] = [
  { name: "Arjun Malhotra", email: "arjun@techrise.in",   company: "TechRise Inc", size: "200-500",  date: "Mar 03, 2026", status: "demo"     },
  { name: "Sonal Mehta",    email: "sonal@fabrica.com",   company: "Fabrica Ltd",  size: "50-100",   date: "Mar 02, 2026", status: "new"      },
  { name: "Deepak Rao",     email: "deepak@growthco.io",  company: "GrowthCo",     size: "100-200",  date: "Mar 01, 2026", status: "proposal" },
  { name: "Kritika Joshi",  email: "kritika@urbanmob.in", company: "UrbanMob",     size: "500-1000", date: "Feb 28, 2026", status: "closed"   },
  { name: "Nikhil Bose",    email: "nikhil@cloudlayer.io",company: "CloudLayer",   size: "1000+",    date: "Feb 26, 2026", status: "demo"     },
];

const FEATURE_FLAGS = [
  { feature: "Parents Split Payroll",   plans: ["Enterprise"],                       desc: "Multi-account salary disbursement" },
  { feature: "AI Resume Screening",     plans: ["Growth", "Enterprise"],             desc: "LLM-powered candidate scoring"     },
  { feature: "Blockchain Certificates", plans: ["Growth", "Enterprise"],             desc: "Immutable certificate hashing"     },
  { feature: "SAML / SSO",             plans: ["Enterprise"],                       desc: "Okta, Azure AD, Google Workspace"  },
  { feature: "Custom Subdomain",        plans: ["Growth", "Enterprise"],             desc: "tenant.akuldravin.com"             },
  { feature: "Dedicated Account Mgr",   plans: ["Enterprise"],                       desc: "Named CSM + SLA guarantee"        },
  { feature: "Analytics Export",        plans: ["Starter", "Growth", "Enterprise"],  desc: "CSV + Excel download"              },
  { feature: "API Access",             plans: ["Growth", "Enterprise"],             desc: "Full REST API with webhooks"       },
];

const HR_PLANS: SubscriptionPlan[] = [
  {
    name: "HR Starter",
    price: 999,
    billingNote: "per month · up to 50 employees",
    maxEmployees: "50",
    features: ["Employee Records", "Attendance", "Leave Management", "Basic Payroll", "Document Storage", "Email Support"],
    status: "active",
  },
  {
    name: "HR Business",
    price: 2999,
    billingNote: "per month · up to 250 employees",
    maxEmployees: "250",
    features: ["All Starter features", "Performance Management", "LMS & Training", "Expense Management", "Compliance Module", "Onboarding/Offboarding", "Priority Support"],
    status: "popular",
  },
  {
    name: "HR Enterprise",
    price: 7999,
    billingNote: "per month · unlimited employees",
    maxEmployees: "Unlimited",
    features: ["All Business features", "AI HR Assistant", "Custom Workflows", "SAML/SSO", "Dedicated CSM", "SLA 99.9%", "White Label Option", "API Access + Webhooks"],
    status: "enterprise",
  },
];

const RECRUITMENT_PLANS: SubscriptionPlan[] = [
  {
    name: "Recruit Starter",
    price: 1499,
    billingNote: "per month · 5 active jobs",
    maxEmployees: "5 jobs",
    features: ["Job Postings (5)", "Candidate Database", "Basic ATS Pipeline", "Email Templates", "Resume Parser", "Standard Support"],
    status: "active",
  },
  {
    name: "Recruit Business",
    price: 3999,
    billingNote: "per month · 25 active jobs",
    maxEmployees: "25 jobs",
    features: ["All Starter features", "AI Screening & Scoring", "Video Interviews", "Recruiter Hub Access", "Job Board Distribution", "Custom Pipeline Stages", "Analytics Dashboard"],
    status: "popular",
  },
  {
    name: "Recruit Enterprise",
    price: 9999,
    billingNote: "per month · unlimited jobs",
    maxEmployees: "Unlimited",
    features: ["All Business features", "Recruitment Marketplace", "Campus Hiring Module", "LinkedIn Integration", "Custom Branding", "Dedicated Recruiter CSM", "Advanced AI Sourcing"],
    status: "enterprise",
  },
];

const COMBINED_PLANS: SubscriptionPlan[] = [
  {
    name: "Professional",
    price: 4999,
    billingNote: "per month · up to 100 employees",
    maxEmployees: "100",
    features: ["Full HR Suite (Starter)", "Full Recruitment Suite (Starter)", "AI HR Chatbot", "Mobile App", "Basic Analytics", "Slack Integration", "Priority Support"],
    status: "active",
  },
  {
    name: "Corporate",
    price: 9999,
    billingNote: "per month · up to 500 employees",
    maxEmployees: "500",
    features: ["Full HR Suite (Business)", "Full Recruitment Suite (Business)", "AI Intelligence Hub", "Custom Workflows", "Advanced Analytics", "Gamification Engine", "SAML/SSO", "24x7 Support"],
    status: "popular",
  },
  {
    name: "Global",
    price: 19999,
    billingNote: "per month · unlimited",
    maxEmployees: "Unlimited",
    features: ["All Corporate features", "Multi-country Payroll", "White Label Platform", "8-Layer AI System", "Custom Integrations", "Dedicated Infra", "CEO Analytics", "Boardroom Briefings"],
    status: "enterprise",
  },
];

const WL_PARTNERS: WhiteLabelPartner[] = [
  { id: "wl-1", name: "RecruitPro Solutions", domain: "app.recruitpro.in",    clients: 12, mrr: 84000,  status: "active",  joined: "Aug 2024" },
  { id: "wl-2", name: "TalentHub Platform",   domain: "hrms.talenthub.co",   clients: 8,  mrr: 56000,  status: "active",  joined: "Oct 2024" },
  { id: "wl-3", name: "HREdge Enterprise",    domain: "hredge.workportal.in", clients: 5,  mrr: 35000,  status: "active",  joined: "Jan 2025" },
  { id: "wl-4", name: "WorkForce360",         domain: "wf360.hrcloud.io",    clients: 3,  mrr: 21000,  status: "pending", joined: "Feb 2026" },
];

// ─── Color helpers ────────────────────────────────────────────────────────────
const PLAN_COLOR: Record<Tenant["plan"], string> = {
  Starter:    "stage-roadmap",
  Growth:     "stage-beta",
  Enterprise: "status-on-track",
};

const STATUS_COLOR: Record<Tenant["status"], string> = {
  active:  "status-on-track",
  trial:   "status-watch",
  churned: "status-risk",
};

const LEAD_COLOR: Record<ContactLead["status"], string> = {
  new:      "stage-roadmap",
  demo:     "stage-beta",
  proposal: "status-watch",
  closed:   "status-on-track",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SuperAdmin() {
  const [tab, setTab] = useState<"overview" | "plans" | "whitelabel">("overview");
  const [planCategory, setPlanCategory] = useState<PlanCategory>("hr");

  const activeTenants  = TENANTS.filter((t) => t.status === "active" || t.status === "trial");
  const totalMRR       = TENANTS.filter((t) => t.status === "active").reduce((s, t) => s + t.mrr, 0);
  const totalARR       = totalMRR * 12;
  const churnedCount   = TENANTS.filter((t) => t.status === "churned").length;
  const churnRate      = ((churnedCount / TENANTS.length) * 100).toFixed(1);
  const avgNPS         = Math.round(TENANTS.filter((t) => t.status === "active").reduce((s, t) => s + t.nps, 0) / activeTenants.length);
  const totalEmployees = TENANTS.filter((t) => t.status === "active").reduce((s, t) => s + t.employees, 0);

  const wlMRR = WL_PARTNERS.filter(p => p.status === "active").reduce((s, p) => s + p.mrr, 0);
  const wlClients = WL_PARTNERS.filter(p => p.status === "active").reduce((s, p) => s + p.clients, 0);

  const currentPlans = planCategory === "hr" ? HR_PLANS : planCategory === "recruitment" ? RECRUITMENT_PLANS : COMBINED_PLANS;

  function planBorderColor(s: SubscriptionPlan["status"]) {
    if (s === "popular")    return "var(--gold)";
    if (s === "enterprise") return "#7c3aed";
    return "rgba(255,255,255,0.08)";
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Super Admin</h1>
        <p className="page-sub">SaaS Control Center · Tenant Management · Revenue · Plans · White Label</p>
      </div>

      {/* Top-level Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {([
          ["overview", "📊 Overview"],
          ["plans",    "💳 Subscription Plans"],
          ["whitelabel","🏷️ White Label"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: "0.85rem" }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* SaaS KPIs */}
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">MRR</p>
              <p className="stat-value" style={{ fontSize: "1.4rem" }}>₹{(totalMRR / 100000).toFixed(1)}L</p>
              <p className="stat-note" style={{ color: "var(--green)" }}>+18% vs last month</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">ARR</p>
              <p className="stat-value" style={{ fontSize: "1.4rem" }}>₹{(totalARR / 10000000).toFixed(2)}Cr</p>
              <p className="stat-note">Annualized run rate</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Active Tenants</p>
              <p className="stat-value stat-green">{activeTenants.length}</p>
              <p className="stat-note">{TENANTS.length} total accounts</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Churn Rate</p>
              <p className="stat-value stat-amber">{churnRate}%</p>
              <p className="stat-note">{churnedCount} churned account{churnedCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Avg NPS</p>
              <p className="stat-value stat-green">{avgNPS}</p>
              <p className="stat-note">Platform satisfaction score</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total Managed EEs</p>
              <p className="stat-value">{totalEmployees.toLocaleString()}</p>
              <p className="stat-note">Across all active tenants</p>
            </div>
          </div>

          {/* Tenant List */}
          <div className="section-block">
            <div className="section-head">
              <h2>Tenant Accounts</h2>
              <p>All organizations on Akul Dravin HRMS platform.</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Slug</th>
                  <th>Plan</th>
                  <th>Employees</th>
                  <th>MRR</th>
                  <th>NPS</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TENANTS.sort((a, b) => b.mrr - a.mrr).map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontFamily: "monospace" }}>{t.slug}</td>
                    <td>
                      <span className={`status-chip ${PLAN_COLOR[t.plan]}`}>{t.plan}</span>
                    </td>
                    <td style={{ fontFamily: "monospace" }}>{t.employees}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--gold)", fontWeight: 700 }}>
                      ₹{t.mrr.toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontFamily: "monospace", color: t.nps >= 60 ? "#22c55e" : t.nps >= 40 ? "var(--gold)" : "#ef4444" }}>
                      {t.nps}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.joined}</td>
                    <td>
                      <span className={`status-chip ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Revenue Breakdown + Leads */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div className="section-block" style={{ marginBottom: 0 }}>
              <div className="section-head">
                <h2>Revenue by Plan</h2>
                <p>MRR contribution per pricing tier</p>
              </div>
              {(["Enterprise", "Growth", "Starter"] as Tenant["plan"][]).map((plan) => {
                const planMRR = TENANTS.filter((t) => t.plan === plan && t.status === "active").reduce((s, t) => s + t.mrr, 0);
                const pct = totalMRR > 0 ? ((planMRR / totalMRR) * 100).toFixed(0) : "0";
                return (
                  <div key={plan} className="chart-bar-row" style={{ marginBottom: 12 }}>
                    <span className="chart-bar-label" style={{ width: 90 }}>{plan}</span>
                    <div className="chart-bar-track">
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: plan === "Enterprise"
                            ? "linear-gradient(90deg, var(--gold), rgba(210,174,82,0.5))"
                            : plan === "Growth"
                            ? "linear-gradient(90deg, #c94267, #f0a8bb)"
                            : "linear-gradient(90deg, #40b77e, #9ef5ca)",
                        }}
                      />
                    </div>
                    <span className="chart-bar-value">₹{(planMRR / 1000).toFixed(0)}K · {pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="section-block" style={{ marginBottom: 0 }}>
              <div className="section-head">
                <h2>Inbound Leads</h2>
                <p>Contact form submissions from prospective customers</p>
              </div>
              <table className="data-table" style={{ fontSize: "0.8rem" }}>
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Size</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADS.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8rem" }}>{l.name}</p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>{l.email}</p>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{l.company}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{l.size}</td>
                      <td><span className={`status-chip ${LEAD_COLOR[l.status]}`}>{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="section-block">
            <div className="section-head">
              <h2>Feature Flag Matrix</h2>
              <p>Feature availability by plan tier. Enterprise unlocks all capabilities.</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Description</th>
                  <th>Starter</th>
                  <th>Growth</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_FLAGS.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, fontSize: "0.84rem" }}>{f.feature}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{f.desc}</td>
                    {(["Starter", "Growth", "Enterprise"] as Tenant["plan"][]).map((plan) => (
                      <td key={plan} style={{ textAlign: "center" }}>
                        {f.plans.includes(plan) ? (
                          <span style={{ color: "#22c55e", fontSize: "1rem" }}>✓</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Subscription Plans Tab ────────────────────────────────────────── */}
      {tab === "plans" && (
        <>
          <div className="section-block" style={{ padding: "1.1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Select plan category to view and manage subscription tiers
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {([
                ["hr",          "🧑‍💼 HR Plans"],
                ["recruitment", "🎯 Recruitment Plans"],
                ["combined",    "✦ Combined Plans"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  className={planCategory === key ? "btn-primary" : "btn-secondary"}
                  style={{ fontSize: "0.85rem" }}
                  onClick={() => setPlanCategory(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            {currentPlans.map((plan) => (
              <div
                key={plan.name}
                className="section-block"
                style={{
                  padding: "1.5rem",
                  border: `1.5px solid ${planBorderColor(plan.status)}`,
                  position: "relative",
                }}
              >
                {plan.status === "popular" && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "var(--gold)", color: "#000", fontWeight: 700,
                    fontSize: "0.72rem", padding: "3px 14px", borderRadius: 20,
                  }}>
                    MOST POPULAR
                  </div>
                )}
                {plan.status === "enterprise" && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "#7c3aed", color: "#fff", fontWeight: 700,
                    fontSize: "0.72rem", padding: "3px 14px", borderRadius: 20,
                  }}>
                    ENTERPRISE
                  </div>
                )}

                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>{plan.name}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--gold)", marginBottom: 2 }}>
                  ₹{plan.price.toLocaleString("en-IN")}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                  {plan.billingNote}
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  Max: <strong style={{ color: "var(--text-primary)" }}>{plan.maxEmployees}</strong>
                  {planCategory !== "recruitment" ? " employees" : " active jobs"}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem" }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", marginBottom: 5, fontSize: "0.82rem" }}>
                      <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1rem", display: "flex", gap: "0.4rem" }}>
                  <button className="btn-primary" style={{ flex: 1, fontSize: "0.8rem" }}>Edit Plan</button>
                  <button className="btn-secondary" style={{ fontSize: "0.8rem" }}>
                    {plan.status === "active" ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Plan stats */}
          <div className="stats-grid">
            {[
              { label: "HR Plans Revenue",        value: "₹4.2L", sub: "MRR from HR modules" },
              { label: "Recruitment Plans Revenue", value: "₹1.8L", sub: "MRR from recruitment" },
              { label: "Combined Plans Revenue",   value: "₹1.7L", sub: "MRR from bundles" },
              { label: "Avg Plan Value",           value: "₹38,200", sub: "ARPU across all plans" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── White Label Tab ───────────────────────────────────────────────── */}
      {tab === "whitelabel" && (
        <>
          {/* WL Stats */}
          <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
            {[
              { label: "Active Partners",   value: WL_PARTNERS.filter(p => p.status === "active").length, sub: "White label deployments" },
              { label: "Custom Domains",    value: WL_PARTNERS.filter(p => p.status === "active").length, sub: "Live branded portals" },
              { label: "WL Revenue (MRR)",  value: `₹${(wlMRR / 100000).toFixed(1)}L`, sub: "From partner licensing" },
              { label: "Avg Clients/Partner", value: Math.round(wlClients / WL_PARTNERS.filter(p => p.status === "active").length), sub: "End customers per partner" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Partners Table */}
          <div className="section-block">
            <div className="section-head" style={{ marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0 }}>White Label Partners</h2>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Organizations reselling Akul Dravin HRMS under their own brand
                </p>
              </div>
              <button className="btn-primary" style={{ fontSize: "0.82rem" }}>+ Add Partner</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Custom Domain</th>
                  <th>Clients</th>
                  <th>MRR</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {WL_PARTNERS.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--gold)" }}>
                      {p.domain}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>{p.clients}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--gold)" }}>
                      ₹{p.mrr.toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{p.joined}</td>
                    <td>
                      <span className={`status-chip ${p.status === "active" ? "status-on-track" : "status-watch"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                          Manage
                        </button>
                        <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                          Portal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* WL Feature details */}
          <div className="section-block" style={{ marginTop: "1rem" }}>
            <div className="section-head" style={{ marginBottom: "1rem" }}>
              <h2 style={{ margin: 0 }}>White Label Capabilities</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.85rem" }}>
              {[
                { icon: "🎨", title: "Custom Branding",      desc: "Logo, color scheme, font — full theme control" },
                { icon: "🌐", title: "Custom Domain",         desc: "CNAME setup for partner-owned domains" },
                { icon: "📧", title: "Branded Emails",        desc: "All transactional emails from partner domain" },
                { icon: "📱", title: "White Label App",       desc: "Mobile app rebranding (iOS + Android)" },
                { icon: "🔒", title: "Data Isolation",        desc: "Full tenant isolation per partner's clients" },
                { icon: "💳", title: "Revenue Share",         desc: "30/70 split on client MRR — paid monthly" },
              ].map((f) => (
                <div key={f.title} className="section-block" style={{ padding: "1rem", marginBottom: 0, textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{f.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
