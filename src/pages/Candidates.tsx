import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AvailabilityStatus = "Active Seeker" | "Open to Offers" | "Not Looking";
type ExperienceLevel = "Fresher" | "Junior" | "Mid-Level" | "Senior" | "Lead" | "Principal";

interface Candidate {
  id: string;
  name: string;
  headline: string;
  location: string;
  experience: number; // years
  level: ExperienceLevel;
  currentCTC: number; // in LPA
  expectedCTC: number; // in LPA
  skills: string[];
  education: string;
  industry: string;
  availability: AvailabilityStatus;
  aiScore: number; // 0-100
  noticePeriod: string;
  appliedJobs: number;
  interviews: number;
  email: string;
  phone: string;
  shortlisted: boolean;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_CANDIDATES: Candidate[] = [
  {
    id: "c-001",
    name: "Arjun Mehta",
    headline: "Full-Stack Engineer · React + Node.js",
    location: "Bengaluru",
    experience: 5,
    level: "Mid-Level",
    currentCTC: 14,
    expectedCTC: 20,
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker"],
    education: "B.Tech CSE — IIT Bombay, 2019",
    industry: "Technology",
    availability: "Active Seeker",
    aiScore: 92,
    noticePeriod: "30 days",
    appliedJobs: 12,
    interviews: 4,
    email: "arjun.mehta@email.com",
    phone: "+91 98765 43210",
    shortlisted: false,
  },
  {
    id: "c-002",
    name: "Priya Sharma",
    headline: "Product Manager · B2B SaaS",
    location: "Mumbai",
    experience: 7,
    level: "Senior",
    currentCTC: 22,
    expectedCTC: 32,
    skills: ["Product Strategy", "Agile", "Jira", "SQL", "Figma", "A/B Testing"],
    education: "MBA — IIM Ahmedabad, 2018",
    industry: "SaaS / Product",
    availability: "Open to Offers",
    aiScore: 88,
    noticePeriod: "60 days",
    appliedJobs: 6,
    interviews: 3,
    email: "priya.sharma@email.com",
    phone: "+91 98765 43211",
    shortlisted: true,
  },
  {
    id: "c-003",
    name: "Rahul Verma",
    headline: "Data Scientist · ML & NLP Specialist",
    location: "Hyderabad",
    experience: 4,
    level: "Mid-Level",
    currentCTC: 18,
    expectedCTC: 26,
    skills: ["Python", "TensorFlow", "PyTorch", "NLP", "LLMs", "Spark"],
    education: "M.Tech AI — IIT Madras, 2020",
    industry: "AI / Data",
    availability: "Active Seeker",
    aiScore: 95,
    noticePeriod: "15 days",
    appliedJobs: 8,
    interviews: 5,
    email: "rahul.verma@email.com",
    phone: "+91 98765 43212",
    shortlisted: false,
  },
  {
    id: "c-004",
    name: "Sneha Iyer",
    headline: "UX Designer · Design Systems & Research",
    location: "Pune",
    experience: 6,
    level: "Senior",
    currentCTC: 16,
    expectedCTC: 24,
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Storybook"],
    education: "B.Des — NID Ahmedabad, 2018",
    industry: "Design / UX",
    availability: "Open to Offers",
    aiScore: 84,
    noticePeriod: "45 days",
    appliedJobs: 5,
    interviews: 2,
    email: "sneha.iyer@email.com",
    phone: "+91 98765 43213",
    shortlisted: true,
  },
  {
    id: "c-005",
    name: "Karan Kapoor",
    headline: "DevOps Engineer · Cloud & Platform",
    location: "Delhi NCR",
    experience: 8,
    level: "Lead",
    currentCTC: 28,
    expectedCTC: 38,
    skills: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Prometheus", "Ansible"],
    education: "B.Tech ECE — BITS Pilani, 2016",
    industry: "Technology",
    availability: "Not Looking",
    aiScore: 79,
    noticePeriod: "90 days",
    appliedJobs: 2,
    interviews: 1,
    email: "karan.kapoor@email.com",
    phone: "+91 98765 43214",
    shortlisted: false,
  },
  {
    id: "c-006",
    name: "Divya Nair",
    headline: "HR Business Partner · Talent & Culture",
    location: "Chennai",
    experience: 9,
    level: "Senior",
    currentCTC: 18,
    expectedCTC: 25,
    skills: ["HRBP", "Talent Management", "OKRs", "Comp & Ben", "HRMS", "ER"],
    education: "MBA HR — XLRI Jamshedpur, 2015",
    industry: "HR / People",
    availability: "Open to Offers",
    aiScore: 87,
    noticePeriod: "30 days",
    appliedJobs: 7,
    interviews: 3,
    email: "divya.nair@email.com",
    phone: "+91 98765 43215",
    shortlisted: false,
  },
  {
    id: "c-007",
    name: "Amit Joshi",
    headline: "Backend Engineer · Go & Microservices",
    location: "Bengaluru",
    experience: 6,
    level: "Senior",
    currentCTC: 24,
    expectedCTC: 34,
    skills: ["Go", "gRPC", "Kafka", "Microservices", "PostgreSQL", "GCP"],
    education: "B.Tech CSE — NIT Trichy, 2018",
    industry: "Technology",
    availability: "Active Seeker",
    aiScore: 91,
    noticePeriod: "30 days",
    appliedJobs: 15,
    interviews: 6,
    email: "amit.joshi@email.com",
    phone: "+91 98765 43216",
    shortlisted: true,
  },
  {
    id: "c-008",
    name: "Meera Pillai",
    headline: "Finance Manager · FP&A & Treasury",
    location: "Mumbai",
    experience: 11,
    level: "Lead",
    currentCTC: 32,
    expectedCTC: 45,
    skills: ["FP&A", "Excel", "SAP", "Budgeting", "Treasury", "IFRS"],
    education: "CA — ICAI, 2013",
    industry: "Finance / BFSI",
    availability: "Not Looking",
    aiScore: 76,
    noticePeriod: "60 days",
    appliedJobs: 1,
    interviews: 1,
    email: "meera.pillai@email.com",
    phone: "+91 98765 43217",
    shortlisted: false,
  },
  {
    id: "c-009",
    name: "Rohan Das",
    headline: "Sales Manager · Enterprise B2B",
    location: "Kolkata",
    experience: 7,
    level: "Senior",
    currentCTC: 20,
    expectedCTC: 30,
    skills: ["Enterprise Sales", "CRM", "Salesforce", "SaaS", "Pipeline Mgmt"],
    education: "MBA Marketing — Symbiosis, 2017",
    industry: "Sales / GTM",
    availability: "Active Seeker",
    aiScore: 82,
    noticePeriod: "15 days",
    appliedJobs: 10,
    interviews: 4,
    email: "rohan.das@email.com",
    phone: "+91 98765 43218",
    shortlisted: false,
  },
  {
    id: "c-010",
    name: "Anjali Reddy",
    headline: "iOS Developer · Swift & SwiftUI",
    location: "Hyderabad",
    experience: 3,
    level: "Junior",
    currentCTC: 10,
    expectedCTC: 16,
    skills: ["Swift", "SwiftUI", "Xcode", "CoreData", "Firebase", "App Store"],
    education: "B.E CSE — CBIT, 2021",
    industry: "Technology",
    availability: "Active Seeker",
    aiScore: 78,
    noticePeriod: "Immediate",
    appliedJobs: 18,
    interviews: 5,
    email: "anjali.reddy@email.com",
    phone: "+91 98765 43219",
    shortlisted: false,
  },
  {
    id: "c-011",
    name: "Vikram Singh",
    headline: "Principal Engineer · Architecture & Scale",
    location: "Bengaluru",
    experience: 15,
    level: "Principal",
    currentCTC: 55,
    expectedCTC: 70,
    skills: ["System Design", "Java", "Distributed Systems", "Kafka", "Cassandra", "Leadership"],
    education: "M.Tech CS — IISc, 2009",
    industry: "Technology",
    availability: "Not Looking",
    aiScore: 97,
    noticePeriod: "90 days",
    appliedJobs: 3,
    interviews: 2,
    email: "vikram.singh@email.com",
    phone: "+91 98765 43220",
    shortlisted: true,
  },
  {
    id: "c-012",
    name: "Kavya Menon",
    headline: "Marketing Lead · Growth & Performance",
    location: "Bengaluru",
    experience: 5,
    level: "Mid-Level",
    currentCTC: 15,
    expectedCTC: 22,
    skills: ["Performance Marketing", "SEO", "Google Ads", "Analytics", "Content", "Email"],
    education: "B.Com + PG Digital Marketing — MICA, 2020",
    industry: "Marketing",
    availability: "Open to Offers",
    aiScore: 83,
    noticePeriod: "30 days",
    appliedJobs: 9,
    interviews: 3,
    email: "kavya.menon@email.com",
    phone: "+91 98765 43221",
    shortlisted: false,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<ExperienceLevel, string> = {
  Fresher:   "status-risk",
  Junior:    "status-watch",
  "Mid-Level": "stage-beta",
  Senior:    "status-on-track",
  Lead:      "",
  Principal: "",
};

const AVAIL_COLORS: Record<AvailabilityStatus, string> = {
  "Active Seeker": "status-on-track",
  "Open to Offers": "status-watch",
  "Not Looking": "status-risk",
};

function scoreColor(score: number) {
  if (score >= 90) return "#22c55e";
  if (score >= 75) return "var(--gold)";
  return "#64748b";
}

function levelStyle(level: ExperienceLevel) {
  if (level === "Lead") return { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff" };
  if (level === "Principal") return { background: "linear-gradient(135deg,var(--gold),#7a5c1e)", color: "#000" };
  return {};
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(SEED_CANDIDATES);
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState<AvailabilityStatus | "All">("All");
  const [filterLevel, setFilterLevel] = useState<ExperienceLevel | "All">("All");
  const [filterIndustry, setFilterIndustry] = useState("All");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const industries = useMemo(() => {
    const s = new Set(candidates.map((c) => c.industry));
    return ["All", ...Array.from(s).sort()];
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter((c) => {
      const textMatch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q));
      const availMatch = filterAvail === "All" || c.availability === filterAvail;
      const levelMatch = filterLevel === "All" || c.level === filterLevel;
      const indMatch = filterIndustry === "All" || c.industry === filterIndustry;
      return textMatch && availMatch && levelMatch && indMatch;
    });
  }, [candidates, search, filterAvail, filterLevel, filterIndustry]);

  function toggleShortlist(id: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, shortlisted: !c.shortlisted } : c))
    );
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, shortlisted: !prev.shortlisted } : prev);
    }
  }

  function scheduleInterview(candidate: Candidate) {
    setScheduleMsg(`Interview invite sent to ${candidate.name} (${candidate.email})`);
    setTimeout(() => setScheduleMsg(null), 3500);
  }

  // Stats
  const totalCandidates = candidates.length;
  const activeSeekers = candidates.filter((c) => c.availability === "Active Seeker").length;
  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;
  const avgAiScore = Math.round(candidates.reduce((s, c) => s + c.aiScore, 0) / candidates.length);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="section-head" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Candidate Pool</h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
            AI-ranked talent database · Search, shortlist & schedule interviews
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {scheduleMsg && (
            <span className="status-chip status-on-track" style={{ fontSize: "0.8rem" }}>
              ✓ {scheduleMsg}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Total Candidates", value: totalCandidates, sub: "In database" },
          { label: "Active Seekers", value: activeSeekers, sub: "Ready to join" },
          { label: "Shortlisted", value: shortlistedCount, sub: "For current roles" },
          { label: "Avg AI Score", value: `${avgAiScore}%`, sub: "Platform-wide match" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="section-block" style={{ marginBottom: "1rem", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="form-input"
            style={{ flex: "1 1 220px", minWidth: 0 }}
            placeholder="Search name, skills, headline, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-input"
            style={{ flex: "0 0 160px" }}
            value={filterAvail}
            onChange={(e) => setFilterAvail(e.target.value as AvailabilityStatus | "All")}
          >
            <option value="All">All Availability</option>
            <option value="Active Seeker">Active Seeker</option>
            <option value="Open to Offers">Open to Offers</option>
            <option value="Not Looking">Not Looking</option>
          </select>
          <select
            className="form-input"
            style={{ flex: "0 0 140px" }}
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as ExperienceLevel | "All")}
          >
            <option value="All">All Levels</option>
            {(["Fresher", "Junior", "Mid-Level", "Senior", "Lead", "Principal"] as ExperienceLevel[]).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            className="form-input"
            style={{ flex: "0 0 160px" }}
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
          >
            {industries.map((i) => (
              <option key={i} value={i}>{i === "All" ? "All Industries" : i}</option>
            ))}
          </select>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            {filtered.length} found
          </span>
        </div>
      </div>

      {/* Main layout: table + detail panel */}
      <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        {/* Candidate Cards Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="section-block" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              No candidates match your filters.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.85rem" }}>
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="section-block"
                  style={{
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    border: selected?.id === c.id ? "1.5px solid var(--gold)" : "1.5px solid transparent",
                    transition: "border 0.15s",
                  }}
                  onClick={() => setSelected(c.id === selected?.id ? null : c)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: "linear-gradient(135deg,var(--gold),#7a5c1e)",
                      color: "#000", fontWeight: 700, fontSize: "1.1rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {c.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.97rem" }}>{c.name}</span>
                        <span
                          className={`status-chip ${LEVEL_COLORS[c.level]}`}
                          style={levelStyle(c.level)}
                        >
                          {c.level}
                        </span>
                        <span className={`status-chip ${AVAIL_COLORS[c.availability]}`}>
                          {c.availability}
                        </span>
                        {c.shortlisted && (
                          <span className="status-chip status-on-track">⭐ Shortlisted</span>
                        )}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginTop: 3 }}>
                        {c.headline}
                      </div>
                      <div style={{ display: "flex", gap: "1.2rem", marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>📍 {c.location}</span>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>💼 {c.experience}y exp</span>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>💰 ₹{c.currentCTC}L → ₹{c.expectedCTC}L</span>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>⏱ {c.noticePeriod}</span>
                      </div>
                      {/* Skills row */}
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: 8 }}>
                        {c.skills.slice(0, 5).map((sk) => (
                          <span key={sk} style={{
                            background: "rgba(210,174,82,0.1)",
                            border: "1px solid rgba(210,174,82,0.25)",
                            borderRadius: 5,
                            padding: "2px 8px",
                            fontSize: "0.76rem",
                            color: "var(--gold)",
                          }}>{sk}</span>
                        ))}
                        {c.skills.length > 5 && (
                          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", padding: "2px 4px" }}>
                            +{c.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Score */}
                    <div style={{ textAlign: "center", flexShrink: 0, minWidth: 64 }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: scoreColor(c.aiScore) }}>
                        {c.aiScore}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>AI Score</div>
                      <div className="automation-track" style={{ width: 60 }}>
                        <div
                          className="automation-fill"
                          style={{ width: `${c.aiScore}%`, background: scoreColor(c.aiScore) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="section-block" style={{
            width: 320, flexShrink: 0, position: "sticky", top: "1rem",
            padding: "1.25rem",
          }}>
            {/* Close + actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>Candidate Profile</span>
              <button
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            {/* Avatar + name */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: "linear-gradient(135deg,var(--gold),#7a5c1e)",
                color: "#000", fontWeight: 700, fontSize: "1.3rem",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selected.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{selected.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{selected.headline}</div>
              </div>
            </div>

            {/* AI Score big */}
            <div style={{
              background: "rgba(210,174,82,0.08)", borderRadius: 10, padding: "0.75rem",
              textAlign: "center", marginBottom: "1rem",
            }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: scoreColor(selected.aiScore) }}>
                {selected.aiScore}%
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>AI Match Score</div>
              <div className="automation-track" style={{ marginTop: 8 }}>
                <div
                  className="automation-fill"
                  style={{ width: `${selected.aiScore}%`, background: scoreColor(selected.aiScore) }}
                />
              </div>
            </div>

            {/* Details */}
            {[
              ["Location", `📍 ${selected.location}`],
              ["Experience", `${selected.experience} years`],
              ["Level", selected.level],
              ["Availability", selected.availability],
              ["Notice Period", selected.noticePeriod],
              ["Current CTC", `₹${selected.currentCTC} LPA`],
              ["Expected CTC", `₹${selected.expectedCTC} LPA`],
              ["Industry", selected.industry],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.83rem",
              }}>
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}

            {/* Education */}
            <div style={{ marginTop: "0.9rem" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>Education</div>
              <div style={{ fontSize: "0.85rem" }}>{selected.education}</div>
            </div>

            {/* Contact */}
            <div style={{ marginTop: "0.9rem" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>Contact</div>
              <div style={{ fontSize: "0.83rem", color: "var(--gold)" }}>{selected.email}</div>
              <div style={{ fontSize: "0.83rem", marginTop: 2 }}>{selected.phone}</div>
            </div>

            {/* Skills */}
            <div style={{ marginTop: "0.9rem" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {selected.skills.map((sk) => (
                  <span key={sk} style={{
                    background: "rgba(210,174,82,0.12)",
                    border: "1px solid rgba(210,174,82,0.3)",
                    borderRadius: 5, padding: "3px 8px",
                    fontSize: "0.76rem", color: "var(--gold)",
                  }}>{sk}</span>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.5rem" }}>
              <div style={{
                flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 8,
                padding: "0.6rem", textAlign: "center",
              }}>
                <div style={{ fontWeight: 700 }}>{selected.appliedJobs}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Jobs Applied</div>
              </div>
              <div style={{
                flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 8,
                padding: "0.6rem", textAlign: "center",
              }}>
                <div style={{ fontWeight: 700 }}>{selected.interviews}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Interviews</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={() => scheduleInterview(selected)}
              >
                📅 Schedule Interview
              </button>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => toggleShortlist(selected.id)}
              >
                {selected.shortlisted ? "★ Remove Shortlist" : "☆ Shortlist Candidate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
