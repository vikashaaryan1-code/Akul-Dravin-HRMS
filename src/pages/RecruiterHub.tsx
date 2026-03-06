import { useState } from "react";
import { usePersistentState } from "../lib/usePersistentState";

type JobStatus = "Active" | "Paused" | "Closed" | "Draft";
type PipelineStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";
type CommissionStatus = "Paid" | "Processing" | "Pending";

type JobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  applicants: number;
  status: JobStatus;
  posted: string;
};

type PipelineCandidate = {
  id: string;
  name: string;
  job: string;
  aiScore: number;
  stage: PipelineStage;
  daysInStage: number;
  source: string;
};

type CommissionRecord = {
  id: string;
  candidate: string;
  company: string;
  role: string;
  monthlySalary: number;
  commissionPct: number;
  amount: number;
  status: CommissionStatus;
  date: string;
};

const DEFAULT_JOBS: JobPosting[] = [
  { id: "j1", title: "Senior Software Engineer",  company: "TechCorp India",   location: "Bangalore",  type: "Full Time",  salary: "₹18–24 LPA", applicants: 47, status: "Active", posted: "2026-03-01" },
  { id: "j2", title: "Product Manager",           company: "StartupX",         location: "Mumbai",     type: "Full Time",  salary: "₹20–30 LPA", applicants: 23, status: "Active", posted: "2026-02-28" },
  { id: "j3", title: "UX Designer",              company: "DesignLab",        location: "Pune",       type: "Remote",     salary: "₹12–18 LPA", applicants: 31, status: "Active", posted: "2026-02-25" },
  { id: "j4", title: "Data Scientist",           company: "Analytics Pro",    location: "Hyderabad",  type: "Full Time",  salary: "₹22–32 LPA", applicants: 18, status: "Paused", posted: "2026-02-20" },
  { id: "j5", title: "Sales Manager",            company: "GrowthCorp",       location: "Delhi",      type: "Full Time",  salary: "₹15–22 LPA", applicants: 55, status: "Active", posted: "2026-03-02" },
  { id: "j6", title: "DevOps Engineer",          company: "CloudSystems",     location: "Remote",     type: "Remote",     salary: "₹20–28 LPA", applicants: 12, status: "Draft",  posted: "2026-03-03" },
];

const DEFAULT_PIPELINE: PipelineCandidate[] = [
  { id: "p1",  name: "Arjun Sharma",   job: "Senior Software Engineer", aiScore: 92, stage: "Applied",   daysInStage: 1,  source: "Platform"  },
  { id: "p2",  name: "Meera Pillai",   job: "Product Manager",          aiScore: 85, stage: "Screening", daysInStage: 3,  source: "Platform"  },
  { id: "p3",  name: "Kiran Desai",    job: "UX Designer",              aiScore: 78, stage: "Interview", daysInStage: 5,  source: "Referral"  },
  { id: "p4",  name: "Suresh Reddy",   job: "Senior Software Engineer", aiScore: 95, stage: "Offer",     daysInStage: 2,  source: "Platform"  },
  { id: "p5",  name: "Pooja Menon",    job: "Data Scientist",           aiScore: 88, stage: "Applied",   daysInStage: 1,  source: "Naukri"    },
  { id: "p6",  name: "Amit Joshi",     job: "DevOps Engineer",          aiScore: 72, stage: "Screening", daysInStage: 4,  source: "Platform"  },
  { id: "p7",  name: "Deepa Krishnan", job: "Sales Manager",            aiScore: 90, stage: "Hired",     daysInStage: 12, source: "Referral"  },
  { id: "p8",  name: "Vikash Singh",   job: "Sales Manager",            aiScore: 68, stage: "Rejected",  daysInStage: 6,  source: "LinkedIn"  },
  { id: "p9",  name: "Neha Gupta",     job: "Product Manager",          aiScore: 82, stage: "Interview", daysInStage: 2,  source: "Platform"  },
  { id: "p10", name: "Rohit Verma",    job: "Data Scientist",           aiScore: 76, stage: "Applied",   daysInStage: 2,  source: "Indeed"    },
];

