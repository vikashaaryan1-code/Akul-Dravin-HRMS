import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { usePersistentState } from "../lib/usePersistentState";

type LeaveType = {
  name: string;
  icon: string;
  total: number;
  used: number;
  encashable: boolean;
  carryforward: boolean;
  maxPerRequest: number;
};

type LeaveRequest = {
  id: string;
  employee: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
  approvedBy?: string;
};

type Holiday = {
  date: string;
  name: string;
  type: "National" | "Optional" | "Company";
};

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { name: "Casual Leave",      icon: "☀️",  total: 12,  used: 3,  encashable: false, carryforward: false, maxPerRequest: 3   },
  { name: "Sick Leave",        icon: "🏥",  total: 10,  used: 2,  encashable: false, carryforward: false, maxPerRequest: 6   },
  { name: "Earned Leave",      icon: "📅",  total: 18,  used: 5,  encashable: true,  carryforward: true,  maxPerRequest: 18  },
  { name: "Privilege Leave",   icon: "⭐",  total: 15,  used: 2,  encashable: true,  carryforward: true,  maxPerRequest: 15  },
  { name: "Maternity Leave",   icon: "🤱",  total: 182, used: 0,  encashable: false, carryforward: false, maxPerRequest: 182 },
  { name: "Paternity Leave",   icon: "👨‍👶",  total: 15,  used: 0,  encashable: false, carryforward: false, maxPerRequest: 15  },
  { name: "Bereavement Leave", icon: "🕊️",  total: 5,   used: 0,  encashable: false, carryforward: false, maxPerRequest: 5   },
  { name: "Marriage Leave",    icon: "💒",  total: 5,   used: 0,  encashable: false, carryforward: false, maxPerRequest: 5   },
  { name: "Compensatory Off",  icon: "🔄",  total: 0,   used: 0,  encashable: false, carryforward: false, maxPerRequest: 5   },
  { name: "Unpaid Leave",      icon: "📝",  total: 0,   used: 0,  encashable: false, carryforward: false, maxPerRequest: 30  },
];

const HOLIDAYS: Holiday[] = [
  { date: "2026-01-26", name: "Republic Day",              type: "National"  },
  { date: "2026-03-17", name: "Holi",                      type: "National"  },
  { date: "2026-04-14", name: "Dr. Ambedkar Jayanti",      type: "National"  },
  { date: "2026-05-01", name: "Maharashtra Day",           type: "Optional"  },
  { date: "2026-06-15", name: "Founders Day (Company)",    type: "Company"   },
  { date: "2026-08-15", name: "Independence Day",          type: "National"  },
  { date: "2026-10-02", name: "Gandhi Jayanti",            type: "National"  },
  { date: "2026-10-23", name: "Diwali",                    type: "National"  },
  { date: "2026-10-24", name: "Diwali (Additional)",       type: "Optional"  },
  { date: "2026-11-05", name: "Diwali Padwa",              type: "Optional"  },
  { date: "2026-12-25", name: "Christmas",                 type: "National"  },
  { date: "2026-12-31", name: "Year-End Shutdown",         type: "Company"   },
];

const EMPLOYEES = ["Priya Nair", "Vikram Singh", "Ananya Roy", "Samar Kapoor", "Nisha Verma", "Rahul Mehta", "Divya Sharma"];

function daysBetween(from: string, to: string): number {
  const d1 = new Date(from + "T00:00:00");
  const d2 = new Date(to + "T00:00:00");
  return Math.max(Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1, 0);
}

function prettyDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_COLOR: Record<"Pending" | "Approved" | "Rejected", string> = {
  Pending:  "status-watch",
  Approved: "status-on-track",
  Rejected: "status-risk",
};

const HOLIDAY_COLOR: Record<"National" | "Optional" | "Company", string> = {
  National: "status-on-track",
  Optional: "status-watch",
  Company:  "stage-beta",
};

