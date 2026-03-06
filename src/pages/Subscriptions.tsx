const SUBSCRIPTIONS = [
  { company: "Akul Dravin Corp", plan: "Global Enterprise", category: "Combined", users: 842, renewal: "31 Mar 2026", status: "active", arr: 239988 },
  { company: "Starfield Dynamics", plan: "Corporate", category: "Combined", users: 318, renewal: "19 Mar 2026", status: "active", arr: 119988 },
  { company: "NovaTech Solutions", plan: "HR Growth", category: "HRMS", users: 97, renewal: "15 Mar 2026", status: "trial", arr: 35988 },
  { company: "BlueWave Media", plan: "Recruit Pro", category: "Recruitment", users: 44, renewal: "28 Mar 2026", status: "active", arr: 47988 },
  { company: "Vertex Capital", plan: "WL Pro", category: "White Label", users: 1500, renewal: "04 Apr 2026", status: "active", arr: 600000 },
];

const STATUS_CLASS: Record<string, string> = {
  active: "status-on-track",
  trial: "status-watch",
  overdue: "status-risk",
};

export default function Subscriptions() {
  const activeCount = SUBSCRIPTIONS.filter((item) => item.status === "active").length;
  const annualValue = SUBSCRIPTIONS.reduce((sum, item) => sum + item.arr, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Subscriptions</h1>
        <p className="page-sub">Track active contracts, renewals, and annual recurring value.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Active Subscriptions</p>
          <p className="stat-value stat-green">{activeCount}</p>
          <p className="stat-note">Currently billed accounts</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Portfolio ARR</p>
          <p className="stat-value">INR {(annualValue / 100000).toFixed(2)}L</p>
          <p className="stat-note">Total annualized value</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Subscription Register</h2>
          <p>Unified contract ledger for HRMS, ATS, and white-label plans.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Category</th>
              <th>Active Users</th>
              <th>Renewal Date</th>
              <th>ARR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {SUBSCRIPTIONS.map((item) => (
              <tr key={item.company}>
                <td style={{ fontWeight: 600 }}>{item.company}</td>
                <td>{item.plan}</td>
                <td>{item.category}</td>
                <td className="mono">{item.users}</td>
                <td className="mono">{item.renewal}</td>
                <td className="mono">INR {item.arr.toLocaleString("en-IN")}</td>
                <td><span className={`status-chip ${STATUS_CLASS[item.status] ?? "stage-roadmap"}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
