import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { usePersistentState } from "../lib/usePersistentState";

type AttendanceStatus = "Present" | "Absent" | "Leave" | "Remote" | "Holiday";

type AttendanceRow = {
  id: string;
  employee: string;
  dept: string;
  today: AttendanceStatus;
  monthDays: number;
  late: number;
  lop: number;
};

type LeaveBalance = {
  type: string;
  total: number;
  used: number;
  balance: number;
};

type LeaveRequestStatus = "Pending" | "Approved" | "Rejected";

type LeaveRequest = {
  id: string;
  from: string;
  to: string;
  type: string;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: string;
};

const DEFAULT_ATTENDANCE: AttendanceRow[] = [
  { id: "a1", employee: "Priya Nair", dept: "Engineering", today: "Present", monthDays: 20, late: 0, lop: 0 },
  { id: "a2", employee: "Vikram Singh", dept: "Sales", today: "Remote", monthDays: 19, late: 1, lop: 0 },
  { id: "a3", employee: "Ananya Roy", dept: "Design", today: "Present", monthDays: 21, late: 0, lop: 0 },
  { id: "a4", employee: "Samar Kapoor", dept: "Engineering", today: "Leave", monthDays: 18, late: 2, lop: 1 },
  { id: "a5", employee: "Nisha Verma", dept: "HR", today: "Present", monthDays: 21, late: 0, lop: 0 },
  { id: "a6", employee: "Rahul Mehta", dept: "Finance", today: "Absent", monthDays: 17, late: 1, lop: 2 },
  { id: "a7", employee: "Divya Sharma", dept: "Product", today: "Present", monthDays: 20, late: 3, lop: 0 },
];

const DEFAULT_LEAVE_BALANCES: LeaveBalance[] = [
  { type: "Earned Leave", total: 18, used: 5, balance: 13 },
  { type: "Sick Leave", total: 10, used: 2, balance: 8 },
  { type: "Casual Leave", total: 8, used: 3, balance: 5 },
  { type: "Optional Holiday", total: 4, used: 1, balance: 3 },
];

const TODAY_COLOR: Record<AttendanceStatus, string> = {
  Present: "status-on-track",
  Remote: "status-watch",
  Leave: "stage-beta",
  Absent: "status-risk",
  Holiday: "stage-roadmap",
};

const LEAVE_REQUEST_COLOR: Record<LeaveRequestStatus, string> = {
  Pending: "status-watch",
  Approved: "status-on-track",
  Rejected: "status-risk",
};

const EMPLOYEE_DEFAULT = "Priya Nair";

