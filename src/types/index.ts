export type UserRole = "super-admin" | "hr-manager" | "manager" | "employee";

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: User;
  tenant: Tenant;
}

export interface Employee {
  id: string;
  tenantId: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  location: string;
  ctcMonthly: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
}

export type CandidateStage =
  | "screening"
  | "interview"
  | "offered"
  | "joined"
  | "rejected";

export interface Candidate {
  id: string;
  tenantId: string;
  jobId: string;
  name: string;
  email: string;
  stage: CandidateStage;
  aiScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: string;
  tenantId: string;
  month: string;
  status: string;
  employeeCount: number;
  totals: {
    gross: number;
    deductions: number;
    net: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PayrollItem {
  id: string;
  runId: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  gross: number;
  pf: number;
  tds: number;
  deductions: number;
  net: number;
  createdAt: string;
}

export interface DashboardSummaryCard {
  label: string;
  value: string;
  trend: string;
}

export interface DashboardKpi {
  label: string;
  value: string;
  status: "on-track" | "watch" | "risk";
}

export interface DashboardModule {
  id: string;
  title: string;
  automation: number;
  stage: "production-ready" | "beta" | "roadmap";
  highlights: string[];
}

export interface DashboardWorkflow {
  event: string;
  steps: string[];
}

export interface DashboardData {
  product: {
    name: string;
    tagline: string;
    mission: string;
  };
  summaryCards: DashboardSummaryCard[];
  kpis: DashboardKpi[];
  modules: DashboardModule[];
  workflows: DashboardWorkflow[];
}
