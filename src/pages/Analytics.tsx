// CEO / Leadership Analytics Dashboard — static illustrative data

type MonthStat = { month: string; value: number };
type DeptStat  = { dept: string; count: number; cost: number };

const HEADCOUNT_TREND: MonthStat[] = [
  { month: "Oct", value: 198 },
  { month: "Nov", value: 211 },
  { month: "Dec", value: 219 },
  { month: "Jan", value: 231 },
  { month: "Feb", value: 241 },
  { month: "Mar", value: 247 },
];

const PAYROLL_TREND: MonthStat[] = [
  { month: "Oct", value: 162 },
  { month: "Nov", value: 174 },
  { month: "Dec", value: 179 },
  { month: "Jan", value: 185 },
  { month: "Feb", value: 188 },
  { month: "Mar", value: 193 },
];

const DEPT_DATA: DeptStat[] = [
  { dept: "Engineering",  count: 84, cost: 138 },
  { dept: "Sales",        count: 42, cost: 58  },
  { dept: "Product",      count: 28, cost: 46  },
  { dept: "Design",       count: 19, cost: 29  },
  { dept: "Finance",      count: 16, cost: 22  },
  { dept: "HR",           count: 12, cost: 14  },
  { dept: "Marketing",    count: 11, cost: 16  },
  { dept: "Operations",   count: 35, cost: 32  },
];

const HIRING_FUNNEL = [
  { stage: "Applied",     count: 1248, pct: 100 },
  { stage: "AI Screened", count: 890,  pct: 71  },
  { stage: "Interview",   count: 243,  pct: 19  },
  { stage: "Offered",     count: 68,   pct: 5.4 },
  { stage: "Joined",      count: 47,   pct: 3.8 },
];

const ATTRITION_RISK = [
  { dept: "Engineering", risk: 12, label: "High" },
  { dept: "Sales",       risk: 24, label: "High" },
  { dept: "Product",     risk: 8,  label: "Low"  },
  { dept: "Design",      risk: 5,  label: "Low"  },
  { dept: "Finance",     risk: 6,  label: "Low"  },
  { dept: "HR",          risk: 4,  label: "Low"  },
];

const KPI_METRICS = [
  { label: "Revenue Per Employee",      value: "₹18.4L",  trend: "+8%",   dir: "up"      },
  { label: "Payroll / Revenue Ratio",   value: "24.1%",   trend: "-1.2%", dir: "up"      },
  { label: "Average CTC (All Bands)",   value: "₹94,200", trend: "+6.3%", dir: "neutral" },
  { label: "Offer Acceptance Rate",     value: "69%",     trend: "+4%",   dir: "up"      },
  { label: "Employee NPS",              value: "52",      trend: "+7pts", dir: "up"       },
  { label: "Training Hours / Employee", value: "18h",     trend: "+3h",   dir: "up"       },
  { label: "Voluntary Attrition",       value: "8.4%",   trend: "-0.8%", dir: "up"       },
  { label: "Compliance Score",          value: "98.7%",  trend: "+1.1%", dir: "up"       },
];

