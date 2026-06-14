import { createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.HRMS_API_PORT ?? 4100);
const HOST = process.env.HRMS_API_HOST ?? "127.0.0.1";
const TOKEN_SECRET = process.env.HRMS_TOKEN_SECRET ?? "akul-dravin-hrms-dev-secret";
const TOKEN_TTL_SECONDS = 60 * 60 * 12;
const CONTACT_WEBHOOK_URL = String(process.env.HRMS_CONTACT_WEBHOOK_URL ?? "").trim();
const CONTACT_WEBHOOK_SECRET = String(process.env.HRMS_CONTACT_WEBHOOK_SECRET ?? "");
const CONTACT_WEBHOOK_TIMEOUT_MS = Number(process.env.HRMS_CONTACT_WEBHOOK_TIMEOUT_MS ?? 5000);
const CONTACT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_ALLOWED_COMPANY_SIZES = new Set(["10-100", "101-500", "501-2000", "2000+"]);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTACT_LEADS_PATH = join(__dirname, "db", "contact-leads.json");

// ─── Payroll: Indian statutory deduction engine ───────────────────────────────
/**
 * Computes full Indian payroll breakdown for a monthly CTC:
 *   - Basic = 40% of CTC
 *   - HRA   = 20% of CTC
 *   - Special Allowance = remainder after HRA+Basic+PF+PT
 *   - PF (employee) = 12% of Basic (capped at 15,000 basic => max ₹1,800)
 *   - ESI = 0.75% of gross if gross <= 21,000/month
 *   - Professional Tax = ₹200/month if gross > 15,000
 *   - TDS (income tax) = simplified new-regime slab (monthly apportionment)
 */
function computePayroll(ctcMonthly) {
  const gross = Math.round(ctcMonthly);

  const basic = Math.round(gross * 0.40);
  const hra   = Math.round(gross * 0.20);

  // PF: 12% of basic, but basic capped at ₹15,000 for PF purposes
  const pfBasic = Math.min(basic, 15000);
  const pf = Math.round(pfBasic * 0.12);

  // ESI: 0.75% of gross if gross <= 21,000
  const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;

  // Professional Tax (Maharashtra/standard slab)
  const pt = gross > 15000 ? 200 : (gross > 10000 ? 150 : 0);

  // TDS – new-regime simplified annual slab
  const annualGross = gross * 12;
  let annualTax = 0;
  if (annualGross > 1500000) {
    annualTax = (annualGross - 1500000) * 0.30 + 150000 * 0.20 + 300000 * 0.15 + 300000 * 0.10 + 300000 * 0.05;
  } else if (annualGross > 1200000) {
    annualTax = (annualGross - 1200000) * 0.20 + 300000 * 0.15 + 300000 * 0.10 + 300000 * 0.05;
  } else if (annualGross > 900000) {
    annualTax = (annualGross - 900000) * 0.15 + 300000 * 0.10 + 300000 * 0.05;
  } else if (annualGross > 600000) {
    annualTax = (annualGross - 600000) * 0.10 + 300000 * 0.05;
  } else if (annualGross > 300000) {
    annualTax = (annualGross - 300000) * 0.05;
  }
  // 4% health & education cess
  annualTax = annualTax * 1.04;
  const tds = Math.round(annualTax / 12);

  const totalDeductions = pf + esi + pt + tds;
  const netPay = gross - totalDeductions;

  const specialAllowance = Math.max(0, gross - basic - hra - pf);

  return {
    gross,
    components: { basic, hra, specialAllowance },
    deductions: { pf, esi, professionalTax: pt, tds, total: totalDeductions },
    netPay,
    taxRegime: "NEW",
  };
}

/**
 * Compute attendance summary: total hours, overtime, late marks.
 * @param {Array} records - array of { checkInAt, checkOutAt, date }
 * @param {number} standardHoursPerDay - default 8
 * @param {string} shiftStartTime - "HH:MM" e.g. "09:00"
 */
function computeAttendanceSummary(records, standardHoursPerDay = 8, shiftStartTime = "09:00") {
  let totalHours = 0;
  let overtimeHours = 0;
  let lateMarks = 0;
  const [shiftHour, shiftMin] = shiftStartTime.split(":").map(Number);

  for (const rec of records) {
    if (!rec.checkInAt || !rec.checkOutAt) continue;
    const checkIn  = new Date(rec.checkInAt);
    const checkOut = new Date(rec.checkOutAt);
    const hoursWorked = (checkOut - checkIn) / 3_600_000; // ms -> hours
    if (hoursWorked < 0) continue;

    totalHours += hoursWorked;

    // Overtime: hours beyond standard
    if (hoursWorked > standardHoursPerDay) {
      overtimeHours += hoursWorked - standardHoursPerDay;
    }

    // Late mark: check-in more than 15 minutes after shift start
    const expectedStart = new Date(checkIn);
    expectedStart.setHours(shiftHour, shiftMin, 0, 0);
    if (checkIn - expectedStart > 15 * 60_000) {
      lateMarks++;
    }
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    lateMarks,
    presentDays: records.filter((r) => r.status === "present").length,
    absentDays: records.filter((r) => r.status === "absent").length,
    leaveDays: records.filter((r) => r.status === "leave").length,
  };
}

/**
 * Compute performance score from rating components.
 * Weights: goals 40%, competencies 30%, manager rating 20%, peer rating 10%
 */
function computePerformanceScore({ goalsScore = 0, competenciesScore = 0, managerRating = 0, peerRating = 0 } = {}) {
  const weighted =
    goalsScore * 0.40 +
    competenciesScore * 0.30 +
    managerRating * 0.20 +
    peerRating * 0.10;

  const score = Math.round(weighted * 100) / 100;
  let grade;
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B+";
  else if (score >= 60) grade = "B";
  else if (score >= 50) grade = "C";
  else grade = "D";

  return { score, grade, breakdown: { goalsScore, competenciesScore, managerRating, peerRating } };
}

/**
 * Compute gamification points from activity events.
 * Points: attendance streak (5 pts/day), task_complete (10), training (20),
 *         leave_approved (2), payslip_viewed (1), referral (50)
 */
function computeGamificationPoints(events = []) {
  const POINTS_MAP = {
    attendance_streak: 5,
    task_complete: 10,
    training_completed: 20,
    leave_approved: 2,
    payslip_viewed: 1,
    referral_submitted: 50,
    performance_review_submitted: 15,
    goal_achieved: 25,
  };

  let total = 0;
  const breakdown = {};
  for (const event of events) {
    const pts = POINTS_MAP[event.type] ?? 0;
    total += pts * (event.count ?? 1);
    breakdown[event.type] = (breakdown[event.type] ?? 0) + pts * (event.count ?? 1);
  }

  let badge;
  if (total >= 1000) badge = "Platinum";
  else if (total >= 500) badge = "Gold";
  else if (total >= 200) badge = "Silver";
  else if (total >= 50) badge = "Bronze";
  else badge = "Starter";

  return { totalPoints: total, badge, breakdown };
}

// ─── Static data ─────────────────────────────────────────────────────────────

const tenants = [
  { id: "tenant-akul", slug: "akul", name: "Akul Dravin Technologies Pvt. Ltd." },
  { id: "tenant-pilot", slug: "pilot", name: "Pilot Customer Sandbox" },
];

const users = [
  {
    id: "user-akul-admin",
    tenantId: "tenant-akul",
    name: "Akul Admin",
    email: "admin@akuldravin.com",
    password: "Admin@123",
    role: "super-admin",
  },
  {
    id: "user-akul-hr",
    tenantId: "tenant-akul",
    name: "Aditi Sharma",
    email: "hr@akuldravin.com",
    password: "Hr@12345",
    role: "hr-manager",
  },
  {
    id: "user-pilot-hr",
    tenantId: "tenant-pilot",
    name: "Rahul Mehta",
    email: "hr@pilotcorp.com",
    password: "Pilot@123",
    role: "hr-manager",
  },
  {
    id: "user-akul-ceo",
    tenantId: "tenant-akul",
    name: "Dravin Kumar",
    email: "ceo@akuldravin.com",
    password: "CEO@12345",
    role: "ceo",
  },
  {
    id: "user-akul-finance",
    tenantId: "tenant-akul",
    name: "Rahul Mehta",
    email: "finance@akuldravin.com",
    password: "Finance@123",
    role: "finance-manager",
  },
  {
    id: "user-akul-recruiter",
    tenantId: "tenant-akul",
    name: "Nisha Verma",
    email: "recruiter@akuldravin.com",
    password: "Recruit@123",
    role: "recruiter",
  },
  {
    id: "user-akul-employee",
    tenantId: "tenant-akul",
    name: "Priya Nair",
    email: "employee@akuldravin.com",
    password: "Emp@12345",
    role: "employee",
  },
  {
    id: "user-akul-manager",
    tenantId: "tenant-akul",
    name: "Vikram Singh",
    email: "manager@akuldravin.com",
    password: "Manager@123",
    role: "manager",
  },
];

