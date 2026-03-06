import { useState } from "react";

type TaskStatus = "done" | "pending" | "blocked";

type Task = {
  label: string;
  owner: "HR" | "IT" | "Finance" | "Employee";
  status: TaskStatus;
};

type Joiner = {
  name: string;
  role: string;
  dept: string;
  joinDate: string;
  progress: number;
  tasks: Task[];
};

const JOINERS: Joiner[] = [
  {
    name: "Karan Malhotra",
    role: "Senior Frontend Engineer",
    dept: "Engineering",
    joinDate: "Mar 10, 2026",
    progress: 72,
    tasks: [
      { label: "Offer Letter Signed",        owner: "HR",       status: "done"    },
      { label: "Aadhaar & PAN Submitted",    owner: "HR",       status: "done"    },
      { label: "Bank Account Verified",      owner: "Finance",  status: "done"    },
      { label: "Laptop Provisioned",         owner: "IT",       status: "done"    },
      { label: "Email & Tools Access",       owner: "IT",       status: "pending" },
      { label: "HRMS Self-Registration",     owner: "Employee", status: "pending" },
      { label: "Induction Training",         owner: "HR",       status: "pending" },
      { label: "PF Form 11 Submitted",       owner: "Finance",  status: "blocked" },
    ],
  },
  {
    name: "Meera Pillai",
    role: "Product Designer",
    dept: "Design",
    joinDate: "Mar 03, 2026",
    progress: 91,
    tasks: [
      { label: "Offer Letter Signed",        owner: "HR",       status: "done"    },
      { label: "Aadhaar & PAN Submitted",    owner: "HR",       status: "done"    },
      { label: "Bank Account Verified",      owner: "Finance",  status: "done"    },
      { label: "Laptop Provisioned",         owner: "IT",       status: "done"    },
      { label: "Email & Tools Access",       owner: "IT",       status: "done"    },
      { label: "HRMS Self-Registration",     owner: "Employee", status: "done"    },
      { label: "Induction Training",         owner: "HR",       status: "done"    },
      { label: "PF Form 11 Submitted",       owner: "Finance",  status: "pending" },
    ],
  },
  {
    name: "Arjun Reddy",
    role: "Data Analyst",
    dept: "Finance",
    joinDate: "Mar 17, 2026",
    progress: 30,
    tasks: [
      { label: "Offer Letter Signed",        owner: "HR",       status: "done"    },
      { label: "Aadhaar & PAN Submitted",    owner: "HR",       status: "done"    },
      { label: "Bank Account Verified",      owner: "Finance",  status: "pending" },
      { label: "Laptop Provisioned",         owner: "IT",       status: "pending" },
      { label: "Email & Tools Access",       owner: "IT",       status: "pending" },
      { label: "HRMS Self-Registration",     owner: "Employee", status: "pending" },
      { label: "Induction Training",         owner: "HR",       status: "pending" },
      { label: "PF Form 11 Submitted",       owner: "Finance",  status: "pending" },
    ],
  },
];

const TASK_COLOR: Record<TaskStatus, string> = {
  done:    "status-on-track",
  pending: "status-watch",
  blocked: "status-risk",
};

const TASK_ICON: Record<TaskStatus, string> = {
  done:    "✓",
  pending: "○",
  blocked: "!",
};

const OWNER_COLOR: Record<Task["owner"], string> = {
  HR:       "stage-beta",
  IT:       "stage-roadmap",
  Finance:  "status-watch",
  Employee: "status-on-track",
};

