import { useState } from "react";

type ExitStatus = "In Progress" | "Completed" | "Pending Clearance";

type ExitEmployee = {
  name: string;
  dept: string;
  lastDay: string;
  reason: string;
  assetsReturned: boolean;
  ffStatus: "Pending" | "Calculated" | "Paid";
  status: ExitStatus;
  noticeDays: number;
  salary: number;
  leaveDays: number;
  gratuity: number;
};

const EXITS: ExitEmployee[] = [
  {
    name: "Arun Kumar",
    dept: "Engineering",
    lastDay: "Mar 31, 2026",
    reason: "Better opportunity",
    assetsReturned: false,
    ffStatus: "Calculated",
    status: "In Progress",
    noticeDays: 45,
    salary: 82500,
    leaveDays: 12,
    gratuity: 0,
  },
  {
    name: "Sunita Rao",
    dept: "Sales",
    lastDay: "Feb 28, 2026",
    reason: "Personal reasons",
    assetsReturned: true,
    ffStatus: "Paid",
    status: "Completed",
    noticeDays: 30,
    salary: 65000,
    leaveDays: 8,
    gratuity: 25000,
  },
  {
    name: "Tejas Mehta",
    dept: "Product",
    lastDay: "Apr 15, 2026",
    reason: "Higher education",
    assetsReturned: false,
    ffStatus: "Pending",
    status: "Pending Clearance",
    noticeDays: 60,
    salary: 95000,
    leaveDays: 6,
    gratuity: 0,
  },
];

const STATUS_COLOR: Record<ExitStatus, string> = {
  "In Progress":      "status-watch",
  "Completed":        "status-on-track",
  "Pending Clearance":"status-risk",
};

const FF_COLOR: Record<ExitEmployee["ffStatus"], string> = {
  Pending:    "status-risk",
  Calculated: "status-watch",
  Paid:       "status-on-track",
};

