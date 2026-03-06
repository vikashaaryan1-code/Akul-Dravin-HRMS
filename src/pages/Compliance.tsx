import { useState } from "react";
import type { FormEvent } from "react";
import { usePersistentState } from "../lib/usePersistentState";

type Severity = "Minor" | "Moderate" | "Major" | "Critical";
type DisciplinaryStatus = "Open" | "Under Investigation" | "Resolved" | "Escalated";
type ComplaintStatus = "Open" | "Investigating" | "Resolved" | "Closed";
type ComplianceStatus = "Compliant" | "Due Soon" | "Overdue" | "Pending";

type DisciplinaryAction = {
  id: string;
  employee: string;
  dept: string;
  type: string;
  severity: Severity;
  date: string;
  description: string;
  status: DisciplinaryStatus;
  actionTaken?: string;
};

type Complaint = {
  id: string;
  complainant: string;
  against: string;
  category: string;
  date: string;
  description: string;
  status: ComplaintStatus;
  anonymous: boolean;
};

type ComplianceItem = {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  status: ComplianceStatus;
  assignedTo: string;
};

type TrainingProgram = {
  name: string;
  completed: number;
  total: number;
  due: string;
  mandatory: boolean;
};

const DEFAULT_DISCIPLINARY: DisciplinaryAction[] = [
  {
    id: "d1", employee: "Samar Kapoor", dept: "Engineering", type: "Misconduct",
    severity: "Moderate", date: "2026-02-15",
    description: "Repeated tardiness and non-compliance with project deadlines despite prior verbal warnings.",
    status: "Resolved", actionTaken: "Written warning issued",
  },
  {
    id: "d2", employee: "Divya Sharma", dept: "Product", type: "Policy Violation",
    severity: "Minor", date: "2026-02-28",
    description: "Unauthorized use of company software licenses for personal freelance projects.",
    status: "Under Investigation",
  },
  {
    id: "d3", employee: "Rahul Mehta", dept: "Finance", type: "Harassment",
    severity: "Major", date: "2026-03-01",
    description: "Complaint filed for inappropriate comments in team meetings. ICC investigation ongoing.",
    status: "Open",
  },
];

const DEFAULT_COMPLAINTS: Complaint[] = [
  {
    id: "c1", complainant: "Nisha Verma", against: "Rahul Mehta",
    category: "Harassment", date: "2026-03-01",
    description: "Repeated inappropriate and demeaning comments in team stand-up meetings.",
    status: "Investigating", anonymous: false,
  },
  {
    id: "c2", complainant: "Anonymous", against: "Management",
    category: "Policy Violation", date: "2026-02-20",
    description: "Overtime being compensated at below-legal rates for extended sprint cycles.",
    status: "Open", anonymous: true,
  },
  {
    id: "c3", complainant: "Vikram Singh", against: "HR Process",
    category: "Process Complaint", date: "2026-01-15",
    description: "Salary revision not processed despite appraisal completion 45 days ago.",
    status: "Resolved", anonymous: false,
  },
  {
    id: "c4", complainant: "Ananya Roy", against: "Team Lead",
    category: "Discrimination", date: "2026-02-10",
    description: "Gender-based task assignments observed and documented over 3 months.",
    status: "Investigating", anonymous: false,
  },
];