const DEFAULT_COMMISSIONS: CommissionRecord[] = [
  { id: "c1", candidate: "Deepa Krishnan", company: "GrowthCorp",    role: "Sales Manager",    monthlySalary: 220000, commissionPct: 15, amount: 33000, status: "Paid",       date: "2026-03-01" },
  { id: "c2", candidate: "Priti Singh",    company: "TechCorp India", role: "Junior Developer", monthlySalary: 120000, commissionPct: 15, amount: 18000, status: "Processing", date: "2026-02-20" },
  { id: "c3", candidate: "Anil Kumar",     company: "DesignLab",      role: "UX Lead",          monthlySalary: 180000, commissionPct: 15, amount: 27000, status: "Pending",    date: "2026-03-03" },
  { id: "c4", candidate: "Sonali Mehta",   company: "Analytics Pro",  role: "Data Engineer",    monthlySalary: 200000, commissionPct: 15, amount: 30000, status: "Paid",       date: "2026-01-15" },
];

const NEXT_STAGE: Partial<Record<PipelineStage, PipelineStage>> = {
  Applied:   "Screening",
  Screening: "Interview",
  Interview: "Offer",
  Offer:     "Hired",
};

const JOB_STATUS_COLOR: Record<JobStatus, string> = {
  Active:  "status-on-track",
  Paused:  "status-watch",
  Closed:  "stage-roadmap",
  Draft:   "status-risk",
};

