import { useContext, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import "../hrms.css";

type DemoAccount = {
  role: string;
  name: string;
  workspace: string;
  email: string;
  password: string;
  color: string;
  icon: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "Super Admin",
    name: "Akul Admin",
    workspace: "akul",
    email: "admin@akuldravin.com",
    password: "Admin@123",
    color: "#d2ae52",
    icon: "★",
  },
  {
    role: "CEO / Analytics",
    name: "Dravin Kumar",
    workspace: "akul",
    email: "ceo@akuldravin.com",
    password: "CEO@12345",
    color: "#b97a93",
    icon: "◆",
  },
  {
    role: "HR Manager",
    name: "Aditi Sharma",
    workspace: "akul",
    email: "hr@akuldravin.com",
    password: "Hr@12345",
    color: "#40b77e",
    icon: "●",
  },
  {
    role: "Finance Manager",
    name: "Rahul Mehta",
    workspace: "akul",
    email: "finance@akuldravin.com",
    password: "Finance@123",
    color: "#5b9cf6",
    icon: "₹",
  },
  {
    role: "Recruiter",
    name: "Nisha Verma",
    workspace: "akul",
    email: "recruiter@akuldravin.com",
    password: "Recruit@123",
    color: "#f59e42",
    icon: "⬡",
  },
  {
    role: "Team Manager",
    name: "Vikram Singh",
    workspace: "akul",
    email: "manager@akuldravin.com",
    password: "Manager@123",
    color: "#a78bfa",
    icon: "▲",
  },
  {
    role: "Employee",
    name: "Priya Nair",
    workspace: "akul",
    email: "employee@akuldravin.com",
    password: "Emp@12345",
    color: "#94a3b8",
    icon: "○",
  },
  {
    role: "Pilot Tenant (HR)",
    name: "Rahul Mehta",
    workspace: "pilot",
    email: "hr@pilotcorp.com",
    password: "Pilot@123",
    color: "#64748b",
    icon: "◇",
  },
];

export default function LoginPage() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [tenant, setTenant] = useState("akul");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth!.login(tenant, email, password);
      navigate("/app", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account: DemoAccount) {
    setTenant(account.workspace);
    setEmail(account.email);
    setPassword(account.password);
    setActiveDemo(account.email);
    setError("");
  }

  return (
    <div className="login-shell">
      <div className="login-orb-1" aria-hidden="true" />
      <div className="login-orb-2" aria-hidden="true" />

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 1rem" }}>

        {/* Demo Credentials Panel */}
        <div style={{
          flex: "0 0 340px",
          background: "rgba(10,22,40,0.85)",
          border: "1px solid rgba(210,174,82,0.25)",
          borderRadius: 16,
          padding: "1.25rem",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "var(--gold)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Demo Accounts
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 2 }}>
                Click any role to auto-fill
              </p>
            </div>
            <button
              onClick={() => setShowPanel((v) => !v)}
              style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.75rem", padding: "2px 6px" }}
            >
              {showPanel ? "Hide" : "Show"}
            </button>
          </div>

          {showPanel && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: activeDemo === acc.email ? "rgba(210,174,82,0.08)" : "rgba(255,255,255,0.03)",
                  border: activeDemo === acc.email ? `1px solid ${acc.color}66` : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `${acc.color}22`,
                    border: `1.5px solid ${acc.color}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    color: acc.color,
                    flexShrink: 0,
                    fontWeight: 700,
                  }}>
                    {acc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8rem", color: "var(--text-main)", lineHeight: 1.3 }}>
                      {acc.role}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 1 }}>
                      {acc.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.67rem", color: acc.color, opacity: 0.85, marginTop: 1, fontFamily: "var(--font-mono, monospace)" }}>
                      {acc.email}
                    </p>
                  </div>
                  {activeDemo === acc.email && (
                    <span style={{ fontSize: "0.7rem", color: acc.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-dim)", lineHeight: 1.5 }}>
              All accounts use the <strong style={{ color: "var(--text-muted)" }}>akul</strong> workspace (except Pilot Tenant).
              Credentials are for demo purposes only.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card" style={{ flex: "0 0 360px" }}>
          <div className="login-logo">
            <div className="login-logo-mark">AD</div>
            <div className="login-logo-text">
              <span className="login-logo-name">Akul Dravin</span>
              <span className="login-logo-ai">HRMS AI</span>
            </div>
          </div>

          <h1 className="login-title">Welcome back</h1>
          <p className="login-sub">Sign in to your workspace</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="tenant">Workspace</label>
              <input
                id="tenant"
                className="login-input"
                type="text"
                placeholder="your-company"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                autoComplete="organization"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="login-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="login-input"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div className="login-footer">
            <span>Enterprise HRMS</span>
            <span className="login-footer-dot" />
            <span>India + Global</span>
            <span className="login-footer-dot" />
            <span>AI-First</span>
          </div>
        </div>

      </div>
    </div>
  );
}
