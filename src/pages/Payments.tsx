const PAYMENTS = [
  { invoice: "INV-2026-00114", company: "Akul Dravin Corp", amount: 19999, due: "05 Mar 2026", paidOn: "04 Mar 2026", mode: "Bank Transfer", status: "paid" },
  { invoice: "INV-2026-00118", company: "Starfield Dynamics", amount: 9999, due: "06 Mar 2026", paidOn: "-", mode: "UPI", status: "pending" },
  { invoice: "INV-2026-00122", company: "NovaTech Solutions", amount: 2999, due: "07 Mar 2026", paidOn: "-", mode: "Card", status: "pending" },
  { invoice: "INV-2026-00125", company: "BlueWave Media", amount: 3999, due: "08 Mar 2026", paidOn: "05 Mar 2026", mode: "Card", status: "paid" },
  { invoice: "INV-2026-00129", company: "Vertex Capital", amount: 50000, due: "10 Mar 2026", paidOn: "-", mode: "Wire", status: "overdue" },
];

const STATUS_STYLE: Record<string, string> = {
  paid: "status-on-track",
  pending: "status-watch",
  overdue: "status-risk",
};

export default function Payments() {
  const collected = PAYMENTS.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amount, 0);
  const receivable = PAYMENTS.filter((row) => row.status !== "paid").reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
        <p className="page-sub">Invoice lifecycle, payment collections, and outstanding receivables.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Collected</p>
          <p className="stat-value stat-green">INR {collected.toLocaleString("en-IN")}</p>
          <p className="stat-note">Settled this cycle</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Receivable</p>
          <p className="stat-value stat-amber">INR {receivable.toLocaleString("en-IN")}</p>
          <p className="stat-note">Pending + overdue</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Billing and Payment Ledger</h2>
          <p>Track invoice status and payment settlement channels.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Company</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Paid On</th>
              <th>Mode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {PAYMENTS.map((row) => (
              <tr key={row.invoice}>
                <td className="mono">{row.invoice}</td>
                <td style={{ fontWeight: 600 }}>{row.company}</td>
                <td className="mono">INR {row.amount.toLocaleString("en-IN")}</td>
                <td className="mono">{row.due}</td>
                <td className="mono">{row.paidOn}</td>
                <td>{row.mode}</td>
                <td>
                  <span className={`status-chip ${STATUS_STYLE[row.status] ?? "stage-roadmap"}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