function BarChart({ data, color, unit }: { data: MonthStat[]; color: string; unit: string }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {data.map((d) => (
        <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
            {unit === "₹" ? `${d.value}L` : d.value}
          </span>
          <div style={{
            width: "100%",
            height: `${(d.value / max) * 90}px`,
            background: color,
            borderRadius: "4px 4px 0 0",
            transition: "height 0.4s ease",
          }} />
          <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const totalHeadcount = 247;
  const totalPayroll = 193;
  const maxDeptCount = Math.max(...DEPT_DATA.map((d) => d.count));
  const maxRisk = Math.max(...ATTRITION_RISK.map((d) => d.risk));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">CEO Analytics</h1>
        <p className="page-sub">Leadership Intelligence · Workforce · Payroll · Attrition · Hiring Funnel</p>
      </div>

      {/* Top KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Headcount</p>
          <p className="stat-value">{totalHeadcount}</p>
          <p className="stat-note" style={{ color: "var(--green)" }}>+16 vs last quarter</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Monthly Payroll</p>
          <p className="stat-value" style={{ fontSize: "1.5rem" }}>₹{totalPayroll}L</p>
          <p className="stat-note">Mar 2026 disbursement</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Voluntary Attrition</p>
          <p className="stat-value stat-amber">8.4%</p>
          <p className="stat-note">Industry avg: 12.1%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Employee NPS</p>
          <p className="stat-value stat-green">52</p>
          <p className="stat-note">World-class SaaS target: 50+</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Compliance Score</p>
          <p className="stat-value stat-green">98.7%</p>
          <p className="stat-note">PF · ESIC · TDS · PT</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Time to Hire</p>
          <p className="stat-value">18 days</p>
          <p className="stat-note">-73% vs manual process</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-head">
            <h2>Headcount Trend</h2>
            <p>Last 6 months employee growth</p>
          </div>
          <BarChart
            data={HEADCOUNT_TREND}
            color="linear-gradient(to top, var(--gold), rgba(210,174,82,0.4))"
            unit=""
          />
        </div>
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-head">
            <h2>Payroll Cost Trend (₹ Lakhs)</h2>
            <p>Monthly gross payroll outflow</p>
          </div>
          <BarChart
            data={PAYROLL_TREND}
            color="linear-gradient(to top, var(--red), rgba(201,45,90,0.4))"
            unit="₹"
          />
        </div>
      </div>

      {/* Department Breakdown + Hiring Funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-head">
            <h2>Headcount by Department</h2>
            <p>Distribution across all business units</p>
          </div>
          <div className="chart-bar-wrap">
            {DEPT_DATA.map((d) => (
              <div key={d.dept} className="chart-bar-row">
                <span className="chart-bar-label">{d.dept}</span>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{
                      width: `${(d.count / maxDeptCount) * 100}%`,
                      background: "linear-gradient(90deg, var(--gold), rgba(210,174,82,0.5))",
                    }}
                  />
                </div>
                <span className="chart-bar-value">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-head">
            <h2>Hiring Funnel — YTD</h2>
            <p>Applied → AI Screened → Interview → Offer → Joined</p>
          </div>
          <div className="chart-bar-wrap">
            {HIRING_FUNNEL.map((s) => (
              <div key={s.stage} className="chart-bar-row">
                <span className="chart-bar-label" style={{ fontSize: "0.72rem" }}>{s.stage}</span>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{
                      width: `${s.pct}%`,
                      background: s.pct > 50
                        ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                        : s.pct > 20
                        ? "linear-gradient(90deg,#d2ae52,#f0d79a)"
                        : "linear-gradient(90deg,#c94267,#f0a8bb)",
                    }}
                  />
                </div>
                <span className="chart-bar-value">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
              Offer Acceptance Rate: <strong style={{ color: "var(--green)" }}>69.1%</strong> ·
              Cost Per Hire: <strong style={{ color: "var(--gold)" }}>₹38,400</strong> ·
              Time to Hire: <strong style={{ color: "var(--red)" }}>18 days</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Attrition Risk + Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-head">
            <h2>AI Attrition Risk</h2>
            <p>6-month flight-risk prediction by department</p>
          </div>
          <div className="chart-bar-wrap">
            {ATTRITION_RISK.map((d) => (
              <div key={d.dept} className="chart-bar-row">
                <span className="chart-bar-label">{d.dept}</span>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{
                      width: `${(d.risk / maxRisk) * 100}%`,
                      background: d.risk > 15
                        ? "linear-gradient(90deg,#eb675f,#ff9c96)"
                        : "linear-gradient(90deg,#40b77e,#9ef5ca)",
                    }}
                  />
                </div>
                <span className={`chart-bar-value ${d.risk > 15 ? "status-chip status-risk" : "status-chip status-on-track"}`} style={{ fontSize: "0.7rem", padding: "2px 7px" }}>
                  {d.risk}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-block" style={{ marginBottom: 0 }}>
          <div className="section-head">
            <h2>Key Business Metrics</h2>
            <p>Financial & HR performance benchmarks</p>
          </div>
          <div>
            {KPI_METRICS.map((m) => (
              <div key={m.label} className="metric-trend-row">
                <span className="metric-trend-label">{m.label}</span>
                <span className="metric-trend-value">{m.value}</span>
                <span className={`metric-trend-badge ${m.dir === "up" ? "metric-up" : m.dir === "down" ? "metric-down" : "metric-neutral"}`}>
                  {m.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll Cost by Dept */}
      <div className="section-block">
        <div className="section-head">
          <h2>Payroll Cost by Department (₹ Lakhs/month)</h2>
          <p>Budget utilization and cost-center breakdown for Finance.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Headcount</th>
              <th>Monthly Cost</th>
              <th>Avg CTC / Employee</th>
              <th>% of Total Payroll</th>
              <th>Distribution</th>
            </tr>
          </thead>
          <tbody>
            {DEPT_DATA.sort((a, b) => b.cost - a.cost).map((d) => {
              const avgCtc = Math.round((d.cost * 100000) / d.count);
              const pct = ((d.cost / totalPayroll) * 100).toFixed(1);
              return (
                <tr key={d.dept}>
                  <td style={{ fontWeight: 600 }}>{d.dept}</td>
                  <td className="mono">{d.count}</td>
                  <td className="mono" style={{ color: "var(--text-main)", fontWeight: 700 }}>₹{d.cost}L</td>
                  <td className="mono" style={{ color: "var(--text-muted)" }}>₹{avgCtc.toLocaleString("en-IN")}</td>
                  <td className="mono">{pct}%</td>
                  <td style={{ width: 140 }}>
                    <div className="automation-track">
                      <div
                        className="automation-fill"
                        style={{
                          width: `${(d.cost / totalPayroll) * 100}%`,
                          background: "linear-gradient(90deg, var(--gold), rgba(210,174,82,0.4))",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
