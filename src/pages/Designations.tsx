import { useState } from "react";
import "../hrms.css";

const LEVELS = [
  { level: "C-Suite", color: "#d2ae52", roles: ["CEO", "CTO", "CFO", "CHRO", "COO"], band: "₹50L – ₹5Cr+", count: 5 },
  { level: "VP / Director", color: "#b97a93", roles: ["VP Engineering", "Sales Director", "HR Director", "Finance Director"], band: "₹30L – ₹80L", count: 12 },
  { level: "Senior Manager", color: "#5b9cf6", roles: ["Sr. Engineering Manager", "Sr. HR Manager", "Sr. Finance Manager"], band: "₹18L – ₹40L", count: 18 },
  { level: "Manager", color: "#40b77e", roles: ["Engineering Manager", "Sales Manager", "HR Manager", "Finance Manager"], band: "₹12L – ₹25L", count: 34 },
  { level: "Lead / Senior", color: "#a78bfa", roles: ["Tech Lead", "Sr. Software Engineer", "Sales Lead", "Team Lead"], band: "₹8L – ₹18L", count: 52 },
  { level: "Associate / Executive", color: "#8ba0b8", roles: ["Software Engineer", "Sales Executive", "HR Executive", "Accountant"], band: "₹4L – ₹12L", count: 148 },
  { level: "Intern / Trainee", color: "#64748b", roles: ["Software Intern", "Management Trainee", "Apprentice"], band: "₹1.5L – ₹4L", count: 23 },
];

const DESIGNATIONS = [
  { title: "CEO", dept: "Leadership", level: "C-Suite", min: "₹50L", max: "₹5Cr+", employees: 1, reportsTo: "Board" },
  { title: "CTO", dept: "Engineering", level: "C-Suite", min: "₹40L", max: "₹2Cr", employees: 1, reportsTo: "CEO" },
  { title: "CFO", dept: "Finance", level: "C-Suite", min: "₹35L", max: "₹1.5Cr", employees: 1, reportsTo: "CEO" },
  { title: "VP Engineering", dept: "Engineering", level: "VP / Director", min: "₹30L", max: "₹80L", employees: 2, reportsTo: "CTO" },
  { title: "Sales Director", dept: "Sales", level: "VP / Director", min: "₹28L", max: "₹70L", employees: 1, reportsTo: "CEO" },
  { title: "Tech Lead", dept: "Engineering", level: "Lead / Senior", min: "₹18L", max: "₹35L", employees: 8, reportsTo: "VP Eng" },
  { title: "Sr. Software Engineer", dept: "Engineering", level: "Lead / Senior", min: "₹12L", max: "₹28L", employees: 16, reportsTo: "Tech Lead" },
  { title: "Software Engineer", dept: "Engineering", level: "Associate / Executive", min: "₹6L", max: "₹14L", employees: 24, reportsTo: "Sr. SWE" },
  { title: "Sales Executive", dept: "Sales", level: "Associate / Executive", min: "₹4L", max: "₹10L", employees: 18, reportsTo: "Sales Mgr" },
  { title: "HR Manager", dept: "HR", level: "Manager", min: "₹10L", max: "₹20L", employees: 4, reportsTo: "HR Director" },
  { title: "Finance Manager", dept: "Finance", level: "Manager", min: "₹12L", max: "₹25L", employees: 3, reportsTo: "CFO" },
  { title: "Software Intern", dept: "Engineering", level: "Intern / Trainee", min: "₹1.5L", max: "₹3.5L", employees: 5, reportsTo: "Tech Lead" },
];

export default function Designations() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtered = DESIGNATIONS.filter(d =>
    (filter === "all" || d.level === filter) &&
    (d.title.toLowerCase().includes(search.toLowerCase()) || d.dept.toLowerCase().includes(search.toLowerCase()))
  );

  const totalEmp = LEVELS.reduce((s, l) => s + l.count, 0);

  return (
    <div className="page-content">
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, background: "#1a7a4a", color: "#fff", padding: "10px 20px", borderRadius: 8, zIndex: 9999, fontWeight: 600, fontSize: "0.85rem" }}>{toast}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card"><p className="stat-label">Total Designations</p><p className="stat-value">{DESIGNATIONS.length}</p><p className="stat-note">Active roles defined</p></div>
        <div className="stat-card"><p className="stat-label">Hierarchy Levels</p><p className="stat-value">{LEVELS.length}</p><p className="stat-note">From intern to C-Suite</p></div>
        <div className="stat-card"><p className="stat-label">Employees Mapped</p><p className="stat-value">{totalEmp}</p><p className="stat-note">Across all designations</p></div>
        <div className="stat-card"><p className="stat-label">Departments</p><p className="stat-value">9</p><p className="stat-note">Business units</p></div>
      </div>

      {/* Hierarchy Pyramid */}
      <div className="section-block">
        <div className="section-head"><h2>Designation Hierarchy</h2><p>Role levels with salary bands and headcount.</p></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {LEVELS.map((lvl, i) => (
            <div key={lvl.level} style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }} onClick={() => setFilter(filter === lvl.level ? "all" : lvl.level)}>
              <div style={{
                height: 44,
                borderRadius: 8,
                background: `${lvl.color}18`,
                border: `1.5px solid ${lvl.color}44`,
                display: "flex",
                alignItems: "center",
                padding: "0 1rem",
                gap: "0.75rem",
                flex: 1,
                marginLeft: `${i * 20}px`,
                transition: "all 0.15s",
                outline: filter === lvl.level ? `2px solid ${lvl.color}` : "none",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: lvl.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: lvl.color, minWidth: 160 }}>{lvl.level}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", flex: 1 }}>{lvl.roles.join(" · ")}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", whiteSpace: "nowrap" }}>{lvl.band}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: lvl.color, minWidth: 40, textAlign: "right" }}>{lvl.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Designation Table */}
      <div className="section-block">
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Search designations..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-input" style={{ width: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Levels</option>
            {LEVELS.map(l => <option key={l.level} value={l.level}>{l.level}</option>)}
          </select>
          <button className="btn-primary" onClick={() => showToast("Add Designation — coming soon")}>+ Add Designation</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Designation</th><th>Department</th><th>Level</th><th>Salary Band</th><th>Reports To</th><th>Employees</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.title}>
                <td style={{ fontWeight: 600 }}>{d.title}</td>
                <td>{d.dept}</td>
                <td><span className="status-chip stage-beta" style={{ fontSize: "0.7rem" }}>{d.level}</span></td>
                <td className="mono">{d.min} – {d.max}</td>
                <td style={{ color: "var(--text-dim)" }}>{d.reportsTo}</td>
                <td className="mono">{d.employees}</td>
                <td>
                  <button className="btn-secondary" style={{ fontSize: "0.72rem", padding: "3px 10px" }} onClick={() => showToast(`Editing ${d.title}`)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