const DEFAULT_COMPLIANCE: ComplianceItem[] = [
  { id: "cc1", title: "PF Registration & Monthly Filing",    category: "Statutory",  dueDate: "2026-03-15", status: "Compliant",  assignedTo: "Finance Team"   },
  { id: "cc2", title: "ESI Filing (February 2026)",          category: "Statutory",  dueDate: "2026-03-21", status: "Due Soon",   assignedTo: "Finance Team"   },
  { id: "cc3", title: "Form 16 Distribution (FY 25-26)",     category: "Tax",        dueDate: "2026-06-15", status: "Pending",    assignedTo: "HR Team"        },
  { id: "cc4", title: "Minimum Wages Compliance Review",     category: "Labour Law", dueDate: "2026-04-01", status: "Compliant",  assignedTo: "HR Team"        },
  { id: "cc5", title: "Maternity Benefit Act Audit",         category: "Labour Law", dueDate: "2026-03-31", status: "Due Soon",   assignedTo: "Legal Team"     },
  { id: "cc6", title: "POSH Annual Training",                category: "Training",   dueDate: "2026-04-30", status: "Pending",    assignedTo: "HR Manager"     },
  { id: "cc7", title: "Fire Safety Drill",                   category: "Safety",     dueDate: "2026-02-28", status: "Overdue",    assignedTo: "Admin Team"     },
  { id: "cc8", title: "ISO 27001 Surveillance Audit",        category: "Compliance", dueDate: "2026-05-15", status: "Pending",    assignedTo: "IT Security"    },
  { id: "cc9", title: "Gratuity Actuarial Valuation",        category: "Statutory",  dueDate: "2026-07-01", status: "Pending",    assignedTo: "Finance + HR"   },
  { id: "cc10",title: "Professional Tax Monthly Return",     category: "Tax",        dueDate: "2026-03-31", status: "Compliant",  assignedTo: "Finance Team"   },
];

const TRAINING_PROGRAMS: TrainingProgram[] = [
  { name: "POSH Awareness Training",        completed: 42, total: 47, due: "Apr 2026",       mandatory: true  },
  { name: "Data Protection & Privacy",      completed: 38, total: 47, due: "Mar 2026",       mandatory: true  },
  { name: "Fire Safety & Evacuation",       completed: 31, total: 47, due: "Mar 2026",       mandatory: true  },
  { name: "Anti-Bribery & Corruption",      completed: 47, total: 47, due: "Completed",      mandatory: true  },
  { name: "Code of Conduct",               completed: 45, total: 47, due: "Jan 2026",       mandatory: true  },
  { name: "Cybersecurity Awareness",        completed: 29, total: 47, due: "Apr 2026",       mandatory: false },
  { name: "Workplace Diversity & Inclusion",completed: 35, total: 47, due: "May 2026",       mandatory: false },
];

const EMPLOYEES = ["Priya Nair", "Vikram Singh", "Ananya Roy", "Samar Kapoor", "Nisha Verma", "Rahul Mehta", "Divya Sharma"];
const DISC_TYPES = ["Misconduct", "Policy Violation", "Harassment", "Fraud", "Insubordination", "Tardiness", "Other"];

const SEVERITY_COLOR: Record<Severity, string> = {
  Minor:    "stage-roadmap",
  Moderate: "status-watch",
  Major:    "stage-beta",
  Critical: "status-risk",
};
const DISC_STATUS_COLOR: Record<DisciplinaryStatus, string> = {
  Open:                "status-risk",
  "Under Investigation": "status-watch",
  Resolved:            "status-on-track",
  Escalated:           "status-risk",
};
const COMPLAINT_COLOR: Record<ComplaintStatus, string> = {
  Open:         "status-risk",
  Investigating:"status-watch",
  Resolved:     "status-on-track",
  Closed:       "stage-roadmap",
};
const COMPLIANCE_COLOR: Record<ComplianceStatus, string> = {
  Compliant: "status-on-track",
  "Due Soon":"status-watch",
  Overdue:   "status-risk",
  Pending:   "stage-roadmap",
};

function prettyDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Compliance() {
  const [disciplinary, setDisciplinary] = usePersistentState<DisciplinaryAction[]>(
    "hrms_disciplinary",
    DEFAULT_DISCIPLINARY,
  );
  const [complaints, setComplaints] = usePersistentState<Complaint[]>(
    "hrms_complaints",
    DEFAULT_COMPLAINTS,
  );
  const [compliance] = usePersistentState<ComplianceItem[]>(
    "hrms_compliance_items",
    DEFAULT_COMPLIANCE,
  );

  const [activeTab, setActiveTab] = useState<"disciplinary" | "complaints" | "compliance" | "training">("disciplinary");
  const [showDiscForm, setShowDiscForm] = useState(false);
  const [discForm, setDiscForm] = useState({
    employee: EMPLOYEES[0],
    type: DISC_TYPES[0],
    severity: "Minor" as Severity,
    description: "",
    date: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const openCases = disciplinary.filter((d) => d.status === "Open" || d.status === "Under Investigation").length;
  const openComplaints = complaints.filter((c) => c.status === "Open" || c.status === "Investigating").length;
  const compliantItems = compliance.filter((c) => c.status === "Compliant").length;
  const overdueItems = compliance.filter((c) => c.status === "Overdue").length;

  function addDisciplinary(e: FormEvent) {
    e.preventDefault();
    const action: DisciplinaryAction = {
      id: `d-${Date.now()}`,
      employee: discForm.employee,
      dept: "HR Logged",
      type: discForm.type,
      severity: discForm.severity,
      date: discForm.date || new Date().toISOString().slice(0, 10),
      description: discForm.description,
      status: "Open",
    };
    setDisciplinary((prev) => [action, ...prev]);
    setSubmitted(true);
    setShowDiscForm(false);
    setTimeout(() => setSubmitted(false), 3000);
    setDiscForm((p) => ({ ...p, description: "", date: "" }));
  }

  function updateComplaintStatus(id: string, status: ComplaintStatus) {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  const TABS = [
    { key: "disciplinary" as const, label: "⚖️ Disciplinary" },
    { key: "complaints"   as const, label: "📢 Complaints"   },
    { key: "compliance"   as const, label: "✅ Compliance"   },
    { key: "training"     as const, label: "🎓 Training"     },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Compliance & Relations</h1>
        <p className="page-sub">Disciplinary Actions · Complaint Management · Statutory Compliance · Training Tracking</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Open Cases</p>
          <p className="stat-value stat-risk">{openCases}</p>
          <p className="stat-note">Active disciplinary proceedings</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Open Complaints</p>
          <p className="stat-value stat-amber">{openComplaints}</p>
          <p className="stat-note">Pending resolution</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Compliance Coverage</p>
          <p className="stat-value stat-green">{compliantItems}/{compliance.length}</p>
          <p className="stat-note">Statutory obligations met</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Overdue Items</p>
          <p className="stat-value stat-risk">{overdueItems}</p>
          <p className="stat-note">Requires immediate action</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* ── Disciplinary Tab ── */}
      {activeTab === "disciplinary" && (
        <div className="section-block">
          <div
            className="section-head"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <h2>Disciplinary Actions</h2>
              <p>Track and manage employee conduct issues and their resolution status.</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowDiscForm((v) => !v)}
              style={{ fontSize: "0.82rem" }}
            >
              {showDiscForm ? "✕ Cancel" : "+ New Case"}
            </button>
          </div>

          {submitted && <p className="notice-success">Disciplinary case logged and HR notified.</p>}

          {showDiscForm && (
            <form className="data-form" onSubmit={addDisciplinary} style={{ marginBottom: 18 }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Employee</label>
                  <select
                    className="form-input"
                    value={discForm.employee}
                    onChange={(e) => setDiscForm((p) => ({ ...p, employee: e.target.value }))}
                  >
                    {EMPLOYEES.map((emp) => <option key={emp}>{emp}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={discForm.type}
                    onChange={(e) => setDiscForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {DISC_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Severity</label>
                  <select
                    className="form-input"
                    value={discForm.severity}
                    onChange={(e) => setDiscForm((p) => ({ ...p, severity: e.target.value as Severity }))}
                  >
                    {(["Minor", "Moderate", "Major", "Critical"] as Severity[]).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Incident Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={discForm.date}
                    onChange={(e) => setDiscForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    placeholder="Brief description of the incident"
                    value={discForm.description}
                    onChange={(e) => setDiscForm((p) => ({ ...p, description: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>
                  Log Case
                </button>
              </div>
            </form>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {disciplinary.map((d) => (
                <tr key={d.id}>
                  <td>{d.employee}</td>
                  <td>{d.dept}</td>
                  <td>{d.type}</td>
                  <td><span className={`status-chip ${SEVERITY_COLOR[d.severity]}`}>{d.severity}</span></td>
                  <td style={{ fontSize: "0.8rem" }}>{prettyDate(d.date)}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 200 }}>{d.description}</td>
                  <td><span className={`status-chip ${DISC_STATUS_COLOR[d.status]}`}>{d.status}</span></td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{d.actionTaken || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Complaints Tab ── */}
      {activeTab === "complaints" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Complaint Register</h2>
            <p>POSH complaints, grievances, and anonymous feedback tracking with ICC workflow.</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Complainant</th>
                <th>Against</th>
                <th>Category</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Anonymous</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.anonymous
                      ? <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Anonymous</span>
                      : c.complainant}
                  </td>
                  <td>{c.against}</td>
                  <td>{c.category}</td>
                  <td style={{ fontSize: "0.8rem" }}>{prettyDate(c.date)}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 180 }}>{c.description}</td>
                  <td><span className={`status-chip ${COMPLAINT_COLOR[c.status]}`}>{c.status}</span></td>
                  <td>{c.anonymous ? <span className="status-chip stage-beta">Yes</span> : "No"}</td>
                  <td>
                    {(c.status === "Open" || c.status === "Investigating") ? (
                      <button
                        className="table-action-btn"
                        onClick={() => updateComplaintStatus(c.id, "Resolved")}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}>Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Compliance Checklist Tab ── */}
      {activeTab === "compliance" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Statutory Compliance Checklist</h2>
            <p>Track all legal and regulatory obligations across PF, ESI, Tax, Labour Law, and Safety.</p>
          </div>

          {overdueItems > 0 && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(235,103,95,0.1)",
                border: "1px solid rgba(235,103,95,0.3)",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: "0.84rem",
                color: "var(--red)",
              }}
            >
              ⚠️ {overdueItems} compliance item{overdueItems > 1 ? "s are" : " is"} overdue and require immediate attention.
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Compliance Item</th>
                <th>Category</th>
                <th>Due Date</th>
                <th>Assigned To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {compliance.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.title}</td>
                  <td><span className="status-chip stage-roadmap">{c.category}</span></td>
                  <td style={{ fontSize: "0.8rem" }}>{prettyDate(c.dueDate)}</td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.assignedTo}</td>
                  <td><span className={`status-chip ${COMPLIANCE_COLOR[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Training Tab ── */}
      {activeTab === "training" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Mandatory Compliance Training</h2>
            <p>Track completion of all compliance-mandated training programs across employees.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {TRAINING_PROGRAMS.map((t) => {
              const pct = Math.round((t.completed / t.total) * 100);
              return (
                <div key={t.name} className="section-block" style={{ margin: 0, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.86rem", fontWeight: 600, lineHeight: 1.35, flex: 1 }}>{t.name}</span>
                    {t.mandatory && (
                      <span className="status-chip status-risk" style={{ fontSize: "0.62rem", flexShrink: 0, marginLeft: 8 }}>
                        Mandatory
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.78rem" }}>
                    <span style={{ color: "var(--text-dim)" }}>Due: {t.due}</span>
                    <span style={{ color: pct === 100 ? "var(--green)" : "var(--text-muted)" }}>
                      {t.completed}/{t.total} completed
                    </span>
                  </div>
                  <div className="automation-track">
                    <div
                      className="automation-fill"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct === 100
                            ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                            : pct >= 70
                            ? "linear-gradient(90deg,#f3b955,#ffd98e)"
                            : "linear-gradient(90deg,#eb675f,#ff9c96)",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 4 }}>{pct}% completion rate</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