export default function Leave() {
  const [leaveTypes] = usePersistentState<LeaveType[]>("hrms_leave_types_v2", DEFAULT_LEAVE_TYPES);
  const [requests, setRequests] = usePersistentState<LeaveRequest[]>("hrms_leave_requests_v2", []);

  const [form, setForm] = useState({
    employee: EMPLOYEES[0],
    type: "Earned Leave",
    from: "",
    to: "",
    reason: "",
  });

  const [activeTab, setActiveTab] = useState<"balances" | "requests" | "calendar" | "policies">("balances");
  const [submitted, setSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  const days = useMemo(() => daysBetween(form.from, form.to), [form.from, form.to]);
  const totalQuota = leaveTypes.reduce((s, t) => s + t.total, 0);
  const totalUsed = leaveTypes.reduce((s, t) => s + t.used, 0);
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const encashableBalance = leaveTypes
    .filter((t) => t.encashable)
    .reduce((s, t) => s + Math.max(t.total - t.used, 0), 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.from || !form.to || days <= 0) return;
    const req: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employee: form.employee,
      type: form.type,
      from: form.from,
      to: form.to,
      days,
      reason: form.reason,
      status: "Pending",
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [req, ...prev]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setForm((prev) => ({ ...prev, from: "", to: "", reason: "" }));
  }

  function updateStatus(id: string, status: "Approved" | "Rejected") {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, approvedBy: "HR Manager" } : r)),
    );
  }

  const filteredRequests = requests.filter(
    (r) => filterStatus === "All" || r.status === filterStatus,
  );

  const TABS = [
    { key: "balances" as const, label: "📊 Balances" },
    { key: "requests" as const, label: "📋 Requests" },
    { key: "calendar" as const, label: "📅 Holiday Calendar" },
    { key: "policies" as const, label: "📜 Policies" },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <p className="page-sub">10+ Leave Types · Balance Tracking · Approval Workflows · Holiday Calendar · Encashment Rules</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Leave Quota</p>
          <p className="stat-value">{totalQuota}</p>
          <p className="stat-note">10 configured leave types</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Days Consumed</p>
          <p className="stat-value stat-amber">{totalUsed}</p>
          <p className="stat-note">Across all leave types</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending Approvals</p>
          <p className="stat-value stat-risk">{pendingCount}</p>
          <p className="stat-note">Awaiting manager decision</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Encashable Balance</p>
          <p className="stat-value stat-green">{encashableBalance}</p>
          <p className="stat-note">Earned + Privilege leave</p>
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

      {/* ── Balances Tab ── */}
      {activeTab === "balances" && (
        <>
          <div className="section-block">
            <div className="section-head">
              <h2>Leave Balance Summary</h2>
              <p>Accrual, usage, and remaining balance across all 10 leave types.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {leaveTypes.map((lt) => {
                const balance = Math.max(lt.total - lt.used, 0);
                const pct = lt.total > 0 ? Math.round((balance / lt.total) * 100) : 0;
                return (
                  <div key={lt.name} className="section-block" style={{ margin: 0, padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{lt.icon} {lt.name}</span>
                      <span style={{ display: "flex", gap: 4 }}>
                        {lt.encashable && (
                          <span className="status-chip status-on-track" style={{ fontSize: "0.62rem", padding: "1px 5px" }}>Encashable</span>
                        )}
                        {lt.carryforward && (
                          <span className="status-chip stage-beta" style={{ fontSize: "0.62rem", padding: "1px 5px" }}>Carry Fwd</span>
                        )}
                      </span>
                    </div>
                    {lt.total > 0 ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>{balance}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "flex-end" }}>/ {lt.total} days</span>
                        </div>
                        <div className="automation-track">
                          <div
                            className="automation-fill"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct > 50
                                  ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                                  : pct > 25
                                  ? "linear-gradient(90deg,#f3b955,#ffd98e)"
                                  : "linear-gradient(90deg,#eb675f,#ff9c96)",
                            }}
                          />
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 4 }}>
                          {lt.used} used · Max {lt.maxPerRequest} days/request
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                        As needed · Max {lt.maxPerRequest} days/instance
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Apply Leave Form */}
          <div className="section-block">
            <div className="section-head">
              <h2>Apply for Leave</h2>
              <p>Request is instantly routed to the direct manager for approval.</p>
            </div>
            {submitted && <p className="notice-success">Leave request submitted and routed to manager for approval.</p>}
            <form className="data-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Employee</label>
                  <select
                    className="form-input"
                    value={form.employee}
                    onChange={(e) => setForm((p) => ({ ...p, employee: e.target.value }))}
                  >
                    {EMPLOYEES.map((emp) => <option key={emp}>{emp}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Leave Type</label>
                  <select
                    className="form-input"
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {leaveTypes.map((lt) => <option key={lt.name}>{lt.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.from}
                    onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.to}
                    onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
                    required
                  />
                </div>
                {form.from && form.to && days > 0 && (
                  <div className="form-group" style={{ flex: 0.5 }}>
                    <label className="form-label">Days</label>
                    <div
                      className="form-input"
                      style={{ textAlign: "center", fontWeight: 700, color: "var(--gold)", fontSize: "1.1rem" }}
                    >
                      {days}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Reason</label>
                  <input
                    className="form-input"
                    placeholder="Brief reason for leave"
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Requests Tab ── */}
      {activeTab === "requests" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Leave Requests</h2>
            <p>Full approval workflow with manager decisions and complete audit trail.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(["All", "Pending", "Approved", "Rejected"] as const).map((f) => (
              <button
                key={f}
                className={filterStatus === f ? "btn-primary" : "btn-secondary"}
                onClick={() => setFilterStatus(f)}
                style={{ fontSize: "0.78rem" }}
              >
                {f}
                {f !== "All" && (
                  <span style={{ marginLeft: 5, fontSize: "0.72rem", opacity: 0.75 }}>
                    ({requests.filter((r) => r.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          {filteredRequests.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>
              No {filterStatus !== "All" ? filterStatus.toLowerCase() + " " : ""}leave requests.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.employee}</td>
                    <td>{req.type}</td>
                    <td>{prettyDate(req.from)}</td>
                    <td>{prettyDate(req.to)}</td>
                    <td className="mono">{req.days}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{req.reason}</td>
                    <td style={{ fontSize: "0.78rem" }}>{prettyDate(req.appliedOn)}</td>
                    <td>
                      <span className={`status-chip ${STATUS_COLOR[req.status]}`}>{req.status}</span>
                    </td>
                    <td>
                      {req.status === "Pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="table-action-btn" onClick={() => updateStatus(req.id, "Approved")}>
                            Approve
                          </button>
                          <button className="table-action-btn" onClick={() => updateStatus(req.id, "Rejected")}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-dim)", fontSize: "0.74rem" }}>
                          Closed · {req.approvedBy || "Auto"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Calendar Tab ── */}
      {activeTab === "calendar" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Holiday Calendar — 2026</h2>
            <p>Official holidays including national, optional, and company-specific days.</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Holiday</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {HOLIDAYS.map((h) => {
                const d = new Date(h.date + "T00:00:00");
                return (
                  <tr key={h.date}>
                    <td className="mono">{prettyDate(h.date)}</td>
                    <td>{d.toLocaleDateString("en-IN", { weekday: "long" })}</td>
                    <td style={{ fontWeight: 500 }}>{h.name}</td>
                    <td>
                      <span className={`status-chip ${HOLIDAY_COLOR[h.type]}`}>{h.type}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: 12 }}>
            * Employees may choose any 2 Optional holidays per year. Company holidays are mandatory paid leaves.
          </p>
        </div>
      )}

      {/* ── Policies Tab ── */}
      {activeTab === "policies" && (
        <div className="section-block">
          <div className="section-head">
            <h2>Leave Policies & Rules</h2>
            <p>Carryforward limits, encashment rates, and annual accrual schedule.</p>
          </div>

          {/* Encashment Formula */}
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(210,174,82,0.07)",
              borderRadius: 8,
              border: "1px solid rgba(210,174,82,0.2)",
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: "0.84rem", color: "var(--gold)", fontWeight: 700, marginBottom: 6 }}>
              Encashment Formula
            </p>
            <p style={{ fontFamily: "monospace", fontSize: "0.88rem", color: "var(--text-main)" }}>
              Encashment Amount = (Basic Salary ÷ 26) × Leave Days
            </p>
            <p style={{ fontSize: "0.76rem", color: "var(--text-dim)", marginTop: 4 }}>
              Applicable for Earned Leave and Privilege Leave balances only.
            </p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Annual Quota</th>
                <th>Monthly Accrual</th>
                <th>Max / Request</th>
                <th>Encashable</th>
                <th>Carryforward</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((lt) => (
                <tr key={lt.name}>
                  <td>{lt.icon} {lt.name}</td>
                  <td className="mono">{lt.total > 0 ? `${lt.total} days` : "As needed"}</td>
                  <td className="mono">{lt.total > 0 ? `${(lt.total / 12).toFixed(1)} days` : "—"}</td>
                  <td className="mono">{lt.maxPerRequest} days</td>
                  <td>
                    <span className={`status-chip ${lt.encashable ? "status-on-track" : "status-risk"}`}>
                      {lt.encashable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-chip ${lt.carryforward ? "status-on-track" : "status-risk"}`}>
                      {lt.carryforward ? "Max 30 days" : "No — lapses Dec 31"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