const COMM_COLOR: Record<CommissionStatus, string> = {
  Paid:       "status-on-track",
  Processing: "status-watch",
  Pending:    "stage-roadmap",
};

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function RecruiterHub() {
  const [jobs] = usePersistentState<JobPosting[]>("hrms_recruiter_jobs", DEFAULT_JOBS);
  const [pipeline, setPipeline] = usePersistentState<PipelineCandidate[]>("hrms_recruiter_pipeline", DEFAULT_PIPELINE);
  const [commissions] = usePersistentState<CommissionRecord[]>("hrms_commissions", DEFAULT_COMMISSIONS);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "pipeline" | "earnings" | "performance">("overview");

  const activeJobs = jobs.filter((j) => j.status === "Active").length;
  const pipelineActive = pipeline.filter((p) => !["Hired", "Rejected"].includes(p.stage)).length;
  const totalCommission = commissions.reduce((s, c) => s + c.amount, 0);
  const hired = pipeline.filter((p) => p.stage === "Hired").length;
  const placementRate = pipeline.length > 0 ? Math.round((hired / pipeline.length) * 100) : 0;

  function moveNext(id: string) {
    setPipeline((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = NEXT_STAGE[p.stage];
        return next ? { ...p, stage: next, daysInStage: 0 } : p;
      }),
    );
  }

  function reject(id: string) {
    setPipeline((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage: "Rejected", daysInStage: 0 } : p)),
    );
  }

  const TABS = [
    { key: "overview"    as const, label: "🏠 Overview"    },
    { key: "jobs"        as const, label: "💼 My Jobs"     },
    { key: "pipeline"    as const, label: "📋 Pipeline"    },
    { key: "earnings"    as const, label: "💰 Earnings"    },
    { key: "performance" as const, label: "📊 Performance" },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Recruiter Hub</h1>
        <p className="page-sub">Multi-Type Recruiter Marketplace · Job Pipeline · Commission Tracking · AI Candidate Matching</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Active Jobs</p>
          <p className="stat-value stat-green">{activeJobs}</p>
          <p className="stat-note">Live job postings</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In Pipeline</p>
          <p className="stat-value">{pipelineActive}</p>
          <p className="stat-note">Active candidates</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Commission Earned</p>
          <p className="stat-value stat-amber">{fmt(totalCommission)}</p>
          <p className="stat-note">This financial year</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Placement Rate</p>
          <p className="stat-value stat-green">{placementRate}%</p>
          <p className="stat-note">Platform avg: 18%</p>
        </div>
      </div>

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

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <>
          <div className="section-block">
            <div className="section-head">
              <h2>Recruiter Types on Platform</h2>
              <p>Multi-type recruiter ecosystem — 5 categories with distinct revenue models (v11.0 PRD).</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
              {[
                { type: "Internal Recruiter",       icon: "🏢", count: 1247,  model: "Salaried",           color: "status-on-track", desc: "In-house HR / recruitment team"            },
                { type: "Agency Recruiter",         icon: "🏦", count: 8420,  model: "15% Commission",     color: "stage-beta",      desc: "Multi-client recruitment agencies"          },
                { type: "Freelance Recruiter",      icon: "💼", count: 23100, model: "15% Commission",     color: "status-watch",    desc: "Independent solo recruiters"               },
                { type: "Global Recruiter Partner", icon: "🌐", count: 892,   model: "20% + Rev Share",    color: "stage-roadmap",   desc: "International placement partners"          },
                { type: "AI Recruiter Bot",         icon: "🤖", count: 50,    model: "Platform Sub.",      color: "status-on-track", desc: "AI-powered automated recruiting"           },
              ].map((r) => (
                <div key={r.type} className="section-block" style={{ margin: 0, padding: "1rem" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "1.5rem" }}>{r.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{r.type}</span>
                  </div>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.5 }}>{r.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--gold)" }}>{r.count.toLocaleString()}</span>
                    <span className={`status-chip ${r.color}`} style={{ fontSize: "0.62rem" }}>{r.model}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-block">
            <div className="section-head">
              <h2>Marketplace Snapshot</h2>
              <p>Live activity across the entire recruiter marketplace.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 10 }}>
              {[
                { label: "Jobs Active",           value: "12,840", icon: "💼", note: "+340 today"            },
                { label: "Candidates Applied",    value: "98,200", icon: "👤", note: "+2,100 this week"      },
                { label: "Interviews Scheduled",  value: "4,320",  icon: "📅", note: "Next 7 days"           },
                { label: "Offers Extended",       value: "1,890",  icon: "📋", note: "This month"            },
                { label: "Hires Completed",       value: "743",    icon: "✅", note: "This month"            },
                { label: "Commission Disbursed",  value: "₹2.4Cr", icon: "💰", note: "This FY"              },
              ].map((s) => (
                <div key={s.label} style={{ padding: "14px 16px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8 }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.icon} {s.label}</p>
                  <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--gold)", margin: "0 0 2px" }}>{s.value}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>{s.note}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Jobs ── */}
      {activeTab === "jobs" && (
        <div className="section-block">
          <div className="section-head">
            <h2>My Job Postings</h2>
            <p>Manage all active, paused, draft, and closed job listings.</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Type</th>
                <th>Salary</th>
                <th>Applicants</th>
                <th>Posted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600 }}>{job.title}</td>
                  <td>{job.company}</td>
                  <td>{job.location}</td>
                  <td>{job.type}</td>
                  <td className="mono" style={{ color: "var(--gold)", fontWeight: 600 }}>{job.salary}</td>
                  <td className="mono">{job.applicants}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{job.posted}</td>
                  <td><span className={`status-chip ${JOB_STATUS_COLOR[job.status]}`}>{job.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pipeline Kanban ── */}
      {activeTab === "pipeline" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Candidate Pipeline</h2>
            <p>AI-scored candidates across all hiring stages. Drag-free Kanban — use action buttons to advance or reject.</p>
          </div>
          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div style={{ display: "flex", gap: 12, minWidth: 860 }}>
              {(["Applied", "Screening", "Interview", "Offer", "Hired"] as PipelineStage[]).map((stage) => {
                const stageCands = pipeline.filter((p) => p.stage === stage);
                return (
                  <div key={stage} style={{ flex: 1, minWidth: 155 }}>
                    <div style={{ padding: "7px 12px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderBottom: "none", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{stage}</span>
                      <span style={{ fontSize: "0.7rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "1px 7px", color: "var(--gold)" }}>{stageCands.length}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "0 0 8px 8px", padding: 8, minHeight: 130, display: "flex", flexDirection: "column", gap: 8 }}>
                      {stageCands.map((c) => (
                        <div key={c.id} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 10px 8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>{c.name}</span>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: c.aiScore >= 85 ? "var(--green)" : c.aiScore >= 70 ? "var(--amber)" : "var(--red)" }}>{c.aiScore}%</span>
                          </div>
                          <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "0 0 5px", lineHeight: 1.3 }}>{c.job}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.64rem", color: "var(--text-dim)", marginBottom: 6 }}>
                            <span>{c.source}</span>
                            <span style={{ color: c.daysInStage > 5 ? "var(--amber)" : "inherit" }}>{c.daysInStage}d</span>
                          </div>
                          {NEXT_STAGE[c.stage] && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="table-action-btn" style={{ flex: 1, fontSize: "0.64rem", padding: "3px 4px" }} onClick={() => moveNext(c.id)}>
                                → {NEXT_STAGE[c.stage]}
                              </button>
                              <button className="table-action-btn" style={{ fontSize: "0.64rem", padding: "3px 6px", color: "var(--red)" }} onClick={() => reject(c.id)}>
                                ✕
                              </button>
                            </div>
                          )}
                          {c.stage === "Hired" && (
                            <span className="status-chip status-on-track" style={{ fontSize: "0.6rem" }}>Hired ✓</span>
                          )}
                        </div>
                      ))}
                      {stageCands.length === 0 && (
                        <p style={{ color: "var(--text-dim)", fontSize: "0.72rem", textAlign: "center", paddingTop: 18 }}>Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {pipeline.filter((p) => p.stage === "Rejected").length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: 8 }}>Rejected ({pipeline.filter((p) => p.stage === "Rejected").length})</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {pipeline.filter((p) => p.stage === "Rejected").map((c) => (
                  <div key={c.id} style={{ padding: "5px 12px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span>{c.name}</span>
                    <span className="status-chip status-risk" style={{ fontSize: "0.6rem" }}>Rejected</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Earnings ── */}
      {activeTab === "earnings" && (
        <div className="section-block">
          <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2>Commission Earnings</h2>
              <p>Revenue from successful candidate placements via the marketplace.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.76rem", color: "var(--text-dim)", margin: 0 }}>Total Earned</p>
              <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>{fmt(totalCommission)}</p>
            </div>
          </div>
          <div style={{ padding: "10px 14px", background: "rgba(210,174,82,0.07)", border: "1px solid rgba(210,174,82,0.2)", borderRadius: 8, marginBottom: 16, fontSize: "0.8rem", color: "var(--text-muted)" }}>
            💡 Commission = ~15% of candidate's first month salary (Standard) | 20% for Enterprise recruiters
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Company</th>
                <th>Role</th>
                <th>Monthly Salary</th>
                <th>Rate</th>
                <th>Commission</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.candidate}</td>
                  <td>{c.company}</td>
                  <td>{c.role}</td>
                  <td className="mono">{fmt(c.monthlySalary)}</td>
                  <td className="mono">{c.commissionPct}%</td>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--gold)" }}>{fmt(c.amount)}</td>
                  <td style={{ fontSize: "0.78rem" }}>{c.date}</td>
                  <td><span className={`status-chip ${COMM_COLOR[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Performance ── */}
      {activeTab === "performance" && (
        <>
          <div className="section-block">
            <div className="section-head">
              <h2>Recruiter Performance Metrics</h2>
              <p>KPIs tracked by platform for ranking, premium access, and commission tier upgrades.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 12 }}>
              {[
                { label: "Placement Success Rate",  value: `${placementRate}%`,  note: "Platform avg: 18%",          icon: "✅", good: placementRate >= 18 },
                { label: "Avg Time-to-Submit",      value: "3.2 days",           note: "Platform avg: 5.1 days",     icon: "⚡", good: true                },
                { label: "Candidate Quality Score", value: "4.3 / 5",           note: "Post-6 month performance",   icon: "⭐", good: true                },
                { label: "Client Satisfaction",     value: "4.6 / 5",           note: "Hiring company rating",      icon: "😊", good: true                },
                { label: "Avg Response Time",       value: "< 2 hours",          note: "Candidate response time",    icon: "⏱️", good: true               },
                { label: "Platform Ranking",        value: "#12",               note: "Out of 33,600 recruiters",   icon: "🏆", good: true                },
              ].map((m) => (
                <div key={m.label} style={{ padding: "14px 16px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8 }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: "0 0 4px" }}>{m.icon} {m.label}</p>
                  <p style={{ fontWeight: 700, fontSize: "1.25rem", color: m.good ? "var(--green)" : "var(--amber)", margin: "0 0 2px" }}>{m.value}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>{m.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-block">
            <div className="section-head">
              <h2>Placements by Source</h2>
              <p>Where successful candidates were originally sourced.</p>
            </div>
            {[
              { source: "Platform AI Match", count: 12, pct: 48, color: "linear-gradient(90deg,var(--gold),rgba(210,174,82,0.5))" },
              { source: "Referral Network",  count: 7,  pct: 28, color: "linear-gradient(90deg,#40b77e,#9ef5ca)"                  },
              { source: "LinkedIn",          count: 4,  pct: 16, color: "linear-gradient(90deg,#3d8bcd,#9ec8f5)"                  },
              { source: "Naukri / Indeed",   count: 2,  pct: 8,  color: "linear-gradient(90deg,#f3b955,#ffd98e)"                  },
            ].map((s) => (
              <div key={s.source} className="chart-bar-row" style={{ marginBottom: 10 }}>
                <span className="chart-bar-label" style={{ width: 145, fontSize: "0.78rem" }}>{s.source}</span>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <span className="chart-bar-value">{s.count} hires · {s.pct}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
