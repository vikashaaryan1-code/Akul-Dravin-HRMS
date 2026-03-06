const PARTNERS = [
  { partner: "TalentHub Platform", domain: "hr.talenthub.com", clients: 42, plan: "WL Global", status: "active", mrr: 100000 },
  { partner: "RecruitPro Solutions", domain: "app.recruitpro.in", clients: 18, plan: "WL Pro", status: "active", mrr: 50000 },
  { partner: "FutureEdge HR", domain: "portal.futureedge.io", clients: 9, plan: "WL Basic", status: "active", mrr: 25000 },
  { partner: "Orbit Workforce", domain: "orbit.workforce.app", clients: 4, plan: "WL Pro", status: "onboarding", mrr: 50000 },
];

const WL_STATUS: Record<string, string> = {
  active: "status-on-track",
  onboarding: "status-watch",
  suspended: "status-risk",
};

const CAPABILITIES = [
  "Custom logo and color themes",
  "Custom domain mapping with SSL",
  "Partner pricing control",
  "Client lifecycle management",
  "Partner revenue dashboard",
  "API and integration access",
];

export default function WhiteLabel() {
  const activePartners = PARTNERS.filter((p) => p.status === "active").length;
  const partnerMRR = PARTNERS.reduce((sum, p) => sum + p.mrr, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">White Label</h1>
        <p className="page-sub">Partner branding, tenant control, and revenue sharing operations.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Active Partners</p>
          <p className="stat-value stat-green">{activePartners}</p>
          <p className="stat-note">Live white-label operators</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Partner MRR</p>
          <p className="stat-value">INR {partnerMRR.toLocaleString("en-IN")}</p>
          <p className="stat-note">From WL plans</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>White Label Partner Registry</h2>
          <p>Branding and commercial control across partner tenants.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Domain</th>
              <th>Clients</th>
              <th>Plan</th>
              <th>MRR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {PARTNERS.map((row) => (
              <tr key={row.partner}>
                <td style={{ fontWeight: 600 }}>{row.partner}</td>
                <td className="mono">{row.domain}</td>
                <td className="mono">{row.clients}</td>
                <td>{row.plan}</td>
                <td className="mono">INR {row.mrr.toLocaleString("en-IN")}</td>
                <td>
                  <span className={`status-chip ${WL_STATUS[row.status] ?? "stage-roadmap"}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>White Label Capabilities</h2>
          <p>Core capabilities available to partner tenants.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {CAPABILITIES.map((item) => (
            <div key={item} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: "0.8rem" }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
