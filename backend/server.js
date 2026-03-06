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
      status: "open",
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    },
    {
      id: "job-a2",
      tenantId: "tenant-akul",
      title: "Product Designer",
      department: "Design",
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
      stage: "interview",
      aiScore: 82,
      createdAt: "2026-02-03T11:00:00.000Z",
      updatedAt: "2026-02-04T11:00:00.000Z",
    },
    {
      id: "cand-a2",
      tenantId: "tenant-akul",
      jobId: "job-a2",
      name: "Ananya Roy",
      email: "ananya.roy@gmail.com",
      stage: "screening",
      aiScore: 76,
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
  json(res, statusCode, { ok: true, data });
}

function fail(res, statusCode, error) {
  json(res, statusCode, { ok: false, error });
}

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

function normalizeCompanySize(value) {
  const normalized = String(value ?? "").trim();
  if (!CONTACT_ALLOWED_COMPANY_SIZES.has(normalized)) {
    return null;
  }
  return normalized;
}

function sanitizeText(value, maxLength = 500) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function isValidContactEmail(value) {
  return CONTACT_EMAIL_REGEX.test(value);
}

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

function employeeCodeForTenant(tenant) {
  const prefix = tenant.slug.toUpperCase().slice(0, 2);
  const count = tenantEmployees(tenant.id).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
}

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
        highlights: ["One-click run process", "PF and TDS calculations", "Run-level audit trace"],
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

