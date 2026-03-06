import { useState } from "react";

type Course = {
  id: string;
  title: string;
  category: "Technical" | "Compliance" | "Leadership" | "Soft Skills" | "Domain";
  duration: string;
  enrolled: number;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
};

type Certificate = {
  employee: string;
  course: string;
  issued: string;
  hash: string;
  expires: string | null;
};

const COURSES: Course[] = [
  { id: "c1", title: "React Advanced Patterns & Performance",   category: "Technical",   duration: "8h",  enrolled: 12, progress: 100, status: "completed"   },
  { id: "c2", title: "POSH Compliance Training 2025",           category: "Compliance",  duration: "2h",  enrolled: 47, progress: 100, status: "completed"   },
  { id: "c3", title: "Leadership Essentials for New Managers",  category: "Leadership",  duration: "12h", enrolled: 8,  progress: 65,  status: "in-progress" },
  { id: "c4", title: "Data Privacy & DPDP Act 2023",            category: "Compliance",  duration: "3h",  enrolled: 47, progress: 40,  status: "in-progress" },
  { id: "c5", title: "TypeScript Deep Dive",                    category: "Technical",   duration: "10h", enrolled: 9,  progress: 0,   status: "not-started" },
  { id: "c6", title: "Effective Communication for Remote Teams",category: "Soft Skills", duration: "4h",  enrolled: 23, progress: 80,  status: "in-progress" },
  { id: "c7", title: "Indian Labour Law Fundamentals",          category: "Compliance",  duration: "5h",  enrolled: 15, progress: 100, status: "completed"   },
  { id: "c8", title: "Product Management Fundamentals",         category: "Domain",      duration: "16h", enrolled: 6,  progress: 20,  status: "in-progress" },
];

const CERTIFICATES: Certificate[] = [
  { employee: "Ananya Roy",   course: "React Advanced Patterns & Performance",  issued: "Mar 01, 2026", hash: "sha256:4a8f2e...9c1d", expires: null         },
  { employee: "Priya Nair",   course: "React Advanced Patterns & Performance",  issued: "Mar 01, 2026", hash: "sha256:7b3c1a...4e8f", expires: null         },
  { employee: "Nisha Verma",  course: "Indian Labour Law Fundamentals",         issued: "Feb 18, 2026", hash: "sha256:2d9e5c...7a3b", expires: "Feb 2027"   },
  { employee: "Rahul Mehta",  course: "POSH Compliance Training 2025",          issued: "Jan 30, 2026", hash: "sha256:6f4b8d...1c2e", expires: "Jan 2027"   },
  { employee: "Vikram Singh", course: "Effective Communication for Remote Teams",issued: "Jan 15, 2026", hash: "sha256:9a7c2f...5d1b", expires: null         },
];

const CAT_COLORS: Record<Course["category"], string> = {
  Technical:   "status-on-track",
  Compliance:  "status-watch",
  Leadership:  "stage-beta",
  "Soft Skills":"stage-roadmap",
  Domain:      "stage-roadmap",
};

type FilterKey = "All" | Course["category"];
const FILTERS: FilterKey[] = ["All", "Technical", "Compliance", "Leadership", "Soft Skills", "Domain"];

export default function LMS() {
  const [filter, setFilter] = useState<FilterKey>("All");
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [toast, setToast] = useState<string | null>(null);

  const completedCourses = courses.filter((c) => c.status === "completed").length;
  const inProgress      = courses.filter((c) => c.status === "in-progress").length;
  const totalEnrolled   = courses.reduce((s, c) => s + c.enrolled, 0);

  const filtered = filter === "All" ? courses : courses.filter((c) => c.category === filter);

  function handleAction(id: string, status: Course["status"]) {
    if (status === "completed") return;
    setCourses((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      if (status === "not-started") {
        showToast(`Enrolled! Course added to your learning path.`);
        return { ...c, status: "in-progress", enrolled: c.enrolled + 1, progress: 5 };
      }
      showToast(`Resumed — continuing from ${c.progress}%`);
      return c;
    }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="page-content">
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: "#22c55e", color: "#fff", borderRadius: 8,
          padding: "10px 18px", fontWeight: 600, fontSize: "0.88rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>
          ✓ {toast}
        </div>
      )}
      <div className="page-header">
        <h1 className="page-title">Learning Management System</h1>
        <p className="page-sub">Courses · AI Learning Paths · Blockchain Certifications</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Completed Courses</p>
          <p className="stat-value">{completedCourses}</p>
          <p className="stat-note">{COURSES.length} total in catalog</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Enrollments</p>
          <p className="stat-value">{totalEnrolled}</p>
          <p className="stat-note">Across all courses</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In Progress</p>
          <p className="stat-value stat-amber">{inProgress}</p>
          <p className="stat-note">Courses being taken now</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Certificates Issued</p>
          <p className="stat-value stat-green">{CERTIFICATES.length}</p>
          <p className="stat-note">Blockchain-verified</p>
        </div>
      </div>

      {/* Course Library */}
      <div className="section-block">
        <div className="section-head">
          <h2>Course Library</h2>
          <p>Browse and enroll in courses. AI suggests based on your skill gaps.</p>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="course-grid">
          {filtered.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-card-top">
                <span className={`status-chip ${CAT_COLORS[course.category]}`}>{course.category}</span>
                <span className="course-duration">{course.duration}</span>
              </div>
              <h3 className="course-title">{course.title}</h3>
              <p className="course-enrolled">{course.enrolled} enrolled</p>
              <div className="course-progress-wrap">
                <div className="automation-track">
                  <div
                    className="automation-fill"
                    style={{
                      width: `${course.progress}%`,
                      background: course.progress === 100 ? "linear-gradient(90deg,#40b77e,#9ef5ca)" : "linear-gradient(90deg,#d2ae52,#f0d79a)",
                    }}
                  />
                </div>
                <span className="mono" style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 32 }}>
                  {course.progress}%
                </span>
              </div>
              <button
                className="course-btn"
                onClick={() => handleAction(course.id, course.status)}
                style={{ opacity: course.status === "completed" ? 0.7 : 1 }}
              >
                {course.status === "completed" ? "Completed" : course.status === "in-progress" ? "Continue" : "Enroll"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates */}
      <div className="section-block">
        <div className="section-head">
          <h2>Blockchain Certificates</h2>
          <p>SHA-256 hashed, tamper-proof. Verifiable by any employer via QR code.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Course</th>
              <th>Issued</th>
              <th>Hash</th>
              <th>Expires</th>
              <th>Verify</th>
            </tr>
          </thead>
          <tbody>
            {CERTIFICATES.map((cert, i) => (
              <tr key={i}>
                <td>{cert.employee}</td>
                <td style={{ maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cert.course}
                </td>
                <td>{cert.issued}</td>
                <td className="mono" style={{ fontSize: "0.77rem", color: "var(--text-muted)" }}>{cert.hash}</td>
                <td>{cert.expires ?? <span className="status-chip status-on-track">Permanent</span>}</td>
                <td>
                  <button className="table-action-btn">QR Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