const state = {
  employees: [
    {
      id: "emp-a1",
      tenantId: "tenant-akul",
      employeeCode: "AK-001",
      name: "Priya Nair",
      email: "priya.nair@akuldravin.com",
      department: "Engineering",
      location: "Bengaluru",
      designation: "Senior Software Engineer",
      joinDate: "2023-03-01",
      ctcMonthly: 165000,
      status: "active",
      createdAt: "2026-01-08T09:00:00.000Z",
      updatedAt: "2026-01-08T09:00:00.000Z",
    },
    {
      id: "emp-a2",
      tenantId: "tenant-akul",
      employeeCode: "AK-002",
      name: "Vikram Singh",
      email: "vikram.singh@akuldravin.com",
      department: "Sales",
      location: "Mumbai",
      designation: "Account Manager",
      joinDate: "2023-06-15",
      ctcMonthly: 98000,
      status: "active",
      createdAt: "2026-01-11T09:00:00.000Z",
      updatedAt: "2026-01-11T09:00:00.000Z",
    },
    {
      id: "emp-p1",
      tenantId: "tenant-pilot",
      employeeCode: "PL-001",
      name: "Nisha Verma",
      email: "nisha.verma@pilotcorp.com",
      department: "HR",
      location: "Delhi",
      designation: "HR Executive",
      joinDate: "2024-01-10",
      ctcMonthly: 72000,
      status: "active",
      createdAt: "2026-01-13T09:00:00.000Z",
      updatedAt: "2026-01-13T09:00:00.000Z",
    },
  ],
  jobs: [
    {
      id: "job-a1",
      tenantId: "tenant-akul",
      title: "Senior Backend Engineer",
      department: "Engineering",
      description: "Build scalable backend services for the HRMS platform.",
      location: "Bengaluru",
      type: "full-time",
      experience: "3-6 years",
      salaryRange: "18-35 LPA",
      status: "open",
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    },
    {
      id: "job-a2",
      tenantId: "tenant-akul",
      title: "Product Designer",
      department: "Design",
      description: "Design beautiful and usable HR workflows.",
      location: "Remote",
      type: "full-time",
      experience: "2-5 years",
      salaryRange: "10-20 LPA",
      status: "open",
      createdAt: "2026-02-12T10:00:00.000Z",
      updatedAt: "2026-02-12T10:00:00.000Z",
    },
  ],
  candidates: [
    {
      id: "cand-a1",
      tenantId: "tenant-akul",
      jobId: "job-a1",
      name: "Samar Kapoor",
      email: "samar.kapoor@gmail.com",
      phone: "+91-9876543210",
      stage: "interview",
      aiScore: 82,
      resumeUrl: null,
      notes: "",
      createdAt: "2026-02-03T11:00:00.000Z",
      updatedAt: "2026-02-04T11:00:00.000Z",
    },
    {
      id: "cand-a2",
      tenantId: "tenant-akul",
      jobId: "job-a2",
      name: "Ananya Roy",
      email: "ananya.roy@gmail.com",
      phone: "+91-9876543211",
      stage: "screening",
      aiScore: 76,
      resumeUrl: null,
      notes: "",
      createdAt: "2026-02-13T11:00:00.000Z",
      updatedAt: "2026-02-13T11:00:00.000Z",
    },
  ],
  payrollRuns: [],
  payrollItems: [],
  contactLeads: [],
  departments: [
    { id: "dept-a1", tenantId: "tenant-akul", name: "Engineering",  description: "Product engineering, platform, and infrastructure",   head: "Priya Nair",    employeeCount: 34, status: "active" },
    { id: "dept-a2", tenantId: "tenant-akul", name: "Design",       description: "Product design, UX research, and brand",              head: "Anika Mehta",   employeeCount: 8,  status: "active" },
    { id: "dept-a3", tenantId: "tenant-akul", name: "Sales",        description: "Enterprise and SMB sales, account management",        head: "Vikram Singh",  employeeCount: 22, status: "active" },
    { id: "dept-a4", tenantId: "tenant-akul", name: "Marketing",    description: "Growth, content, demand generation, and brand",       head: "Kavya Iyer",    employeeCount: 12, status: "active" },
    { id: "dept-a5", tenantId: "tenant-akul", name: "HR",           description: "Talent acquisition, people ops, and culture",        head: "Aditi Sharma",  employeeCount: 6,  status: "active" },
    { id: "dept-a6", tenantId: "tenant-akul", name: "Finance",      description: "FP&A, accounting, compliance, and treasury",         head: "Rahul Gupta",   employeeCount: 9,  status: "active" },
    { id: "dept-p1", tenantId: "tenant-pilot", name: "Engineering", description: "Engineering team",                                    head: "Nisha Verma",   employeeCount: 12, status: "active" },
    { id: "dept-p2", tenantId: "tenant-pilot", name: "HR",          description: "HR and people operations",                           head: "Nisha Verma",   employeeCount: 4,  status: "active" },
  ],
  designations: [
    { id: "des-a1", tenantId: "tenant-akul", title: "Software Engineer",   department: "Engineering", level: "L3", minCtc: 8,  maxCtc: 18, reportsTo: "Tech Lead",           headcount: 14 },
    { id: "des-a2", tenantId: "tenant-akul", title: "Tech Lead",           department: "Engineering", level: "L5", minCtc: 18, maxCtc: 35, reportsTo: "Engineering Manager",  headcount: 4  },
    { id: "des-a3", tenantId: "tenant-akul", title: "Engineering Manager", department: "Engineering", level: "L6", minCtc: 30, maxCtc: 55, reportsTo: "CTO",                  headcount: 2  },
    { id: "des-a4", tenantId: "tenant-akul", title: "HR Executive",        department: "HR",          level: "L2", minCtc: 4,  maxCtc: 8,  reportsTo: "HR Manager",           headcount: 3  },
    { id: "des-a5", tenantId: "tenant-akul", title: "HR Manager",          department: "HR",          level: "L4", minCtc: 10, maxCtc: 22, reportsTo: "CHRO",                 headcount: 2  },
    { id: "des-a6", tenantId: "tenant-akul", title: "Sales Executive",     department: "Sales",       level: "L2", minCtc: 5,  maxCtc: 10, reportsTo: "Account Manager",      headcount: 10 },
    { id: "des-a7", tenantId: "tenant-akul", title: "Account Manager",     department: "Sales",       level: "L4", minCtc: 12, maxCtc: 25, reportsTo: "VP Sales",             headcount: 5  },
    { id: "des-a8", tenantId: "tenant-akul", title: "Product Designer",    department: "Design",      level: "L3", minCtc: 8,  maxCtc: 18, reportsTo: "Design Lead",          headcount: 5  },
    { id: "des-a9", tenantId: "tenant-akul", title: "Finance Analyst",     department: "Finance",     level: "L3", minCtc: 7,  maxCtc: 15, reportsTo: "Finance Manager",      headcount: 4  },
  ],
  // New in-memory stores for new modules
  leaveTypes: [
    { id: "lt-casual",  tenantId: "tenant-akul", leaveCode: "CL",  leaveName: "Casual Leave",    daysPerYear: 12,  carryForwardLimit: 0,  encashable: false, isActive: true },
    { id: "lt-sick",    tenantId: "tenant-akul", leaveCode: "SL",  leaveName: "Sick Leave",      daysPerYear: 12,  carryForwardLimit: 30, encashable: false, isActive: true },
    { id: "lt-earned",  tenantId: "tenant-akul", leaveCode: "EL",  leaveName: "Earned Leave",    daysPerYear: 15,  carryForwardLimit: 45, encashable: true,  isActive: true },
    { id: "lt-pat",     tenantId: "tenant-akul", leaveCode: "PAT", leaveName: "Paternity Leave", daysPerYear: 15,  carryForwardLimit: 0,  encashable: false, isActive: true },
    { id: "lt-mat",     tenantId: "tenant-akul", leaveCode: "MAT", leaveName: "Maternity Leave", daysPerYear: 182, carryForwardLimit: 0,  encashable: false, isActive: true },
    { id: "lt-casual-p", tenantId: "tenant-pilot", leaveCode: "CL", leaveName: "Casual Leave",  daysPerYear: 12,  carryForwardLimit: 0,  encashable: false, isActive: true },
    { id: "lt-earned-p", tenantId: "tenant-pilot", leaveCode: "EL", leaveName: "Earned Leave",  daysPerYear: 15,  carryForwardLimit: 45, encashable: true,  isActive: true },
  ],
  leaveRequests: [],
  leaveBalances: [],
  attendance: [],
  performanceReviews: [],
  notifications: [],
  gamificationEvents: [],
};

const staticPricing = [
  {
    name: "Starter",
    priceInrPerEmployee: 49,
    employeesLimit: 200,
    features: ["Core HR", "Basic ATS", "Payroll", "Attendance"],
  },
  {
    name: "Growth",
    priceInrPerEmployee: 99,
    employeesLimit: 2000,
    features: ["Everything in Starter", "AI Layer", "LMS", "Performance"],
  },
  {
    name: "Enterprise",
    priceInrPerEmployee: 199,
    employeesLimit: null,
    features: ["Everything in Growth", "White Label", "Unlimited API", "SSO"],
  },
];

const staticWorkflows = [
  {
    event: "candidate.applied",
    steps: [
      "AI resume parsing",
      "Fit score generation",
      "Auto-route candidate",
      "Recruiter notification",
    ],
  },
  {
    event: "offer.accepted",
    steps: [
      "eSign verification",
      "Onboarding task creation",
      "Payroll profile creation",
      "Training enrollment",
    ],
  },
  {
    event: "payroll.month.end",
    steps: [
      "Attendance consolidation",
      "Statutory deduction calculations",
      "Anomaly checks",
      "Payslip and payout generation",
    ],
  },
];

// ─── Token helpers ────────────────────────────────────────────────────────────

function signToken(payload) {
  const base = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", TOKEN_SECRET).update(base).digest("base64url");
  return `${base}.${signature}`;
}

function verifyToken(token) {
  const [base, signature] = token.split(".");
  if (!base || !signature) {
    throw new Error("Malformed token");
  }

  const expected = createHmac("sha256", TOKEN_SECRET).update(base).digest("base64url");
  if (expected !== signature) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8"));
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw new Error("Token expired");
  }

  return payload;
}

function publicUser(user) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function ok(res, data, statusCode = 200) {
  json(res, statusCode, { success: true, data });
}

function fail(res, statusCode, message, error = null) {
  json(res, statusCode, { success: false, message, error: error ?? message });
}

// ─── Input utilities ──────────────────────────────────────────────────────────

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function parseCurrency(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function sanitizeText(value, maxLength = 500) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return CONTACT_EMAIL_REGEX.test(value);
}

function normalizeCompanySize(value) {
  const normalized = String(value ?? "").trim();
  if (!CONTACT_ALLOWED_COMPANY_SIZES.has(normalized)) {
    return null;
  }
  return normalized;
}

function parseIntParam(value, min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

// ─── Body parser ──────────────────────────────────────────────────────────────

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON payload"));
      }
    });

    req.on("error", (error) => reject(error));
  });
}

// ─── Contact leads persistence ────────────────────────────────────────────────

async function loadContactLeads() {
  try {
    const raw = await readFile(CONTACT_LEADS_PATH, "utf8");
    const normalizedRaw = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const parsed = JSON.parse(normalizedRaw);
    if (Array.isArray(parsed)) {
      state.contactLeads = parsed;
    }
  } catch (error) {
    const errorCode = error && typeof error === "object" && "code" in error ? error.code : "";
    if (errorCode !== "ENOENT") {
      console.error("Failed to load contact leads:", error);
    }
  }
}

