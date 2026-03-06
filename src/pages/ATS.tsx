import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import type { Job, Candidate, CandidateStage } from "../types";

const STAGE_LABELS: Record<CandidateStage, string> = {
  screening:  "Screening",
  interview:  "Interview",
  offered:    "Offered",
  joined:     "Joined",
  rejected:   "Rejected",
};

const STAGE_COLOR: Record<CandidateStage, string> = {
  screening:  "stage-roadmap",
  interview:  "stage-beta",
  offered:    "status-watch",
  joined:     "status-on-track",
  rejected:   "status-risk",
};

const STAGES: CandidateStage[] = ["screening", "interview", "offered", "joined", "rejected"];

export default function ATS() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({ title: "", department: "" });
  const [showJobForm, setShowJobForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const DEPTS = ["Engineering", "Design", "Product", "Sales", "Marketing", "Finance", "HR"];

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Job[]>("/ats/jobs"),
      api.get<Candidate[]>("/ats/candidates"),
    ])
      .then(([j, c]) => { setJobs(j); setCandidates(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateJob(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<Job>("/ats/jobs", jobForm);
      setJobForm({ title: "", department: "" });
      setShowJobForm(false);
      load();
    } catch {/**/} finally { setSubmitting(false); }
  }

  async function moveCandidate(candidate: Candidate, stage: CandidateStage) {
    await api.patch(`/ats/candidates/${candidate.id}`, { stage }).catch(() => {});
    load();
  }

  const openJobs = jobs.filter((j) => j.status === "open");
  const totalCandidates = candidates.length;
  const inInterview = candidates.filter((c) => c.stage === "interview").length;
  const joined = candidates.filter((c) => c.stage === "joined").length;
  const highAi = candidates.filter((c) => c.aiScore >= 80).length;

  const filteredCandidates = selectedJob
    ? candidates.filter((c) => c.jobId === selectedJob)
    : candidates;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">AI Recruitment</h1>
        <p className="page-sub">AI JD Generator · Smart Scoring · Pipeline Automation · Offer Management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Open Positions</p>
          <p className="stat-value">{openJobs.length}</p>
          <p className="stat-note">Active job requisitions</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Candidates</p>
          <p className="stat-value">{totalCandidates}</p>
          <p className="stat-note">In pipeline</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In Interview</p>
          <p className="stat-value stat-amber">{inInterview}</p>
          <p className="stat-note">Scheduled this week</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Joined This Month</p>
          <p className="stat-value stat-green">{joined}</p>
          <p className="stat-note">Successfully onboarded</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">High AI Score</p>
          <p className="stat-value">{highAi}</p>
          <p className="stat-note">Score ≥ 80%</p>
        </div>
      </div>

      {/* Jobs */}
      <div className="section-block">
        <div className="section-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2>Job Requisitions</h2>
            <p>Manage open positions and auto-generate job descriptions with AI.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowJobForm((v) => !v)}>
            {showJobForm ? "✕ Cancel" : "+ New Job"}
          </button>
        </div>

        {showJobForm && (
          <form className="data-form" onSubmit={handleCreateJob} style={{ marginBottom: 16, padding: "14px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px solid var(--border-gold)" }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" placeholder="e.g. Senior React Engineer" value={jobForm.title} onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={jobForm.department} onChange={(e) => setJobForm((p) => ({ ...p, department: e.target.value }))} required>
                  <option value="">Select</option>
                  {DEPTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ alignSelf: "flex-end" }}>
                {submitting ? "Creating…" : "Create Job"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", padding: "18px 0", textAlign: "center" }}>Loading…</p>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className={`filter-tab${selectedJob === null ? " active" : ""}`}
              onClick={() => setSelectedJob(null)}
            >
              All ({candidates.length})
            </button>
            {jobs.map((job) => (
              <button
                key={job.id}
                className={`filter-tab${selectedJob === job.id ? " active" : ""}`}
                onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
              >
                {job.title} · {job.department}
                <span className={`status-chip ${job.status === "open" ? "status-on-track" : "status-risk"}`} style={{ marginLeft: 6 }}>
                  {job.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Candidates Pipeline */}
      <div className="section-block">
        <div className="section-head">
          <h2>Candidate Pipeline</h2>
          <p>AI-scored candidates with stage management. Update stage to advance in pipeline.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job</th>
              <th>AI Score</th>
              <th>Stage</th>
              <th>Move To</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
                  No candidates yet.
                </td>
              </tr>
            ) : (
              filteredCandidates.map((c) => {
                const job = jobs.find((j) => j.id === c.jobId);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="emp-avatar" style={{ width: 28, height: 28, fontSize: "0.72rem" }}>{c.name.charAt(0)}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.84rem" }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{job?.title ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="automation-track" style={{ width: 60 }}>
                          <div
                            className="automation-fill"
                            style={{
                              width: `${c.aiScore}%`,
                              background: c.aiScore >= 80
                                ? "linear-gradient(90deg,#40b77e,#9ef5ca)"
                                : c.aiScore >= 60
                                ? "linear-gradient(90deg,#f3b955,#ffd98e)"
                                : "linear-gradient(90deg,#eb675f,#ff9c96)",
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.aiScore}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${STAGE_COLOR[c.stage]}`}>{STAGE_LABELS[c.stage]}</span>
                    </td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: "5px 8px", fontSize: "0.78rem", width: "auto" }}
                        value={c.stage}
                        onChange={(e) => moveCandidate(c, e.target.value as CandidateStage)}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
