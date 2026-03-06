import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DashboardData } from "../types";

export default function Overview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/dashboard")
      .then(setData)
      .catch(() => {/* use mock fallback */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div style={{ height: 28, width: 220, background: "var(--border)", borderRadius: 8 }} />
          <div style={{ height: 14, width: 320, background: "var(--border)", borderRadius: 6, marginTop: 8 }} />
        </div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card" style={{ minHeight: 100 }} />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summaryCards ?? [
    { label: "Total Employees",    value: "247",   trend: "+12 this month" },
    { label: "Active Jobs",         value: "18",    trend: "8 interviews scheduled" },
    { label: "Payroll This Month",  value: "₹1.8Cr", trend: "Processed on time" },
    { label: "Open Tickets",        value: "34",    trend: "5 high priority" },
  ];

  const kpis = data?.kpis ?? [
    { label: "Onboarding Completion",   value: "94%",  status: "on-track" as const },
    { label: "Attendance Rate",         value: "91%",  status: "on-track" as const },
    { label: "Pending Appraisals",      value: "12",   status: "watch" as const },
    { label: "Compliance Score",        value: "88%",  status: "on-track" as const },
    { label: "Attrition Rate",          value: "8.4%", status: "watch" as const },
    { label: "Payroll Accuracy",        value: "99.6%",status: "on-track" as const },
  ];

  const modules = data?.modules ?? [
    { id: "ats",         title: "AI ATS",          automation: 88, stage: "production-ready" as const, highlights: ["JD generation","AI scoring","Pipeline automation"] },
    { id: "payroll",     title: "Smart Payroll",   automation: 95, stage: "production-ready" as const, highlights: ["Auto-compute","Statutory","Parents Split"] },
    { id: "performance", title: "Performance",     automation: 72, stage: "production-ready" as const, highlights: ["OKRs","360° feedback","Appraisals"] },
    { id: "lms",         title: "LMS",             automation: 65, stage: "beta"             as const, highlights: ["AI paths","Blockchain certs","Assessments"] },
    { id: "gamification",title: "Gamification",    automation: 78, stage: "production-ready" as const, highlights: ["Bronze→Diamond","Leaderboard","Rewards"] },
    { id: "expense",     title: "Expense Mgmt",   automation: 81, stage: "production-ready" as const, highlights: ["AI validation","GST credit","Multi-level"] },
  ];

  const stageColor: Record<string, string> = {
    "production-ready": "status-on-track",
    "beta":             "stage-beta",
    "roadmap":          "stage-roadmap",
  };

  const workflows = data?.workflows ?? [
    { event: "New Hire Joined",       steps: ["Account creation","Equipment provisioning","Training assignment","Buddy allocation","Day-1 check-in"] },
    { event: "Resignation Submitted", steps: ["Manager notified","Exit interview scheduled","KT tracking","Asset recovery","F&F calculation"] },
    { event: "Payroll Cycle Start",   steps: ["Attendance sync","LOP calculation","TDS compute","Approval workflow","Bank disbursement"] },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Command Center</h1>
        <p className="page-sub">Real-time visibility across all HR operations — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>

      {/* Summary KPIs */}
      <div className="stats-grid">
        {summary.map((card) => (
          <div key={card.label} className="stat-card">
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p className="stat-note">{card.trend}</p>
          </div>
        ))}
      </div>

      {/* Health KPIs */}
      <div className="section-block">
        <div className="section-head">
          <h2>System Health Indicators</h2>
          <p>Key metrics across all active modules — updated in real-time.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                padding: "14px 16px",
                background: "var(--bg-panel)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{kpi.label}</span>
              <span className={`status-chip ${stageColor[kpi.status] ?? "stage-roadmap"}`}>{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Automation */}
      <div className="section-block">
        <div className="section-head">
          <h2>Module Automation Coverage</h2>
          <p>AI automation level across active HRMS modules.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modules.map((mod) => (
            <div key={mod.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ minWidth: 160, fontSize: "0.84rem", fontWeight: 600, color: "var(--text-main)" }}>
                {mod.title}
              </div>
              <span className={`status-chip ${stageColor[mod.stage]}`} style={{ flexShrink: 0 }}>
                {mod.stage}
              </span>
              <div style={{ flex: 1, maxWidth: 300 }}>
                <div className="automation-track">
                  <div
                    className="automation-fill"
                    style={{
                      width: `${mod.automation}%`,
                      background: mod.automation >= 80
                        ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                        : "linear-gradient(90deg,#d2ae52,#f0d79a)",
                    }}
                  />
                </div>
              </div>
              <span className="mono" style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 36 }}>
                {mod.automation}%
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {mod.highlights.map((h) => (
                  <span key={h} style={{
                    fontSize: "0.65rem",
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}>{h}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows */}
      <div className="section-block">
        <div className="section-head">
          <h2>Automated Workflows</h2>
          <p>Trigger-based automation sequences running in the background.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {workflows.map((wf) => (
            <div key={wf.event} style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "14px 16px",
            }}>
              <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 10px" }}>
                🔁 {wf.event}
              </p>
              <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
                {wf.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--gold-dim)",
                      border: "1px solid var(--border-gold)",
                      color: "var(--gold)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>{step}</span>
                    {i < wf.steps.length - 1 && (
                      <span style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0 6px" }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
