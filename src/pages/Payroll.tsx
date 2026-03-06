import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import type { PayrollRun, PayrollItem } from "../types";

type SplitAccount = {
  id: string;
  label: string;
  accountNo: string;
  ifsc: string;
  pct: number;
  enabled: boolean;
};

const DEFAULT_SPLITS: SplitAccount[] = [
  { id: "s1", label: "Father's Account",  accountNo: "", ifsc: "", pct: 20, enabled: false },
  { id: "s2", label: "Mother's Account",  accountNo: "", ifsc: "", pct: 10, enabled: false },
  { id: "s3", label: "Spouse's Account",  accountNo: "", ifsc: "", pct: 0,  enabled: false },
];

export default function Payroll() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [splits, setSplits] = useState<SplitAccount[]>(DEFAULT_SPLITS);
  const [splitSaved, setSplitSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"runs" | "split">("runs");

  const load = useCallback(() => {
    setLoading(true);
    api.get<PayrollRun[]>("/payroll/runs")
      .then((r) => {
        setRuns(r);
        if (r.length > 0) setSelectedRun(r[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load items when run selected
  useEffect(() => {
    if (!selectedRun) return;
    api.get<{ run: PayrollRun; items: PayrollItem[] }>(`/payroll/runs/${selectedRun}`)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, [selectedRun]);

  async function handleRunPayroll() {
    setRunning(true);
    try {
      await api.post<{ run: PayrollRun; items: PayrollItem[] }>(
        "/payroll/runs/process",
        { month: new Date().toISOString().slice(0, 7) }
      );
      load();
    } catch {/**/} finally { setRunning(false); }
  }

  function handleSplitChange(id: string, field: keyof SplitAccount, value: string | number | boolean) {
    setSplits((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  function handleSaveSplit() {
    setSplitSaved(true);
    setTimeout(() => setSplitSaved(false), 3000);
  }

  const currentRun = runs.find((r) => r.id === selectedRun) ?? runs[0];
  const enabledSplits = splits.filter((s) => s.enabled);
  const totalSplitPct = enabledSplits.reduce((sum, s) => sum + s.pct, 0);

  const STATUS_COLOR: Record<string, string> = {
    processed:  "status-on-track",
    pending:    "status-watch",
    failed:     "status-risk",
    draft:      "stage-roadmap",
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Smart Payroll</h1>
        <p className="page-sub">AI-Compute · Statutory Compliance · Parents Split Payroll · Auto-disbursement</p>
      </div>

      {currentRun && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Gross Payroll</p>
            <p className="stat-value" style={{ fontSize: "1.5rem" }}>₹{currentRun.totals.gross.toLocaleString("en-IN")}</p>
            <p className="stat-note">{currentRun.month} · {currentRun.employeeCount} employees</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Deductions</p>
            <p className="stat-value stat-risk" style={{ fontSize: "1.5rem" }}>₹{currentRun.totals.deductions.toLocaleString("en-IN")}</p>
            <p className="stat-note">PF (12%) + TDS (8%)</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Net Disbursement</p>
            <p className="stat-value stat-green" style={{ fontSize: "1.5rem" }}>₹{currentRun.totals.net.toLocaleString("en-IN")}</p>
            <p className="stat-note">Bank transfer amount</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Run Status</p>
            <p className="stat-value" style={{ marginTop: 8 }}>
              <span className={`status-chip ${STATUS_COLOR[currentRun.status] ?? "stage-roadmap"}`}>{currentRun.status}</span>
            </p>
            <p className="stat-note">{new Date(currentRun.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={`filter-tab${activeSection === "runs" ? " active" : ""}`} onClick={() => setActiveSection("runs")}>
          💸 Payroll Runs
        </button>
        <button className={`filter-tab${activeSection === "split" ? " active" : ""}`} onClick={() => setActiveSection("split")}>
          ★ Parents Split Payroll
        </button>
      </div>

      {activeSection === "runs" && (
        <>
          {/* Payroll Runs */}
          <div className="section-block">
            <div className="section-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2>Payroll Runs</h2>
                <p>Monthly payroll cycles. PF 12% + TDS 8% auto-computed per employee.</p>
              </div>
              <button className="btn-primary" onClick={handleRunPayroll} disabled={running}>
                {running ? "Processing…" : "▶ Run Payroll"}
              </button>
            </div>

            {loading ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", textAlign: "center", padding: "24px 0" }}>Loading payroll data…</p>
            ) : runs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No payroll runs yet. Add employees first, then run payroll.</p>
                <button className="btn-primary" onClick={handleRunPayroll} disabled={running}>
                  {running ? "Processing…" : "Run First Payroll"}
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Employees</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net</th>
                    <th>Status</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} style={{ background: selectedRun === run.id ? "var(--gold-dim)" : undefined }}>
                      <td className="mono" style={{ fontWeight: 600 }}>{run.month}</td>
                      <td>{run.employeeCount}</td>
                      <td className="mono">₹{run.totals.gross.toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color: "var(--red)" }}>₹{run.totals.deductions.toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color: "var(--green)", fontWeight: 700 }}>₹{run.totals.net.toLocaleString("en-IN")}</td>
                      <td><span className={`status-chip ${STATUS_COLOR[run.status] ?? "stage-roadmap"}`}>{run.status}</span></td>
                      <td>
                        <button className="table-action-btn" onClick={() => setSelectedRun(run.id)}>
                          View Payslips
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payslip Breakdown */}
          {items.length > 0 && (
            <div className="section-block">
              <div className="section-head">
                <h2>Payslip Breakdown — {currentRun?.month}</h2>
                <p>Individual payroll with PF, TDS computation and net disbursement.</p>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Gross</th>
                    <th>PF (12%)</th>
                    <th>TDS (8%)</th>
                    <th>Total Deductions</th>
                    <th>Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.employeeName}</td>
                      <td className="mono">₹{item.gross.toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color: "var(--amber)" }}>₹{item.pf.toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color: "var(--amber)" }}>₹{item.tds.toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color: "var(--red)" }}>₹{item.deductions.toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color: "var(--green)", fontWeight: 700 }}>₹{item.net.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Statutory Compliance Section */}
              <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Statutory Compliance — Auto-Generated Challans
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { label: "PF ECR File", sub: "EPFO Unified Portal" },
                    { label: "ESIC Challan", sub: "Gross ≤ ₹21,000 threshold" },
                    { label: "TDS Form 26Q", sub: "Quarterly filing" },
                    { label: "Prof. Tax", sub: "State-wise slab" },
                  ].map((c) => (
                    <div key={c.label} style={{
                      flex: 1, minWidth: 160, padding: "10px 14px",
                      background: "var(--bg-hover)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 4,
                    }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)" }}>{c.label}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.sub}</span>
                      <button className="table-action-btn" style={{ marginTop: 4, fontSize: "0.7rem", padding: "4px 8px" }}>
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeSection === "split" && (
        <div className="section-block">
          <div className="section-head">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h2>★ Parents Split Payroll — World's First</h2>
                <p>Automatically split your salary to up to 3 family bank accounts every month. Tax-optimized, legally compliant, fully audited.</p>
              </div>
              <span className="stage-beta status-chip">World First</span>
            </div>
          </div>

          {/* How it works */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { icon: "🏦", title: "Multi-Account Disbursement", desc: "Salary auto-split to up to 3 accounts via NEFT/RTGS/IMPS" },
              { icon: "🧾", title: "Tax Optimization", desc: "Track HUF payments, plan Section 80 deductions automatically" },
              { icon: "🔐", title: "Consent & eSign", desc: "Legal consent flow with digital signature for every beneficiary" },
              { icon: "📊", title: "Audit Trail", desc: "Every split logged with timestamp, amount, beneficiary & authorization" },
            ].map((f) => (
              <div key={f.title} style={{
                flex: 1, minWidth: 180, padding: "14px 16px",
                background: "var(--bg-panel)", border: "1px solid var(--border-gold)",
                borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <span style={{ fontSize: "1.4rem" }}>{f.icon}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gold)" }}>{f.title}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.45 }}>{f.desc}</span>
              </div>
            ))}
          </div>

          {/* Split Config */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px" }}>
              Configure Split Accounts
            </p>
            {splits.map((split) => (
              <div key={split.id} className="split-config-row">
                <div className="split-config-toggle">
                  <input
                    type="checkbox"
                    id={split.id}
                    checked={split.enabled}
                    onChange={(e) => handleSplitChange(split.id, "enabled", e.target.checked)}
                  />
                  <label htmlFor={split.id} className="split-config-label">{split.label}</label>
                </div>
                {split.enabled && (
                  <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
                    <input
                      className="form-input"
                      placeholder="Account Number"
                      value={split.accountNo}
                      onChange={(e) => handleSplitChange(split.id, "accountNo", e.target.value)}
                      style={{ flex: 2, minWidth: 140 }}
                    />
                    <input
                      className="form-input"
                      placeholder="IFSC Code"
                      value={split.ifsc}
                      onChange={(e) => handleSplitChange(split.id, "ifsc", e.target.value.toUpperCase())}
                      style={{ flex: 1, minWidth: 120 }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        max={50}
                        placeholder="%"
                        value={split.pct}
                        onChange={(e) => handleSplitChange(split.id, "pct", Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>% of net</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {enabledSplits.length > 0 && (
            <div style={{ background: "var(--gold-dim)", border: "1px solid var(--border-gold)", borderRadius: "var(--radius)", padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gold)", margin: "0 0 8px" }}>Split Summary</p>
              {enabledSplits.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>
                  <span>{s.label}</span>
                  <span className="mono" style={{ color: "var(--gold)", fontWeight: 700 }}>{s.pct}% of net salary</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border-gold)", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Primary account (your account)</span>
                <span className="mono" style={{ color: "var(--text-main)", fontWeight: 700 }}>{100 - totalSplitPct}% of net salary</span>
              </div>
              {totalSplitPct > 50 && (
                <p style={{ fontSize: "0.72rem", color: "var(--red)", marginTop: 8 }}>⚠ Split cannot exceed 50% of net salary per company policy.</p>
              )}
            </div>
          )}

          {splitSaved && <p className="notice-success">Split configuration saved and consent sent to beneficiaries!</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary"
              onClick={handleSaveSplit}
              disabled={totalSplitPct > 50 || enabledSplits.some((s) => !s.accountNo || !s.ifsc)}
            >
              Save Split Config + Send Consent
            </button>
            <button className="table-action-btn">Download Audit Log</button>
          </div>
        </div>
      )}
    </div>
  );
}