export default function Onboarding() {
  const [expanded, setExpanded] = useState<string | null>(JOINERS[0].name);
  const [joiners, setJoiners] = useState<Joiner[]>(JOINERS);

  function toggleTask(joinerName: string, taskIdx: number) {
    setJoiners((prev) => prev.map((j) => {
      if (j.name !== joinerName) return j;
      const tasks = j.tasks.map((t, i) => {
        if (i !== taskIdx || t.status === "blocked") return t;
        return { ...t, status: t.status === "done" ? "pending" : "done" } as Task;
      });
      const done = tasks.filter((t) => t.status === "done").length;
      return { ...j, tasks, progress: Math.round((done / tasks.length) * 100) };
    }));
  }

  const avgProgress = Math.round(joiners.reduce((s, j) => s + j.progress, 0) / joiners.length);
  const totalTasks  = joiners.reduce((s, j) => s + j.tasks.length, 0);
  const doneTasks   = joiners.reduce((s, j) => s + j.tasks.filter((t) => t.status === "done").length, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Smart Onboarding Engine</h1>
        <p className="page-sub">Digital KYC · Day-1 Automation · 30-60-90 Journey · Buddy Program</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Active Joiners</p>
          <p className="stat-value">{joiners.length}</p>
          <p className="stat-note">Currently in onboarding</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Tasks Completed</p>
          <p className="stat-value stat-green">{doneTasks} / {totalTasks}</p>
          <p className="stat-note">Across all joiners</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Completion</p>
          <p className="stat-value stat-amber">{avgProgress}%</p>
          <p className="stat-note">AI-generated readiness score</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Blocked Tasks</p>
          <p className="stat-value stat-risk">
            {joiners.reduce((s, j) => s + j.tasks.filter((t) => t.status === "blocked").length, 0)}
          </p>
          <p className="stat-note">Require immediate action</p>
        </div>
      </div>

      {/* Joiner Cards */}
      <div className="section-block">
        <div className="section-head">
          <h2>Joiner Checklist</h2>
          <p>Click a joiner to view their onboarding task progress.</p>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Click task icons to toggle completion status.
        </p>
        <div className="joiner-list">
          {joiners.map((joiner) => (
            <div key={joiner.name} className="joiner-card">
              <button
                className="joiner-header"
                onClick={() => setExpanded(expanded === joiner.name ? null : joiner.name)}
              >
                <div className="joiner-avatar">{joiner.name.charAt(0)}</div>
                <div className="joiner-info">
                  <span className="joiner-name">{joiner.name}</span>
                  <span className="joiner-role">{joiner.role} · {joiner.dept}</span>
                  <span className="joiner-date">Joining: {joiner.joinDate}</span>
                </div>
                <div className="joiner-progress-wrap">
                  <div className="automation-track" style={{ width: 120 }}>
                    <div
                      className="automation-fill"
                      style={{
                        width: `${joiner.progress}%`,
                        background: joiner.progress >= 80 ? "linear-gradient(90deg,#40b77e,#9ef5ca)" : joiner.progress >= 50 ? "linear-gradient(90deg,#d2ae52,#f0d79a)" : "linear-gradient(90deg,#eb675f,#ff9c96)",
                      }}
                    />
                  </div>
                  <span className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{joiner.progress}%</span>
                </div>
                <span className="joiner-chevron">{expanded === joiner.name ? "▾" : "›"}</span>
              </button>

              {expanded === joiner.name && (
                <div className="joiner-tasks">
                  {joiner.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="task-row"
                      style={{ cursor: task.status !== "blocked" ? "pointer" : "default" }}
                      onClick={() => toggleTask(joiner.name, i)}
                      title={task.status === "blocked" ? "Blocked — requires action" : "Click to toggle"}
                    >
                      <span className={`task-icon ${TASK_COLOR[task.status]}`}>{TASK_ICON[task.status]}</span>
                      <span className="task-label">{task.label}</span>
                      <span className={`status-chip ${OWNER_COLOR[task.owner]}`} style={{ marginLeft: "auto" }}>{task.owner}</span>
                      <span className={`status-chip ${TASK_COLOR[task.status]}`}>{task.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 30-60-90 Timeline */}
      <div className="section-block">
        <div className="section-head">
          <h2>30–60–90 Day Journey</h2>
          <p>AI-generated milestone checkpoints and automated check-ins.</p>
        </div>
        <div className="timeline-strip">
          {[
            { label: "Day 1",   date: "Orientation",          done: true  },
            { label: "Day 7",   date: "First check-in",       done: true  },
            { label: "Day 30",  date: "30-day review",        done: false },
            { label: "Day 60",  date: "Mid-probation",        done: false },
            { label: "Day 90",  date: "Probation completion", done: false },
          ].map((step, i) => (
            <div key={i} className={`timeline-step${step.done ? " done" : ""}`}>
              <div className="timeline-dot" />
              <p className="timeline-label">{step.label}</p>
              <p className="timeline-date">{step.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
