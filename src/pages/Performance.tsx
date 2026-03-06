import { useState } from "react";

type OKR = {
  employee: string;
  dept: string;
  progress: number;
  score360: number;
  rating: "Exceptional" | "Exceeds" | "Meets" | "Below" | "PIP";
  status: "on-track" | "watch" | "risk";
};

type Feedback = {
  from: string;
  to: string;
  type: "praise" | "developmental" | "neutral";
  text: string;
  date: string;
};

type EmployeeScore = {
  employee: string;
  dept: string;
  designation: string;
  tenure: number;
  attendance: number;
  kpi: number;
  productivity: number;
  skills: number;
  behavior: number;
  innovation: number;
  totalScore: number;
  percentage: number;
  level: string;
  promotionEligible: boolean;
  incrementPct: number;
};

const OKR_DATA: OKR[] = [
  { employee: "Priya Nair",     dept: "Engineering",  progress: 88, score360: 4.4, rating: "Exceptional", status: "on-track" },
  { employee: "Vikram Singh",   dept: "Sales",        progress: 72, score360: 3.8, rating: "Meets",       status: "watch"    },
  { employee: "Ananya Roy",     dept: "Design",       progress: 91, score360: 4.7, rating: "Exceptional", status: "on-track" },
  { employee: "Samar Kapoor",   dept: "Engineering",  progress: 65, score360: 3.2, rating: "Below",       status: "risk"     },
  { employee: "Nisha Verma",    dept: "HR",           progress: 84, score360: 4.1, rating: "Exceeds",     status: "on-track" },
  { employee: "Rahul Mehta",    dept: "Finance",      progress: 79, score360: 3.9, rating: "Meets",       status: "on-track" },
  { employee: "Divya Sharma",   dept: "Product",      progress: 55, score360: 2.9, rating: "PIP",         status: "risk"     },
];

const FEEDBACK_DATA: Feedback[] = [
  { from: "Ananya Roy",   to: "Priya Nair",   type: "praise",        text: "Exceptional architecture decisions on the payment gateway. Sets the standard for the team.", date: "Mar 03, 2026" },
  { from: "Vikram Singh", to: "Nisha Verma",  type: "developmental", text: "Could improve on data-driven presentations in client meetings. Suggest practising with mock data.", date: "Mar 01, 2026" },
  { from: "Priya Nair",   to: "Samar Kapoor", type: "neutral",       text: "Sprint velocity improved this quarter. Code review participation needs to be more consistent.", date: "Feb 27, 2026" },
  { from: "Nisha Verma",  to: "Rahul Mehta",  type: "praise",        text: "Payroll automation initiative saved 18 hours per month. Outstanding ownership and delivery.", date: "Feb 25, 2026" },
];

