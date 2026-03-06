import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import Sidebar from "../components/Sidebar";
import type { TabKey } from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";

import Overview from "./Overview";
import Employees from "./Employees";
import Departments from "./Departments";
import Designations from "./Designations";
import ATS from "./ATS";
import Interviews from "./Interviews";
import Payroll from "./Payroll";
import Performance from "./Performance";
import Gamification from "./Gamification";
import LMS from "./LMS";
import Attendance from "./Attendance";
import Leave from "./Leave";
import Expense from "./Expense";
import Documents from "./Documents";
import Compliance from "./Compliance";
import EmployeeServices from "./EmployeeServices";
import Onboarding from "./Onboarding";
import Offboarding from "./Offboarding";
import Analytics from "./Analytics";
import SuperAdmin from "./SuperAdmin";
import JobBoard from "./JobBoard";
import RecruiterHub from "./RecruiterHub";
import RecruiterRevenue from "./RecruiterRevenue";
import Candidates from "./Candidates";
import AIHub from "./AIHub";
import PlanCatalog from "./PlanCatalog";
import Subscriptions from "./Subscriptions";
import Payments from "./Payments";
import WhiteLabel from "./WhiteLabel";

import "../hrms.css";

const PAGE_TITLES: Record<TabKey, { title: string; sub: string }> = {
  overview: { title: "Command Center", sub: "Real-time overview of workforce operations" },
  employees: { title: "Employees", sub: "Employee records, lifecycle, and org visibility" },
  departments: { title: "Departments", sub: "Department hierarchy and demand planning" },
  designations: { title: "Designations", sub: "Role structure, levels, and salary governance" },
  ats: { title: "AI Recruitment", sub: "Applicant tracking and smart hiring pipeline" },
  interviews: { title: "Interviews", sub: "Interview scheduling and AI scoring workflows" },
  payroll: { title: "Smart Payroll", sub: "Payroll processing and statutory compliance" },
  performance: { title: "Performance Management", sub: "OKRs, feedback, and appraisal automation" },
  gamification: { title: "Gamification Engine", sub: "Points, levels, and rewards engagement" },
  lms: { title: "Learning Management", sub: "Courses, certifications, and AI learning paths" },
  attendance: { title: "Attendance", sub: "Biometric, GPS, and policy-based attendance control" },
  leave: { title: "Leave Management", sub: "Leave balances, approvals, and calendar controls" },
  expense: { title: "Expense Management", sub: "Claims, approvals, and reimbursement lifecycle" },
  documents: { title: "Document Management", sub: "Digital documents and automated letter generation" },
  compliance: { title: "Compliance", sub: "Policy controls, statutory checks, and governance" },
  "employee-services": { title: "Employee Services", sub: "Helpdesk, benefits, and support workflows" },
  onboarding: { title: "Onboarding", sub: "Pre-join to day-one onboarding orchestration" },
  offboarding: { title: "Offboarding", sub: "Exit process, handover, and full-and-final controls" },
  analytics: { title: "CEO Analytics", sub: "Leadership metrics and AI workforce intelligence" },
  "super-admin": { title: "Super Admin", sub: "Platform control center and tenant operations" },
  "job-board": { title: "Job Board", sub: "Marketplace job listings and application funnel" },
  "recruiter-hub": { title: "Recruiter Hub", sub: "Recruiter network operations and pipelines" },
  "recruiter-revenue": { title: "Recruiter Revenue", sub: "Commission, payout, and placement economics" },
  candidates: { title: "Candidate Pool", sub: "Talent database with AI ranking and matching" },
  "ai-hub": { title: "AI Intelligence Hub", sub: "8-layer AI engine activity and business impact" },
  "plan-catalog": { title: "Plan Catalog", sub: "Multi-pricing architecture and feature packaging" },
  subscriptions: { title: "Subscriptions", sub: "Contract lifecycle and renewal governance" },
  payments: { title: "Payments", sub: "Invoices, collections, and receivable tracking" },
  "white-label": { title: "White Label", sub: "Partner branding, domains, and client operations" },
};

export default function AppShell() {
  const auth = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  if (!auth?.session) {
    return <Navigate to="/login" replace />;
  }

  const { user, tenant } = auth.session;
  const { title, sub } = PAGE_TITLES[activeTab];

  function renderPage() {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "employees":
        return <Employees />;
      case "departments":
        return <Departments />;
      case "designations":
        return <Designations />;
      case "onboarding":
        return <Onboarding />;
      case "ats":
        return <ATS />;
      case "interviews":
        return <Interviews />;
      case "candidates":
        return <Candidates />;
      case "performance":
        return <Performance />;
      case "lms":
        return <LMS />;
      case "gamification":
        return <Gamification />;
      case "payroll":
        return <Payroll />;
      case "attendance":
        return <Attendance />;
      case "leave":
        return <Leave />;
      case "expense":
        return <Expense />;
      case "documents":
        return <Documents />;
      case "compliance":
        return <Compliance />;
      case "employee-services":
        return <EmployeeServices />;
      case "offboarding":
        return <Offboarding />;
      case "job-board":
        return <JobBoard />;
      case "recruiter-hub":
        return <RecruiterHub />;
      case "recruiter-revenue":
        return <RecruiterRevenue />;
      case "ai-hub":
        return <AIHub />;
      case "analytics":
        return <Analytics />;
      case "super-admin":
        return <SuperAdmin />;
      case "plan-catalog":
        return <PlanCatalog />;
      case "subscriptions":
        return <Subscriptions />;
      case "payments":
        return <Payments />;
      case "white-label":
        return <WhiteLabel />;
      default:
        return <Overview />;
    }
  }

  return (
    <div className="hrms-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tenantName={tenant.name}
        userName={user.name}
        userRole={user.role}
        onLogout={() => auth.logout()}
      />

      <header className="hrms-topbar">
        <div className="topbar-left">
          <span className="topbar-title">{title}</span>
          <span className="topbar-sub">{sub}</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-ai-badge">AI Powered</span>
          <span className="topbar-badge">{tenant.name}</span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--gold), #7a5c1e)",
              color: "#000",
              fontWeight: 700,
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {user.name.charAt(0)}
          </div>
        </div>
      </header>

      <main className="hrms-main">{renderPage()}</main>

      <AIAssistant />
    </div>
  );
}
