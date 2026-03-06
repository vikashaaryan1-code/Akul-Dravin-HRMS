const PLAN_CARDS = [
  {
    category: "HRMS Plans",
    plans: [
      { name: "HR Starter", price: "INR 999/mo", limits: "25 employees", ai: "No" },
      { name: "HR Growth", price: "INR 2,999/mo", limits: "100 employees", ai: "Partial" },
      { name: "HR Enterprise", price: "INR 7,999/mo", limits: "Unlimited", ai: "Full" },
    ],
  },
  {
    category: "Recruitment Plans",
    plans: [
      { name: "Recruit Starter", price: "INR 1,499/mo", limits: "10 jobs", ai: "No" },
      { name: "Recruit Pro", price: "INR 3,999/mo", limits: "50 jobs", ai: "Partial" },
      { name: "Recruit Enterprise", price: "INR 9,999/mo", limits: "Unlimited", ai: "Full" },
    ],
  },
  {
    category: "Recruiter Plans",
    plans: [
      { name: "Recruiter Starter", price: "INR 999/mo", limits: "10 jobs", ai: "No" },
      { name: "Recruiter Pro", price: "INR 2,999/mo", limits: "50 jobs", ai: "Partial" },
      { name: "Recruiter Enterprise", price: "INR 7,999/mo", limits: "Unlimited", ai: "Full" },
    ],
  },
  {
    category: "Combined Plans",
    plans: [
      { name: "Professional", price: "INR 4,999/mo", limits: "100 employees + 30 jobs", ai: "Partial" },
      { name: "Corporate", price: "INR 9,999/mo", limits: "500 employees + unlimited jobs", ai: "Advanced" },
      { name: "Global Enterprise", price: "INR 19,999/mo", limits: "Unlimited", ai: "Full" },
    ],
  },
  {
    category: "White Label Plans",
    plans: [
      { name: "WL Basic", price: "INR 25,000/mo", limits: "10 clients", ai: "Partial" },
      { name: "WL Pro", price: "INR 50,000/mo", limits: "50 clients", ai: "Advanced" },
      { name: "WL Global", price: "INR 100,000/mo", limits: "Unlimited clients", ai: "Full" },
    ],
  },
];

export default function PlanCatalog() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Plan Catalog</h1>
        <p className="page-sub">Multi-pricing architecture for HRMS, recruitment, recruiters, combined, and white-label tiers.</p>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Pricing Architecture</h2>
          <p>All plan families with limits and AI coverage visibility.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
          {PLAN_CARDS.map((group) => (
            <div key={group.category} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "0.92rem" }}>{group.category}</h3>
              <table className="data-table" style={{ fontSize: "0.75rem" }}>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Limit</th>
                    <th>AI</th>
                  </tr>
                </thead>
                <tbody>
                  {group.plans.map((plan) => (
                    <tr key={plan.name}>
                      <td style={{ fontWeight: 600 }}>{plan.name}</td>
                      <td className="mono">{plan.price}</td>
                      <td>{plan.limits}</td>
                      <td>{plan.ai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