// PRD 6-parameter scoring data
const SCORE_DATA: EmployeeScore[] = [
  { employee: "Priya Nair",   dept: "Engineering", designation: "Executive",        tenure: 3, attendance: 98, kpi: 4.6, productivity: 4.5, skills: 4.7, behavior: 4.5, innovation: 4.3, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
  { employee: "Vikram Singh", dept: "Sales",       designation: "Senior Associate", tenure: 2, attendance: 88, kpi: 3.8, productivity: 3.7, skills: 3.5, behavior: 4.0, innovation: 3.2, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
  { employee: "Ananya Roy",   dept: "Design",      designation: "Executive",        tenure: 4, attendance: 99, kpi: 4.7, productivity: 4.8, skills: 4.6, behavior: 4.8, innovation: 4.9, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
  { employee: "Samar Kapoor", dept: "Engineering", designation: "Senior Associate", tenure: 1, attendance: 82, kpi: 3.2, productivity: 3.0, skills: 3.4, behavior: 3.1, innovation: 2.8, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
  { employee: "Nisha Verma",  dept: "HR",          designation: "Senior Manager",   tenure: 5, attendance: 96, kpi: 4.2, productivity: 4.1, skills: 4.0, behavior: 4.3, innovation: 3.8, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
  { employee: "Rahul Mehta",  dept: "Finance",     designation: "Executive",        tenure: 2, attendance: 91, kpi: 3.9, productivity: 3.8, skills: 3.9, behavior: 3.7, innovation: 3.5, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
  { employee: "Divya Sharma", dept: "Product",     designation: "Junior Associate", tenure: 1, attendance: 76, kpi: 2.8, productivity: 2.7, skills: 3.0, behavior: 2.9, innovation: 2.5, totalScore: 0, percentage: 0, level: "", promotionEligible: false, incrementPct: 0 },
];

// PRD formula: Score = (KPI×30%) + (Attendance×15%) + (Productivity×20%) + (Skills×15%) + (Behavior×10%) + (Innovation×10%)
function calcScore(e: EmployeeScore): EmployeeScore {
  const attScore = (e.attendance / 100) * 5; // convert % to 0-5 scale
  const total =
    e.kpi * 0.30 +
    attScore * 0.15 +
    e.productivity * 0.20 +
    e.skills * 0.15 +
    e.behavior * 0.10 +
    e.innovation * 0.10;
  const pct = Math.round(total * 20);
  let level = "";
  let incr = 0;
  if (pct >= 90) { level = "Exceptional"; incr = 18; }
  else if (pct >= 80) { level = "Excellent"; incr = 14; }
  else if (pct >= 70) { level = "Good"; incr = 9; }
  else if (pct >= 60) { level = "Satisfactory"; incr = 4; }
  else { level = "Below Average"; incr = 0; }

  // Tenure bonus: 0.5% per year, max 5%
  const tenureBonus = Math.min(e.tenure * 0.5, 5);
  const totalIncr = incr > 0 ? incr + tenureBonus : 0;

  // Promotion eligibility (PRD criteria)
  const eligible =
    pct >= 80 &&
    e.tenure >= 2 &&
    e.attendance >= 90 &&
    total >= 4.0;

  return { ...e, totalScore: Math.round(total * 100) / 100, percentage: pct, level, promotionEligible: eligible, incrementPct: Math.round(totalIncr * 10) / 10 };
}

const COMPUTED = SCORE_DATA.map(calcScore);

const RATING_COLOR: Record<OKR["rating"], string> = {
  Exceptional: "status-on-track",
  Exceeds:     "status-on-track",
  Meets:       "status-watch",
  Below:       "status-risk",
  PIP:         "status-risk",
};

const STATUS_COLOR: Record<OKR["status"], string> = {
  "on-track": "status-on-track",
  watch:      "status-watch",
  risk:       "status-risk",
};

const FEEDBACK_COLOR: Record<Feedback["type"], string> = {
  praise:        "status-on-track",
  developmental: "status-watch",
  neutral:       "stage-roadmap",
};

const LEVEL_COLOR: Record<string, string> = {
  Exceptional:   "status-on-track",
  Excellent:     "status-on-track",
  Good:          "status-watch",
  Satisfactory:  "stage-roadmap",
  "Below Average": "status-risk",
};

type Tab = "okr" | "scoring" | "batch" | "appraisal";

export default function Performance() {
  const avgProgress = Math.round(OKR_DATA.reduce((s, o) => s + o.progress, 0) / OKR_DATA.length);
  const avg360 = (OKR_DATA.reduce((s, o) => s + o.score360, 0) / OKR_DATA.length).toFixed(1);
  const reviewsDue = OKR_DATA.filter((o) => o.status === "risk").length;
  const highPerformers = OKR_DATA.filter((o) => o.rating === "Exceptional" || o.rating === "Exceeds").length;

  const [activeTab, setActiveTab] = useState<Tab>("okr");
  const [batchProcessed, setBatchProcessed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchStep, setBatchStep] = useState(0);

  const BATCH_STEPS = [
    "Calculating performance scores for all employees...",
    "Checking promotion eligibility criteria...",
    "Assigning promotions (PRD auto-promotion rules)...",
    "Calculating salary increments...",
    "Auto-generating offer/increment letters...",
    "Routing approvals to department heads...",
    "Sending notifications to employees...",
    "Updating payroll for next cycle...",
    "Generating board-level reports...",
    "✓ Annual review complete!",
  ];

  function runBatchProcess() {
    setProcessing(true);
    setBatchStep(0);
    setBatchProcessed(false);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setBatchStep(step);
      if (step >= BATCH_STEPS.length - 1) {
        clearInterval(interval);
        setProcessing(false);
        setBatchProcessed(true);
      }
    }, 400);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "okr",      label: "📈 OKR & 360°"         },
    { key: "scoring",  label: "🧮 Scoring Engine"      },
    { key: "batch",    label: "⚡ Annual Batch Review" },
    { key: "appraisal",label: "📅 Appraisal Cycle"    },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Performance Management</h1>
        <p className="page-sub">OKRs · 360° Feedback · 6-Parameter AI Scoring · Auto-Promotion · Batch Processing</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Avg OKR Progress</p>
          <p className="stat-value">{avgProgress}%</p>
          <p className="stat-note">Across all active employees</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg 360 Rating</p>
          <p className="stat-value">{avg360}<span className="stat-unit">/5</span></p>
          <p className="stat-note">Multi-rater feedback score</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">At Risk / PIP</p>
          <p className="stat-value stat-risk">{reviewsDue}</p>
          <p className="stat-note">Require immediate attention</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">High Performers</p>
          <p className="stat-value stat-green">{highPerformers}</p>
          <p className="stat-note">Exceptional + Exceeds rating</p>
        </div>
      </div>

      {/* Internal Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={activeTab === key ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab(key)}
            style={{ fontSize: "0.82rem" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OKR & 360° Tab ── */}
      {activeTab === "okr" && (
        <>
          {/* OKR Table */}
          <div className="section-block">
            <div className="section-head">
              <h2>OKR & Appraisal Status</h2>
              <p>Real-time goal progress + aggregated 360° rating per employee.</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>OKR Progress</th>
                  <th>360 Score</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {OKR_DATA.map((row) => (
                  <tr key={row.employee}>
                    <td>{row.employee}</td>
                    <td>{row.dept}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className="automation-track" style={{ flex: 1, minWidth: 80 }}>
                          <div
                            className="automation-fill"
                            style={{
                              width: `${row.progress}%`,
                              background:
                                row.progress >= 80
                                  ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                                  : row.progress >= 60
                                  ? "linear-gradient(90deg,#f3b955,#ffd98e)"
                                  : "linear-gradient(90deg,#eb675f,#ff9c96)",
                            }}
                          />
                        </div>
                        <span className="mono" style={{ minWidth: 34, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {row.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="mono">{row.score360}/5</td>
                    <td><span className={`status-chip ${RATING_COLOR[row.rating]}`}>{row.rating}</span></td>
                    <td><span className={`status-chip ${STATUS_COLOR[row.status]}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 360 Feedback */}
          <div className="section-block">
            <div className="section-head">
              <h2>Recent 360° Feedback</h2>
              <p>Continuous feedback submitted by peers, managers, and team members.</p>
            </div>
            <div className="feedback-grid">
              {FEEDBACK_DATA.map((fb, i) => (
                <div key={i} className="feedback-card">
                  <div className="feedback-meta">
                    <span className={`status-chip ${FEEDBACK_COLOR[fb.type]}`}>{fb.type}</span>
                    <span className="feedback-date">{fb.date}</span>
                  </div>
                  <p className="feedback-text">"{fb.text}"</p>
                  <p className="feedback-parties">
                    <span className="feedback-from">{fb.from}</span>
                    <span className="feedback-arrow"> → </span>
                    <span className="feedback-to">{fb.to}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 9-Box Grid */}
          <div className="section-block">
            <div className="section-head">
              <h2>9-Box Talent Matrix</h2>
              <p>Performance (Y-axis) vs Potential (X-axis) — AI-calibrated placement for succession planning.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 2, marginBottom: 8 }}>
              {(["High", "Mid", "Low"] as const).map((perfLabel, rowIdx) => {
                const perfMin = perfLabel === "High" ? 80 : perfLabel === "Mid" ? 60 : 0;
                const perfMax = perfLabel === "High" ? 100 : perfLabel === "Mid" ? 79 : 59;
                return [
                  <div
                    key={`yl-${rowIdx}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, fontSize: "0.72rem", color: "var(--text-muted)", width: 52 }}
                  >
                    {perfLabel} Perf
                  </div>,
                  ...(["Low", "Mid", "High"] as const).map((potLabel, colIdx) => {
                    const potMin = potLabel === "High" ? 4.0 : potLabel === "Mid" ? 3.5 : 0;
                    const names = OKR_DATA
                      .filter((o) =>
                        o.progress >= perfMin &&
                        o.progress <= perfMax &&
                        o.score360 >= potMin &&
                        (potLabel === "High" ? true : o.score360 < (potLabel === "Mid" ? 4.0 : 3.5)),
                      )
                      .map((o) => o.employee.split(" ")[0]);
                    const BOX_LABELS: Record<string, string> = {
                      "High-High": "★ Star",      "High-Mid": "High Impact", "High-Low": "Solid Pro",
                      "Mid-High":  "Growth Star",  "Mid-Mid":  "Core Pro",    "Mid-Low":  "Latent",
                      "Low-High":  "Enigma",       "Low-Mid":  "Inconsistent","Low-Low":  "Needs Focus",
                    };
                    const boxKey = `${perfLabel}-${potLabel}`;
                    const boxBg =
                      perfLabel === "High" && potLabel === "High"
                        ? "rgba(210,174,82,0.12)"
                        : perfLabel === "High" || potLabel === "High"
                        ? "rgba(64,183,126,0.08)"
                        : perfLabel === "Low" && potLabel === "Low"
                        ? "rgba(235,103,95,0.1)"
                        : "var(--bg-panel)";
                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        style={{ background: boxBg, border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px", minHeight: 72 }}
                      >
                        <p style={{ margin: "0 0 6px", fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {BOX_LABELS[boxKey]}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {names.length === 0 ? (
                            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>—</span>
                          ) : names.map((n) => (
                            <span key={n} style={{ fontSize: "0.72rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px", color: "var(--text-main)" }}>
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }),
                ];
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 2 }}>
              <div style={{ width: 52 }} />
              {["Low Potential", "Mid Potential", "High Potential"].map((lbl) => (
                <div key={lbl} style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-dim)", paddingTop: 6 }}>{lbl}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Scoring Engine Tab ── */}
      {activeTab === "scoring" && (
        <>
          {/* Formula Card */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(210,174,82,0.07)",
              border: "1px solid rgba(210,174,82,0.2)",
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: "0.86rem", color: "var(--gold)", fontWeight: 700, marginBottom: 10 }}>
              PRD Performance Formula (6 Parameters, Weighted)
            </p>
            <p style={{ fontFamily: "monospace", fontSize: "0.88rem", color: "var(--text-main)", lineHeight: 2 }}>
              Score = (KPI × 30%) + (Attendance × 15%) + (Productivity × 20%) + (Skills × 15%) + (Behaviour × 10%) + (Innovation × 10%)
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: 8 }}>
              Result: 0–5.0 Scale &nbsp;|&nbsp; Percentage = Score × 20 &nbsp;|&nbsp; Tenure bonus: 0.5%/year (max 5%)
            </p>
          </div>

          {/* Performance Level Legend */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { level: "Exceptional",    range: "90–100%", incr: "17–20%", color: "status-on-track" },
              { level: "Excellent",      range: "80–89%",  incr: "13–15%", color: "status-on-track" },
              { level: "Good",           range: "70–79%",  incr: "8–10%",  color: "status-watch"    },
              { level: "Satisfactory",   range: "60–69%",  incr: "4–5%",   color: "stage-roadmap"   },
              { level: "Below Average",  range: "<60%",    incr: "0%",     color: "status-risk"     },
            ].map((l) => (
              <div
                key={l.level}
                style={{ padding: "8px 12px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.78rem" }}
              >
                <span className={`status-chip ${l.color}`} style={{ fontSize: "0.7rem" }}>{l.level}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{l.range} · Increment: {l.incr}</span>
              </div>
            ))}
          </div>

          {/* Scores Table */}
          <div className="section-block">
            <div className="section-head">
              <h2>6-Parameter Score Breakdown</h2>
              <p>Individual parameter scores, computed composite score, and eligibility outcomes.</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>KPI (30%)</th>
                    <th>Attend. (15%)</th>
                    <th>Prod. (20%)</th>
                    <th>Skills (15%)</th>
                    <th>Behav. (10%)</th>
                    <th>Innov. (10%)</th>
                    <th>Score / 5</th>
                    <th>%</th>
                    <th>Level</th>
                    <th>Promotion</th>
                    <th>Increment</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPUTED.map((e) => (
                    <tr key={e.employee}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.employee}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{e.designation}</div>
                      </td>
                      <td className="mono">{e.kpi.toFixed(1)}</td>
                      <td className="mono">{e.attendance}%</td>
                      <td className="mono">{e.productivity.toFixed(1)}</td>
                      <td className="mono">{e.skills.toFixed(1)}</td>
                      <td className="mono">{e.behavior.toFixed(1)}</td>
                      <td className="mono">{e.innovation.toFixed(1)}</td>
                      <td className="mono" style={{ fontWeight: 700, color: "var(--gold)" }}>{e.totalScore.toFixed(2)}</td>
                      <td className="mono">{e.percentage}%</td>
                      <td><span className={`status-chip ${LEVEL_COLOR[e.level]}`}>{e.level}</span></td>
                      <td>
                        <span className={`status-chip ${e.promotionEligible ? "status-on-track" : "status-risk"}`}>
                          {e.promotionEligible ? "Eligible" : "Not Eligible"}
                        </span>
                      </td>
                      <td className="mono" style={{ color: e.incrementPct > 0 ? "var(--green)" : "var(--red)" }}>
                        {e.incrementPct > 0 ? `+${e.incrementPct}%` : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Promotion Criteria */}
          <div className="section-block">
            <div className="section-head">
              <h2>Auto-Promotion Eligibility Criteria</h2>
              <p>All conditions must be met for automatic promotion (zero bias, 100% transparent — per PRD).</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                { criterion: "Performance Score",      requirement: "≥ 80% (Excellent+)",    icon: "📊" },
                { criterion: "Tenure in Current Role", requirement: "≥ 2 years",             icon: "📅" },
                { criterion: "Attendance Rate",        requirement: "≥ 90%",                 icon: "⏱️" },
                { criterion: "Composite Score",        requirement: "≥ 4.0 / 5.0",          icon: "⭐" },
                { criterion: "Disciplinary Record",    requirement: "No major action",       icon: "⚖️" },
                { criterion: "Skills Assessment",      requirement: "Role competency passed", icon: "🎓" },
              ].map((c) => (
                <div
                  key={c.criterion}
                  style={{ padding: "12px 14px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8 }}
                >
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, margin: "0 0 4px" }}>{c.icon} {c.criterion}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{c.requirement}</p>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "0.88rem", color: "var(--gold)", marginBottom: 10 }}>Promotion Hierarchy (PRD)</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {["Junior Associate", "Senior Associate", "Executive", "Senior Manager", "Director", "VP / Head"].map((level, i, arr) => (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "6px 12px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 20, fontSize: "0.8rem" }}>
                    {level}
                  </span>
                  {i < arr.length - 1 && <span style={{ color: "var(--gold)", fontSize: "1rem" }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Annual Batch Review Tab ── */}
      {activeTab === "batch" && (
        <>
          {/* Batch processing hero */}
          <div
            style={{
              padding: "24px 28px",
              background: "linear-gradient(135deg, rgba(210,174,82,0.08), rgba(64,183,126,0.06))",
              border: "1px solid rgba(210,174,82,0.25)",
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", color: "var(--gold)", marginBottom: 6 }}>
              Annual Review — One-Click Batch Processing
            </h2>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Click the button below to process all 47 employees simultaneously. The system will calculate scores, check promotion eligibility, assign increments, generate letters, route approvals, and update payroll — automatically.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                onClick={runBatchProcess}
                disabled={processing}
                style={{ fontSize: "0.9rem", padding: "10px 24px", opacity: processing ? 0.7 : 1 }}
              >
                {processing ? "⚡ Processing..." : "▶ Process Annual Review"}
              </button>
              <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                ~47 employees · Target: &lt;5 minutes
              </span>
            </div>
          </div>

          {/* Processing Log */}
          {(processing || batchProcessed) && (
            <div className="section-block">
              <div className="section-head">
                <h2>Processing Log</h2>
                <p>Real-time status of each batch processing step.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BATCH_STEPS.slice(0, batchStep + 1).map((step, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8 }}
                  >
                    <span style={{ color: i === batchStep && processing ? "var(--amber)" : "var(--green)", fontSize: "1rem" }}>
                      {i === batchStep && processing ? "⏳" : "✓"}
                    </span>
                    <span style={{ fontSize: "0.84rem" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {batchProcessed && (
            <div className="section-block">
              <div className="section-head">
                <h2>Batch Processing Results</h2>
                <p>Annual review completed successfully. Summary of outcomes.</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Processed</p>
                  <p className="stat-value stat-green">47</p>
                  <p className="stat-note">100% employees reviewed</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Promotions</p>
                  <p className="stat-value" style={{ color: "var(--gold)" }}>
                    {COMPUTED.filter((e) => e.promotionEligible).length}
                  </p>
                  <p className="stat-note">Auto-assigned, zero bias</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Increments Given</p>
                  <p className="stat-value stat-green">
                    {COMPUTED.filter((e) => e.incrementPct > 0).length}
                  </p>
                  <p className="stat-note">With auto-calculated %</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Letters Generated</p>
                  <p className="stat-value">47</p>
                  <p className="stat-note">Increment + promotion letters</p>
                </div>
              </div>

              <table className="data-table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Level</th>
                    <th>Score</th>
                    <th>Increment</th>
                    <th>Promotion</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPUTED.map((e) => (
                    <tr key={e.employee}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.employee}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{e.dept}</div>
                      </td>
                      <td><span className={`status-chip ${LEVEL_COLOR[e.level]}`}>{e.level}</span></td>
                      <td className="mono">{e.totalScore.toFixed(2)} / 5 ({e.percentage}%)</td>
                      <td className="mono" style={{ color: e.incrementPct > 0 ? "var(--green)" : "var(--red)" }}>
                        {e.incrementPct > 0 ? `+${e.incrementPct}%` : "No increment"}
                      </td>
                      <td>
                        {e.promotionEligible
                          ? <span className="status-chip status-on-track">Promoted ✓</span>
                          : <span className="status-chip stage-roadmap">No change</span>}
                      </td>
                      <td style={{ fontSize: "0.78rem" }}>
                        {e.incrementPct > 0
                          ? <span style={{ color: "var(--text-muted)" }}>Letter generated · Payroll updated</span>
                          : <span style={{ color: "var(--text-dim)" }}>PIP recommended</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Appraisal Cycle Tab ── */}
      {activeTab === "appraisal" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Appraisal Cycle — FY 2025-26</h2>
            <p>Annual appraisal timeline, key milestones, and current status.</p>
          </div>
          <div className="timeline-strip">
            {[
              { label: "Goal Setting",        date: "Apr 2025", done: true  },
              { label: "Mid-Year Review",      date: "Oct 2025", done: true  },
              { label: "360° Feedback Open",   date: "Jan 2026", done: true  },
              { label: "Manager Ratings",      date: "Feb 2026", done: true  },
              { label: "Calibration",          date: "Mar 2026", done: false },
              { label: "Final Ratings",        date: "Apr 2026", done: false },
              { label: "Salary Revision",      date: "May 2026", done: false },
            ].map((step, i) => (
              <div key={i} className={`timeline-step${step.done ? " done" : ""}`}>
                <div className="timeline-dot" />
                <p className="timeline-label">{step.label}</p>
                <p className="timeline-date">{step.date}</p>
              </div>
            ))}
          </div>

          {/* Salary Increment Formula */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--gold)", marginBottom: 12 }}>Salary Increment Formula (PRD)</h3>
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(210,174,82,0.07)",
                border: "1px solid rgba(210,174,82,0.2)",
                borderRadius: 10,
                fontFamily: "monospace",
                fontSize: "0.88rem",
                lineHeight: 2,
                color: "var(--text-main)",
              }}
            >
              <div>New Salary = Current Salary × (1 + Total Increment%)</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Total Increment = Base Increment + Tenure Bonus (0.5%/yr, max 5%) + Inflation (2–3%) + Promotion Bonus (5%) + Special Achievement
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