export default function Offboarding() {
  const [exits, setExits] = useState<ExitEmployee[]>(EXITS);
  const [checklist, setChecklist] = useState([
    { label: "Resignation accepted by manager",     done: true  },
    { label: "Notice period served / bought out",   done: true  },
    { label: "Knowledge transfer completed",        done: true  },
    { label: "IT assets returned (laptop, badge)",  done: false },
    { label: "Access to all systems revoked",       done: false },
    { label: "Exit interview conducted",            done: false },
    { label: "PF withdrawal form submitted",        done: false },
    { label: "F&F payment processed",               done: false },
  ]);
  const [ffApproved, setFfApproved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const inProgress = exits.filter((e) => e.status === "In Progress").length;
  const completed  = exits.filter((e) => e.status === "Completed").length;
  const pending    = exits.filter((e) => e.status === "Pending Clearance").length;

  const selected = exits[0];
  const leaveEncashment = selected.leaveDays * Math.round(selected.salary / 26);
  const totalFF = selected.salary + leaveEncashment + selected.gratuity;

  function toggleChecklistItem(idx: number) {
    setChecklist((prev) => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  }

  function approveFF() {
    setFfApproved(true);
    setExits((prev) => prev.map((e, i) => i === 0 ? { ...e, ffStatus: "Paid" } : e));
    showToast("F&F approved and payment initiated for " + selected.name);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="page-content">
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: "#22c55e", color: "#fff", borderRadius: 8,
          padding: "10px 18px", fontWeight: 600, fontSize: "0.88rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>
          ✓ {toast}
        </div>
      )}
      <div className="page-header">
        <h1 className="page-title">Offboarding & Exit</h1>
        <p className="page-sub">Resignation Workflow · F&F Settlement · Exit Interview · Alumni Portal</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">In Progress</p>
          <p className="stat-value stat-amber">{inProgress}</p>
          <p className="stat-note">Active exit processes</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Completed (This Month)</p>
          <p className="stat-value stat-green">{completed}</p>
          <p className="stat-note">Successfully offboarded</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending Clearance</p>
          <p className="stat-value stat-risk">{pending}</p>
          <p className="stat-note">Assets / docs pending</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Clearance Days</p>
          <p className="stat-value">8.4</p>
          <p className="stat-note">Days from last day to F&F</p>
        </div>
      </div>

      {/* Exit Table */}
      <div className="section-block">
        <div className="section-head">
          <h2>Exit Pipeline</h2>
          <p>All active and recently completed offboarding cases.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Last Day</th>
              <th>Reason</th>
              <th>Notice Period</th>
              <th>Assets Returned</th>
              <th>F&F Status</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {exits.map((exit) => (
              <tr key={exit.name}>
                <td>{exit.name}</td>
                <td>{exit.dept}</td>
                <td>{exit.lastDay}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>{exit.reason}</td>
                <td className="mono">{exit.noticeDays} days</td>
                <td>
                  <span className={`status-chip ${exit.assetsReturned ? "status-on-track" : "status-risk"}`}>
                    {exit.assetsReturned ? "Returned" : "Pending"}
                  </span>
                </td>
                <td><span className={`status-chip ${FF_COLOR[exit.ffStatus]}`}>{exit.ffStatus}</span></td>
                <td><span className={`status-chip ${STATUS_COLOR[exit.status]}`}>{exit.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* F&F Calculator */}
      <div className="section-block">
        <div className="section-head">
          <h2>F&F Settlement — {selected.name}</h2>
          <p>Auto-calculated Full & Final settlement breakdown.</p>
        </div>
        <div className="ff-grid">
          <div className="ff-item">
            <span className="ff-label">Pending Salary (Prorated)</span>
            <span className="ff-value">₹{selected.salary.toLocaleString("en-IN")}</span>
          </div>
          <div className="ff-item">
            <span className="ff-label">Leave Encashment ({selected.leaveDays} days)</span>
            <span className="ff-value">₹{leaveEncashment.toLocaleString("en-IN")}</span>
          </div>
          <div className="ff-item">
            <span className="ff-label">Gratuity (if eligible)</span>
            <span className="ff-value">{selected.gratuity > 0 ? `₹${selected.gratuity.toLocaleString("en-IN")}` : "Not eligible (<5 yrs)"}</span>
          </div>
          <div className="ff-item ff-item-total">
            <span className="ff-label">Total F&F Payable</span>
            <span className="ff-value" style={{ color: "var(--gold-soft)", fontSize: "1.3rem", fontWeight: 800 }}>₹{totalFF.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem" }}>
          <button
            className="btn-primary"
            onClick={approveFF}
            disabled={ffApproved}
            style={{ opacity: ffApproved ? 0.6 : 1 }}
          >
            {ffApproved ? "✓ F&F Approved" : "Approve F&F"}
          </button>
          <button className="table-action-btn" onClick={() => showToast("Settlement letter downloaded as PDF")}>
            Download Settlement Letter
          </button>
          <button className="table-action-btn" onClick={() => showToast("Exit interview link sent to " + selected.name)}>
            Send Exit Interview
          </button>
        </div>
      </div>

      {/* Exit Checklist */}
      <div className="section-block">
        <div className="section-head">
          <h2>Exit Checklist — {selected.name}</h2>
          <p>Click items to mark as complete. All items must be cleared before final payment.</p>
        </div>
        <div className="joiner-tasks">
          {checklist.map((item, i) => (
            <div
              key={i}
              className="task-row"
              style={{ cursor: "pointer" }}
              onClick={() => toggleChecklistItem(i)}
            >
              <span className={`task-icon ${item.done ? "status-on-track" : "status-watch"}`}>
                {item.done ? "✓" : "○"}
              </span>
              <span className="task-label" style={{ color: item.done ? "var(--text-muted)" : "var(--text-main)", textDecoration: item.done ? "line-through" : "none" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {checklist.filter(i => i.done).length} / {checklist.length} items completed
        </div>
      </div>
    </div>
  );
}
