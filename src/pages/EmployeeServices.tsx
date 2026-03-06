import { useState } from "react";
import type { FormEvent } from "react";
import { usePersistentState } from "../lib/usePersistentState";

type LoanStatus = "Applied" | "Under Review" | "Approved" | "Disbursed" | "Rejected";
type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Critical";

type LoanApplication = {
  id: string;
  employee: string;
  type: string;
  amount: number;
  emi: number;
  tenure: number;
  purpose: string;
  status: LoanStatus;
  appliedOn: string;
};

type HelpTicket = {
  id: string;
  employee: string;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
};

const DEFAULT_LOANS: LoanApplication[] = [
  { id: "l1", employee: "Priya Nair",   type: "Personal Loan",  amount: 200000, emi: 9000, tenure: 24, purpose: "Home renovation",    status: "Disbursed",    appliedOn: "2026-01-10" },
  { id: "l2", employee: "Rahul Mehta",  type: "Emergency Loan", amount: 50000,  emi: 5000, tenure: 10, purpose: "Medical emergency",  status: "Approved",     appliedOn: "2026-02-20" },
  { id: "l3", employee: "Vikram Singh", type: "Education Loan", amount: 100000, emi: 8500, tenure: 12, purpose: "AWS Certification",  status: "Under Review", appliedOn: "2026-03-01" },
  { id: "l4", employee: "Nisha Verma",  type: "Festival Advance",amount: 30000, emi: 5000, tenure: 6,  purpose: "Diwali advance",    status: "Disbursed",    appliedOn: "2025-10-10" },
];

const DEFAULT_TICKETS: HelpTicket[] = [
  { id: "t1", employee: "Nisha Verma",  category: "Payroll",   subject: "Salary slip not received",        description: "February payslip not generated in the system.",        status: "In Progress", priority: "High",     createdAt: "2026-03-02" },
  { id: "t2", employee: "Samar Kapoor", category: "IT Support", subject: "Laptop keyboard not working",     description: "Spill accident, keyboard needs urgent replacement.",    status: "Open",        priority: "Medium",   createdAt: "2026-03-03" },
  { id: "t3", employee: "Ananya Roy",   category: "Benefits",  subject: "Health insurance card query",     description: "Spouse name incorrect on Medi-claim insurance card.",   status: "Resolved",    priority: "Low",      createdAt: "2026-02-25" },
  { id: "t4", employee: "Divya Sharma", category: "Leave",     subject: "Leave balance discrepancy",       description: "Casual leave shows 3 days remaining — should be 5.",    status: "Open",        priority: "Medium",   createdAt: "2026-03-03" },
  { id: "t5", employee: "Rahul Mehta",  category: "HR Query",  subject: "Confirmation letter required",    description: "Employment confirmation letter needed for bank loan.",   status: "Resolved",    priority: "High",     createdAt: "2026-02-18" },
];

const EMPLOYEES = ["Priya Nair", "Vikram Singh", "Ananya Roy", "Samar Kapoor", "Nisha Verma", "Rahul Mehta", "Divya Sharma"];
const LOAN_TYPES = ["Personal Loan", "Emergency Loan", "Education Loan", "Festival Advance", "Vehicle Loan", "Medical Loan"];
const TICKET_CATEGORIES = ["Payroll", "IT Support", "Benefits", "Leave", "HR Query", "Training", "Other"];

const LOAN_COLOR: Record<LoanStatus, string> = {
  Applied:        "stage-roadmap",
  "Under Review": "status-watch",
  Approved:       "status-on-track",
  Disbursed:      "stage-beta",
  Rejected:       "status-risk",
};
const TICKET_COLOR: Record<TicketStatus, string> = {
  Open:          "status-risk",
  "In Progress": "status-watch",
  Resolved:      "status-on-track",
  Closed:        "stage-roadmap",
};
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  Low:      "stage-roadmap",
  Medium:   "status-watch",
  High:     "stage-beta",
  Critical: "status-risk",
};

function prettyDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmt(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export default function EmployeeServices() {
  const [loans, setLoans] = usePersistentState<LoanApplication[]>("hrms_loans", DEFAULT_LOANS);
  const [tickets, setTickets] = usePersistentState<HelpTicket[]>("hrms_tickets", DEFAULT_TICKETS);

  const [activeTab, setActiveTab] = useState<"helpdesk" | "loans" | "benefits" | "wellness" | "events">("helpdesk");
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);

  const [loanForm, setLoanForm] = useState({
    employee: EMPLOYEES[0],
    type: LOAN_TYPES[0],
    amount: "",
    tenure: "12",
    purpose: "",
  });
  const [ticketForm, setTicketForm] = useState({
    employee: EMPLOYEES[0],
    category: TICKET_CATEGORIES[0],
    subject: "",
    description: "",
    priority: "Medium" as TicketPriority,
  });
  const [submitted, setSubmitted] = useState(false);

  const openTickets = tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length;
  const activeLoans = loans.filter((l) => l.status === "Disbursed").length;
  const pendingLoans = loans.filter((l) => l.status === "Applied" || l.status === "Under Review").length;
  const totalLoanExposure = loans.filter((l) => l.status === "Disbursed").reduce((s, l) => s + l.amount, 0);

  function submitLoan(e: FormEvent) {
    e.preventDefault();
    const amt = Number(loanForm.amount);
    const emi = Math.round(amt / Number(loanForm.tenure));
    const loan: LoanApplication = {
      id: `l-${Date.now()}`,
      employee: loanForm.employee,
      type: loanForm.type,
      amount: amt,
      emi,
      tenure: Number(loanForm.tenure),
      purpose: loanForm.purpose,
      status: "Applied",
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setLoans((prev) => [loan, ...prev]);
    setSubmitted(true);
    setShowLoanForm(false);
    setTimeout(() => setSubmitted(false), 3000);
    setLoanForm((p) => ({ ...p, amount: "", purpose: "" }));
  }

  function submitTicket(e: FormEvent) {
    e.preventDefault();
    const ticket: HelpTicket = {
      id: `t-${Date.now()}`,
      employee: ticketForm.employee,
      category: ticketForm.category,
      subject: ticketForm.subject,
      description: ticketForm.description,
      status: "Open",
      priority: ticketForm.priority,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTickets((prev) => [ticket, ...prev]);
    setSubmitted(true);
    setShowTicketForm(false);
    setTimeout(() => setSubmitted(false), 3000);
    setTicketForm((p) => ({ ...p, subject: "", description: "" }));
  }

  function resolveTicket(id: string) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Resolved" } : t)));
  }

  const TABS = [
    { key: "helpdesk" as const, label: "🎫 Help Desk"  },
    { key: "loans"    as const, label: "💰 Loans"      },
    { key: "benefits" as const, label: "🏥 Benefits"   },
    { key: "wellness" as const, label: "🌿 Wellness"   },
    { key: "events"   as const, label: "🎉 Events"     },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Employee Services</h1>
        <p className="page-sub">Help Desk · Loans & Advances · Benefits · Wellness Programs · Company Events</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Open Tickets</p>
          <p className="stat-value stat-risk">{openTickets}</p>
          <p className="stat-note">Active help desk requests</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active Loans</p>
          <p className="stat-value stat-amber">{activeLoans}</p>
          <p className="stat-note">Currently disbursed</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending Approvals</p>
          <p className="stat-value">{pendingLoans}</p>
          <p className="stat-note">Loan applications under review</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Loan Exposure</p>
          <p className="stat-value stat-green">{fmt(totalLoanExposure)}</p>
          <p className="stat-note">Disbursed loan portfolio</p>
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

      {submitted && <p className="notice-success">Request submitted successfully.</p>}

      {/* ── Help Desk Tab ── */}
      {activeTab === "helpdesk" && (
        <div className="section-block">
          <div
            className="section-head"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <h2>Help Desk Tickets</h2>
              <p>Track employee support requests across payroll, IT, benefits, leave, and HR.</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowTicketForm((v) => !v)}
              style={{ fontSize: "0.82rem" }}
            >
              {showTicketForm ? "✕ Cancel" : "+ New Ticket"}
            </button>
          </div>

          {showTicketForm && (
            <form className="data-form" onSubmit={submitTicket} style={{ marginBottom: 18 }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Employee</label>
                  <select
                    className="form-input"
                    value={ticketForm.employee}
                    onChange={(e) => setTicketForm((p) => ({ ...p, employee: e.target.value }))}
                  >
                    {EMPLOYEES.map((emp) => <option key={emp}>{emp}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
                  >
                    {(["Low", "Medium", "High", "Critical"] as TicketPriority[]).map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Subject</label>
                  <input
                    className="form-input"
                    placeholder="Brief subject"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    placeholder="Detailed description of the issue"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>Submit</button>
              </div>
            </form>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.employee}</td>
                  <td>{t.category}</td>
                  <td style={{ fontWeight: 500 }}>{t.subject}</td>
                  <td><span className={`status-chip ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span></td>
                  <td><span className={`status-chip ${TICKET_COLOR[t.status]}`}>{t.status}</span></td>
                  <td style={{ fontSize: "0.78rem" }}>{prettyDate(t.createdAt)}</td>
                  <td>
                    {(t.status === "Open" || t.status === "In Progress") ? (
                      <button className="table-action-btn" onClick={() => resolveTicket(t.id)}>Resolve</button>
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

      {/* ── Loans Tab ── */}
      {activeTab === "loans" && (
        <div className="section-block">
          <div
            className="section-head"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <h2>Employee Loan Management</h2>
              <p>Personal loans, emergency advances, education loans, and festival advances.</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowLoanForm((v) => !v)}
              style={{ fontSize: "0.82rem" }}
            >
              {showLoanForm ? "✕ Cancel" : "+ Apply Loan"}
            </button>
          </div>

          {showLoanForm && (
            <form className="data-form" onSubmit={submitLoan} style={{ marginBottom: 18 }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Employee</label>
                  <select
                    className="form-input"
                    value={loanForm.employee}
                    onChange={(e) => setLoanForm((p) => ({ ...p, employee: e.target.value }))}
                  >
                    {EMPLOYEES.map((emp) => <option key={emp}>{emp}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Loan Type</label>
                  <select
                    className="form-input"
                    value={loanForm.type}
                    onChange={(e) => setLoanForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 100000"
                    value={loanForm.amount}
                    onChange={(e) => setLoanForm((p) => ({ ...p, amount: e.target.value }))}
                    required
                    min="1000"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tenure (months)</label>
                  <select
                    className="form-input"
                    value={loanForm.tenure}
                    onChange={(e) => setLoanForm((p) => ({ ...p, tenure: e.target.value }))}
                  >
                    {["6", "12", "18", "24", "36", "48"].map((m) => (
                      <option key={m} value={m}>{m} months</option>
                    ))}
                  </select>
                </div>
                {loanForm.amount && Number(loanForm.amount) > 0 && (
                  <div className="form-group" style={{ flex: 0.7 }}>
                    <label className="form-label">Est. EMI</label>
                    <div
                      className="form-input"
                      style={{ fontWeight: 700, color: "var(--gold)", textAlign: "center" }}
                    >
                      {fmt(Math.round(Number(loanForm.amount) / Number(loanForm.tenure)))}/mo
                    </div>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Purpose</label>
                  <input
                    className="form-input"
                    placeholder="Purpose of the loan"
                    value={loanForm.purpose}
                    onChange={(e) => setLoanForm((p) => ({ ...p, purpose: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>Apply</button>
              </div>
            </form>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Amount</th>
                <th>EMI / Month</th>
                <th>Tenure</th>
                <th>Purpose</th>
                <th>Applied On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td>{l.employee}</td>
                  <td>{l.type}</td>
                  <td className="mono">{fmt(l.amount)}</td>
                  <td className="mono">{fmt(l.emi)}</td>
                  <td className="mono">{l.tenure} mo</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{l.purpose}</td>
                  <td style={{ fontSize: "0.78rem" }}>{prettyDate(l.appliedOn)}</td>
                  <td><span className={`status-chip ${LOAN_COLOR[l.status]}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Benefits Tab ── */}
      {activeTab === "benefits" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Employee Benefits</h2>
            <p>Health insurance, life cover, vehicle allowance, and other employer-provided perks.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { title: "Group Health Insurance",  icon: "🏥", provider: "Star Health Insurance", coverage: "₹5,00,000",  enrolled: 45, total: 47, desc: "Cashless hospitalization at 6,000+ hospitals. Covers employee + spouse + 2 children." },
              { title: "Term Life Insurance",      icon: "🛡️", provider: "HDFC Life",             coverage: "₹50,00,000", enrolled: 47, total: 47, desc: "100% employer-paid. 10× CTC coverage for all permanent employees." },
              { title: "Vehicle Allowance",        icon: "🚗", provider: "Company Policy",        coverage: "₹5,000/mo",  enrolled: 28, total: 47, desc: "For field roles requiring travel. Includes fuel reimbursement." },
              { title: "Meal Vouchers (Sodexo)",   icon: "🍱", provider: "Sodexo",                coverage: "₹2,600/mo",  enrolled: 42, total: 47, desc: "Tax-exempt meal allowance. Accepted at 2 lakh+ outlets across India." },
              { title: "Group Accident Cover",     icon: "🩺", provider: "New India Assurance",   coverage: "₹10,00,000", enrolled: 47, total: 47, desc: "24×7 accident coverage with disability and hospitalization benefits." },
              { title: "Mobile Reimbursement",     icon: "📱", provider: "Company Policy",        coverage: "₹1,500/mo",  enrolled: 35, total: 47, desc: "Mobile + data plan reimbursement for eligible roles." },
            ].map((b) => {
              const pct = Math.round((b.enrolled / b.total) * 100);
              return (
                <div key={b.title} className="section-block" style={{ margin: 0, padding: "1.2rem" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{b.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{b.title}</p>
                      <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", margin: 0 }}>{b.provider}</p>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.88rem", whiteSpace: "nowrap" }}>
                      {b.coverage}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.55 }}>{b.desc}</p>
                  <div className="automation-track">
                    <div className="automation-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#40b77e,#9ef5ca)" }} />
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: 4 }}>
                    {b.enrolled}/{b.total} enrolled ({pct}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Wellness Tab ── */}
      {activeTab === "wellness" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Wellness Programs</h2>
            <p>Mental health support, physical fitness, and work-life balance initiatives.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {[
              { name: "Mental Health EAP",        icon: "🧠", participants: 18, sessions: 34, desc: "8 free counseling sessions/year via Employee Assistance Program." },
              { name: "Fitness Reimbursement",     icon: "💪", participants: 29, sessions: 0,  desc: "Up to ₹2,000/month for gym, yoga, or sports activities." },
              { name: "Annual Health Checkup",     icon: "🩺", participants: 44, sessions: 0,  desc: "Comprehensive health screening at empanelled hospitals — 100% covered." },
              { name: "Meditation & Mindfulness",  icon: "🧘", participants: 22, sessions: 48, desc: "Weekly online guided meditation sessions. Recordings available anytime." },
              { name: "Ergonomics Program",        icon: "🪑", participants: 47, sessions: 0,  desc: "Ergonomic desk assessment and equipment for all employees." },
              { name: "Work-Life Balance Week",    icon: "⚖️", participants: 47, sessions: 0,  desc: "Annual no-meetings week. Encourage PTO and digital detox." },
            ].map((prog) => (
              <div key={prog.name} className="section-block" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "1.6rem" }}>{prog.icon}</span>
                  <p style={{ fontWeight: 600, fontSize: "0.88rem", margin: 0 }}>{prog.name}</p>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 8 }}>
                  {prog.desc}
                </p>
                <div style={{ display: "flex", gap: 14, fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  <span>👥 {prog.participants} participating</span>
                  {prog.sessions > 0 && <span>🗓️ {prog.sessions} sessions logged</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Events Tab ── */}
      {activeTab === "events" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Company Events & Celebrations</h2>
            <p>Team building, cultural events, and employee engagement activities.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { date: "2026-03-08", name: "International Women's Day",        type: "Cultural",    attendees: 47, status: "Upcoming",   venue: "Main Office + Virtual"    },
              { date: "2026-03-15", name: "Q1 Town Hall & All-Hands Meeting", type: "Company",     attendees: 47, status: "Upcoming",   venue: "Conference Hall A"        },
              { date: "2026-03-21", name: "Holi Celebration & Team Lunch",    type: "Festival",    attendees: 38, status: "Upcoming",   venue: "Office Terrace"           },
              { date: "2026-04-05", name: "Annual Sports Day",                type: "Wellness",    attendees: 42, status: "Planned",    venue: "City Sports Complex"      },
              { date: "2026-04-22", name: "Earth Day CSR Initiative",         type: "CSR",         attendees: 30, status: "Planned",    venue: "Local Park / Community"   },
              { date: "2026-02-14", name: "Employee Appreciation Day",        type: "Recognition", attendees: 47, status: "Completed",  venue: "Main Office"              },
              { date: "2026-01-26", name: "Republic Day Flag Hoisting",       type: "National",    attendees: 47, status: "Completed",  venue: "Office Premises"          },
            ].map((event) => {
              const TYPE_CLR: Record<string, string> = {
                Cultural: "status-watch", Company: "stage-beta", Festival: "status-on-track",
                Wellness: "stage-roadmap", CSR: "status-on-track", Recognition: "stage-beta", National: "status-on-track",
              };
              const STAT_CLR: Record<string, string> = {
                Upcoming: "status-watch", Planned: "stage-roadmap", Completed: "status-on-track",
              };
              const d = new Date(event.date);
              return (
                <div
                  key={event.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 18px",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ textAlign: "center", minWidth: 52, flexShrink: 0 }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: 0, textTransform: "uppercase" }}>
                      {d.toLocaleDateString("en-IN", { month: "short" })}
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)", margin: 0, lineHeight: 1 }}>
                      {d.getDate()}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 2px" }}>{event.name}</p>
                    <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>
                      {event.venue} · {event.attendees} attendees
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className={`status-chip ${TYPE_CLR[event.type] ?? "stage-roadmap"}`}>{event.type}</span>
                    <span className={`status-chip ${STAT_CLR[event.status] ?? "stage-roadmap"}`}>{event.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
