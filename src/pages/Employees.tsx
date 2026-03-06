import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import type { Employee } from "../types";

type EmployeeForm = {
  name: string;
  email: string;
  department: string;
  location: string;
  ctcMonthly: string;
};

const BLANK_FORM: EmployeeForm = {
  name: "", email: "", department: "", location: "", ctcMonthly: "",
};

const DEPTS = ["Engineering", "Design", "Product", "Sales", "Marketing", "Finance", "HR", "Operations"];
const LOCATIONS = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Remote"];

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<EmployeeForm>(BLANK_FORM);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.get<Employee[]>("/employees")
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<Employee>("/employees", {
        ...form,
        ctcMonthly: Number(form.ctcMonthly),
      });
      setForm(BLANK_FORM);
      setShowForm(false);
      load();
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(emp: Employee) {
    await api.patch(`/employees/${emp.id}`, {
      status: emp.status === "active" ? "inactive" : "active",
    }).catch(() => {});
    load();
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const active = employees.filter((e) => e.status === "active").length;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <p className="page-sub">Employee lifecycle · Core HR · Org Chart</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Employees</p>
          <p className="stat-value">{employees.length}</p>
          <p className="stat-note">All records</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active</p>
          <p className="stat-value stat-green">{active}</p>
          <p className="stat-note">Currently employed</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Inactive</p>
          <p className="stat-value stat-risk">{employees.length - active}</p>
          <p className="stat-note">On hold / exit</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Departments</p>
          <p className="stat-value">{new Set(employees.map((e) => e.department)).size}</p>
          <p className="stat-note">Unique departments</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="section-block">
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <input
            className="form-input"
            style={{ maxWidth: 260 }}
            placeholder="Search by name, email, dept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn-primary"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ Cancel" : "+ Add Employee"}
          </button>
        </div>

        {showForm && (
          <form className="data-form" onSubmit={handleCreate} style={{ marginBottom: 20, padding: "16px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px solid var(--border-gold)" }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Work Email</label>
                <input className="form-input" type="email" placeholder="email@company.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} required>
                  <option value="">Select dept</option>
                  {DEPTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <select className="form-input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required>
                  <option value="">Select location</option>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">CTC / Month (INR)</label>
                <input className="form-input" type="number" placeholder="85000" min="1" value={form.ctcMonthly} onChange={(e) => setForm((p) => ({ ...p, ctcMonthly: e.target.value }))} required />
              </div>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ alignSelf: "flex-end" }}>
                {submitting ? "Adding…" : "Add Employee"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", padding: "24px 0", textAlign: "center" }}>Loading employees…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Department</th>
                <th>Location</th>
                <th>CTC / Month</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "28px 0" }}>No employees found.</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="emp-name-cell">
                        <div className="emp-avatar">{emp.name.charAt(0)}</div>
                        <div>
                          <p className="emp-name" style={{ margin: 0, fontSize: "0.84rem" }}>{emp.name}</p>
                          <p className="emp-email">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: "0.78rem" }}>{emp.employeeCode}</td>
                    <td>{emp.department}</td>
                    <td>{emp.location}</td>
                    <td className="mono">₹{emp.ctcMonthly.toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`status-chip ${emp.status === "active" ? "status-on-track" : "status-risk"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button className="table-action-btn" onClick={() => handleToggle(emp)}>
                        {emp.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
