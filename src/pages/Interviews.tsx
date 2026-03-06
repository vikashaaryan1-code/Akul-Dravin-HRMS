const INTERVIEWS = [
  { candidate: "Aarav Mehta", role: "Senior Backend Engineer", slot: "08 Mar 2026 11:30", mode: "Video", aiScore: 86, stage: "panel" },
  { candidate: "Nisha Patel", role: "HR Business Partner", slot: "08 Mar 2026 14:00", mode: "In-person", aiScore: 81, stage: "manager" },
  { candidate: "Rohan Sharma", role: "Sales Manager", slot: "09 Mar 2026 10:00", mode: "Video", aiScore: 74, stage: "final" },
  { candidate: "Fatima Khan", role: "Product Designer", slot: "09 Mar 2026 16:30", mode: "Video", aiScore: 90, stage: "panel" },
  { candidate: "Karan Das", role: "DevOps Engineer", slot: "10 Mar 2026 12:30", mode: "Video", aiScore: 78, stage: "manager" },
];

const STAGE_CLASS: Record<string, string> = {
  panel: "stage-beta",
  manager: "status-watch",
  final: "status-on-track",
};

export default function Interviews() {
  const avgScore = Math.round(INTERVIEWS.reduce((sum, item) => sum + item.aiScore, 0) / INTERVIEWS.length);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Interviews</h1>
        <p className="page-sub">AI interview scheduling, analysis, and candidate scoring.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Scheduled</p>
          <p className="stat-value">{INTERVIEWS.length}</p>
          <p className="stat-note">Upcoming interviews</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Average AI Score</p>
          <p className="stat-value stat-green">{avgScore}%</p>
          <p className="stat-note">Model-assisted rating</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Final Round</p>
          <p className="stat-value stat-amber">{INTERVIEWS.filter((item) => item.stage === "final").length}</p>
          <p className="stat-note">Close to offer stage</p>
        </div>
      </div>

      <div className="section-block">
        <div className="section-head">
          <h2>Interview Queue</h2>
          <p>Central queue for recruiter and hiring manager coordination.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Interview Slot</th>
              <th>Mode</th>
              <th>AI Score</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            {INTERVIEWS.map((item) => (
              <tr key={`${item.candidate}-${item.slot}`}>
                <td style={{ fontWeight: 600 }}>{item.candidate}</td>
                <td>{item.role}</td>
                <td className="mono">{item.slot}</td>
                <td>{item.mode}</td>
                <td className="mono">{item.aiScore}%</td>
                <td>
                  <span className={`status-chip ${STAGE_CLASS[item.stage] ?? "stage-roadmap"}`}>{item.stage}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