async function saveContactLeads() {
  await mkdir(dirname(CONTACT_LEADS_PATH), { recursive: true });
  await writeFile(CONTACT_LEADS_PATH, JSON.stringify(state.contactLeads, null, 2), "utf8");
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

async function deliverContactWebhook(lead) {
  if (!CONTACT_WEBHOOK_URL) {
    return { attempted: false, delivered: false, statusCode: null, error: null };
  }

  const payload = JSON.stringify({ source: "website", lead });
  const headers = {
    "content-type": "application/json",
  };

  if (CONTACT_WEBHOOK_SECRET) {
    headers["x-hrms-signature"] = createHmac("sha256", CONTACT_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONTACT_WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(CONTACT_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: payload,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        attempted: true,
        delivered: false,
        statusCode: response.status,
        error: `Webhook returned ${response.status}`,
      };
    }

    return {
      attempted: true,
      delivered: true,
      statusCode: response.status,
      error: null,
    };
  } catch (error) {
    return {
      attempted: true,
      delivered: false,
      statusCode: null,
      error: error instanceof Error ? error.message : "Unknown webhook error",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Auth context ─────────────────────────────────────────────────────────────

function getAuthContext(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const payload = verifyToken(token);
  const user = users.find((item) => item.id === payload.userId && item.tenantId === payload.tenantId);
  if (!user) {
    throw new Error("Unknown user");
  }

  const tenant = tenants.find((item) => item.id === user.tenantId);
  if (!tenant) {
    throw new Error("Unknown tenant");
  }

  return { token, user, tenant };
}

// ─── Tenant-scoped data helpers ───────────────────────────────────────────────

function tenantEmployees(tenantId) {
  return state.employees.filter((item) => item.tenantId === tenantId);
}

function tenantJobs(tenantId) {
  return state.jobs.filter((item) => item.tenantId === tenantId);
}

function tenantCandidates(tenantId) {
  return state.candidates.filter((item) => item.tenantId === tenantId);
}

function tenantPayrollRuns(tenantId) {
  return state.payrollRuns.filter((item) => item.tenantId === tenantId);
}

function tenantPayrollItems(runId, tenantId) {
  return state.payrollItems.filter((item) => item.runId === runId && item.tenantId === tenantId);
}

function tenantLeaveTypes(tenantId) {
  return state.leaveTypes.filter((lt) => lt.tenantId === tenantId && lt.isActive);
}

function tenantLeaveRequests(tenantId) {
  return state.leaveRequests.filter((lr) => lr.tenantId === tenantId);
}

function tenantAttendance(tenantId) {
  return state.attendance.filter((a) => a.tenantId === tenantId);
}

function tenantNotifications(tenantId) {
  return state.notifications.filter((n) => n.tenantId === tenantId);
}

function tenantPerformanceReviews(tenantId) {
  return state.performanceReviews.filter((r) => r.tenantId === tenantId);
}

function employeeCodeForTenant(tenant) {
  const prefix = tenant.slug.toUpperCase().slice(0, 2);
  const count = tenantEmployees(tenant.id).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
}

// ─── Leave balance helpers ────────────────────────────────────────────────────

function getOrInitLeaveBalance(tenantId, employeeId, leaveTypeId, year) {
  const existing = state.leaveBalances.find(
    (b) => b.tenantId === tenantId && b.employeeId === employeeId &&
            b.leaveTypeId === leaveTypeId && b.year === year,
  );
  if (existing) return existing;

  const lt = state.leaveTypes.find((t) => t.id === leaveTypeId && t.tenantId === tenantId);
  const daysEntitled = lt ? lt.daysPerYear : 0;

  const balance = {
    id: `bal-${randomUUID().slice(0, 8)}`,
    tenantId,
    employeeId,
    leaveTypeId,
    year,
    openingBalance: daysEntitled,
    credited: 0,
    carryForwardDays: 0,
    utilized: 0,
    encashedDays: 0,
    closingBalance: daysEntitled,
    lastComputedAt: nowIso(),
  };
  state.leaveBalances.push(balance);
  return balance;
}

function recalcLeaveClosing(balance) {
  return Math.max(
    0,
    balance.openingBalance + balance.credited + balance.carryForwardDays -
    balance.utilized - balance.encashedDays,
  );
}

function countLeaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}

// ─── Dashboard builder ────────────────────────────────────────────────────────

function buildDashboard(tenant) {
  const employees = tenantEmployees(tenant.id);
  const jobs = tenantJobs(tenant.id);
  const candidates = tenantCandidates(tenant.id);
  const payrollRuns = tenantPayrollRuns(tenant.id);

  const activeEmployees = employees.filter((item) => item.status === "active").length;
  const openJobs = jobs.filter((item) => item.status === "open").length;
  const monthlyPayroll = payrollRuns.length > 0 ? payrollRuns[0].totals.net : 0;
  const avgAiScore =
    candidates.length > 0
      ? Math.round(candidates.reduce((sum, item) => sum + item.aiScore, 0) / candidates.length)
      : 0;

  return {
    product: {
      name: "Akul Dravin HRMS AI",
      tagline: "AI-Powered. Autonomous. Global SaaS.",
      mission: "Tenant-isolated HR operating system with real operational CRUD modules.",
    },
    summaryCards: [
      { label: "Active Employees", value: String(activeEmployees), trend: `Tenant: ${tenant.slug}` },
      { label: "Open Jobs", value: String(openJobs), trend: "ATS live" },
      { label: "Candidate AI Score", value: avgAiScore ? `${avgAiScore}/100` : "N/A", trend: "Realtime" },
      { label: "Last Net Payroll", value: `INR ${monthlyPayroll.toLocaleString("en-IN")}`, trend: "Processed" },
    ],
    kpis: [
      { label: "Payroll Accuracy", value: "99.9%", status: "on-track" },
      { label: "Time to Hire Reduction", value: "73%", status: "on-track" },
      { label: "Onboarding Completion", value: "95%", status: "watch" },
      { label: "Compliance Error", value: "<0.1%", status: "on-track" },
      { label: "Monthly Adoption", value: "85%", status: "watch" },
      { label: "Uptime", value: "99.99%", status: "on-track" },
    ],
    modules: [
      {
        id: "employees",
        title: "Core Employee Service",
        automation: 86,
        stage: "production-ready",
        highlights: ["Tenant-aware CRUD", "Role-safe access", "Department and location mapping"],
      },
      {
        id: "ats",
        title: "AI ATS",
        automation: 88,
        stage: "production-ready",
        highlights: ["Job and candidate pipeline", "AI score capture", "Stage management"],
      },
      {
        id: "payroll",
        title: "Payroll Processing",
        automation: 90,
        stage: "production-ready",
        highlights: ["One-click run process", "PF/ESI/PT/TDS calculations", "Run-level audit trace"],
      },
      {
        id: "leave",
        title: "Leave Management",
        automation: 85,
        stage: "production-ready",
        highlights: ["Balance tracking", "Approval workflow", "Year-end carry-forward"],
      },
      {
        id: "attendance",
        title: "Attendance & Overtime",
        automation: 82,
        stage: "production-ready",
        highlights: ["Punch-in/out", "Overtime calculation", "Late mark detection"],
      },
      {
        id: "performance",
        title: "Performance Reviews",
        automation: 78,
        stage: "production-ready",
        highlights: ["Weighted scoring", "Grade assignment", "Multi-rater feedback"],
      },
    ],
    workflows: staticWorkflows,
    pricing: staticPricing,
    roadmap: [
      { phase: "Phase 1", timeline: "Q1-Q2 2025", goal: "India Launch" },
      { phase: "Phase 2", timeline: "Q3 2025-Q2 2026", goal: "Scale India" },
      { phase: "Phase 3", timeline: "2026-2027", goal: "Global Payroll" },
      { phase: "Phase 4", timeline: "2027-2028", goal: "IPO Ready" },
    ],
  };
}

// ─── Route matcher ────────────────────────────────────────────────────────────

function routeMatch(pathname, pattern) {
  return pathname.match(pattern);
}

// ─── Request handler ──────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  if (!req.url || !req.method) {
    fail(res, 400, "Bad request");
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,content-type",
    });
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  let pathname = requestUrl.pathname;
  if (pathname.startsWith('/api/v1/')) {
    pathname = '/api/' + pathname.slice(8);
  }

  // ── Public: health ──────────────────────────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/health") {
    ok(res, {
      service: "akul-dravin-hrms-api",
      version: "2.0.0",
      storage: {
        mode: process.env.DATABASE_URL ? "postgres-configured" : "in-memory",
        multiTenantModel: "tenant_id scoped records + optional PostgreSQL schema.sql",
      },
      timestamp: nowIso(),
    });
    return;
  }

  // ── Public: demo credentials ────────────────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/auth/demo-credentials") {
    ok(res, {
      tenants: tenants.map((tenant) => ({ slug: tenant.slug, name: tenant.name })),
      users: users.map((user) => ({
        tenantSlug: tenants.find((tenant) => tenant.id === user.tenantId)?.slug ?? "",
        email: user.email,
        password: user.password,
        role: user.role,
      })),
    });
    return;
  }

  // ── Public: login ───────────────────────────────────────────────────────────
  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });

    if (!body) {
      return;
    }

    const tenantSlug = String(body.tenantSlug ?? "").trim().toLowerCase();
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");

    if (!tenantSlug || !email || !password) {
      fail(res, 400, "tenantSlug, email and password are required");
      return;
    }

    const tenant = tenants.find((item) => item.slug === tenantSlug);
    if (!tenant) {
      fail(res, 401, "Invalid credentials");
      return;
    }

    const user = users.find(
      (item) => item.tenantId === tenant.id && normalizeEmail(item.email) === email && item.password === password,
    );

    if (!user) {
      fail(res, 401, "Invalid credentials");
      return;
    }

    const tokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    };

    const token = signToken(tokenPayload);
    ok(res, { token, user: publicUser(user), tenant });
    return;
  }

  // ── Public: contact leads (POST) ────────────────────────────────────────────
  if (req.method === "POST" && pathname === "/api/contact/leads") {
    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });

    if (!body) {
      return;
    }

    const fullName = sanitizeText(body.fullName, 120);
    const workEmail = normalizeEmail(body.workEmail);
    const companySize = normalizeCompanySize(body.companySize);
    const requirements = sanitizeText(body.requirements, 2000);

    if (!fullName || !workEmail || !companySize) {
      fail(res, 400, "fullName, workEmail and companySize are required");
      return;
    }

    if (!isValidEmail(workEmail)) {
      fail(res, 400, "workEmail must be a valid email address");
      return;
    }

    const timestamp = nowIso();
    const lead = {
      id: `lead-${randomUUID().slice(0, 8)}`,
      fullName,
      workEmail,
      companySize,
      requirements,
      source: "website",
      status: "new",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.contactLeads.unshift(lead);

    try {
      await saveContactLeads();
    } catch (error) {
      state.contactLeads.shift();
      fail(res, 500, `Unable to store lead: ${error.message}`);
      return;
    }

    const webhookResult = await deliverContactWebhook(lead);

    ok(
      res,
      {
        leadId: lead.id,
        receivedAt: timestamp,
        webhook: webhookResult,
      },
      201,
    );
    return;
  }

  // ── Public: open jobs (careers page) ───────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/careers/jobs") {
    const allOpenJobs = state.jobs.filter((job) => job.status === "open");
    ok(res, allOpenJobs);
    return;
  }

  // ── Auth gate — all routes below require valid JWT ──────────────────────────
  let authContext;
  try {
    authContext = getAuthContext(req);
  } catch (error) {
    fail(res, 401, error.message);
    return;
  }

  const { tenant, user } = authContext;

  // ── GET /api/auth/me ────────────────────────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/auth/me") {
    ok(res, { user: publicUser(user), tenant });
    return;
  }

  // ── GET /api/dashboard ──────────────────────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/dashboard") {
    ok(res, buildDashboard(tenant));
    return;
  }

  // ── GET /api/admin/tenants ──────────────────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/admin/tenants") {
    if (user.role !== "super-admin") {
      fail(res, 403, "Only super-admin can access tenant analytics");
      return;
    }

    const summaries = tenants.map((tenantItem) => {
      const employees = tenantEmployees(tenantItem.id);
      const activeEmployees = employees.filter((employee) => employee.status === "active").length;
      const suggestedPlan = activeEmployees > 200 ? "Enterprise" : activeEmployees > 50 ? "Growth" : "Starter";
      const mrrPerEmployee = suggestedPlan === "Enterprise" ? 199 : suggestedPlan === "Growth" ? 99 : 49;
      const mrr = activeEmployees * mrrPerEmployee;
      const earliestJoin = employees
        .map((employee) => employee.createdAt)
        .sort((a, b) => a.localeCompare(b))[0];

      return {
        id: tenantItem.id,
        name: tenantItem.name,
        slug: tenantItem.slug,
        plan: suggestedPlan,
        employees: activeEmployees,
        mrr,
        status: activeEmployees > 0 ? "active" : "trial",
        joined: earliestJoin
          ? new Date(earliestJoin).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
          : "N/A",
        nps: Math.max(42, Math.min(80, 45 + Math.round(activeEmployees / 8))),
      };
    });

    ok(res, summaries);
    return;
  }

  // ── GET /api/contact/leads (auth-protected) ─────────────────────────────────
  if (req.method === "GET" && pathname === "/api/contact/leads") {
    if (user.role !== "super-admin") {
      fail(res, 403, "Only super-admin can access contact leads");
      return;
    }

    ok(res, state.contactLeads);
    return;
  }

  // ── Employee CRUD ───────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/employees") {
    const { searchParams } = requestUrl;
    let records = tenantEmployees(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Filtering
    const dept = searchParams.get("department");
    if (dept) records = records.filter((e) => e.department.toLowerCase() === dept.toLowerCase());

    const status = searchParams.get("status");
    if (status) records = records.filter((e) => e.status === status);

    const q = searchParams.get("q");
    if (q) {
      const lq = q.toLowerCase();
      records = records.filter(
        (e) => e.name.toLowerCase().includes(lq) || e.email.toLowerCase().includes(lq) || e.employeeCode.toLowerCase().includes(lq),
      );
    }

    ok(res, records);
    return;
  }

  if (req.method === "POST" && pathname === "/api/employees") {
    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });
    if (!body) {
      return;
    }

    const name = String(body.name ?? "").trim();
    const email = normalizeEmail(body.email);
    const department = String(body.department ?? "").trim();
    const location = String(body.location ?? "").trim();
    const ctcMonthly = parseCurrency(body.ctcMonthly);
    const designation = String(body.designation ?? "").trim();
    const joinDate = body.joinDate ? String(body.joinDate).trim() : new Date().toISOString().split("T")[0];

    if (!name || !email || !department || !location || !ctcMonthly) {
      fail(res, 400, "name, email, department, location, ctcMonthly are required");
      return;
    }

    if (!isValidEmail(email)) {
      fail(res, 400, "email must be a valid email address");
      return;
    }

    const duplicate = tenantEmployees(tenant.id).find((item) => normalizeEmail(item.email) === email);
    if (duplicate) {
      fail(res, 409, "Employee with this email already exists");
      return;
    }

    const timestamp = nowIso();
    const created = {
      id: `emp-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      employeeCode: employeeCodeForTenant(tenant),
      name,
      email,
      department,
      location,
      designation,
      joinDate,
      ctcMonthly,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.employees.push(created);
    ok(res, created, 201);
    return;
  }

  // GET single employee
  const employeeGetMatch = routeMatch(pathname, /^\/api\/employees\/([a-zA-Z0-9-]+)$/);
  if (employeeGetMatch && req.method === "GET") {
    const employeeId = employeeGetMatch[1];
    const employee = state.employees.find((item) => item.id === employeeId && item.tenantId === tenant.id);
    if (!employee) {
      fail(res, 404, "Employee not found");
      return;
    }
    // Attach payroll breakdown
    const payrollBreakdown = computePayroll(employee.ctcMonthly);
    ok(res, { ...employee, payrollBreakdown });
    return;
  }

  const employeeMatch = routeMatch(pathname, /^\/api\/employees\/([a-zA-Z0-9-]+)$/);
  if (employeeMatch && req.method === "PATCH") {
    const employeeId = employeeMatch[1];
    const employee = state.employees.find((item) => item.id === employeeId && item.tenantId === tenant.id);

    if (!employee) {
      fail(res, 404, "Employee not found");
      return;
    }

    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });
    if (!body) {
      return;
    }

    if (body.name !== undefined) employee.name = String(body.name).trim();
    if (body.department !== undefined) employee.department = String(body.department).trim();
    if (body.location !== undefined) employee.location = String(body.location).trim();
    if (body.designation !== undefined) employee.designation = String(body.designation).trim();
    if (body.joinDate !== undefined) employee.joinDate = String(body.joinDate).trim();
    if (body.status !== undefined) {
      const status = String(body.status).trim();
      if (["active", "inactive", "terminated"].includes(status)) {
        employee.status = status;
      }
    }
    if (body.ctcMonthly !== undefined) {
      const ctcMonthly = parseCurrency(body.ctcMonthly);
      if (ctcMonthly) {
        employee.ctcMonthly = ctcMonthly;
      }
    }

    employee.updatedAt = nowIso();
    ok(res, employee);
    return;
  }

  if (employeeMatch && req.method === "DELETE") {
    const employeeId = employeeMatch[1];
    const index = state.employees.findIndex((item) => item.id === employeeId && item.tenantId === tenant.id);

    if (index === -1) {
      fail(res, 404, "Employee not found");
      return;
    }

    const [removed] = state.employees.splice(index, 1);
    ok(res, removed);
    return;
  }

  // ── ATS: Jobs ───────────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/ats/jobs") {
    const jobs = tenantJobs(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    ok(res, jobs);
    return;
  }

  if (req.method === "POST" && pathname === "/api/ats/jobs") {
    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });
    if (!body) {
      return;
    }

    const title = String(body.title ?? "").trim();
    const department = String(body.department ?? "").trim();
    const status = String(body.status ?? "open").trim().toLowerCase();

    if (!title || !department) {
      fail(res, 400, "title and department are required");
      return;
    }

    const timestamp = nowIso();
    const created = {
      id: `job-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      title,
      department,
      description: sanitizeText(body.description, 2000),
      location: String(body.location ?? "").trim(),
      type: ["full-time", "part-time", "contract", "internship"].includes(body.type) ? body.type : "full-time",
      experience: String(body.experience ?? "").trim(),
      salaryRange: String(body.salaryRange ?? "").trim(),
      status: status === "closed" ? "closed" : "open",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.jobs.push(created);
    ok(res, created, 201);
    return;
  }

  const jobMatch = routeMatch(pathname, /^\/api\/ats\/jobs\/([a-zA-Z0-9-]+)$/);
  if (jobMatch && req.method === "PATCH") {
    const jobId = jobMatch[1];
    const job = state.jobs.find((item) => item.id === jobId && item.tenantId === tenant.id);
    if (!job) {
      fail(res, 404, "Job not found");
      return;
    }
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    if (body.title !== undefined) job.title = String(body.title).trim();
    if (body.department !== undefined) job.department = String(body.department).trim();
    if (body.description !== undefined) job.description = sanitizeText(body.description, 2000);
    if (body.location !== undefined) job.location = String(body.location).trim();
    if (body.experience !== undefined) job.experience = String(body.experience).trim();
    if (body.salaryRange !== undefined) job.salaryRange = String(body.salaryRange).trim();
    if (body.status !== undefined) {
      const st = String(body.status).trim().toLowerCase();
      if (["open", "closed", "paused"].includes(st)) job.status = st;
    }
    job.updatedAt = nowIso();
    ok(res, job);
    return;
  }

  if (jobMatch && req.method === "DELETE") {
    const idx = state.jobs.findIndex((j) => j.id === jobMatch[1] && j.tenantId === tenant.id);
    if (idx === -1) { fail(res, 404, "Job not found"); return; }
    const [removed] = state.jobs.splice(idx, 1);
    ok(res, removed);
    return;
  }

  // ── ATS: Candidates ─────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/ats/candidates") {
    let candidates = tenantCandidates(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const jobId = requestUrl.searchParams.get("jobId");
    if (jobId) candidates = candidates.filter((c) => c.jobId === jobId);
    const stage = requestUrl.searchParams.get("stage");
    if (stage) candidates = candidates.filter((c) => c.stage === stage);
    ok(res, candidates);
    return;
  }

  if (req.method === "POST" && pathname === "/api/ats/candidates") {
    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });
    if (!body) {
      return;
    }

    const jobId = String(body.jobId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = normalizeEmail(body.email);
    const stage = String(body.stage ?? "screening").trim().toLowerCase();
    const aiScore = Number(body.aiScore ?? 0);

    if (!jobId || !name || !email) {
      fail(res, 400, "jobId, name and email are required");
      return;
    }

    if (!isValidEmail(email)) {
      fail(res, 400, "email must be a valid email address");
      return;
    }

    const job = state.jobs.find((item) => item.id === jobId && item.tenantId === tenant.id);
    if (!job) {
      fail(res, 400, "Invalid jobId for this tenant");
      return;
    }

    const validStages = new Set(["screening", "interview", "offered", "joined", "rejected"]);
    const normalizedStage = validStages.has(stage) ? stage : "screening";
    const score = Number.isFinite(aiScore) ? Math.max(0, Math.min(100, Math.round(aiScore))) : 0;

    const timestamp = nowIso();
    const created = {
      id: `cand-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      jobId,
      name,
      email,
      phone: sanitizeText(body.phone, 20),
      stage: normalizedStage,
      aiScore: score,
      resumeUrl: body.resumeUrl ? String(body.resumeUrl).trim() : null,
      notes: sanitizeText(body.notes, 1000),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.candidates.push(created);
    ok(res, created, 201);
    return;
  }

  const candidateMatch = routeMatch(pathname, /^\/api\/ats\/candidates\/([a-zA-Z0-9-]+)$/);
  if (candidateMatch && req.method === "PATCH") {
    const candidateId = candidateMatch[1];
    const candidate = state.candidates.find((item) => item.id === candidateId && item.tenantId === tenant.id);

    if (!candidate) {
      fail(res, 404, "Candidate not found");
      return;
    }

    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });
    if (!body) {
      return;
    }

    if (body.stage !== undefined) {
      const stage = String(body.stage).trim().toLowerCase();
      if (["screening", "interview", "offered", "joined", "rejected"].includes(stage)) {
        candidate.stage = stage;
      }
    }

    if (body.aiScore !== undefined) {
      const aiScore = Number(body.aiScore);
      if (Number.isFinite(aiScore)) {
        candidate.aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
      }
    }

    if (body.notes !== undefined) candidate.notes = sanitizeText(body.notes, 1000);
    if (body.phone !== undefined) candidate.phone = sanitizeText(body.phone, 20);
    if (body.resumeUrl !== undefined) candidate.resumeUrl = String(body.resumeUrl).trim() || null;

    candidate.updatedAt = nowIso();
    ok(res, candidate);
    return;
  }

  if (candidateMatch && req.method === "DELETE") {
    const idx = state.candidates.findIndex((c) => c.id === candidateMatch[1] && c.tenantId === tenant.id);
    if (idx === -1) { fail(res, 404, "Candidate not found"); return; }
    const [removed] = state.candidates.splice(idx, 1);
    ok(res, removed);
    return;
  }

  // ── Payroll ─────────────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/payroll/runs") {
    const runs = tenantPayrollRuns(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    ok(res, runs);
    return;
  }

  if (req.method === "POST" && pathname === "/api/payroll/runs/process") {
    const body = await parseJsonBody(req).catch((error) => {
      fail(res, 400, error.message);
      return null;
    });
    if (!body) {
      return;
    }

    const month = String(body.month ?? "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      fail(res, 400, "month must be in YYYY-MM format");
      return;
    }

    const existing = state.payrollRuns.find((item) => item.tenantId === tenant.id && item.month === month);
    if (existing) {
      fail(res, 409, "Payroll run already exists for this month");
      return;
    }

    const activeEmployees = tenantEmployees(tenant.id).filter((item) => item.status === "active");
    if (activeEmployees.length === 0) {
      fail(res, 400, "No active employees found");
      return;
    }

    const runId = `run-${randomUUID().slice(0, 8)}`;
    const timestamp = nowIso();

    const items = activeEmployees.map((employee) => {
      const payroll = computePayroll(employee.ctcMonthly);

      return {
        id: `item-${randomUUID().slice(0, 8)}`,
        runId,
        tenantId: tenant.id,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeCode: employee.employeeCode,
        department: employee.department,
        gross: payroll.gross,
        basic: payroll.components.basic,
        hra: payroll.components.hra,
        specialAllowance: payroll.components.specialAllowance,
        pf: payroll.deductions.pf,
        esi: payroll.deductions.esi,
        professionalTax: payroll.deductions.professionalTax,
        tds: payroll.deductions.tds,
        deductions: payroll.deductions.total,
        net: payroll.netPay,
        taxRegime: payroll.taxRegime,
        createdAt: timestamp,
      };
    });

    const totals = items.reduce(
      (accumulator, item) => ({
        gross: accumulator.gross + item.gross,
        deductions: accumulator.deductions + item.deductions,
        pf: accumulator.pf + item.pf,
        esi: accumulator.esi + item.esi,
        tds: accumulator.tds + item.tds,
        professionalTax: accumulator.professionalTax + item.professionalTax,
        net: accumulator.net + item.net,
      }),
      { gross: 0, deductions: 0, pf: 0, esi: 0, tds: 0, professionalTax: 0, net: 0 },
    );

    const createdRun = {
      id: runId,
      tenantId: tenant.id,
      month,
      status: "processed",
      employeeCount: items.length,
      totals,
      processedBy: user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.payrollRuns.push(createdRun);
    state.payrollItems.push(...items);

    ok(res, { run: createdRun, items }, 201);
    return;
  }

  // GET single payroll run
  const payrollRunMatch = routeMatch(pathname, /^\/api\/payroll\/runs\/([a-zA-Z0-9-]+)$/);
  if (payrollRunMatch && req.method === "GET") {
    const runId = payrollRunMatch[1];
    const run = state.payrollRuns.find((item) => item.id === runId && item.tenantId === tenant.id);

    if (!run) {
      fail(res, 404, "Payroll run not found");
      return;
    }

    ok(res, { run, items: tenantPayrollItems(runId, tenant.id) });
    return;
  }

  // GET payroll breakdown for single employee (salary calculator)
  const payrollCalcMatch = routeMatch(pathname, /^\/api\/payroll\/calculate$/);
  if (req.method === "POST" && pathname === "/api/payroll/calculate") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    const ctcMonthly = parseCurrency(body.ctcMonthly);
    if (!ctcMonthly) {
      fail(res, 400, "ctcMonthly must be a positive number");
      return;
    }
    ok(res, computePayroll(ctcMonthly));
    return;
  }

  // GET payslips for a specific employee
  const employeePayslipsMatch = routeMatch(pathname, /^\/api\/employees\/([a-zA-Z0-9-]+)\/payslips$/);
  if (employeePayslipsMatch && req.method === "GET") {
    const employeeId = employeePayslipsMatch[1];
    const emp = state.employees.find((e) => e.id === employeeId && e.tenantId === tenant.id);
    if (!emp) { fail(res, 404, "Employee not found"); return; }
    const payslips = state.payrollItems.filter((i) => i.employeeId === employeeId && i.tenantId === tenant.id);
    ok(res, payslips);
    return;
  }

  // ── Departments ─────────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/departments") {
    ok(res, state.departments.filter((d) => d.tenantId === tenant.id));
    return;
  }

  if (req.method === "POST" && pathname === "/api/departments") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    const name = String(body.name ?? "").trim();
    if (!name) { fail(res, 400, "name is required"); return; }
    const created = {
      id: `dept-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      name,
      description: sanitizeText(body.description, 500),
      head: String(body.head ?? "").trim(),
      employeeCount: 0,
      status: body.status === "inactive" ? "inactive" : "active",
    };
    state.departments.push(created);
    ok(res, created, 201);
    return;
  }

  const deptMatch = routeMatch(pathname, /^\/api\/departments\/([a-zA-Z0-9-]+)$/);
  if (deptMatch && req.method === "PATCH") {
    const dept = state.departments.find((d) => d.id === deptMatch[1] && d.tenantId === tenant.id);
    if (!dept) { fail(res, 404, "Department not found"); return; }
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    if (body.name !== undefined) dept.name = String(body.name).trim();
    if (body.description !== undefined) dept.description = sanitizeText(body.description, 500);
    if (body.head !== undefined) dept.head = String(body.head).trim();
    if (body.employeeCount !== undefined) dept.employeeCount = Math.max(0, parseInt(body.employeeCount, 10) || 0);
    if (body.status !== undefined) dept.status = body.status === "inactive" ? "inactive" : "active";
    ok(res, dept);
    return;
  }

  if (deptMatch && req.method === "DELETE") {
    const idx = state.departments.findIndex((d) => d.id === deptMatch[1] && d.tenantId === tenant.id);
    if (idx === -1) { fail(res, 404, "Department not found"); return; }
    state.departments.splice(idx, 1);
    ok(res, { deleted: true });
    return;
  }

  // ── Designations ─────────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/designations") {
    ok(res, state.designations.filter((d) => d.tenantId === tenant.id));
    return;
  }

  if (req.method === "POST" && pathname === "/api/designations") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    const title = String(body.title ?? "").trim();
    if (!title) { fail(res, 400, "title is required"); return; }
    const created = {
      id: `des-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      title,
      department: String(body.department ?? "").trim(),
      level: String(body.level ?? "L1").trim(),
      minCtc: Number(body.minCtc) || 0,
      maxCtc: Number(body.maxCtc) || 0,
      reportsTo: String(body.reportsTo ?? "").trim(),
      headcount: 0,
    };
    state.designations.push(created);
    ok(res, created, 201);
    return;
  }

  const desMatch = routeMatch(pathname, /^\/api\/designations\/([a-zA-Z0-9-]+)$/);
  if (desMatch && req.method === "PATCH") {
    const des = state.designations.find((d) => d.id === desMatch[1] && d.tenantId === tenant.id);
    if (!des) { fail(res, 404, "Designation not found"); return; }
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    if (body.title !== undefined) des.title = String(body.title).trim();
    if (body.department !== undefined) des.department = String(body.department).trim();
    if (body.level !== undefined) des.level = String(body.level).trim();
    if (body.minCtc !== undefined) des.minCtc = Number(body.minCtc);
    if (body.maxCtc !== undefined) des.maxCtc = Number(body.maxCtc);
    if (body.reportsTo !== undefined) des.reportsTo = String(body.reportsTo).trim();
    if (body.headcount !== undefined) des.headcount = Math.max(0, parseInt(body.headcount, 10) || 0);
    ok(res, des);
    return;
  }

  if (desMatch && req.method === "DELETE") {
    const idx = state.designations.findIndex((d) => d.id === desMatch[1] && d.tenantId === tenant.id);
    if (idx === -1) { fail(res, 404, "Designation not found"); return; }
    state.designations.splice(idx, 1);
    ok(res, { deleted: true });
    return;
  }

  // ── Leave Types ─────────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/leave/types") {
    ok(res, tenantLeaveTypes(tenant.id));
    return;
  }

  if (req.method === "POST" && pathname === "/api/leave/types") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    const leaveName = sanitizeText(body.leaveName, 80);
    const leaveCode = sanitizeText(body.leaveCode, 10).toUpperCase();
    if (!leaveName || !leaveCode) { fail(res, 400, "leaveName and leaveCode are required"); return; }
    const daysPerYear = parseIntParam(body.daysPerYear, 1, 366, null);
    if (!daysPerYear) { fail(res, 400, "daysPerYear must be between 1 and 366"); return; }
    const created = {
      id: `lt-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      leaveCode,
      leaveName,
      daysPerYear,
      carryForwardLimit: parseIntParam(body.carryForwardLimit, 0, 365, 0),
      encashable: !!body.encashable,
      isActive: true,
    };
    state.leaveTypes.push(created);
    ok(res, created, 201);
    return;
  }

  // ── Leave Requests ──────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/leave/requests") {
    let requests = tenantLeaveRequests(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const empId = requestUrl.searchParams.get("employeeId");
    if (empId) requests = requests.filter((r) => r.employeeId === empId);
    const status = requestUrl.searchParams.get("status");
    if (status) requests = requests.filter((r) => r.status === status);
    ok(res, requests);
    return;
  }

  if (req.method === "POST" && pathname === "/api/leave/requests") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const employeeId = String(body.employeeId ?? "").trim();
    const leaveTypeId = String(body.leaveTypeId ?? "").trim();
    const startDate = String(body.startDate ?? "").trim();
    const endDate = String(body.endDate ?? "").trim();

    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      fail(res, 400, "employeeId, leaveTypeId, startDate, endDate are required");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      fail(res, 400, "startDate and endDate must be in YYYY-MM-DD format");
      return;
    }

    if (endDate < startDate) {
      fail(res, 400, "endDate must be >= startDate");
      return;
    }

    const emp = state.employees.find((e) => e.id === employeeId && e.tenantId === tenant.id);
    if (!emp) { fail(res, 404, "Employee not found"); return; }

    const lt = state.leaveTypes.find((t) => t.id === leaveTypeId && t.tenantId === tenant.id);
    if (!lt) { fail(res, 404, "Leave type not found"); return; }

    const totalDays = countLeaveDays(startDate, endDate);

    // Balance check
    const year = parseInt(startDate.split("-")[0], 10);
    const balance = getOrInitLeaveBalance(tenant.id, employeeId, leaveTypeId, year);
    if (balance.closingBalance < totalDays) {
      fail(res, 400, `Insufficient leave balance. Available: ${balance.closingBalance} days, Requested: ${totalDays} days.`);
      return;
    }

    const timestamp = nowIso();
    const created = {
      id: `lr-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      employeeId,
      leaveTypeId,
      leaveTypeName: lt.leaveName,
      leaveCode: lt.leaveCode,
      startDate,
      endDate,
      totalDays,
      reason: sanitizeText(body.reason, 500),
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.leaveRequests.push(created);
    ok(res, created, 201);
    return;
  }

  // GET single leave request
  const leaveReqMatch = routeMatch(pathname, /^\/api\/leave\/requests\/([a-zA-Z0-9-]+)$/);
  if (leaveReqMatch && req.method === "GET") {
    const lr = state.leaveRequests.find((r) => r.id === leaveReqMatch[1] && r.tenantId === tenant.id);
    if (!lr) { fail(res, 404, "Leave request not found"); return; }
    ok(res, lr);
    return;
  }

  // PATCH /api/leave/requests/:id/status — approve / reject
  const leaveStatusMatch = routeMatch(pathname, /^\/api\/leave\/requests\/([a-zA-Z0-9-]+)\/status$/);
  if (leaveStatusMatch && req.method === "PATCH") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const lr = state.leaveRequests.find((r) => r.id === leaveStatusMatch[1] && r.tenantId === tenant.id);
    if (!lr) { fail(res, 404, "Leave request not found"); return; }

    const newStatus = String(body.status ?? "").trim().toLowerCase();
    if (!["approved", "rejected", "cancelled"].includes(newStatus)) {
      fail(res, 400, "status must be: approved, rejected, or cancelled");
      return;
    }

    if (lr.status !== "pending" && !(lr.status === "approved" && newStatus === "cancelled")) {
      fail(res, 409, `Cannot change status from '${lr.status}' to '${newStatus}'`);
      return;
    }

    lr.status = newStatus;
    lr.approvedBy = user.id;
    lr.approvedAt = newStatus === "approved" ? nowIso() : null;
    lr.updatedAt = nowIso();

    // Deduct balance on approval
    if (newStatus === "approved") {
      const year = parseInt(lr.startDate.split("-")[0], 10);
      const balance = getOrInitLeaveBalance(tenant.id, lr.employeeId, lr.leaveTypeId, year);
      balance.utilized += lr.totalDays;
      balance.closingBalance = recalcLeaveClosing(balance);
      balance.lastComputedAt = nowIso();
    }

    // Restore balance on cancellation of previously approved leave
    if (newStatus === "cancelled" && lr.status === "approved") {
      const year = parseInt(lr.startDate.split("-")[0], 10);
      const balance = state.leaveBalances.find(
        (b) => b.tenantId === tenant.id && b.employeeId === lr.employeeId &&
                b.leaveTypeId === lr.leaveTypeId && b.year === year,
      );
      if (balance) {
        balance.utilized = Math.max(0, balance.utilized - lr.totalDays);
        balance.closingBalance = recalcLeaveClosing(balance);
        balance.lastComputedAt = nowIso();
      }
    }

    // Enqueue notification
    const notifTimestamp = nowIso();
    state.notifications.push({
      id: `notif-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      userId: lr.employeeId,
      channel: "in-app",
      type: `LEAVE_${newStatus.toUpperCase()}`,
      title: `Leave Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Your leave request from ${lr.startDate} to ${lr.endDate} has been ${newStatus}.`,
      status: "sent",
      readAt: null,
      createdAt: notifTimestamp,
    });

    ok(res, lr);
    return;
  }

  // ── Leave Balances ──────────────────────────────────────────────────────────

  // GET /api/leave/balances?employeeId=&year=
  if (req.method === "GET" && pathname === "/api/leave/balances") {
    const employeeId = requestUrl.searchParams.get("employeeId");
    const year = parseIntParam(requestUrl.searchParams.get("year"), 2020, 2100, new Date().getFullYear());
    if (!employeeId) { fail(res, 400, "employeeId is required"); return; }

    const emp = state.employees.find((e) => e.id === employeeId && e.tenantId === tenant.id);
    if (!emp) { fail(res, 404, "Employee not found"); return; }

    // Initialize balances for this employee/year if not done
    const leaveTypes = tenantLeaveTypes(tenant.id);
    for (const lt of leaveTypes) {
      getOrInitLeaveBalance(tenant.id, employeeId, lt.id, year);
    }

    const balances = state.leaveBalances
      .filter((b) => b.tenantId === tenant.id && b.employeeId === employeeId && b.year === year)
      .map((b) => {
        const lt = state.leaveTypes.find((t) => t.id === b.leaveTypeId);
        return {
          ...b,
          leaveCode: lt?.leaveCode ?? "UNKNOWN",
          leaveName: lt?.leaveName ?? "Unknown",
          encashable: lt?.encashable ?? false,
        };
      });

    ok(res, balances);
    return;
  }

  // POST /api/leave/balances/carry-forward
  if (req.method === "POST" && pathname === "/api/leave/balances/carry-forward") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    const fromYear = parseIntParam(body.fromYear, 2020, 2100, null);
    if (!fromYear) { fail(res, 400, "fromYear must be a valid year"); return; }
    const toYear = fromYear + 1;

    let processed = 0; let skipped = 0; let totalDays = 0;
    const details = [];

    const fromBalances = state.leaveBalances.filter((b) => b.tenantId === tenant.id && b.year === fromYear);
    for (const balance of fromBalances) {
      const lt = state.leaveTypes.find((t) => t.id === balance.leaveTypeId);
      const cfLimit = lt?.carryForwardLimit ?? 0;
      if (cfLimit <= 0) { skipped++; continue; }
      const carriedDays = Math.min(balance.closingBalance, cfLimit);
      if (carriedDays <= 0) { skipped++; continue; }

      const nextBal = getOrInitLeaveBalance(tenant.id, balance.employeeId, balance.leaveTypeId, toYear);
      nextBal.carryForwardDays += carriedDays;
      nextBal.closingBalance = recalcLeaveClosing(nextBal);
      nextBal.lastComputedAt = nowIso();

      processed++;
      totalDays += carriedDays;
      details.push({ employeeId: balance.employeeId, leaveTypeId: balance.leaveTypeId, carriedDays, cappedAt: cfLimit });
    }

    ok(res, { processedCount: processed, skippedCount: skipped, totalDaysCarried: totalDays, details });
    return;
  }

  // ── Attendance ──────────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/attendance") {
    let records = tenantAttendance(tenant.id).sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
    const empId = requestUrl.searchParams.get("employeeId");
    if (empId) records = records.filter((r) => r.employeeId === empId);
    const month = requestUrl.searchParams.get("month"); // YYYY-MM
    if (month) records = records.filter((r) => r.attendanceDate.startsWith(month));
    ok(res, records);
    return;
  }

  if (req.method === "POST" && pathname === "/api/attendance") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const employeeId = String(body.employeeId ?? "").trim();
    const attendanceDate = String(body.attendanceDate ?? "").trim();
    const status = String(body.status ?? "present").trim().toLowerCase();

    if (!employeeId || !attendanceDate) {
      fail(res, 400, "employeeId and attendanceDate are required");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
      fail(res, 400, "attendanceDate must be in YYYY-MM-DD format");
      return;
    }
    if (!["present", "absent", "leave", "half-day", "work-from-home"].includes(status)) {
      fail(res, 400, "status must be: present, absent, leave, half-day, or work-from-home");
      return;
    }

    const emp = state.employees.find((e) => e.id === employeeId && e.tenantId === tenant.id);
    if (!emp) { fail(res, 404, "Employee not found"); return; }

    const existing = state.attendance.find(
      (a) => a.employeeId === employeeId && a.attendanceDate === attendanceDate && a.tenantId === tenant.id,
    );
    if (existing) {
      fail(res, 409, "Attendance record already exists for this employee and date");
      return;
    }

    const checkInAt = body.checkInAt ? new Date(body.checkInAt).toISOString() : null;
    const checkOutAt = body.checkOutAt ? new Date(body.checkOutAt).toISOString() : null;

    // Compute hours worked and overtime if check-in/out provided
    let hoursWorked = 0;
    let overtime = 0;
    let isLate = false;
    if (checkInAt && checkOutAt) {
      hoursWorked = Math.max(0, (new Date(checkOutAt) - new Date(checkInAt)) / 3_600_000);
      overtime = Math.max(0, hoursWorked - 8);
      const checkInDate = new Date(checkInAt);
      const shiftStart = new Date(checkInDate);
      shiftStart.setHours(9, 0, 0, 0);
      isLate = checkInDate - shiftStart > 15 * 60_000;
    }

    const timestamp = nowIso();
    const created = {
      id: `att-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      employeeId,
      employeeName: emp.name,
      department: emp.department,
      attendanceDate,
      status,
      checkInAt,
      checkOutAt,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      overtime: Math.round(overtime * 100) / 100,
      isLate,
      geoLocation: body.geoLocation ? String(body.geoLocation).trim() : null,
      notes: sanitizeText(body.notes, 200),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.attendance.push(created);
    ok(res, created, 201);
    return;
  }

  // PATCH attendance (punch-out / update)
  const attendanceMatch = routeMatch(pathname, /^\/api\/attendance\/([a-zA-Z0-9-]+)$/);
  if (attendanceMatch && req.method === "PATCH") {
    const att = state.attendance.find((a) => a.id === attendanceMatch[1] && a.tenantId === tenant.id);
    if (!att) { fail(res, 404, "Attendance record not found"); return; }
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    if (body.checkOutAt !== undefined) {
      att.checkOutAt = new Date(body.checkOutAt).toISOString();
      if (att.checkInAt) {
        att.hoursWorked = Math.max(0, (new Date(att.checkOutAt) - new Date(att.checkInAt)) / 3_600_000);
        att.hoursWorked = Math.round(att.hoursWorked * 100) / 100;
        att.overtime = Math.max(0, Math.round((att.hoursWorked - 8) * 100) / 100);
      }
    }
    if (body.status !== undefined) {
      const st = String(body.status).trim().toLowerCase();
      if (["present", "absent", "leave", "half-day", "work-from-home"].includes(st)) att.status = st;
    }
    if (body.notes !== undefined) att.notes = sanitizeText(body.notes, 200);
    att.updatedAt = nowIso();
    ok(res, att);
    return;
  }

  // GET /api/attendance/summary?employeeId=&month=
  if (req.method === "GET" && pathname === "/api/attendance/summary") {
    const employeeId = requestUrl.searchParams.get("employeeId");
    const month = requestUrl.searchParams.get("month"); // YYYY-MM
    if (!employeeId || !month) {
      fail(res, 400, "employeeId and month are required");
      return;
    }
    const emp = state.employees.find((e) => e.id === employeeId && e.tenantId === tenant.id);
    if (!emp) { fail(res, 404, "Employee not found"); return; }

    const records = state.attendance.filter(
      (a) => a.employeeId === employeeId && a.tenantId === tenant.id && a.attendanceDate.startsWith(month),
    );

    const summary = computeAttendanceSummary(records, 8, "09:00");
    ok(res, { employeeId, month, ...summary, records });
    return;
  }

  // ── Performance Reviews ─────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/performance/reviews") {
    let reviews = tenantPerformanceReviews(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const empId = requestUrl.searchParams.get("employeeId");
    if (empId) reviews = reviews.filter((r) => r.employeeId === empId);
    ok(res, reviews);
    return;
  }

  if (req.method === "POST" && pathname === "/api/performance/reviews") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const employeeId = String(body.employeeId ?? "").trim();
    const reviewPeriod = String(body.reviewPeriod ?? "").trim(); // e.g., "2026-Q1"

    if (!employeeId || !reviewPeriod) {
      fail(res, 400, "employeeId and reviewPeriod are required");
      return;
    }

    const emp = state.employees.find((e) => e.id === employeeId && e.tenantId === tenant.id);
    if (!emp) { fail(res, 404, "Employee not found"); return; }

    const goalsScore = Math.min(100, Math.max(0, Number(body.goalsScore ?? 0)));
    const competenciesScore = Math.min(100, Math.max(0, Number(body.competenciesScore ?? 0)));
    const managerRating = Math.min(100, Math.max(0, Number(body.managerRating ?? 0)));
    const peerRating = Math.min(100, Math.max(0, Number(body.peerRating ?? 0)));

    const performanceResult = computePerformanceScore({ goalsScore, competenciesScore, managerRating, peerRating });

    const timestamp = nowIso();
    const created = {
      id: `rev-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      employeeId,
      employeeName: emp.name,
      department: emp.department,
      reviewPeriod,
      reviewerId: user.id,
      reviewerName: user.name,
      ...performanceResult,
      status: "submitted",
      feedback: sanitizeText(body.feedback, 2000),
      goals: sanitizeText(body.goals, 1000),
      improvements: sanitizeText(body.improvements, 1000),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.performanceReviews.push(created);

    // Award gamification points for submitting a review
    state.gamificationEvents.push({
      id: `gev-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      userId: user.id,
      type: "performance_review_submitted",
      count: 1,
      createdAt: timestamp,
    });

    ok(res, created, 201);
    return;
  }

  // PATCH /api/performance/reviews/:id
  const perfReviewMatch = routeMatch(pathname, /^\/api\/performance\/reviews\/([a-zA-Z0-9-]+)$/);
  if (perfReviewMatch && req.method === "PATCH") {
    const review = state.performanceReviews.find((r) => r.id === perfReviewMatch[1] && r.tenantId === tenant.id);
    if (!review) { fail(res, 404, "Performance review not found"); return; }
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    if (body.goalsScore !== undefined || body.competenciesScore !== undefined ||
        body.managerRating !== undefined || body.peerRating !== undefined) {
      const goalsScore = Math.min(100, Math.max(0, Number(body.goalsScore ?? review.breakdown.goalsScore)));
      const competenciesScore = Math.min(100, Math.max(0, Number(body.competenciesScore ?? review.breakdown.competenciesScore)));
      const managerRating = Math.min(100, Math.max(0, Number(body.managerRating ?? review.breakdown.managerRating)));
      const peerRating = Math.min(100, Math.max(0, Number(body.peerRating ?? review.breakdown.peerRating)));
      const result = computePerformanceScore({ goalsScore, competenciesScore, managerRating, peerRating });
      Object.assign(review, result);
    }
    if (body.feedback !== undefined) review.feedback = sanitizeText(body.feedback, 2000);
    if (body.goals !== undefined) review.goals = sanitizeText(body.goals, 1000);
    if (body.improvements !== undefined) review.improvements = sanitizeText(body.improvements, 1000);
    if (body.status !== undefined) {
      const st = String(body.status).trim();
      if (["submitted", "acknowledged", "finalized"].includes(st)) review.status = st;
    }
    review.updatedAt = nowIso();
    ok(res, review);
    return;
  }

  // ── Notifications ───────────────────────────────────────────────────────────

  if (req.method === "GET" && pathname === "/api/notifications") {
    let notifs = tenantNotifications(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const userId = requestUrl.searchParams.get("userId");
    if (userId) notifs = notifs.filter((n) => n.userId === userId);
    const unreadOnly = requestUrl.searchParams.get("unread") === "true";
    if (unreadOnly) notifs = notifs.filter((n) => !n.readAt);
    ok(res, notifs);
    return;
  }

  if (req.method === "POST" && pathname === "/api/notifications") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const userId = String(body.userId ?? "").trim();
    const title = sanitizeText(body.title, 120);
    const message = sanitizeText(body.message, 1000);

    if (!userId || !title || !message) {
      fail(res, 400, "userId, title, and message are required");
      return;
    }

    const timestamp = nowIso();
    const created = {
      id: `notif-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      userId,
      channel: String(body.channel ?? "in-app").trim(),
      type: sanitizeText(body.type, 50) || "GENERAL",
      title,
      message,
      status: "sent",
      readAt: null,
      metadata: body.metadata ?? {},
      createdAt: timestamp,
    };

    state.notifications.push(created);
    ok(res, created, 201);
    return;
  }

  // PATCH /api/notifications/:id/read
  const notifReadMatch = routeMatch(pathname, /^\/api\/notifications\/([a-zA-Z0-9-]+)\/read$/);
  if (notifReadMatch && req.method === "PATCH") {
    const notif = state.notifications.find((n) => n.id === notifReadMatch[1] && n.tenantId === tenant.id);
    if (!notif) { fail(res, 404, "Notification not found"); return; }
    notif.readAt = nowIso();
    ok(res, notif);
    return;
  }

  // ── Gamification ────────────────────────────────────────────────────────────

  // GET /api/gamification/points?userId=
  if (req.method === "GET" && pathname === "/api/gamification/points") {
    const targetUserId = requestUrl.searchParams.get("userId") ?? user.id;
    const events = state.gamificationEvents.filter(
      (e) => e.tenantId === tenant.id && e.userId === targetUserId,
    );
    const result = computeGamificationPoints(events);
    ok(res, { userId: targetUserId, ...result, events });
    return;
  }

  // POST /api/gamification/events — record a gamification event
  if (req.method === "POST" && pathname === "/api/gamification/events") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const eventType = String(body.type ?? "").trim();
    const validTypes = [
      "attendance_streak", "task_complete", "training_completed", "leave_approved",
      "payslip_viewed", "referral_submitted", "performance_review_submitted", "goal_achieved",
    ];
    if (!validTypes.includes(eventType)) {
      fail(res, 400, `type must be one of: ${validTypes.join(", ")}`);
      return;
    }

    const targetUserId = String(body.userId ?? user.id).trim();
    const count = Math.max(1, parseIntParam(body.count, 1, 1000, 1));
    const timestamp = nowIso();

    const event = {
      id: `gev-${randomUUID().slice(0, 8)}`,
      tenantId: tenant.id,
      userId: targetUserId,
      type: eventType,
      count,
      createdAt: timestamp,
    };

    state.gamificationEvents.push(event);

    const allEvents = state.gamificationEvents.filter(
      (e) => e.tenantId === tenant.id && e.userId === targetUserId,
    );
    const points = computeGamificationPoints(allEvents);

    ok(res, { event, currentPoints: points }, 201);
    return;
  }

  // GET /api/gamification/leaderboard
  if (req.method === "GET" && pathname === "/api/gamification/leaderboard") {
    const employeeUsers = users.filter((u) => u.tenantId === tenant.id);
    const leaderboard = employeeUsers.map((u) => {
      const events = state.gamificationEvents.filter((e) => e.tenantId === tenant.id && e.userId === u.id);
      const points = computeGamificationPoints(events);
      return { userId: u.id, name: u.name, role: u.role, ...points };
    });
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    ok(res, leaderboard);
    return;
  }

  // ── AI/ML Stubs ─────────────────────────────────────────────────────────────

  // POST /api/ai/resume-score
  if (req.method === "POST" && pathname === "/api/ai/resume-score") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;
    const resumeText = sanitizeText(body.resumeText ?? body.text ?? "", 10000);
    const jobDescription = sanitizeText(body.jobDescription ?? body.jd ?? "", 5000);
    if (!resumeText) {
      fail(res, 400, "resumeText is required");
      return;
    }
    // Deterministic stub — based on length ratio
    const ratio = jobDescription ? Math.min(resumeText.length / Math.max(jobDescription.length, 1), 2) : 1;
    const baseScore = 55 + Math.round(ratio * 20);
    const score = Math.min(98, Math.max(40, baseScore));
    ok(res, {
      score,
      aiProvider: "openai-gpt4-stub",
      analysis: {
        strengths: ["Strong technical background", "Relevant experience", "Clear communication"],
        gaps: ["Missing specific certifications", "Limited leadership examples"],
        recommendation: score >= 75 ? "Recommended for interview" : "Further screening required",
      },
      processingTimeMs: Math.round(Math.random() * 300 + 100),
      note: "AI integration stub — connect OPENAI_API_KEY env var for live scoring",
    });
    return;
  }

  // POST /api/ai/insights
  if (req.method === "POST" && pathname === "/api/ai/insights") {
    const body = await parseJsonBody(req).catch((e) => { fail(res, 400, e.message); return null; });
    if (!body) return;

    const employees = tenantEmployees(tenant.id);
    const payrollRuns = tenantPayrollRuns(tenant.id);

    ok(res, {
      aiProvider: "openai-gpt4-stub",
      insights: [
        {
          type: "attrition-risk",
          severity: "medium",
          title: "Attrition Risk Alert",
          description: `${Math.round(employees.length * 0.15)} employees show low engagement signals based on attendance patterns.`,
          recommendedActions: ["Schedule 1:1 check-ins", "Review compensation benchmarks", "Offer growth opportunities"],
        },
        {
          type: "payroll-anomaly",
          severity: "low",
          title: "Payroll Pattern",
          description: `Total payroll for ${payrollRuns.length} processed runs: INR ${payrollRuns.reduce((s, r) => s + r.totals.net, 0).toLocaleString("en-IN")}`,
          recommendedActions: ["Review employee CTC bands", "Check for salary parity"],
        },
        {
          type: "hiring-velocity",
          severity: "info",
          title: "Hiring Velocity",
          description: `${tenantJobs(tenant.id).filter((j) => j.status === "open").length} open positions with ${tenantCandidates(tenant.id).length} candidates in pipeline.`,
          recommendedActions: ["Accelerate screening", "Expand sourcing channels"],
        },
      ],
      generatedAt: nowIso(),
      note: "AI integration stub — connect OPENAI_API_KEY env var for live insights",
    });
    return;
  }

  // GET /api/ai/recommendations
  if (req.method === "GET" && pathname === "/api/ai/recommendations") {
    ok(res, {
      aiProvider: "openai-gpt4-stub",
      recommendations: [
        { id: "rec-1", category: "workforce", priority: "high",   title: "Optimize Team Structure",     description: "Engineering team capacity looks misaligned with roadmap velocity." },
        { id: "rec-2", category: "payroll",   priority: "medium", title: "Benchmark Salaries",           description: "3 employees are below market rate for their level." },
        { id: "rec-3", category: "training",  priority: "low",    title: "Upskill Finance Team",         description: "New GST regulations — schedule compliance training." },
        { id: "rec-4", category: "hiring",    priority: "high",   title: "Fast-Track Backend Hiring",    description: "2 open backend roles have been open > 60 days." },
      ],
      generatedAt: nowIso(),
      note: "AI integration stub — connect OPENAI_API_KEY env var for live recommendations",
    });
    return;
  }

  // ── Reports ─────────────────────────────────────────────────────────────────

  // GET /api/reports/headcount
  if (req.method === "GET" && pathname === "/api/reports/headcount") {
    const employees = tenantEmployees(tenant.id);
    const byDept = {};
    const byStatus = {};
    for (const emp of employees) {
      byDept[emp.department] = (byDept[emp.department] ?? 0) + 1;
      byStatus[emp.status] = (byStatus[emp.status] ?? 0) + 1;
    }
    ok(res, {
      total: employees.length,
      active: byStatus.active ?? 0,
      inactive: byStatus.inactive ?? 0,
      terminated: byStatus.terminated ?? 0,
      byDepartment: byDept,
      generatedAt: nowIso(),
    });
    return;
  }

  // GET /api/reports/payroll-summary?month=YYYY-MM
  if (req.method === "GET" && pathname === "/api/reports/payroll-summary") {
    const month = requestUrl.searchParams.get("month");
    let runs = tenantPayrollRuns(tenant.id);
    if (month) runs = runs.filter((r) => r.month === month);

    const summary = {
      totalRuns: runs.length,
      totalGross: runs.reduce((s, r) => s + r.totals.gross, 0),
      totalDeductions: runs.reduce((s, r) => s + r.totals.deductions, 0),
      totalPF: runs.reduce((s, r) => s + (r.totals.pf ?? 0), 0),
      totalESI: runs.reduce((s, r) => s + (r.totals.esi ?? 0), 0),
      totalTDS: runs.reduce((s, r) => s + (r.totals.tds ?? 0), 0),
      totalNet: runs.reduce((s, r) => s + r.totals.net, 0),
      runs: runs.map((r) => ({ id: r.id, month: r.month, employeeCount: r.employeeCount, totals: r.totals, status: r.status })),
      generatedAt: nowIso(),
    };
    ok(res, summary);
    return;
  }

  // GET /api/reports/leave-summary?year=
  if (req.method === "GET" && pathname === "/api/reports/leave-summary") {
    const year = parseIntParam(requestUrl.searchParams.get("year"), 2020, 2100, new Date().getFullYear());
    const requests = tenantLeaveRequests(tenant.id).filter((r) => r.startDate.startsWith(String(year)));

    const byType = {};
    const byStatus = {};
    let totalDays = 0;
    for (const req2 of requests) {
      byType[req2.leaveTypeName] = (byType[req2.leaveTypeName] ?? 0) + req2.totalDays;
      byStatus[req2.status] = (byStatus[req2.status] ?? 0) + 1;
      if (req2.status === "approved") totalDays += req2.totalDays;
    }

    ok(res, {
      year,
      totalRequests: requests.length,
      approvedDays: totalDays,
      byLeaveType: byType,
      byStatus,
      generatedAt: nowIso(),
    });
    return;
  }

  // ── Subscription plans catalog (auth-protected) ─────────────────────────────
  if (req.method === "GET" && pathname === "/api/plans") {
    ok(res, {
      hr: [
        { key: "hr-starter",    name: "HR Starter",    price: 999,   employees: 25,          features: ["Core HR & employee records", "Attendance & leave management", "Employee self-service portal", "Basic reporting"] },
        { key: "hr-business",   name: "HR Business",   price: 2999,  employees: 100,         features: ["Everything in Starter", "Payroll processing & statutory", "Performance & goal tracking", "Advanced analytics"], badge: "Most Popular" },
        { key: "hr-enterprise", name: "HR Enterprise", price: 7999,  employees: "Unlimited", features: ["Everything in Business", "AI HR assistant chatbot", "White-label option", "Dedicated CSM + SLA"] },
      ],
      recruitment: [
        { key: "rec-starter",    name: "Recruit Starter",    price: 1499, jobs: 10,          features: ["10 active job posts", "Candidate applications", "Basic pipeline view", "Email notifications"] },
        { key: "rec-business",   name: "Recruit Business",   price: 3999, jobs: 50,          features: ["50 active job posts", "AI resume parser", "Interview scheduling", "Recruiter analytics"], badge: "Most Popular" },
        { key: "rec-enterprise", name: "Recruit Enterprise", price: 9999, jobs: "Unlimited", features: ["Unlimited job posts", "AI candidate matching", "Talent pool & CRM", "Custom career portal"] },
      ],
      combined: [
        { key: "pro",       name: "Professional",     price: 4999,  employees: 100,         jobs: 30,          features: ["Full HRMS + Recruitment", "100 employees", "30 active job posts", "AI resume screening"] },
        { key: "corporate", name: "Corporate",        price: 9999,  employees: 500,         jobs: "Unlimited", features: ["Full HRMS + Recruitment", "500 employees", "Unlimited jobs", "Dedicated support"], badge: "Most Popular" },
        { key: "global",    name: "Global Enterprise", price: 19999, employees: "Unlimited", jobs: "Unlimited", features: ["Everything unlimited", "AI workforce analytics", "White-label SaaS", "Custom integrations"] },
      ],
    });
    return;
  }

  
  // --- Catch-All removed for SaaS completion ---
  // This mock server must not silently return fake data.
  // Frontend should only succeed when NestJS microservices endpoints exist and respond.
  // Therefore any unknown /api/* route must fail with 404.

  fail(res, 404, "Endpoint not found");
}

// ─── Server bootstrap ─────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error("Unhandled request error:", error);
    fail(res, 500, "Internal server error", error.message);
  });
});

async function boot() {
  await loadContactLeads();

  server.listen(PORT, HOST, () => {
    console.log(`HRMS API running at http://${HOST}:${PORT}`);
    console.log("Modules: employees, ATS, payroll, leave, attendance, performance, notifications, gamification, AI stubs, reports");
  });
}

boot().catch((error) => {
  console.error("Failed to boot HRMS API", error);
  process.exit(1);
});