function routeMatch(pathname, pattern) {
  const matched = pathname.match(pattern);
  return matched;
}

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
  const pathname = requestUrl.pathname;

  if (req.method === "GET" && pathname === "/api/health") {
    ok(res, {
      service: "akul-dravin-hrms-api",
      storage: {
        mode: process.env.DATABASE_URL ? "postgres-configured" : "in-memory",
        multiTenantModel: "tenant_id scoped records + optional PostgreSQL schema.sql",
      },
      timestamp: nowIso(),
    });
    return;
  }

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

    const payload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    };

    const token = signToken(payload);
    ok(res, { token, user: publicUser(user), tenant });
    return;
  }

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

    if (!isValidContactEmail(workEmail)) {
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
  if (req.method === "GET" && pathname === "/api/careers/jobs") {
    const allOpenJobs = state.jobs.filter((job) => job.status === "open");
    ok(res, allOpenJobs);
    return;
  }

  let authContext;
  try {
    authContext = getAuthContext(req);
  } catch (error) {
    fail(res, 401, error.message);
    return;
  }

  const { tenant, user } = authContext;

  if (req.method === "GET" && pathname === "/api/auth/me") {
    ok(res, { user: publicUser(user), tenant });
    return;
  }

  if (req.method === "GET" && pathname === "/api/dashboard") {
    ok(res, buildDashboard(tenant));
    return;
  }

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
  if (req.method === "GET" && pathname === "/api/contact/leads") {
    if (user.role !== "super-admin") {
      fail(res, 403, "Only super-admin can access contact leads");
      return;
    }

    ok(res, state.contactLeads);
    return;
  }
  if (req.method === "GET" && pathname === "/api/employees") {
    const records = tenantEmployees(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

    if (!name || !email || !department || !location || !ctcMonthly) {
      fail(res, 400, "name, email, department, location, ctcMonthly are required");
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
      ctcMonthly,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.employees.push(created);
    ok(res, created, 201);
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

    if (body.name !== undefined) {
      employee.name = String(body.name).trim();
    }
    if (body.department !== undefined) {
      employee.department = String(body.department).trim();
    }
    if (body.location !== undefined) {
      employee.location = String(body.location).trim();
    }
    if (body.status !== undefined) {
      const status = String(body.status).trim();
      if (status === "active" || status === "inactive") {
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
      status: status === "closed" ? "closed" : "open",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.jobs.push(created);
    ok(res, created, 201);
    return;
  }

  if (req.method === "GET" && pathname === "/api/ats/candidates") {
    const candidates = tenantCandidates(tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
      stage: normalizedStage,
      aiScore: score,
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

    candidate.updatedAt = nowIso();
    ok(res, candidate);
    return;
  }

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
      const gross = employee.ctcMonthly;
      const pf = Math.round(gross * 0.12);
      const tds = Math.round(gross * 0.08);
      const deductions = pf + tds;
      const net = gross - deductions;

      return {
        id: `item-${randomUUID().slice(0, 8)}`,
        runId,
        tenantId: tenant.id,
        employeeId: employee.id,
        employeeName: employee.name,
        gross,
        pf,
        tds,
        deductions,
        net,
        createdAt: timestamp,
      };
    });

    const totals = items.reduce(
      (accumulator, item) => ({
        gross: accumulator.gross + item.gross,
        deductions: accumulator.deductions + item.deductions,
        net: accumulator.net + item.net,
      }),
      { gross: 0, deductions: 0, net: 0 },
    );

    const createdRun = {
      id: runId,
      tenantId: tenant.id,
      month,
      status: "processed",
      employeeCount: items.length,
      totals,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.payrollRuns.push(createdRun);
    state.payrollItems.push(...items);

    ok(res, { run: createdRun, items }, 201);
    return;
  }

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
  // --- Departments ---
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
      description: String(body.description ?? "").trim(),
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
    if (body.description !== undefined) dept.description = String(body.description).trim();
    if (body.head !== undefined) dept.head = String(body.head).trim();
    if (body.employeeCount !== undefined) dept.employeeCount = Number(body.employeeCount);
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

  // --- Designations ---
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
    if (body.headcount !== undefined) des.headcount = Number(body.headcount);
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

  // Subscription plans catalog (auth-protected)
  if (req.method === "GET" && pathname === "/api/plans") {
    ok(res, {
      hr: [
        { key: "hr-starter",    name: "HR Starter",    price: 999,   employees: 25,        features: ["Core HR & employee records", "Attendance & leave management", "Employee self-service portal", "Basic reporting"] },
        { key: "hr-business",   name: "HR Business",   price: 2999,  employees: 100,       features: ["Everything in Starter", "Payroll processing & statutory", "Performance & goal tracking", "Advanced analytics"], badge: "Most Popular" },
        { key: "hr-enterprise", name: "HR Enterprise", price: 7999,  employees: "Unlimited", features: ["Everything in Business", "AI HR assistant chatbot", "White-label option", "Dedicated CSM + SLA"] },
      ],
      recruitment: [
        { key: "rec-starter",    name: "Recruit Starter",    price: 1499, jobs: 10,          features: ["10 active job posts", "Candidate applications", "Basic pipeline view", "Email notifications"] },
        { key: "rec-business",   name: "Recruit Business",   price: 3999, jobs: 50,          features: ["50 active job posts", "AI resume parser", "Interview scheduling", "Recruiter analytics"], badge: "Most Popular" },
        { key: "rec-enterprise", name: "Recruit Enterprise", price: 9999, jobs: "Unlimited", features: ["Unlimited job posts", "AI candidate matching", "Talent pool & CRM", "Custom career portal"] },
      ],
      combined: [
        { key: "pro",        name: "Professional",    price: 4999,  employees: 100,       jobs: 30,          features: ["Full HRMS + Recruitment", "100 employees", "30 active job posts", "AI resume screening"] },
        { key: "corporate",  name: "Corporate",       price: 9999,  employees: 500,       jobs: "Unlimited", features: ["Full HRMS + Recruitment", "500 employees", "Unlimited jobs", "Dedicated support"], badge: "Most Popular" },
        { key: "global",     name: "Global Enterprise", price: 19999, employees: "Unlimited", jobs: "Unlimited", features: ["Everything unlimited", "AI workforce analytics", "White-label SaaS", "Custom integrations"] },
      ],
    });
    return;
  }

  fail(res, 404, "Endpoint not found");
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    fail(res, 500, `Unhandled error: ${error.message}`);
  });
});

async function boot() {
  await loadContactLeads();

  server.listen(PORT, HOST, () => {
    console.log(`HRMS API running at http://${HOST}:${PORT}`);
  });
}

boot().catch((error) => {
  console.error("Failed to boot HRMS API", error);
  process.exit(1);
});













