import { useState } from "react";

export type TabKey =
  | "overview"
  | "employees"
  | "departments"
  | "designations"
  | "onboarding"
  | "ats"
  | "interviews"
  | "candidates"
  | "performance"
  | "lms"
  | "gamification"
  | "payroll"
  | "attendance"
  | "leave"
  | "expense"
  | "documents"
  | "compliance"
  | "employee-services"
  | "offboarding"
  | "job-board"
  | "recruiter-hub"
  | "recruiter-revenue"
  | "ai-hub"
  | "analytics"
  | "super-admin"
  | "plan-catalog"
  | "subscriptions"
  | "payments"
  | "white-label";

type NavItem = {
  key: TabKey;
  label: string;
  icon: string;
  group: "core" | "talent" | "ops" | "marketplace" | "insights";
};

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: "OV", group: "core" },
  { key: "employees", label: "Employees", icon: "EM", group: "core" },
  { key: "departments", label: "Departments", icon: "DP", group: "core" },
  { key: "designations", label: "Designations", icon: "DS", group: "core" },

  { key: "onboarding", label: "Onboarding", icon: "ON", group: "talent" },
  { key: "ats", label: "Recruitment", icon: "AT", group: "talent" },
  { key: "interviews", label: "Interviews", icon: "IV", group: "talent" },
  { key: "candidates", label: "Candidates", icon: "CD", group: "talent" },
  { key: "performance", label: "Performance", icon: "PF", group: "talent" },
  { key: "lms", label: "Learning", icon: "LM", group: "talent" },
  { key: "gamification", label: "Gamification", icon: "GM", group: "talent" },

  { key: "payroll", label: "Payroll", icon: "PY", group: "ops" },
  { key: "attendance", label: "Attendance", icon: "AD", group: "ops" },
  { key: "leave", label: "Leave", icon: "LV", group: "ops" },
  { key: "expense", label: "Expenses", icon: "EX", group: "ops" },
  { key: "documents", label: "Documents", icon: "DC", group: "ops" },
  { key: "compliance", label: "Compliance", icon: "CP", group: "ops" },
  { key: "employee-services", label: "Emp. Services", icon: "ES", group: "ops" },
  { key: "offboarding", label: "Offboarding", icon: "OF", group: "ops" },

  { key: "job-board", label: "Job Board", icon: "JB", group: "marketplace" },
  { key: "recruiter-hub", label: "Recruiter Hub", icon: "RH", group: "marketplace" },
  { key: "recruiter-revenue", label: "Recruiter Revenue", icon: "RR", group: "marketplace" },
  { key: "ai-hub", label: "AI Hub", icon: "AI", group: "marketplace" },

  { key: "analytics", label: "CEO Analytics", icon: "AN", group: "insights" },
  { key: "super-admin", label: "Super Admin", icon: "SA", group: "insights" },
  { key: "plan-catalog", label: "Plan Catalog", icon: "PL", group: "insights" },
  { key: "subscriptions", label: "Subscriptions", icon: "SB", group: "insights" },
  { key: "payments", label: "Payments", icon: "PM", group: "insights" },
  { key: "white-label", label: "White Label", icon: "WL", group: "insights" },
];

const GROUP_LABELS: Record<NavItem["group"], string> = {
  core: "Core",
  talent: "Talent",
  ops: "Operations",
  marketplace: "Marketplace",
  insights: "Intelligence",
};

type Props = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tenantName: string;
  userName: string;
  userRole: string;
  onLogout: () => void;
};

export default function Sidebar({ activeTab, onTabChange, tenantName, userName, userRole, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const groups: Array<NavItem["group"]> = ["core", "talent", "ops", "marketplace", "insights"];

  return (
    <aside className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">AD</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">HRMS</span>
            <span className="sidebar-logo-ai">AI</span>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <nav className="sidebar-nav">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((n) => n.group === group);
          return (
            <div key={group} className="sidebar-group">
              {!collapsed && <p className="sidebar-group-label">{GROUP_LABELS[group]}</p>}
              {items.map((item) => (
                <button
                  key={item.key}
                  className={`sidebar-item${activeTab === item.key ? " active" : ""}`}
                  onClick={() => onTabChange(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                  {!collapsed && activeTab === item.key && <span className="sidebar-item-dot" />}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{userName.charAt(0)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{userName}</span>
              <span className="sidebar-user-role">{tenantName} | {userRole}</span>
            </div>
          </div>
        )}
        <button className="sidebar-logout" onClick={onLogout} title="Sign out">
          OUT
        </button>
      </div>
    </aside>
  );
}
