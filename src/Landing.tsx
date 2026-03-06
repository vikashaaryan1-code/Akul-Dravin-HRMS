import "./Landing.css";

type Props = {
  onSignIn: () => void;
};

const STATS = [
  { value: "90%", label: "AI Automation" },
  { value: "50+", label: "AI Features" },
  { value: "10M+", label: "Employees Supported" },
  { value: "â‚¹49", label: "Starting / emp / mo" },
];

const DIFFERENTIATORS = [
  {
    icon: "ðŸ¤–",
    title: "90% AI Automation",
    desc: "Every HR workflow runs automatically â€” screening, scheduling, payroll, compliance. Zero manual intervention needed.",
  },
  {
    icon: "â˜…",
    title: "Parents Split Payroll",
    badge: "World's First",
    desc: "Auto-split salary to parents' bank accounts. Multi-account disbursement with full audit trail and tax optimization.",
  },
  {
    icon: "ðŸ†",
    title: "Gamification Engine",
    desc: "Bronze â†’ Silver â†’ Gold â†’ Platinum â†’ Diamond levels. Points, leaderboards, rewards marketplace â€” employees love it.",
  },
  {
    icon: "ðŸ”—",
    title: "Blockchain Certification",
    desc: "SHA-256 hash for every certificate. QR verification, LinkedIn integration â€” tamper-proof and globally trusted.",
  },
  {
    icon: "ðŸ‡®ðŸ‡³",
    title: "India Statutory Compliance",
    desc: "Full PF, ESIC, TDS, PT compliance across all 28 states. Auto-generated challans, ECR files, Form 26Q.",
  },
  {
    icon: "ðŸ’°",
    title: "Transparent Pricing",
    desc: "â‚¹49/emp/mo â€” no hidden costs, no lock-ins. Modular â€” pay only for what you use. Cheaper than any competitor.",
  },
];

const MODULES = [
  { icon: "ðŸŽ¯", title: "AI ATS", desc: "End-to-end hiring â€” job posting to offer signing. AI resume parsing, fit score, auto-scheduling." },
  { icon: "ðŸ’¸", title: "Payroll Engine", desc: "1L employees in under 4 minutes. PF/ESIC/TDS auto-computed. Parents Split Payroll built-in." },
  { icon: "ðŸ“ˆ", title: "Performance", desc: "OKRs, 360Â° feedback, bell curve calibration, AI coaching, appraisal cycles â€” complete PM." },
  { icon: "ðŸŽ“", title: "LMS + Certs", desc: "5,000+ courses, AI learning paths, blockchain certificates. Skill gap auto-detection." },
  { icon: "ðŸ…", title: "Gamification", desc: "5-level progression, points system, reward marketplace, leaderboard, team challenges." },
  { icon: "â±ï¸", title: "Attendance & Leave", desc: "Biometric, GPS, face-recognition. Shift management. Geo-fencing. Auto payroll sync." },
  { icon: "ðŸ“„", title: "Documents", desc: "Digital locker, 200+ templates, eSign via Aadhaar, OCR extraction, bulk operations." },
  { icon: "ðŸšª", title: "Offboarding", desc: "Resignation workflow, F&F settlement, exit interview AI, alumni portal, asset recovery." },
];

type CompRow = {
  feature: string;
  workday: string;
  sap: string;
  darwinbox: string;
  zoho: string;
  akul: string;
  akul_win?: boolean;
};

const COMP_ROWS: CompRow[] = [
  { feature: "AI Automation", workday: "60%", sap: "55%", darwinbox: "50%", zoho: "40%", akul: "90%", akul_win: true },
  { feature: "Gamification", workday: "âœ—", sap: "âœ—", darwinbox: "Basic", zoho: "âœ—", akul: "Full Layer", akul_win: true },
  { feature: "Blockchain Certs", workday: "âœ—", sap: "âœ—", darwinbox: "âœ—", zoho: "âœ—", akul: "âœ“ Yes", akul_win: true },
  { feature: "Parents Split Payroll", workday: "âœ—", sap: "âœ—", darwinbox: "âœ—", zoho: "âœ—", akul: "â˜… World First", akul_win: true },
  { feature: "India Compliance", workday: "Partial", sap: "Partial", darwinbox: "âœ“ Yes", zoho: "âœ“ Yes", akul: "Full + AI", akul_win: true },
  { feature: "Starting Price", workday: "$25/emp", sap: "$30/emp", darwinbox: "â‚¹150/emp", zoho: "â‚¹60/emp", akul: "â‚¹49/emp", akul_win: true },
  { feature: "White Label", workday: "âœ—", sap: "âœ—", darwinbox: "Custom", zoho: "âœ—", akul: "âœ“ Add-on", akul_win: true },
];