function dateToPretty(value: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Attendance() {
  const [attendance, setAttendance] = usePersistentState<AttendanceRow[]>(
    "hrms_attendance_rows",
    DEFAULT_ATTENDANCE,
  );
  const [leaveBalances] = usePersistentState<LeaveBalance[]>(
    "hrms_leave_balances",
    DEFAULT_LEAVE_BALANCES,
  );
  const [leaveRequests, setLeaveRequests] = usePersistentState<LeaveRequest[]>(
    "hrms_leave_requests",
    [],
  );

  const [search, setSearch] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    employee: EMPLOYEE_DEFAULT,
    from: "",
    to: "",
    type: "Earned Leave",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const filteredAttendance = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return attendance;
    }
    return attendance.filter((row) => {
      return (
        row.employee.toLowerCase().includes(query) ||
        row.dept.toLowerCase().includes(query) ||
        row.today.toLowerCase().includes(query)
      );
    });
  }, [attendance, search]);

  const present = attendance.filter((row) => row.today === "Present" || row.today === "Remote").length;
  const onLeave = attendance.filter((row) => row.today === "Leave").length;
  const absent = attendance.filter((row) => row.today === "Absent").length;
  const remote = attendance.filter((row) => row.today === "Remote").length;

  function updateAttendanceStatus(id: string, status: AttendanceStatus) {
    setAttendance((prev) => prev.map((row) => (row.id === id ? { ...row, today: status } : row)));
  }

  function updateLeaveRequestStatus(id: string, status: LeaveRequestStatus) {
    setLeaveRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const fromDate = new Date(`${leaveForm.from}T00:00:00`);
    const toDate = new Date(`${leaveForm.to}T00:00:00`);
    if (toDate < fromDate) {
      return;
    }

    const request: LeaveRequest = {
      id: `lr-${Date.now()}`,
      from: leaveForm.from,
      to: leaveForm.to,
      type: leaveForm.type,
      reason: leaveForm.reason,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [request, ...prev]);

    setAttendance((prev) => {
      const row = prev.find((item) => item.employee === leaveForm.employee);
      if (!row) {
        return prev;
      }
      return prev.map((item) =>
        item.id === row.id
          ? {
              ...item,
              today: "Leave",
            }
          : item,
      );
    });

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
    setLeaveForm((prev) => ({ ...prev, from: "", to: "", reason: "" }));
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Attendance and Leave</h1>
        <p className="page-sub">Biometric, GPS, shift controls, leave workflows, and payroll sync.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Present Today</p>
          <p className="stat-value stat-green">{present}</p>
          <p className="stat-note">Including remote workers</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">On Leave</p>
          <p className="stat-value stat-amber">{onLeave}</p>
          <p className="stat-note">Approved or requested leaves</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Absent</p>
          <p className="stat-value stat-risk">{absent}</p>
          <p className="stat-note">Unplanned absence</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Working Remote</p>
          <p className="stat-value">{remote}</p>
          <p className="stat-note">Location-aware attendance</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Leave Balances</h2>
          <p>Accrual and balance tracking by leave type.</p>
        </div>

        <div className="leave-balance-grid">
          {leaveBalances.map((balance) => (
            <div key={balance.type} className="leave-balance-card">
              <p className="leave-type">{balance.type}</p>
              <div className="leave-numbers">
                <span className="leave-balance-val">{balance.balance}</span>
                <span className="leave-balance-of"> / {balance.total} days</span>
              </div>
              <div className="automation-track" style={{ marginTop: "0.6rem" }}>
                <div
                  className="automation-fill"
                  style={{
                    width: `${(balance.balance / balance.total) * 100}%`,
                    background:
                      balance.balance > balance.total / 2
                        ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                        : "linear-gradient(90deg,#f3b955,#ffd98e)",
                  }}
                />
              </div>
              <p className="leave-used">{balance.used} used</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Apply Leave</h2>
          <p>Request is routed to manager immediately.</p>
        </div>

        {submitted && <p className="notice-success">Leave request submitted successfully.</p>}

        <form className="data-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Employee</label>
              <select
                className="form-input"
                value={leaveForm.employee}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, employee: event.target.value }))}
                required
              >
                {attendance.map((row) => (
                  <option key={row.id} value={row.employee}>{row.employee}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">From</label>
              <input
                className="form-input"
                type="date"
                value={leaveForm.from}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, from: event.target.value }))}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">To</label>
              <input
                className="form-input"
                type="date"
                value={leaveForm.to}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, to: event.target.value }))}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Leave Type</label>
              <select
                className="form-input"
                value={leaveForm.type}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                {leaveBalances.map((balance) => (
                  <option key={balance.type} value={balance.type}>{balance.type}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Reason</label>
              <input
                className="form-input"
                placeholder="Reason for leave"
                value={leaveForm.reason}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
                required
              />
            </div>
            <button className="btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>Apply</button>
          </div>
        </form>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Attendance Register</h2>
          <p>Update status and monitor monthly attendance markers.</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            className="form-input"
            style={{ maxWidth: 260 }}
            placeholder="Search employee, department, status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Today</th>
              <th>Update</th>
              <th>Working Days</th>
              <th>Late</th>
              <th>LOP</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((row) => (
              <tr key={row.id}>
                <td>{row.employee}</td>
                <td>{row.dept}</td>
                <td><span className={`status-chip ${TODAY_COLOR[row.today]}`}>{row.today}</span></td>
                <td>
                  <select
                    className="form-input"
                    style={{ padding: "5px 8px", fontSize: "0.78rem", width: "auto" }}
                    value={row.today}
                    onChange={(event) => updateAttendanceStatus(row.id, event.target.value as AttendanceStatus)}
                  >
                    <option value="Present">Present</option>
                    <option value="Remote">Remote</option>
                    <option value="Leave">Leave</option>
                    <option value="Absent">Absent</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </td>
                <td className="mono">{row.monthDays}</td>
                <td className="mono" style={{ color: row.late > 0 ? "var(--amber)" : "inherit" }}>{row.late}</td>
                <td className="mono" style={{ color: row.lop > 0 ? "var(--red)" : "inherit" }}>{row.lop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Leave Requests</h2>
          <p>Manager decision workflow for submitted leave requests.</p>
        </div>

        {leaveRequests.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>No leave requests yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Requested On</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>{dateToPretty(request.createdAt.slice(0, 10))}</td>
                  <td>{dateToPretty(request.from)}</td>
                  <td>{dateToPretty(request.to)}</td>
                  <td>{request.type}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{request.reason}</td>
                  <td><span className={`status-chip ${LEAVE_REQUEST_COLOR[request.status]}`}>{request.status}</span></td>
                  <td>
                    {request.status === "Pending" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="table-action-btn" onClick={() => updateLeaveRequestStatus(request.id, "Approved")}>Approve</button>
                        <button className="table-action-btn" onClick={() => updateLeaveRequestStatus(request.id, "Rejected")}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: "0.74rem" }}>Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
