import { useState } from "react";
import type { FormEvent } from "react";

type ExpenseClaim = {
  id: string;
  employee: string;
  category: string;
  amount: number;
  date: string;
  status: "Pending" | "Approved" | "Rejected" | "Processing";
  desc: string;
};

const CLAIMS: ExpenseClaim[] = [
  { id: "EXP-001", employee: "Vikram Singh", category: "Travel",        amount: 12400, date: "Mar 02, 2026", status: "Approved",    desc: "Mumbai client visit — train + cab"              },
  { id: "EXP-002", employee: "Priya Nair",   category: "Meal",          amount: 1850,  date: "Mar 01, 2026", status: "Pending",     desc: "Team lunch — sprint retrospective"             },
  { id: "EXP-003", employee: "Ananya Roy",   category: "Software",      amount: 4999,  date: "Feb 28, 2026", status: "Approved",    desc: "Figma annual subscription"                     },
  { id: "EXP-004", employee: "Samar Kapoor", category: "Travel",        amount: 8200,  date: "Feb 25, 2026", status: "Rejected",    desc: "Personal travel mixed with work — policy flag" },
  { id: "EXP-005", employee: "Nisha Verma",  category: "Training",      amount: 15000, date: "Feb 22, 2026", status: "Processing",  desc: "SHRM certification exam fee"                   },
  { id: "EXP-006", employee: "Rahul Mehta",  category: "Accommodation", amount: 9500,  date: "Feb 20, 2026", status: "Approved",    desc: "Hyderabad 2-night client stay"                 },
  { id: "EXP-007", employee: "Divya Sharma", category: "Meal",          amount: 3200,  date: "Feb 18, 2026", status: "Pending",     desc: "Product team offsite dinner"                   },
];

const STATUS_COLOR: Record<ExpenseClaim["status"], string> = {
  Pending:    "status-watch",
  Approved:   "status-on-track",
  Rejected:   "status-risk",
  Processing: "stage-beta",
};

const CATEGORIES = ["Travel", "Meal", "Accommodation", "Software", "Training", "Entertainment", "Other"];

export default function Expense() {
  const [form, setForm] = useState({ category: "Travel", amount: "", date: "", desc: "" });
  const [claims, setClaims] = useState<ExpenseClaim[]>(CLAIMS);
  const [submitted, setSubmitted] = useState(false);

  const totalPending  = claims.filter((c) => c.status === "Pending").length;
  const totalApproved = claims.filter((c) => c.status === "Approved").length;
  const totalRejected = claims.filter((c) => c.status === "Rejected").length;
  const totalAmount   = claims.filter((c) => c.status === "Approved").reduce((s, c) => s + c.amount, 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newClaim: ExpenseClaim = {
      id:       `EXP-${String(claims.length + 1).padStart(3, "0")}`,
      employee: "Priya Nair",
      category: form.category,
      amount:   Number(form.amount),
      date:     new Date(form.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status:   "Pending",
      desc:     form.desc,
    };
    setClaims((prev) => [newClaim, ...prev]);
    setForm({ category: "Travel", amount: "", date: "", desc: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Expense & Reimbursements</h1>
        <p className="page-sub">AI Policy Validation · Multi-Level Approval · GST Input Credit</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Approved Amount</p>
          <p className="stat-value" style={{ fontSize: "1.3rem" }}>₹{totalAmount.toLocaleString("en-IN")}</p>
          <p className="stat-note">Reimbursed this month</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending Approval</p>
          <p className="stat-value stat-amber">{totalPending}</p>
          <p className="stat-note">Awaiting manager action</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Approved</p>
          <p className="stat-value stat-green">{totalApproved}</p>
          <p className="stat-note">Ready for payment</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rejected</p>
          <p className="stat-value stat-risk">{totalRejected}</p>
          <p className="stat-note">Policy violations flagged</p>
        </div>
      </div>

      {/* Submit Expense */}
      <div className="section-block">
        <div className="section-head">
          <h2>Submit Expense Claim</h2>
          <p>AI validates your claim against company policy before routing for approval.</p>
        </div>
        {submitted && <p className="notice-success">Expense claim submitted! Routed to your manager.</p>}
        <form className="data-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (INR)</label>
              <input className="form-input" type="number" placeholder="Amount" min="1" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Brief description of expense" value={form.desc} onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))} required />
            </div>
            <button className="btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>Submit</button>
          </div>
        </form>
      </div>

      {/* Claims Table */}
      <div className="section-block">
        <div className="section-head">
          <h2>All Expense Claims</h2>
          <p>View and track all submitted claims across the team.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td className="mono">{claim.id}</td>
                <td>{claim.employee}</td>
                <td>{claim.category}</td>
                <td className="mono">₹{claim.amount.toLocaleString("en-IN")}</td>
                <td>{claim.date}</td>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "0.84rem" }}>
                  {claim.desc}
                </td>
                <td><span className={`status-chip ${STATUS_COLOR[claim.status]}`}>{claim.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