const PRICING = [
  {
    name: "Starter",
    price: "â‚¹49",
    limit: "Up to 200 employees",
    popular: false,
    features: [
      "Core HR Module",
      "Basic ATS (50 reqs/mo)",
      "AI Payroll Engine",
      "Attendance & Leave",
      "ESS Portal (Web)",
      "Document Management",
      "Basic Reports & Analytics",
      "Email Support (48hr SLA)",
      "1 Legal Entity",
    ],
  },
  {
    name: "Growth",
    price: "â‚¹99",
    limit: "Up to 2,000 employees",
    popular: true,
    features: [
      "Everything in Starter",
      "Full AI Intelligence Layer",
      "Advanced ATS (Unlimited)",
      "Complete LMS Module",
      "Gamification Engine",
      "Mobile App (iOS + Android)",
      "Performance Management",
      "360Â° Feedback",
      "Expense Management",
      "Chat Support (12hr SLA)",
      "Up to 5 Entities",
    ],
  },
  {
    name: "Enterprise",
    price: "â‚¹199",
    limit: "Unlimited employees",
    popular: false,
    features: [
      "Everything in Growth",
      "Blockchain Certification",
      "White Label Platform",
      "Custom Domain & Branding",
      "Unlimited API Access",
      "SSO (SAML 2.0)",
      "IP Whitelisting",
      "Dedicated CSM",
      "Phone + Priority Support (2hr SLA)",
      "Custom Integrations",
      "Private Cloud Option",
      "Executive Dashboard",
    ],
  },
];

const WORKFLOWS = [
  {
    event: "Candidate.Applied",
    color: "#9f1237",
    steps: [
      "AI Resume Parser extracts skills & experience",
      "AI Fit Score generated (0â€“100)",
      "Score < 40% â†’ Auto-reject with email",
      "Score > 70% â†’ Auto-schedule interview",
      "Recruiter notified with AI candidate summary",
    ],
  },
  {
    event: "Offer.Accepted",
    color: "#d2ae52",
    steps: [
      "eSign verified â€” offer legally binding",
      "Background check API auto-triggered",
      "Pre-boarding portal access sent",
      "Onboarding tasks created for HR, IT, Admin",
      "Payroll record pre-created with offer CTC",
    ],
  },
  {
    event: "Payroll.Month.End",
    color: "#40b77e",
    steps: [
      "Attendance data auto-pulled & consolidated",
      "PF, ESIC, TDS, PT all computed automatically",
      "Parents Split Payroll amounts allocated",
      "Payroll Anomaly AI runs fraud detection",
      "Bank files generated â€” payslips emailed",
    ],
  },
];

