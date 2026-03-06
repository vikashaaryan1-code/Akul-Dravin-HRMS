import { useState, useMemo } from "react";

type JobType = "Full Time" | "Part Time" | "Remote" | "Contract" | "Internship";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  skills: string[];
  industry: string;
  posted: string;
  aiMatch: number;
  applicants: number;
  description: string;
  benefits: string[];
};

const JOBS: Job[] = [
  { id: "j1",  title: "Senior Software Engineer",    company: "TechCorp India",    location: "Bangalore",  type: "Full Time",  salaryMin: 18, salaryMax: 24, experience: "4–7 years",  skills: ["React", "Node.js", "AWS", "PostgreSQL"],              industry: "Technology",  posted: "2 days ago",   aiMatch: 92, applicants: 47,  description: "Build scalable microservices and lead technical architecture for our core product platform serving 5M+ users.", benefits: ["Health Insurance", "ESOPs", "WFH 2 days/week", "Learning Budget"] },
  { id: "j2",  title: "Product Manager",             company: "StartupX",          location: "Mumbai",     type: "Full Time",  salaryMin: 20, salaryMax: 30, experience: "5–8 years",  skills: ["Product Strategy", "Agile", "Data Analytics", "JIRA"], industry: "Technology",  posted: "4 days ago",   aiMatch: 78, applicants: 23,  description: "Drive product vision and roadmap for our B2B SaaS platform serving 500+ enterprise clients across Southeast Asia.", benefits: ["Health Insurance", "Flexible Hours", "Stock Options"] },
  { id: "j3",  title: "UX Designer",                 company: "DesignLab",         location: "Pune",       type: "Remote",     salaryMin: 12, salaryMax: 18, experience: "3–5 years",  skills: ["Figma", "User Research", "Prototyping", "Design Sys"], industry: "Design",      posted: "1 week ago",   aiMatch: 85, applicants: 31,  description: "Design intuitive product experiences for millions of users across web and mobile. Full creative ownership.", benefits: ["100% Remote", "Meal Vouchers", "Conference Budget"] },
  { id: "j4",  title: "Data Scientist",              company: "Analytics Pro",     location: "Hyderabad",  type: "Full Time",  salaryMin: 22, salaryMax: 32, experience: "3–6 years",  skills: ["Python", "TensorFlow", "SQL", "Tableau", "Spark"],    industry: "Analytics",   posted: "5 days ago",   aiMatch: 71, applicants: 18,  description: "Build and deploy ML models for predictive analytics across 50+ financial services clients.", benefits: ["Health + Life Insurance", "WFH Fridays", "PhD Sponsorship"] },
  { id: "j5",  title: "Sales Manager",               company: "GrowthCorp",        location: "Delhi",      type: "Full Time",  salaryMin: 15, salaryMax: 22, experience: "4–8 years",  skills: ["B2B Sales", "CRM", "Negotiation", "SaaS", "Salesforce"],industry: "Sales",      posted: "1 day ago",    aiMatch: 64, applicants: 55,  description: "Lead a team of 8 SDRs to drive enterprise account acquisition across North India. Uncapped incentives.", benefits: ["Vehicle Allowance", "Uncapped Incentives", "Health Insurance"] },
  { id: "j6",  title: "DevOps Engineer",             company: "CloudSystems",      location: "Remote",     type: "Remote",     salaryMin: 20, salaryMax: 28, experience: "4–6 years",  skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Helm"],     industry: "Technology",  posted: "3 days ago",   aiMatch: 89, applicants: 12,  description: "Architect and manage cloud infrastructure for 50+ client deployments at 99.99% uptime guarantee.", benefits: ["100% Remote", "Health Insurance", "Tech Stipend ₹2K/mo"] },
  { id: "j7",  title: "HR Manager",                  company: "RetailChain India", location: "Chennai",    type: "Full Time",  salaryMin: 10, salaryMax: 16, experience: "5–8 years",  skills: ["HRMS", "Payroll", "Talent Acquisition", "Compliance"], industry: "Retail",      posted: "1 week ago",   aiMatch: 90, applicants: 19,  description: "Build and manage HR operations for 1,200+ employees across 45 retail outlets across South India.", benefits: ["Health Insurance", "PF + Gratuity", "Annual Bonus 15%"] },
  { id: "j8",  title: "Finance Manager",             company: "Finserv Capital",   location: "Mumbai",     type: "Full Time",  salaryMin: 18, salaryMax: 26, experience: "6–10 years", skills: ["Financial Modeling", "Tally", "SEBI", "Excel", "SAP"],  industry: "Finance",     posted: "2 weeks ago",  aiMatch: 55, applicants: 8,   description: "Oversee financial planning, budgeting, and regulatory compliance for NBFC operations.", benefits: ["Group Insurance", "Gratuity", "NPS Benefits"] },
  { id: "j9",  title: "Content Marketing Lead",      company: "BrandBuilders",     location: "Bangalore",  type: "Contract",   salaryMin: 8,  salaryMax: 14, experience: "3–5 years",  skills: ["SEO", "Content Strategy", "HubSpot", "Analytics"],    industry: "Marketing",   posted: "6 days ago",   aiMatch: 68, applicants: 34,  description: "Drive content-led growth for 6 D2C brands with ₹50Cr+ combined revenue. 6-month contract.", benefits: ["Flexible Hours", "Performance Bonus", "Convert to FTE option"] },
  { id: "j10", title: "Software Engineering Intern", company: "NextGen Tech",      location: "Bangalore",  type: "Internship", salaryMin: 3,  salaryMax: 5,  experience: "0–1 years",  skills: ["JavaScript", "Python", "Git", "REST APIs"],           industry: "Technology",  posted: "Today",        aiMatch: 95, applicants: 103, description: "6-month internship — build real features shipped to 100K+ users. Mentored by senior engineers. PPO on performance.", benefits: ["Stipend ₹40K/mo", "PPO Opportunity", "Certificate + LOR"] },
];

const TYPE_COLOR: Record<JobType, string> = {
  "Full Time":  "status-on-track",
  "Part Time":  "status-watch",
  "Remote":     "stage-beta",
  "Contract":   "stage-roadmap",
  "Internship": "status-watch",
};

type SalaryFilter = "All" | "0-10" | "10-20" | "20-30" | "30+";

export default function JobBoard() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<JobType | "All">("All");
  const [filterIndustry, setFilterIndustry] = useState("All");
  const [filterSalary, setFilterSalary] = useState<SalaryFilter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const industries = ["All", ...Array.from(new Set(JOBS.map((j) => j.industry)))];

  const filtered = useMemo(() => {
    return JOBS.filter((job) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.skills.some((s) => s.toLowerCase().includes(q));
      const matchType = filterType === "All" || job.type === filterType;
      const matchIndustry = filterIndustry === "All" || job.industry === filterIndustry;
      const matchSalary =
        filterSalary === "All" ||
        (filterSalary === "0-10"  && job.salaryMin < 10) ||
        (filterSalary === "10-20" && job.salaryMin >= 10 && job.salaryMin < 20) ||
        (filterSalary === "20-30" && job.salaryMin >= 20 && job.salaryMin < 30) ||
        (filterSalary === "30+"   && job.salaryMin >= 30);
      return matchSearch && matchType && matchIndustry && matchSalary;
    });
  }, [search, filterType, filterIndustry, filterSalary]);

  const selected = selectedId ? JOBS.find((j) => j.id === selectedId) : null;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Job Marketplace</h1>
        <p className="page-sub">AI-Matched Opportunities · {JOBS.length} Live Jobs · One-Click Apply · Real-time Applications</p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          className="form-input"
          style={{ flex: 2, minWidth: 220 }}
          placeholder="🔍 Search title, company, location, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          style={{ flex: 1, minWidth: 128 }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as JobType | "All")}
        >
          {(["All", "Full Time", "Remote", "Part Time", "Contract", "Internship"] as (JobType | "All")[]).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          className="form-input"
          style={{ flex: 1, minWidth: 128 }}
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value)}
        >
          {industries.map((i) => <option key={i}>{i}</option>)}
        </select>
        <select
          className="form-input"
          style={{ flex: 1, minWidth: 128 }}
          value={filterSalary}
          onChange={(e) => setFilterSalary(e.target.value as SalaryFilter)}
        >
          <option value="All">Any Salary</option>
          <option value="0-10">Under ₹10 LPA</option>
          <option value="10-20">₹10–20 LPA</option>
          <option value="20-30">₹20–30 LPA</option>
          <option value="30+">₹30+ LPA</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 390px" : "1fr", gap: 16, alignItems: "start" }}>

        {/* Job Cards */}
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: 12 }}>
            {filtered.length} of {JOBS.length} jobs
            {applied.size > 0 && <span style={{ marginLeft: 12, color: "var(--gold)" }}>· {applied.size} applied</span>}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedId(selectedId === job.id ? null : job.id)}
                style={{
                  padding: "16px 18px",
                  background: selectedId === job.id ? "rgba(210,174,82,0.07)" : "var(--bg-panel)",
                  border: `1px solid ${selectedId === job.id ? "rgba(210,174,82,0.3)" : "var(--border)"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "0.94rem", fontWeight: 700, margin: "0 0 2px" }}>{job.title}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{job.company} · {job.location}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 14 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 4, color: job.aiMatch >= 85 ? "var(--green)" : job.aiMatch >= 70 ? "var(--amber)" : "var(--text-muted)" }}>
                      ✦ {job.aiMatch}% match
                    </div>
                    <div className="automation-track" style={{ width: 72 }}>
                      <div className="automation-fill" style={{
                        width: `${job.aiMatch}%`,
                        background: job.aiMatch >= 85 ? "linear-gradient(90deg,#40b77e,#9ef5ca)" : job.aiMatch >= 70 ? "linear-gradient(90deg,#f3b955,#ffd98e)" : "linear-gradient(90deg,#888,#ccc)",
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <span className={`status-chip ${TYPE_COLOR[job.type]}`} style={{ fontSize: "0.68rem" }}>{job.type}</span>
                  <span style={{ fontSize: "0.76rem", color: "var(--gold)", fontWeight: 600 }}>₹{job.salaryMin}–{job.salaryMax} LPA</span>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>· {job.experience}</span>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}>· {job.applicants} applicants · {job.posted}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {job.skills.slice(0, 4).map((s) => (
                    <span key={s} style={{ fontSize: "0.68rem", padding: "2px 8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)" }}>
                      {s}
                    </span>
                  ))}
                  {job.skills.length > 4 && <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>+{job.skills.length - 4} more</span>}
                </div>

                {applied.has(job.id) && (
                  <div style={{ marginTop: 8 }}>
                    <span className="status-chip status-on-track" style={{ fontSize: "0.68rem" }}>✓ Applied</span>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
                <p style={{ fontSize: "2rem", marginBottom: 8 }}>🔍</p>
                <p>No jobs match your filters. Try broadening your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ position: "sticky", top: 20 }}>
            <div className="section-block" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: "1rem", margin: "0 0 3px" }}>{selected.title}</h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{selected.company} · {selected.location}</p>
                </div>
                <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1.1rem", padding: 0 }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                <span className={`status-chip ${TYPE_COLOR[selected.type]}`}>{selected.type}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600 }}>₹{selected.salaryMin}–{selected.salaryMax} LPA</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selected.experience}</span>
              </div>

              <div style={{ padding: "10px 12px", background: "rgba(210,174,82,0.07)", borderRadius: 8, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>✦ AI Match Score</span>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: selected.aiMatch >= 85 ? "var(--green)" : selected.aiMatch >= 70 ? "var(--amber)" : "var(--text-muted)" }}>
                  {selected.aiMatch}%
                </span>
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 14 }}>{selected.description}</p>

              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Required Skills</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {selected.skills.map((s) => (
                    <span key={s} style={{ fontSize: "0.72rem", padding: "3px 10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10 }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Benefits</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {selected.benefits.map((b) => (
                    <span key={b} style={{ fontSize: "0.72rem", padding: "3px 10px", background: "rgba(64,183,126,0.1)", border: "1px solid rgba(64,183,126,0.2)", borderRadius: 10, color: "var(--green)" }}>
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: 12 }}>
                {selected.applicants} applicants · Posted {selected.posted}
              </p>

              {applied.has(selected.id) ? (
                <div style={{ padding: "12px 16px", background: "rgba(64,183,126,0.1)", border: "1px solid rgba(64,183,126,0.25)", borderRadius: 8, textAlign: "center" }}>
                  <p style={{ color: "var(--green)", fontWeight: 600, fontSize: "0.86rem", margin: 0 }}>✓ Application Submitted</p>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 4 }}>Recruiter will review your profile shortly.</p>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setApplied((prev) => new Set([...prev, selected.id]))}
                  style={{ width: "100%", fontSize: "0.88rem", padding: "10px" }}
                >
                  Apply Now — One Click
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
