import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AILayer = {
  id: string;
  number: number;
  name: string;
  description: string;
  icon: string;
  status: "active" | "beta" | "roadmap";
  models: string[];
  metrics: { label: string; value: string }[];
  lastRun: string;
  accuracy: number;
  enabled: boolean;
};

type AIActivity = {
  id: string;
  time: string;
  layer: string;
  event: string;
  result: string;
  confidence: number;
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_LAYERS: AILayer[] = [
  {
    id: "l1",
    number: 1,
    name: "Talent Intelligence Engine",
    description: "AI-powered candidate screening, resume parsing, skill extraction, and culture-fit scoring across all applicants in real-time.",
    icon: "🧠",
    status: "active",
    models: ["GPT-4 Turbo", "Custom NLP v3", "Vector Embeddings"],
    metrics: [
      { label: "Resumes Parsed", value: "12,847" },
      { label: "Avg Parse Time", value: "1.2s" },
      { label: "Accuracy", value: "96.4%" },
    ],
    lastRun: "2 min ago",
    accuracy: 96,
    enabled: true,
  },
  {
    id: "l2",
    number: 2,
    name: "Performance Prediction AI",
    description: "Predicts employee performance trajectories using 6-parameter scoring, behavioral patterns, engagement signals, and historical data.",
    icon: "📈",
    status: "active",
    models: ["XGBoost v2", "Time-Series LSTM", "Behavioral NLP"],
    metrics: [
      { label: "Employees Scored", value: "847" },
      { label: "Prediction Horizon", value: "6 months" },
      { label: "MAE Score", value: "±0.3" },
    ],
    lastRun: "15 min ago",
    accuracy: 89,
    enabled: true,
  },
  {
    id: "l3",
    number: 3,
    name: "Attrition Risk Forecaster",
    description: "Identifies flight-risk employees 90 days in advance using 40+ signals: tenure, satisfaction scores, peer comparison, and market benchmarks.",
    icon: "🔮",
    status: "active",
    models: ["Gradient Boosting", "Survival Analysis", "Sentiment BERT"],
    metrics: [
      { label: "High-Risk Flags", value: "23" },
      { label: "False Positive Rate", value: "8.2%" },
      { label: "Lead Time", value: "90 days" },
    ],
    lastRun: "1 hr ago",
    accuracy: 91,
    enabled: true,
  },
  {
    id: "l4",
    number: 4,
    name: "Smart Learning Recommender",
    description: "Personalised learning paths built from skill gaps, role roadmap, engagement patterns, and industry benchmarks via collaborative filtering.",
    icon: "🎓",
    status: "active",
    models: ["Collaborative Filtering", "Knowledge Graph", "GPT-4 Mini"],
    metrics: [
      { label: "Recommendations/Day", value: "3,200" },
      { label: "Acceptance Rate", value: "68%" },
      { label: "Completion Lift", value: "+41%" },
    ],
    lastRun: "30 min ago",
    accuracy: 84,
    enabled: true,
  },
  {
    id: "l5",
    number: 5,
    name: "Payroll Anomaly Detector",
    description: "Detects salary discrepancies, ghost employees, duplicate payments, and statutory compliance gaps before every payroll run.",
    icon: "💸",
    status: "active",
    models: ["Isolation Forest", "Statistical Z-Score", "Rule Engine v4"],
    metrics: [
      { label: "Anomalies Caught", value: "147" },
      { label: "Amount Saved", value: "₹18.4L" },
      { label: "False Alarm Rate", value: "2.1%" },
    ],
    lastRun: "Payroll cycle",
    accuracy: 97,
    enabled: true,
  },
  {
    id: "l6",
    number: 6,
    name: "Engagement Pulse AI",
    description: "Continuous sentiment analysis from survey responses, check-in signals, and communication patterns to surface team morale in real-time.",
    icon: "❤️",
    status: "beta",
    models: ["BERT Sentiment", "eNPS Model", "Pulse Analytics"],
    metrics: [
      { label: "Surveys Analysed", value: "5,621" },
      { label: "Avg eNPS Score", value: "47" },
      { label: "Sentiment Accuracy", value: "88%" },
    ],
    lastRun: "4 hr ago",
    accuracy: 88,
    enabled: true,
  },
  {
    id: "l7",
    number: 7,
    name: "Compliance Guardian",
    description: "Automated statutory compliance monitoring: PF, ESI, TDS, labour law alerts, and audit trail generation with zero manual intervention.",
    icon: "⚖️",
    status: "beta",
    models: ["Rule Engine v5", "Legal NLP", "RegTech Classifier"],
    metrics: [
      { label: "Rules Monitored", value: "284" },
      { label: "Alerts Raised", value: "31" },
      { label: "Compliance Score", value: "98.7%" },
    ],
    lastRun: "12 hr ago",
    accuracy: 99,
    enabled: false,
  },
  {
    id: "l8",
    number: 8,
    name: "CEO Intelligence Briefing",
    description: "Executive-level AI synthesis of workforce KPIs, revenue-per-employee trends, headcount forecasting, and board-ready narrative generation.",
    icon: "👔",
    status: "roadmap",
    models: ["GPT-4o", "Financial ML", "Narrative Gen v2"],
    metrics: [
      { label: "Briefings Generated", value: "24" },
      { label: "Data Sources", value: "18" },
      { label: "Avg Read Time", value: "3 min" },
    ],
    lastRun: "Daily 6 AM",
    accuracy: 93,
    enabled: false,
  },
];

const ACTIVITY_LOG: AIActivity[] = [
  { id: "a1",  time: "09:42 AM", layer: "Talent Intelligence",        event: "Resume batch processed",           result: "48 parsed, 12 shortlisted",           confidence: 94 },
  { id: "a2",  time: "09:38 AM", layer: "Attrition Forecaster",       event: "Risk re-evaluation triggered",     result: "3 new high-risk flags raised",        confidence: 87 },
  { id: "a3",  time: "09:21 AM", layer: "Payroll Anomaly Detector",   event: "Pre-payroll scan completed",       result: "2 anomalies detected, escalated",     confidence: 99 },
  { id: "a4",  time: "09:10 AM", layer: "Learning Recommender",       event: "Skill gap analysis run",           result: "142 new paths recommended",           confidence: 81 },
  { id: "a5",  time: "08:55 AM", layer: "Performance Prediction",     event: "Monthly batch scoring",            result: "847 employees re-scored",             confidence: 91 },
  { id: "a6",  time: "08:30 AM", layer: "Engagement Pulse",           event: "Weekly sentiment sweep",           result: "eNPS: 47 (+3 from last week)",        confidence: 88 },
  { id: "a7",  time: "07:00 AM", layer: "CEO Intelligence",           event: "Executive briefing generated",     result: "Board deck draft ready",              confidence: 93 },
  { id: "a8",  time: "06:45 AM", layer: "Compliance Guardian",        event: "Statutory calendar check",         result: "PF due in 5 days — reminder sent",    confidence: 100 },
  { id: "a9",  time: "Yesterday", layer: "Talent Intelligence",       event: "Job description auto-generated",   result: "3 JDs created from role templates",   confidence: 89 },
  { id: "a10", time: "Yesterday", layer: "Attrition Forecaster",      event: "Model retrained on Q4 data",       result: "Accuracy improved from 89% → 91%",    confidence: 95 },
];

const BUSINESS_IMPACT = [
  { icon: "⏱", label: "Time-to-Hire Reduced",       value: "37%",     desc: "vs. manual process" },
  { icon: "💰", label: "Payroll Savings (YTD)",       value: "₹18.4L",  desc: "Anomalies prevented" },
  { icon: "📉", label: "Attrition Reduction",         value: "22%",     desc: "Since AI deployment" },
  { icon: "🎓", label: "Learning Completion Lift",    value: "+41%",    desc: "AI-recommended paths" },
  { icon: "🔍", label: "Compliance Violations Avoided", value: "31",   desc: "Auto-flagged this year" },
  { icon: "📊", label: "HR Ops Hours Saved/Month",   value: "280 hrs", desc: "Automation ROI" },
];

function statusChip(s: AILayer["status"]) {
  if (s === "active")   return <span className="status-chip status-on-track">● Live</span>;
  if (s === "beta")     return <span className="status-chip stage-beta">◐ Beta</span>;
  return <span className="status-chip stage-roadmap">○ Roadmap</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AIHub() {
  const [layers, setLayers] = useState<AILayer[]>(INITIAL_LAYERS);
  const [tab, setTab] = useState<"layers" | "activity" | "impact">("layers");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleEnabled(id: string) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  }

  const activeCount  = layers.filter((l) => l.status === "active").length;
  const betaCount    = layers.filter((l) => l.status === "beta").length;
  const enabledCount = layers.filter((l) => l.enabled).length;
  const avgAccuracy  = Math.round(layers.filter(l => l.status !== "roadmap").reduce((s, l) => s + l.accuracy, 0) / layers.filter(l => l.status !== "roadmap").length);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="section-head" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
            ✦ 8-Layer AI Intelligence Hub
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Unified control center for all AI/ML systems powering your HRMS platform
          </p>
        </div>
        <span className="status-chip status-on-track" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
          {enabledCount} / {layers.length} Active
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "AI Layers",      value: layers.length,  sub: "Total intelligence layers" },
          { label: "Live Now",       value: activeCount,    sub: "Production-ready layers" },
          { label: "In Beta",        value: betaCount,      sub: "Testing & validation" },
          { label: "Avg Accuracy",   value: `${avgAccuracy}%`, sub: "Across active models" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {([["layers", "⚙️ AI Layers"], ["activity", "📋 Activity Log"], ["impact", "📊 Business Impact"]] as const).map(([key, label]) => (
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

      {/* ── AI Layers Tab ─────────────────────────────────────────────────── */}
      {tab === "layers" && (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {layers.map((layer) => {
            const expanded = expandedId === layer.id;
            return (
              <div key={layer.id} className="section-block" style={{ padding: "1.1rem 1.25rem" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : layer.id)}
                >
                  {/* Layer number badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: layer.enabled
                      ? "linear-gradient(135deg,var(--gold),#7a5c1e)"
                      : "rgba(255,255,255,0.08)",
                    color: layer.enabled ? "#000" : "var(--text-muted)",
                    fontWeight: 800, fontSize: "0.9rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    L{layer.number}
                  </div>

                  <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{layer.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{layer.name}</span>
                      {statusChip(layer.status)}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
                      Last run: {layer.lastRun} · Accuracy: {layer.accuracy}%
                    </div>
                  </div>

                  {/* Accuracy bar */}
                  <div style={{ width: 80, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: "0.8rem", color: layer.accuracy >= 90 ? "#22c55e" : "var(--gold)" }}>
                      {layer.accuracy}%
                    </span>
                    <div className="automation-track" style={{ width: 80 }}>
                      <div
                        className="automation-fill"
                        style={{
                          width: `${layer.accuracy}%`,
                          background: layer.accuracy >= 90 ? "#22c55e" : "var(--gold)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Toggle */}
                  <div
                    style={{
                      width: 42, height: 24, borderRadius: 12,
                      background: layer.enabled ? "var(--gold)" : "rgba(255,255,255,0.12)",
                      position: "relative", cursor: "pointer", flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(layer.id); }}
                    title={layer.enabled ? "Disable" : "Enable"}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#fff",
                      position: "absolute", top: 3,
                      left: layer.enabled ? 21 : 3,
                      transition: "left 0.2s",
                    }} />
                  </div>

                  <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>{expanded ? "▲" : "▼"}</span>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.6 }}>
                      {layer.description}
                    </p>

                    {/* Models */}
                    <div style={{ marginBottom: "0.9rem" }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 5 }}>Models & Engines</div>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {layer.models.map((m) => (
                          <span key={m} style={{
                            background: "rgba(210,174,82,0.1)",
                            border: "1px solid rgba(210,174,82,0.25)",
                            borderRadius: 5, padding: "3px 9px",
                            fontSize: "0.78rem", color: "var(--gold)",
                          }}>{m}</span>
                        ))}
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {layer.metrics.map((m) => (
                        <div key={m.label} style={{
                          flex: "1 1 100px",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 8, padding: "0.6rem 0.75rem",
                          textAlign: "center",
                        }}>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{m.value}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Activity Log Tab ──────────────────────────────────────────────── */}
      {tab === "activity" && (
        <div className="section-block" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>AI Layer</th>
                <th>Event</th>
                <th>Result</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY_LOG.map((a) => (
                <tr key={a.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{a.time}</td>
                  <td>
                    <span style={{
                      background: "rgba(210,174,82,0.1)",
                      border: "1px solid rgba(210,174,82,0.25)",
                      borderRadius: 5, padding: "2px 8px",
                      fontSize: "0.78rem", color: "var(--gold)",
                    }}>{a.layer}</span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{a.event}</td>
                  <td style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>{a.result}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="automation-track" style={{ width: 60 }}>
                        <div
                          className="automation-fill"
                          style={{
                            width: `${a.confidence}%`,
                            background: a.confidence >= 90 ? "#22c55e" : "var(--gold)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.8rem" }}>{a.confidence}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Business Impact Tab ───────────────────────────────────────────── */}
      {tab === "impact" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {BUSINESS_IMPACT.map((b) => (
              <div key={b.label} className="section-block" style={{ padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{b.icon}</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--gold)" }}>{b.value}</div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", margin: "4px 0" }}>{b.label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{b.desc}</div>
              </div>
            ))}
          </div>

          {/* Layer accuracy comparison chart */}
          <div className="section-block" style={{ padding: "1.25rem" }}>
            <div className="section-head" style={{ marginBottom: "1rem" }}>
              <span style={{ fontWeight: 600 }}>Model Accuracy by Layer</span>
            </div>
            {layers.map((layer) => (
              <div key={layer.id} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem", marginBottom: 4 }}>
                  <span>L{layer.number} · {layer.name}</span>
                  <span style={{ color: layer.accuracy >= 90 ? "#22c55e" : "var(--gold)" }}>
                    {layer.accuracy}%
                  </span>
                </div>
                <div className="chart-bar-row">
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${layer.accuracy}%`,
                        background: layer.accuracy >= 95
                          ? "#22c55e"
                          : layer.accuracy >= 85
                          ? "var(--gold)"
                          : "#64748b",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ROI summary box */}
          <div className="section-block" style={{
            marginTop: "1rem",
            padding: "1.25rem",
            background: "rgba(210,174,82,0.05)",
            border: "1px solid rgba(210,174,82,0.2)",
          }}>
            <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>✦ AI Platform ROI Summary</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.7 }}>
              The 8-layer AI intelligence system has delivered measurable ROI across all HR functions.
              Talent acquisition efficiency improved by <strong style={{ color: "var(--gold)" }}>37%</strong>,
              payroll anomaly detection prevented <strong style={{ color: "var(--gold)" }}>₹18.4L</strong> in losses,
              and attrition dropped <strong style={{ color: "var(--gold)" }}>22%</strong> after predictive
              interventions. Cumulatively, the platform automates <strong style={{ color: "var(--gold)" }}>280+ HR hours/month</strong>,
              translating to approximately <strong style={{ color: "var(--gold)" }}>₹4.2L/month</strong> in operational savings.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
