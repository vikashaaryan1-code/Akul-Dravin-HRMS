const RECRUITERS = [
  { name: "Internal Team A", type: "Internal", jobs: 18, hires: 7, commission: 0, payout: 0 },
  { name: "Talent Grid Partners", type: "Agency", jobs: 26, hires: 11, commission: 55000, payout: 44000 },
  { name: "Anita Verma", type: "Freelance", jobs: 12, hires: 5, commission: 25000, payout: 20000 },
  { name: "Global Hunt Hub", type: "Global Partner", jobs: 19, hires: 8, commission: 64000, payout: 51200 },
  { name: "AI Recruiter Bot", type: "AI Bot", jobs: 44, hires: 14, commission: 0, payout: 0 },
];

export default function RecruiterRevenue() {
  const paidCommission = RECRUITERS.reduce((sum, row) => sum + row.payout, 0);
  const grossCommission = RECRUITERS.reduce((sum, row) => sum + row.commission, 0);
  const totalHires = RECRUITERS.reduce((sum, row) => sum + row.hires, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Recruiter Revenue</h1>
        <p className="page-sub">Marketplace commission tracking and recruiter performance payouts.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Hires</p>
          <p className="stat-value">{totalHires}</p>
          <p className="stat-note">Placements this month</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Gross Commission</p>
          <p className="stat-value stat-amber">INR {grossCommission.toLocaleString("en-IN")}</p>
          <p className="stat-note">Before payout</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Paid Out</p>
          <p className="stat-value stat-green">INR {paidCommission.toLocaleString("en-IN")}</p>
          <p className="stat-note">Released this cycle</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Recruiter Earnings Dashboard</h2>
          <p>Track job delivery, hires, commissions, and payout readiness.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Recruiter</th>
              <th>Type</th>
              <th>Jobs</th>
              <th>Hires</th>
              <th>Commission</th>
              <th>Payout</th>
            </tr>
          </thead>
          <tbody>
            {RECRUITERS.map((row) => (
              <tr key={row.name}>
                <td style={{ fontWeight: 600 }}>{row.name}</td>
                <td>{row.type}</td>
                <td className="mono">{row.jobs}</td>
                <td className="mono">{row.hires}</td>
                <td className="mono">INR {row.commission.toLocaleString("en-IN")}</td>
                <td className="mono">INR {row.payout.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
