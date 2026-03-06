const DEPARTMENTS = [
  { name: "Human Resources", headcount: 42, openRoles: 3, budgetUse: 78, risk: "watch" },
  { name: "Finance", headcount: 26, openRoles: 2, budgetUse: 72, risk: "on-track" },
  { name: "Sales", headcount: 118, openRoles: 14, budgetUse: 91, risk: "watch" },
  { name: "Marketing", headcount: 54, openRoles: 5, budgetUse: 76, risk: "on-track" },
  { name: "IT", headcount: 87, openRoles: 11, budgetUse: 88, risk: "watch" },
  { name: "Operations", headcount: 139, openRoles: 9, budgetUse: 83, risk: "on-track" },
];

const RISK_CLASS: Record<string, string> = {
  "on-track": "status-on-track",
  watch: "status-watch",
  risk: "status-risk",
};

export default function Departments() {
  const totalHeadcount = DEPARTMENTS.reduce((sum, dept) => sum + dept.headcount, 0);
  const totalOpenRoles = DEPARTMENTS.reduce((sum, dept) => sum + dept.openRoles, 0);
  const avgBudgetUse = Math.round(DEPARTMENTS.reduce((sum, dept) => sum + dept.budgetUse, 0) / DEPARTMENTS.length);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Departments</h1>
        <p className="page-sub">Department hierarchy, workforce load, and hiring demand.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Departments</p>
          <p className="stat-value">{DEPARTMENTS.length}</p>
          <p className="stat-note">Active business units</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Headcount</p>
          <p className="stat-value">{totalHeadcount}</p>
          <p className="stat-note">Across all departments</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Open Roles</p>
          <p className="stat-value stat-amber">{totalOpenRoles}</p>
          <p className="stat-note">Hiring demand this quarter</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Budget Use</p>
          <p className="stat-value">{avgBudgetUse}%</p>
          <p className="stat-note">Average utilization</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Department Management Matrix</h2>
          <p>Track headcount, open demand, and risk signals by function.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Headcount</th>
              <th>Open Roles</th>
              <th>Budget Use</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEPARTMENTS.map((dept) => (
              <tr key={dept.name}>
                <td style={{ fontWeight: 600 }}>{dept.name}</td>
                <td className="mono">{dept.headcount}</td>
                <td className="mono">{dept.openRoles}</td>
                <td className="mono">{dept.budgetUse}%</td>
                <td>
                  <span className={`status-chip ${RISK_CLASS[dept.risk] ?? "stage-roadmap"}`}>{dept.risk}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
