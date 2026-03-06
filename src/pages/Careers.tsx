import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Job } from "../types";
import "../hrms.css";

const T = "tenant-akul";
const MOCK_JOBS: Job[] = [
  { id: "1", tenantId: T, title: "Senior React Engineer",        department: "Engineering", status: "open", createdAt: "2026-02-10", updatedAt: "2026-02-10" },
  { id: "2", tenantId: T, title: "Product Designer (UI/UX)",     department: "Design",      status: "open", createdAt: "2026-02-14", updatedAt: "2026-02-14" },
  { id: "3", tenantId: T, title: "Account Executive â€” SaaS",     department: "Sales",       status: "open", createdAt: "2026-02-20", updatedAt: "2026-02-20" },
  { id: "4", tenantId: T, title: "AI/ML Engineer",               department: "Engineering", status: "open", createdAt: "2026-02-22", updatedAt: "2026-02-22" },
  { id: "5", tenantId: T, title: "HR Business Partner",          department: "HR",          status: "open", createdAt: "2026-02-28", updatedAt: "2026-02-28" },
  { id: "6", tenantId: T, title: "Growth Marketing Manager",     department: "Marketing",   status: "open", createdAt: "2026-03-01", updatedAt: "2026-03-01" },
  { id: "7", tenantId: T, title: "Full-Stack Engineer (Node)",   department: "Engineering", status: "open", createdAt: "2026-03-02", updatedAt: "2026-03-02" },
  { id: "8", tenantId: T, title: "Data Analyst",                 department: "Finance",     status: "open", createdAt: "2026-03-03", updatedAt: "2026-03-03" },
];

const PERKS = [
  { icon: "ðŸ’°", label: "Competitive Salaries",   desc: "Above-market CTC with ESOPs for senior roles" },
  { icon: "ðŸŒ´", label: "Unlimited PTO",          desc: "Flexible leaves with no approval friction"    },
  { icon: "ðŸŽ“", label: "Learning Budget",        desc: "â‚¹50,000/yr for courses, books, conferences"   },
  { icon: "ðŸ ", label: "Remote-First",           desc: "Work from anywhere â€” async-first culture"     },
  { icon: "ðŸ¥", label: "Health Insurance",       desc: "â‚¹5L medical cover for employee + family"      },
  { icon: "ðŸ†", label: "Gamified Growth",        desc: "Points, levels, and quarterly reward drops"   },
];

export default function Careers() {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [filter, setFilter] = useState("All");
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    api.get<Job[]>("/ats/jobs")
      .then((data) => { if (data.length > 0) setJobs(data); })
      .catch(() => {/* use mock */});
  }, []);

  const openJobs = jobs.filter((j) => j.status === "open");
  const depts = ["All", ...Array.from(new Set(openJobs.map((j) => j.department))).sort()];
  const filtered = filter === "All" ? openJobs : openJobs.filter((j) => j.department === filter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-main)", fontFamily: "var(--font-body)" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #2a0a15 0%, #4a1023 50%, #18060f 100%)",
        borderBottom: "1px solid var(--border-gold)",
        padding: "80px 40px 60px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", top: -80, left: "10%",  width: 400, height: 400, background: "radial-gradient(circle, rgba(210,174,82,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(201,45,90,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 16 }}>
            âœ¦ We're Hiring
          </span>
          <h1 style={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px", background: "linear-gradient(135deg, #fff 40%, var(--gold) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Build the future of<br />work with us
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", margin: "0 0 32px", lineHeight: 1.7 }}>
            Akul Dravin HRMS is redefining how India's best companies hire, manage, and grow their people. Join a team that ships fast, learns faster, and actually enjoys Mondays.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, color: "var(--gold)" }}>{openJobs.length}</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Open Roles</p>
            </div>
            <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, color: "var(--gold)" }}>18</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Days avg hiring</p>
            </div>
            <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, color: "var(--gold)" }}>4.8â˜…</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Glassdoor rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 40px 20px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 24px", color: "var(--text-main)" }}>Why Akul Dravin?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 48 }}>
          {PERKS.map((p) => (
            <div key={p.label} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 18px" }}>
              <span style={{ fontSize: "1.5rem", display: "block", marginBottom: 8 }}>{p.icon}</span>
              <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>{p.label}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Job List */}
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 16px", color: "var(--text-main)" }}>Open Positions</h2>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {depts.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              style={{
                padding: "6px 14px",
                fontSize: "0.78rem",
                fontWeight: filter === d ? 700 : 400,
                borderRadius: 20,
                border: `1px solid ${filter === d ? "var(--gold)" : "var(--border)"}`,
                background: filter === d ? "rgba(210,174,82,0.12)" : "var(--bg-panel)",
                color: filter === d ? "var(--gold)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {d}
              {d !== "All" && (
                <span style={{ marginLeft: 6, fontSize: "0.7rem", opacity: 0.7 }}>
                  ({openJobs.filter((j) => j.department === d).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Job Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 60 }}>
          {filtered.map((job) => (
            <div key={job.id} style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, rgba(210,174,82,0.15), rgba(210,174,82,0.05))", border: "1px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  {job.department === "Engineering" ? "âš¡" : job.department === "Design" ? "ðŸŽ¨" : job.department === "Sales" ? "ðŸ’¼" : job.department === "HR" ? "ðŸ‘¥" : job.department === "Marketing" ? "ðŸ“£" : job.department === "Finance" ? "ðŸ“Š" : "ðŸ¢"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.94rem", color: "var(--text-main)" }}>{job.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{job.department}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Â·</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Full-time Â· Remote</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Â·</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Bangalore Â· India</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, background: "rgba(64,183,126,0.12)", border: "1px solid rgba(64,183,126,0.25)", color: "var(--green)" }}>
                  Open
                </span>
                {applied === job.id ? (
                  <span style={{ fontSize: "0.8rem", color: "var(--green)", fontWeight: 600 }}>âœ“ Applied!</span>
                ) : (
                  <button
                    onClick={() => setApplied(job.id)}
                    style={{
                      padding: "7px 18px",
                      background: "linear-gradient(135deg, var(--gold), #7a5c1e)",
                      border: "none",
                      borderRadius: 8,
                      color: "#000",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px 0" }}>No open roles in {filter} right now. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Footer strip */}
      <div style={{ borderTop: "1px solid var(--border)", textAlign: "center", padding: "24px", fontSize: "0.8rem", color: "var(--text-dim)" }}>
        Akul Dravin HRMS AI â€” An equal opportunity employer Â· <a href="/" style={{ color: "var(--gold)", textDecoration: "none" }}>â† Back to Home</a>
      </div>
    </div>
  );
}

