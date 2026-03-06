import { useState } from "react";

type DocCategory = "Offer Letters" | "Payslips" | "Certificates" | "ID Proofs" | "Templates";

type Doc = {
  id: string;
  name: string;
  category: DocCategory;
  employee: string;
  size: string;
  date: string;
  signed: boolean;
  expires: string | null;
};

const DOCS: Doc[] = [
  { id: "d1",  name: "Offer Letter — Priya Nair",          category: "Offer Letters",  employee: "Priya Nair",   size: "124 KB", date: "Jan 08, 2026", signed: true,  expires: null          },
  { id: "d2",  name: "Offer Letter — Vikram Singh",         category: "Offer Letters",  employee: "Vikram Singh", size: "118 KB", date: "Jan 11, 2026", signed: true,  expires: null          },
  { id: "d3",  name: "Payslip Feb 2026 — Priya Nair",      category: "Payslips",       employee: "Priya Nair",   size: "86 KB",  date: "Mar 01, 2026", signed: false, expires: null          },
  { id: "d4",  name: "Payslip Feb 2026 — Vikram Singh",    category: "Payslips",       employee: "Vikram Singh", size: "84 KB",  date: "Mar 01, 2026", signed: false, expires: null          },
  { id: "d5",  name: "React Advanced Cert — Ananya Roy",   category: "Certificates",   employee: "Ananya Roy",   size: "210 KB", date: "Mar 01, 2026", signed: true,  expires: null          },
  { id: "d6",  name: "Aadhaar — Priya Nair",               category: "ID Proofs",      employee: "Priya Nair",   size: "340 KB", date: "Jan 08, 2026", signed: false, expires: null          },
  { id: "d7",  name: "PAN Card — Vikram Singh",            category: "ID Proofs",      employee: "Vikram Singh", size: "180 KB", date: "Jan 11, 2026", signed: false, expires: null          },
  { id: "d8",  name: "Passport — Ananya Roy",              category: "ID Proofs",      employee: "Ananya Roy",   size: "450 KB", date: "Feb 01, 2026", signed: false, expires: "Apr 2026"    },
  { id: "d9",  name: "Employment Offer Template v3",       category: "Templates",      employee: "HR Team",       size: "52 KB",  date: "Jan 01, 2026", signed: false, expires: null          },
  { id: "d10", name: "Experience Letter Template",         category: "Templates",      employee: "HR Team",       size: "38 KB",  date: "Jan 01, 2026", signed: false, expires: null          },
  { id: "d11", name: "POSH Cert — Nisha Verma",           category: "Certificates",   employee: "Nisha Verma",  size: "195 KB", date: "Jan 30, 2026", signed: true,  expires: "Jan 2027"    },
];

const CATEGORY_ICON: Record<DocCategory, string> = {
  "Offer Letters": "📝",
  Payslips:        "💰",
  Certificates:    "🎓",
  "ID Proofs":     "🪪",
  Templates:       "📋",
};

const CATEGORIES: DocCategory[] = ["Offer Letters", "Payslips", "Certificates", "ID Proofs", "Templates"];
type FilterKey = "All" | DocCategory;