export default function Landing({ onSignIn }: Props) {
  return (
    <div className="lp-root">
      {/* Background orbs */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-noise" />

      {/* â”€â”€ Navbar â”€â”€ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-mark">AD</span>
            <span className="lp-logo-text">HRMS <span className="lp-logo-ai">AI</span></span>
          </div>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#modules" className="lp-nav-link">Modules</a>
            <a href="#pricing" className="lp-nav-link">Pricing</a>
            <a href="#roadmap" className="lp-nav-link">Roadmap</a>
          </div>
          <div className="lp-nav-ctas">
            <button className="lp-btn-ghost" onClick={onSignIn}>Sign In</button>
            <button className="lp-btn-gold" onClick={onSignIn}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            AI-Powered Â· Autonomous Â· Global SaaS Â· Multi-Tenant
          </div>
          <h1 className="lp-hero-h1">
            The World's Most
            <br />
            <span className="lp-gold-text">Intelligent HR</span>
            <br />
            Operating System
          </h1>
          <p className="lp-hero-sub">
            Eliminate 90% of manual HR work. Automate hiring, payroll, performance, and compliance â€”
            powered by AI. Built for India, ready for the world.
          </p>
          <div className="lp-hero-btns">
            <button className="lp-btn-gold lp-btn-lg" onClick={onSignIn}>Start Free Trial</button>
            <button className="lp-btn-outline lp-btn-lg" onClick={onSignIn}>Try Live Demo â†’</button>
          </div>

          {/* Stats bar */}
          <div className="lp-stats">
            {STATS.map((s) => (
              <div key={s.label} className="lp-stat">
                <span className="lp-stat-val">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Differentiators â”€â”€ */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">Why Akul Dravin</p>
            <h2 className="lp-section-h2">Built Different. Built Better.</h2>
            <p className="lp-section-sub">
              Six capabilities that no other HR platform in India offers â€” all in one product.
            </p>
          </div>
          <div className="lp-diff-grid">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className={`lp-diff-card${d.badge ? " lp-diff-card-featured" : ""}`}>
                <div className="lp-diff-icon">{d.icon}</div>
                <div className="lp-diff-title-row">
                  <h3 className="lp-diff-title">{d.title}</h3>
                  {d.badge && <span className="lp-badge">{d.badge}</span>}
                </div>
                <p className="lp-diff-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Modules â”€â”€ */}
      <section className="lp-section lp-section-alt" id="modules">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">Platform Modules</p>
            <h2 className="lp-section-h2">Every HR Function. One Platform.</h2>
            <p className="lp-section-sub">
              8 fully integrated modules â€” from hire to retire. AI-powered end to end.
            </p>
          </div>
          <div className="lp-module-grid">
            {MODULES.map((m) => (
              <div key={m.title} className="lp-module-card">
                <div className="lp-module-icon">{m.icon}</div>
                <h3 className="lp-module-title">{m.title}</h3>
                <p className="lp-module-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Competitive Table â”€â”€ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">Competitive Edge</p>
            <h2 className="lp-section-h2">We Win on Every Dimension</h2>
            <p className="lp-section-sub">
              See how Akul Dravin HRMS AI stacks up against global leaders â€” at a fraction of the price.
            </p>
          </div>
          <div className="lp-table-wrap">
            <table className="lp-comp-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Workday</th>
                  <th>SAP SF</th>
                  <th>Darwinbox</th>
                  <th>Zoho People</th>
                  <th className="lp-col-akul">Akul Dravin AI</th>
                </tr>
              </thead>
              <tbody>
                {COMP_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td className="lp-comp-feature">{row.feature}</td>
                    <td className="lp-comp-no">{row.workday}</td>
                    <td className="lp-comp-no">{row.sap}</td>
                    <td className="lp-comp-no">{row.darwinbox}</td>
                    <td className="lp-comp-no">{row.zoho}</td>
                    <td className="lp-comp-yes">{row.akul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* â”€â”€ Pricing â”€â”€ */}
      <section className="lp-section lp-section-alt" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">Transparent Pricing</p>
            <h2 className="lp-section-h2">Simple. Honest. Modular.</h2>
            <p className="lp-section-sub">
              Per employee, per month. No hidden costs. Save 15% with annual billing.
            </p>
          </div>
          <div className="lp-pricing-grid">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`lp-pricing-card${plan.popular ? " lp-pricing-popular" : ""}`}>
                {plan.popular && <div className="lp-popular-badge">Most Popular</div>}
                <h3 className="lp-plan-name">{plan.name}</h3>
                <div className="lp-plan-price">
                  {plan.price}
                  <span className="lp-plan-per"> / emp / mo</span>
                </div>
                <p className="lp-plan-limit">{plan.limit}</p>
                <button className="lp-plan-btn" onClick={onSignIn}>
                  {plan.popular ? "Start Free Trial" : "Get Started"}
                </button>
                <ul className="lp-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="lp-check">âœ“</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="lp-pricing-note">
            Annual plan saves 15% Â· Quarterly saves 5% Â· Biennial saves 25%
          </p>
        </div>
      </section>

      {/* â”€â”€ Automation Workflows â”€â”€ */}
      <section className="lp-section" id="roadmap">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">AI Automation Engine</p>
            <h2 className="lp-section-h2">Self-Running HR Operations</h2>
            <p className="lp-section-sub">
              Every action triggers an event. Every event triggers automation. No human needed.
            </p>
          </div>
          <div className="lp-workflow-grid">
            {WORKFLOWS.map((wf) => (
              <div key={wf.event} className="lp-workflow-card" style={{ "--wf-color": wf.color } as React.CSSProperties}>
                <div className="lp-wf-event">EVENT: {wf.event}</div>
                <ol className="lp-wf-steps">
                  {wf.steps.map((step, i) => (
                    <li key={i} className="lp-wf-step">
                      <span className="lp-wf-num">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA Banner â”€â”€ */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-h2">Ready to Transform HR?</h2>
          <p className="lp-cta-sub">
            Join 10M+ employees already powered by Akul Dravin HRMS AI.
            Setup in under 24 hours. No credit card required.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-btn-gold lp-btn-lg" onClick={onSignIn}>Start Free Trial</button>
            <button className="lp-btn-outline lp-btn-lg" onClick={onSignIn}>Try Live Demo â†’</button>
          </div>
        </div>
      </section>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <span className="lp-logo-mark">AD</span>
              <span className="lp-logo-text">HRMS <span className="lp-logo-ai">AI</span></span>
            </div>
            <p className="lp-footer-tagline">AI-Powered Â· Investor-Ready Â· Enterprise-Grade Â· Global SaaS</p>
          </div>
          <div className="lp-footer-links">
            <a href="#features" className="lp-footer-link">Features</a>
            <a href="#modules" className="lp-footer-link">Modules</a>
            <a href="#pricing" className="lp-footer-link">Pricing</a>
            <button className="lp-footer-link lp-footer-link-btn" onClick={onSignIn}>Sign In</button>
          </div>
          <p className="lp-footer-copy">
            Â© 2025â€“2026 Akul Dravin Technologies Pvt. Ltd. Â· CONFIDENTIAL
          </p>
        </div>
      </footer>
    </div>
  );
}