export default function Documents() {
  const [filter, setFilter] = useState<FilterKey>("All");
  const [docs, setDocs] = useState<Doc[]>(DOCS);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", category: "Offer Letters" as DocCategory, employee: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [signedDocs, setSignedDocs] = useState<Set<string>>(new Set());

  const filtered = filter === "All" ? docs : docs.filter((d) => d.category === filter);
  const pendingSig = docs.filter((d) => !d.signed && !signedDocs.has(d.id) && d.category !== "Templates" && d.category !== "ID Proofs").length;
  const expiringSoon = docs.filter((d) => d.expires !== null).length;

  function handleUpload() {
    if (!uploadForm.name.trim() || !uploadForm.employee.trim()) return;
    const newDoc: Doc = {
      id: `d${docs.length + 1}`,
      name: uploadForm.name,
      category: uploadForm.category,
      employee: uploadForm.employee,
      size: "N/A",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      signed: false,
      expires: null,
    };
    setDocs((prev) => [newDoc, ...prev]);
    setUploadForm({ name: "", category: "Offer Letters", employee: "" });
    setShowUpload(false);
    showToast(`Document "${newDoc.name}" uploaded successfully`);
  }

  function handleESign(id: string) {
    setSignedDocs((prev) => new Set([...prev, id]));
    showToast("eSign request sent. Document will be marked signed on completion.");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
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
        <h1 className="page-title">Document Management</h1>
        <p className="page-sub">Digital Locker · eSign · OCR · 200+ Templates · Audit Trail</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Documents</p>
          <p className="stat-value">{docs.length}</p>
          <p className="stat-note">Across all categories</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending eSign</p>
          <p className="stat-value stat-amber">{pendingSig}</p>
          <p className="stat-note">Awaiting digital signature</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Expiring Soon</p>
          <p className="stat-value stat-risk">{expiringSoon}</p>
          <p className="stat-note">Within next 90 days</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Storage Used</p>
          <p className="stat-value" style={{ fontSize: "1.2rem" }}>2.4 MB</p>
          <p className="stat-note">of 10 GB limit (Starter)</p>
        </div>
      </div>

      {/* Filter + Upload */}
      <div className="section-block">
        <div className="section-head">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2>Document Library</h2>
              <p>Encrypted storage with signed URLs. Every action is audit-logged.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowUpload((v) => !v)}>
              {showUpload ? "✕ Cancel" : "+ Upload Document"}
            </button>
          </div>
        </div>

        {showUpload && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1rem",
          }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label className="form-label">Document Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Offer Letter — Karan Malhotra"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div style={{ flex: "0 0 160px" }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value as DocCategory }))}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label className="form-label">Employee</label>
                <input
                  className="form-input"
                  placeholder="Employee name"
                  value={uploadForm.employee}
                  onChange={(e) => setUploadForm((p) => ({ ...p, employee: e.target.value }))}
                />
              </div>
              <button className="btn-primary" onClick={handleUpload} style={{ flexShrink: 0 }}>
                Upload
              </button>
            </div>
          </div>
        )}

        <div className="filter-tabs">
          <button className={`filter-tab${filter === "All" ? " active" : ""}`} onClick={() => setFilter("All")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`filter-tab${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>
              {CATEGORY_ICON[c]} {c}
            </button>
          ))}
        </div>

        <div className="doc-grid">
          {filtered.map((doc) => (
            <div key={doc.id} className={`doc-card${doc.expires ? " doc-expiring" : ""}`}>
              <div className="doc-icon">{CATEGORY_ICON[doc.category]}</div>
              <div className="doc-body">
                <p className="doc-name">{doc.name}</p>
                <p className="doc-meta">
                  {doc.employee} · {doc.size} · {doc.date}
                </p>
                {doc.expires && (
                  <p className="doc-expiry">Expires: {doc.expires}</p>
                )}
              </div>
              <div className="doc-actions">
                {!doc.signed && !signedDocs.has(doc.id) && doc.category !== "Templates" && doc.category !== "ID Proofs" && (
                  <button
                    className="table-action-btn"
                    style={{ color: "var(--amber)", borderColor: "rgba(243,185,85,0.45)" }}
                    onClick={() => handleESign(doc.id)}
                  >
                    eSign
                  </button>
                )}
                {signedDocs.has(doc.id) && (
                  <span className="status-chip status-on-track" style={{ fontSize: "0.72rem" }}>✓ eSigned</span>
                )}
                <button className="table-action-btn" onClick={() => showToast(`Viewing "${doc.name}"`)}>View</button>
                <button className="table-action-btn" onClick={() => showToast(`Downloading "${doc.name}"`)}>↓</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
