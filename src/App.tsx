import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth/AuthContext";
import AppShell from "./pages/AppShell";
import LoginPage from "./pages/LoginPage";
import Careers from "./pages/Careers";
import {
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  Globe2,
  GraduationCap,
  HandCoins,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Route, Routes, useLocation, useParams } from "react-router-dom";
import "./App.css";

type FooterTabKey = "company" | "solutions" | "tools" | "links";

type ContentCategory = "company" | "solutions" | "tools" | "links";

type NavItem = {
  to: string;
  label: string;
};

type FooterLinkItem = {
  label: string;
  to: string;
};

type Metric = {
  label: string;
  value: string;
  note: string;
};

type GlobalSignal = {
  value: string;
  label: string;
};

type StoryMoment = {
  phase: string;
  title: string;
  detail: string;
  highlight: string;
};

type BrandTheme = "imperial" | "onyx" | "emerald" | "sunset";
type PartnerId = "akul" | "nova" | "zenith" | "atlas";

type PartnerProfile = {
  id: PartnerId;
  label: string;
  brandName: string;
  platformLabel: string;
  edition: string;
  theme: BrandTheme;
  tollFree: string;
  supportEmail: string;
  hq: string;
  appTag: string;
  domainHints: string[];
};

type Pillar = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Layer = {
  name: string;
  subtitle: string;
  items: string[];
};


type RoadmapPhase = {
  title: string;
  timeline: string;
  target: string;
  focus: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type SeoMeta = {
  title: string;
  description: string;
};

type PersonaProfile = {
  title: string;
  description: string;
  points: string[];
};

type AutomationPlay = {
  title: string;
  steps: string[];
};

type ContactFormValues = {
  fullName: string;
  workEmail: string;
  companySize: string;
  requirements: string;
};

type ContactPageProps = {
  partner: PartnerProfile;
};

type ContactSubmissionState = {
  type: "idle" | "success" | "error";
  message: string;
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type PageVisual = {
  badge: string;
  title: string;
  description: string;
  src: string;
  alt: string;
};

type ContentPageSection = {
  heading: string;
  description: string;
  points: string[];
};

type ContentPage = {
  slug: string;
  category: ContentCategory;
  label: string;
  kicker: string;
  title: string;
  lead: string;
  sections: ContentPageSection[];
  ctaLabel: string;
  ctaTo: string;
};

const COMPANY_SIZE_OPTIONS = ["10-100", "101-500", "501-2000", "2000+"] as const;
const BRAND_THEME_STORAGE_KEY = "adh_brand_theme";
const PARTNER_STORAGE_KEY = "adh_partner_id";

const brandThemes: Array<{ key: BrandTheme; label: string }> = [
  { key: "imperial", label: "Imperial" },
  { key: "onyx", label: "Onyx" },
  { key: "emerald", label: "Emerald" },
  { key: "sunset", label: "Sunset" },
];

const partnerProfiles: PartnerProfile[] = [
  {
    id: "akul",
    label: "Akul Dravin",
    brandName: "Akul Dravin",
    platformLabel: "HRMS",
    edition: "V11 Hyper AI",
    theme: "imperial",
    tollFree: "1800 270 7000",
    supportEmail: "sales@akuldravin.com",
    hq: "Bengaluru, Mumbai, Hyderabad, Delhi NCR",
    appTag: "ADH",
    domainHints: ["akul", "dravin"],
  },
  {
    id: "nova",
    label: "Nova People",
    brandName: "Nova People",
    platformLabel: "Workforce OS",
    edition: "Global Enterprise",
    theme: "onyx",
    tollFree: "1800 120 8200",
    supportEmail: "growth@novapeople.com",
    hq: "Dubai, Singapore, London",
    appTag: "NOVA",
    domainHints: ["nova", "peoplecloud"],
  },
  {
    id: "zenith",
    label: "Zenith Talent",
    brandName: "Zenith Talent",
    platformLabel: "HR Cloud",
    edition: "Partner Prime",
    theme: "emerald",
    tollFree: "1800 330 6400",
    supportEmail: "hello@zenithtalent.ai",
    hq: "Bengaluru, Riyadh, Kuala Lumpur",
    appTag: "ZTH",
    domainHints: ["zenith", "talent"],
  },
  {
    id: "atlas",
    label: "Atlas Workforce",
    brandName: "Atlas Workforce",
    platformLabel: "People Platform",
    edition: "White Label Pro",
    theme: "sunset",
    tollFree: "1800 420 9800",
    supportEmail: "partners@atlasworkforce.com",
    hq: "Mumbai, Abu Dhabi, Toronto",
    appTag: "ATLS",
    domainHints: ["atlas", "workforce"],
  },
];

function isPartnerId(value: string): value is PartnerId {
  return partnerProfiles.some((partner) => partner.id === value);
}

function resolvePartnerIdFromRuntime(): PartnerId {
  if (typeof window === "undefined") {
    return "akul";
  }

  const queryPartner = new URLSearchParams(window.location.search).get("partner")?.toLowerCase();
  if (queryPartner && isPartnerId(queryPartner)) {
    return queryPartner;
  }

  const host = window.location.hostname.toLowerCase();
  const hostMatch = partnerProfiles.find((partner) =>
    partner.domainHints.some((hint) => host.includes(hint.toLowerCase())),
  );
  if (hostMatch) {
    return hostMatch.id;
  }

  const savedPartner = window.localStorage.getItem(PARTNER_STORAGE_KEY)?.toLowerCase();
  if (savedPartner && isPartnerId(savedPartner)) {
    return savedPartner;
  }

  return "akul";
}

const navItems: NavItem[] = [
  { to: "/", label: "Home" },
  {
    label: "Platform",
    submenu: [
      { to: "/platform", label: "Platform Overview" },
      { to: "/modules", label: "Core Modules" },
      { to: "/ai-engine", label: "AI Engine" },
      { to: "/integrations", label: "Integrations" },
      { to: "/security", label: "Security" },
      { to: "/enterprise", label: "Enterprise" },
    ],
  },
  {
    label: "Marketplace",
    submenu: [
      { to: "/for-recruiters", label: "For Recruiters" },
      { to: "/find-jobs", label: "Find Jobs" },
      { to: "/white-label-partners", label: "White Label Partners" },
    ],
  },
  { to: "/pricing", label: "Pricing" },
  {
    label: "Resources",
    submenu: [
      { to: "/roadmap", label: "Roadmap" },
      { to: "/faq", label: "FAQ" },
      { to: "/contact", label: "Contact" },
    ],
  },
];

const metrics: Metric[] = [
  { label: "AI Workflow Coverage", value: "99%", note: "Across HRMS, ATS, payroll, and workforce decisions" },
  { label: "Platform Uptime Target", value: "99.99%", note: "Enterprise availability with resilient architecture" },
  { label: "Recruiter Ecosystem", value: "50K+", note: "Marketplace-ready network across regions" },
  { label: "Go-Live Velocity", value: "14-30 Days", note: "Structured implementation for rapid adoption" },
];

const globalSignals: GlobalSignal[] = [
  { value: "10K+", label: "Targeted Company Onboarding" },
  { value: "5+", label: "Country Expansion Pipeline" },
  { value: "95%+", label: "AI Hiring Recommendation Accuracy" },
  { value: "100+", label: "White Label Partner Target" },
  { value: "NPS 70+", label: "Customer Experience Benchmark" },
];

const trustSignals = [
  "GDPR & DPDP Ready",
  "SOC 2 Control Framework",
  "ISO 27001 Security Program",
  "Enterprise RBAC + Audit Trails",
  "API-first Global Integrations",
  "White Label SaaS Architecture",
];

const storyMoments: StoryMoment[] = [
  {
    phase: "01",
    title: "Command Setup",
    detail: "Launch the workforce operating layer with multi-entity structure, policy architecture, and role controls.",
    highlight: "Go-live foundation in weeks, not quarters",
  },
  {
    phase: "02",
    title: "AI Recruitment Flow",
    detail: "Activate marketplace hiring, smart shortlisting, interview intelligence, and offer automation from one system.",
    highlight: "Higher hiring velocity with controlled quality",
  },
  {
    phase: "03",
    title: "Payroll and Compliance Grid",
    detail: "Run payroll, statutory, and audit workflows with predictable precision and region-aware policy execution.",
    highlight: "Enterprise trust with lower manual overhead",
  },
  {
    phase: "04",
    title: "Global Brand Scale",
    detail: "Enable white-label themes, partner models, and international rollout playbooks while preserving governance.",
    highlight: "Premium brand continuity across markets",
  },
];

const pillars: Pillar[] = [
  {
    title: "Unified Core HR",
    description:
      "A single system for employee records, org structure, policy management, and lifecycle visibility.",
    icon: Building2,
  },
  {
    title: "Smart Attendance and Leave",
    description:
      "Flexible shifts, geo-fencing, policy-led leave logic, and real-time manager approvals.",
    icon: Users,
  },
  {
    title: "Payroll and Compliance Intelligence",
    description:
      "Automated payroll runs, statutory controls, anomaly checks, and audit-ready outputs.",
    icon: HandCoins,
  },
  {
    title: "Talent and Performance Cloud",
    description:
      "Hiring pipeline, onboarding journeys, OKRs, feedback, and appraisal orchestration in one flow.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Learning, Skills, and Careers",
    description:
      "Role-based learning paths, assessments, certifications, and progression analytics.",
    icon: GraduationCap,
  },
  {
    title: "International-Grade Trust Layer",
    description:
      "RBAC, MFA, SSO, encryption, audit logs, and enterprise governance for global operations.",
    icon: ShieldCheck,
  },
];

const personaProfiles: PersonaProfile[] = [
  {
    title: "For HR Leaders",
    description: "Run every people process from one command center.",
    points: ["Headcount and attrition visibility", "Policy automation", "Actionable people analytics"],
  },
  {
    title: "For Managers",
    description: "Approve, review, and coach teams without bottlenecks.",
    points: ["One-click approvals", "Goal and review tracking", "Team-level workforce insights"],
  },
  {
    title: "For Employees",
    description: "Self-service experiences across web and mobile.",
    points: ["Payslips and documents", "Leave, attendance, and claims", "Learning and growth journeys"],
  },
  {
    title: "For Finance and Ops",
    description: "Improve payroll accuracy and cost control at scale.",
    points: ["Payroll readiness dashboards", "Audit-ready compliance", "Forecasting and cost controls"],
  },
];

const automationPlays: AutomationPlay[] = [
  {
    title: "Candidate to Joiner in One Flow",
    steps: [
      "Auto-screen applicants and rank fit",
      "Schedule interviews and collect structured feedback",
      "Generate offer, trigger eSign, and start pre-boarding tasks",
    ],
  },
  {
    title: "Month-End Payroll on Autopilot",
    steps: [
      "Sync attendance, leave, and variable pay components",
      "Run compliance checks and anomaly detection",
      "Publish payslips and generate bank + statutory files",
    ],
  },
  {
    title: "Continuous Performance Loop",
    steps: [
      "Cascade goals by business priority",
      "Capture feedback and progress continuously",
      "Automate appraisal cycles, calibration, and recommendations",
    ],
  },
  {
    title: "Learning to Skills Conversion",
    steps: [
      "Detect role-wise skill gaps",
      "Assign personalized learning paths",
      "Issue verified certifications and update skill matrix",
    ],
  },
];

const pageVisuals: Record<string, PageVisual> = {
  home: {
    badge: "People Operations",
    title: "One Workspace for Every Workforce Journey",
    description:
      "A visual command layer for HR, managers, and employees to run people operations with clarity and speed.",
    src: "/visuals/home-workforce.svg",
    alt: "ADH home visual showing connected HR operations dashboards",
  },
  platform: {
    badge: "Platform Architecture",
    title: "Built as a Scalable, Composable Operating Layer",
    description:
      "Experience and intelligence layers orchestrated over resilient services for enterprise-grade performance.",
    src: "/visuals/platform-architecture.svg",
    alt: "Platform architecture visual with layered cloud services",
  },
  modules: {
    badge: "Unified Modules",
    title: "Connected Apps, Shared Data, Zero Process Silos",
    description:
      "From hiring and onboarding to payroll and performance, every module works from one integrated data model.",
    src: "/visuals/modules-suite.svg",
    alt: "HR modules visual showing interconnected workflows",
  },
  security: {
    badge: "Security and Compliance",
    title: "Trust Framework for Regulated, Global Operations",
    description:
      "Role controls, encrypted flows, and audit-ready governance to protect workforce and payroll data at scale.",
    src: "/visuals/security-shield.svg",
    alt: "Security visual with shield, lock, and compliance signals",
  },
  integrations: {
    badge: "Connected Ecosystem",
    title: "Plug ADH into Your Existing Business Stack",
    description:
      "Pre-built connectors, open APIs, and webhook automation for finance, productivity, and compliance systems.",
    src: "/visuals/integrations-network.svg",
    alt: "Integration visual showing connected systems and data flows",
  },
  pricing: {
    badge: "Pricing Experience",
    title: "Plans That Scale with Your Operational Maturity",
    description:
      "Start lean, expand confidently, and unlock deeper automation as your teams and regions grow.",
    src: "/visuals/pricing-growth.svg",
    alt: "Pricing visual with growth tiers and value progression",
  },
  roadmap: {
    badge: "Expansion Strategy",
    title: "A Phased Path to Global People Ops Leadership",
    description:
      "Delivery roadmap designed for adoption, automation depth, and international workforce governance.",
    src: "/visuals/roadmap-global.svg",
    alt: "Roadmap visual showing milestone-based global expansion",
  },
  faq: {
    badge: "Customer Enablement",
    title: "Clear Answers for Every Buying and Rollout Question",
    description:
      "Quick guidance for HR, IT, and finance teams evaluating implementation, controls, and scale readiness.",
    src: "/visuals/faq-support.svg",
    alt: "FAQ support visual with help center and guidance elements",
  },
  contact: {
    badge: "Consultative Demo",
    title: "Plan Your Rollout with Product and Domain Specialists",
    description:
      "Get a tailored walkthrough focused on your workflows, integrations, and business priorities.",
    src: "/visuals/contact-demo.svg",
    alt: "Contact visual showing strategy call and implementation planning",
  },
};
const layers: Layer[] = [
  {
    name: "Experience Cloud",
    subtitle: "Web, mobile, ESS, manager, admin",
    items: ["Role-first dashboards", "Mobile parity by design", "Fast and accessible interactions"],
  },
  {
    name: "AI Decision Layer",
    subtitle: "Prediction, scoring, and recommendations",
    items: ["Attrition signals", "Payroll anomaly intelligence", "Smart learning and talent insights"],
  },
  {
    name: "Process Services Layer",
    subtitle: "Lifecycle microservices from hire to retire",
    items: ["Event-driven orchestration", "Independent service scaling", "Domain-level reliability"],
  },
  {
    name: "Global Reliability Layer",
    subtitle: "Cloud-native infrastructure and control plane",
    items: ["PostgreSQL + Redis + Kafka", "Kubernetes auto-healing", "Multi-region resilience and DR"],
  },
];

const roadmap: RoadmapPhase[] = [
  {
    title: "Phase 1 - Experience Foundation",
    timeline: "Now",
    target: "Unified platform adoption in India and GCC-ready teams",
    focus: "Deliver seamless core HR, payroll, attendance, and AI-assisted hiring experiences.",
  },
  {
    title: "Phase 2 - Automation at Scale",
    timeline: "Next 12 Months",
    target: "Deep workflow automation and cross-function visibility",
    focus: "Expand AI assistants, mobile-first adoption, performance, learning, and engagement intelligence.",
  },
  {
    title: "Phase 3 - Multi-Country Expansion",
    timeline: "2027",
    target: "Regional compliance + multi-entity control plane",
    focus: "Launch country-specific payroll and compliance packs for major global hiring regions.",
  },
  {
    title: "Phase 4 - Category Leadership",
    timeline: "2028 and Beyond",
    target: "International brand trust with enterprise depth",
    focus: "Advance predictive workforce intelligence and board-grade analytics for global enterprises.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Can this platform support both fast-growing teams and large enterprises?",
    answer:
      "Yes. The architecture is multi-tenant and modular, so teams can start lean and scale into enterprise controls, advanced workflows, and custom integrations.",
  },
  {
    question: "What makes ADH different from legacy HR tools?",
    answer:
      "ADH combines employee experience, operational automation, and AI decision support in one platform instead of fragmented tools across departments.",
  },
  {
    question: "How quickly can we go live?",
    answer:
      "Most organizations launch core modules quickly with guided setup and migration support. Enterprise rollouts are phased by integrations and governance needs.",
  },
  {
    question: "Do you support compliance and international expansion?",
    answer:
      "Yes. ADH is built for multi-entity operations and offers region-specific compliance configurations with a roadmap for additional countries.",
  },
  {
    question: "Can employees and managers use it without heavy training?",
    answer:
      "Absolutely. The UX is role-first, mobile-ready, and designed for quick adoption, with contextual guidance and automated workflows reducing manual effort.",
  },
];

const footerNoticeRows = [
  "AKUL DRAVIN TECHNOLOGIES PVT. LTD. | CIN: U64990MH2023PLC399485 | IRDAI Registration: CA0871 | AMFI Registration: ARN-270149",
  "BEWARE OF SPURIOUS / FRAUD PHONE CALLS!",
];

const footerSubsidiaries = [
  "Akul Dravin Housing Finance Limited",
  "Akul Dravin Sun Life Insurance Company Limited",
  "Akul Dravin Health Insurance Company Limited",
  "Akul Dravin Money Limited",
  "Akul Dravin Sun Life Mutual Fund Limited",
  "Akul Dravin Sun Life Pension Fund Management Limited",
  "Akul Dravin Wellness Private Limited",
  "Akul Dravin Asset Reconstruction Company Limited",
  "Akul Dravin Capital Digital Limited",
];

const footerTabItems: Array<{ key: FooterTabKey; label: string }> = [
  { key: "company", label: "Company" },
  { key: "solutions", label: "Solutions" },
  { key: "tools", label: "Tools & Resources" },
  { key: "links", label: "Useful Links" },
];

const footerTabLinks: Record<FooterTabKey, FooterLinkItem[]> = {
  company: [
    { label: "About Us", to: "/pages/about-us" },
    { label: "Locate Us", to: "/pages/locate-us" },
    { label: "Press and Media", to: "/pages/press-media" },
    { label: "CSR and Sustainability", to: "/pages/csr-sustainability" },
    { label: "Investor Relations", to: "/pages/investor-relations" },
    { label: "Careers", to: "/careers" },
  ],
  solutions: [
    { label: "Core HR", to: "/pages/core-hr" },
    { label: "AI Payroll", to: "/pages/ai-payroll" },
    { label: "Smart Onboarding", to: "/pages/smart-onboarding" },
    { label: "Performance Management", to: "/pages/performance-management" },
    { label: "LMS + Certifications", to: "/pages/lms-certifications" },
    { label: "Gamification", to: "/pages/gamification" },
  ],
  tools: [
    { label: "Tax Calculators", to: "/pages/tax-calculators" },
    { label: "Policy Templates", to: "/pages/policy-templates" },
    { label: "HR Glossary", to: "/pages/hr-glossary" },
    { label: "Salary Benchmark Reports", to: "/pages/salary-benchmark-reports" },
    { label: "API Docs", to: "/pages/api-docs" },
    { label: "Developer Sandbox", to: "/pages/developer-sandbox" },
  ],
  links: [
    { label: "Privacy Policy", to: "/pages/privacy-policy" },
    { label: "Terms of Use", to: "/pages/terms-of-use" },
    { label: "Security Center", to: "/pages/security-center" },
    { label: "Customer Support", to: "/pages/customer-support" },
    { label: "Data Processing Addendum", to: "/pages/data-processing-addendum" },
    { label: "Compliance Dashboard", to: "/pages/compliance-dashboard" },
  ],
};

const contentCategoryVisuals: Record<ContentCategory, PageVisual> = {
  company: {
    badge: "Company",
    title: "Institutional Foundations for Long-Term Trust",
    description:
      "Explore governance, corporate profile, investor communication, and strategic direction of ADH.",
    src: "/visuals/company-governance.svg",
    alt: "Company governance visual with enterprise leadership context",
  },
  solutions: {
    badge: "Solutions",
    title: "Workflow Solutions Designed for Operational Excellence",
    description:
      "Solution pages covering execution models for hiring, payroll, performance, learning, and engagement.",
    src: "/visuals/solutions-engine.svg",
    alt: "Solutions visual showing connected workflow systems",
  },
  tools: {
    badge: "Tools and Resources",
    title: "Decision Support for HR, Finance, and IT Teams",
    description:
      "Calculators, templates, benchmarks, and developer resources to accelerate implementation quality.",
    src: "/visuals/tools-hub.svg",
    alt: "Tools hub visual with calculators, templates, and documentation",
  },
  links: {
    badge: "Legal and Support",
    title: "Transparent Policies and Customer Trust Framework",
    description:
      "Review platform policies, support commitments, data processing controls, and compliance assurance.",
    src: "/visuals/legal-trust.svg",
    alt: "Legal and compliance visual for trust center and policy pages",
  },
};

const contentPages: Record<string, ContentPage> = {
  "about-us": buildContentPage("company", "about-us", "About Us"),
  "locate-us": buildContentPage("company", "locate-us", "Locate Us"),
  "press-media": buildContentPage("company", "press-media", "Press and Media"),
  "csr-sustainability": buildContentPage("company", "csr-sustainability", "CSR and Sustainability"),
  "investor-relations": buildContentPage("company", "investor-relations", "Investor Relations"),
  "core-hr": buildContentPage("solutions", "core-hr", "Core HR"),
  "ai-payroll": buildContentPage("solutions", "ai-payroll", "AI Payroll"),
  "smart-onboarding": buildContentPage("solutions", "smart-onboarding", "Smart Onboarding"),
  "performance-management": buildContentPage("solutions", "performance-management", "Performance Management"),
  "lms-certifications": buildContentPage("solutions", "lms-certifications", "LMS + Certifications"),
  gamification: buildContentPage("solutions", "gamification", "Gamification"),
  "tax-calculators": buildContentPage("tools", "tax-calculators", "Tax Calculators"),
  "policy-templates": buildContentPage("tools", "policy-templates", "Policy Templates"),
  "hr-glossary": buildContentPage("tools", "hr-glossary", "HR Glossary"),
  "salary-benchmark-reports": buildContentPage("tools", "salary-benchmark-reports", "Salary Benchmark Reports"),
  "api-docs": buildContentPage("tools", "api-docs", "API Docs"),
  "developer-sandbox": buildContentPage("tools", "developer-sandbox", "Developer Sandbox"),
  "privacy-policy": buildContentPage("links", "privacy-policy", "Privacy Policy"),
  "terms-of-use": buildContentPage("links", "terms-of-use", "Terms of Use"),
  "security-center": buildContentPage("links", "security-center", "Security Center"),
  "customer-support": buildContentPage("links", "customer-support", "Customer Support"),
  "data-processing-addendum": buildContentPage("links", "data-processing-addendum", "Data Processing Addendum"),
  "compliance-dashboard": buildContentPage("links", "compliance-dashboard", "Compliance Dashboard"),
};

function buildContentPage(category: ContentCategory, slug: string, label: string): ContentPage {
  const categoryCopy: Record<
    ContentCategory,
    { kicker: string; titleSuffix: string; leadTemplate: string; ctaLabel: string; ctaTo: string }
  > = {
    company: {
      kicker: "Company Information",
      titleSuffix: "Corporate Context",
      leadTemplate:
        "Review how ADH approaches {label} with enterprise discipline, transparent governance, and long-term execution focus.",
      ctaLabel: "Talk to Corporate Team",
      ctaTo: "/contact",
    },
    solutions: {
      kicker: "Solution Detail",
      titleSuffix: "Implementation Model",
      leadTemplate:
        "Explore how ADH delivers {label} through automation-first workflows, role-specific UX, and measurable business outcomes.",
      ctaLabel: "Schedule Solution Walkthrough",
      ctaTo: "/contact",
    },
    tools: {
      kicker: "Tools and Resources",
      titleSuffix: "Enablement Hub",
      leadTemplate:
        "Use ADH {label} resources to accelerate implementation planning, operational decisions, and cross-team alignment.",
      ctaLabel: "Access Platform Demo",
      ctaTo: "/contact",
    },
    links: {
      kicker: "Policy and Trust",
      titleSuffix: "Compliance Reference",
      leadTemplate:
        "Read ADH {label} details for policy clarity, legal transparency, and customer confidence at enterprise scale.",
      ctaLabel: "Contact Trust Office",
      ctaTo: "/contact",
    },
  };

  const sectionMap: Record<ContentCategory, ContentPageSection[]> = {
    company: [
      {
        heading: "Institutional Overview",
        description: "Understand how {label} fits within ADH's corporate and market strategy.",
        points: [
          "Leadership priorities aligned to long-term category growth",
          "Operational governance models across business and product functions",
          "Global expansion readiness with India-first execution rigor",
        ],
      },
      {
        heading: "Operating Structure",
        description: "Execution structure and ownership model for {label} initiatives.",
        points: [
          "Cross-functional ownership across product, finance, legal, and operations",
          "Documented review cadence and escalation framework",
          "Investor and stakeholder communication standards",
        ],
      },
      {
        heading: "Business Confidence",
        description: "How ADH converts {label} into measurable business confidence.",
        points: [
          "Clear reporting lines and decision accountability",
          "Program-level milestones with periodic performance tracking",
          "Enterprise-grade documentation and audit traceability",
        ],
      },
    ],
    solutions: [
      {
        heading: "Solution Scope",
        description: "Core workflow boundaries and capability coverage for {label}.",
        points: [
          "Role-based experience for HR, managers, finance, and employees",
          "Workflow automation mapped to operational SLAs",
          "Configurable controls for policy and approval governance",
        ],
      },
      {
        heading: "Deployment Model",
        description: "How ADH enables fast, controlled rollout for {label}.",
        points: [
          "Guided implementation templates and migration runbooks",
          "Integrations with payroll, communication, and document systems",
          "Sandbox-first validation before production release",
        ],
      },
      {
        heading: "Outcome Metrics",
        description: "Expected impact benchmarks from a mature {label} rollout.",
        points: [
          "Reduction in manual processing effort and cycle time",
          "Higher data consistency across connected HR workflows",
          "Improved user adoption with mobile-ready interfaces",
        ],
      },
    ],
    tools: [
      {
        heading: "Toolkit Coverage",
        description: "What teams can solve using {label} resources.",
        points: [
          "Decision support for HR, finance, and compliance owners",
          "Reusable frameworks for faster setup and onboarding",
          "Data-backed inputs for operational planning",
        ],
      },
      {
        heading: "How to Use",
        description: "Recommended usage model for maximum value from {label}.",
        points: [
          "Embed tools within rollout and governance checklists",
          "Align outputs with stakeholder review cadences",
          "Use resource library as a single source of process truth",
        ],
      },
      {
        heading: "Execution Impact",
        description: "Business impact outcomes enabled by {label} adoption.",
        points: [
          "Faster policy and process standardization",
          "Higher quality implementation decisions",
          "Lower rework across multi-team project execution",
        ],
      },
    ],
    links: [
      {
        heading: "Policy Context",
        description: "Why {label} matters for enterprise trust and governance.",
        points: [
          "Explicit policy boundaries for platform usage and data handling",
          "Defined customer rights and processing obligations",
          "Alignment with internal and regulatory compliance controls",
        ],
      },
      {
        heading: "Control Mechanisms",
        description: "Operational controls that enforce {label} across ADH systems.",
        points: [
          "Auditability across platform actions and access changes",
          "Security checkpoints mapped to risk categories",
          "Versioned documentation with review ownership",
        ],
      },
      {
        heading: "Customer Assurance",
        description: "How ADH communicates and maintains {label} commitments.",
        points: [
          "Transparent support and escalation channels",
          "Structured compliance reporting and periodic updates",
          "Clear response protocols for policy and security requests",
        ],
      },
    ],
  };

  const copy = categoryCopy[category];
  const sections = sectionMap[category].map((section) => ({
    heading: section.heading,
    description: section.description.replace("{label}", label),
    points: section.points.map((point) => point.replace("{label}", label)),
  }));

  return {
    slug,
    category,
    label,
    kicker: copy.kicker,
    title: `${label} - ${copy.titleSuffix}`,
    lead: copy.leadTemplate.replace("{label}", label),
    sections,
    ctaLabel: copy.ctaLabel,
    ctaTo: copy.ctaTo,
  };
}
const routeSeo: Record<string, SeoMeta> = {
  "/": {
    title: "People Operations Platform for Global Teams",
    description:
      "ADH unifies core HR, payroll, attendance, talent, and analytics into one premium people operations platform for modern global teams.",
  },
  "/platform": {
    title: "Platform Experience and Architecture",
    description:
      "Explore ADH modules, AI workflow orchestration, and scalable architecture for international workforce operations.",
  },
  "/modules": {
    title: "HR Modules and Workflows",
    description:
      "Discover every HR workflow from hiring and onboarding to payroll, performance, learning, and employee engagement.",
  },
  "/security": {
    title: "Security, Compliance, and Integrations",
    description:
      "Review enterprise security controls, compliance posture, DR standards, and integration ecosystem for ADH.",
  },
  "/integrations": {
    title: "Integration Ecosystem and API Platform",
    description:
      "Connect ADH with ERP, communication, identity, and payroll systems through connectors, APIs, and webhooks.",
  },
  "/pricing": {
    title: "Flexible Pricing Plans",
    description:
      "Transparent PEPM pricing with Starter, Growth, and Enterprise plans designed for teams at every maturity stage.",
  },
  "/roadmap": {
    title: "Product and Expansion Roadmap",
    description:
      "See ADH's roadmap from experience foundation to multi-country expansion and category leadership.",
  },
  "/faq": {
    title: "Frequently Asked Questions - ADH",
    description:
      "Answers on implementation, pricing, security, compliance, integrations, and global scale readiness.",
  },
  "/contact": {
    title: "Talk to Product and Sales",
    description:
      "Request a guided demo and discuss rollout, migration, integrations, and global operations strategy.",
  },
};

function resolveSeoMeta(pathname: string): SeoMeta {
  if (pathname.startsWith("/pages/")) {
    const slug = pathname.replace("/pages/", "");
    const page = contentPages[slug];
    if (page) {
      return {
        title: `${page.label} | ${page.kicker}`,
        description: page.lead,
      };
    }
  }

  return routeSeo[pathname] ?? {
    title: "ADH People Platform",
    description:
      "ADH is an AI-powered people operations platform built for modern, high-growth, and enterprise workforce teams.",
  };
}

function upsertMetaTag(attr: "name" | "property", key: string, value: string) {
  let element = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
}

function upsertCanonicalLink(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function buildAbsoluteUrl(pathname: string): string {
  const configuredBase = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  const base = configuredBase && configuredBase.length > 0
    ? configuredBase.replace(/\/+$/, "")
    : window.location.origin;
  return `${base}${pathname}`;
}

async function submitContactLead(values: ContactFormValues) {
  const response = await fetch("/api/contact/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<{ leadId: string }> | null;
  if (!response.ok || !payload || !payload.ok || !payload.data) {
    throw new Error(payload?.error ?? "Unable to submit request. Please try again.");
  }

  return payload.data;
}

function PageVisualSection({
  visual,
  reverse = false,
}: {
  visual: PageVisual;
  reverse?: boolean;
}) {
  return (
    <section className="section visual-band">
      <article className={`visual-panel ${reverse ? "reverse" : ""} reveal-up`}>
        <figure className="visual-art">
          <img src={visual.src} alt={visual.alt} loading="lazy" decoding="async" />
        </figure>
        <div className="visual-copy">
          <p className="kicker">{visual.badge}</p>
          <h2>{visual.title}</h2>
          <p>{visual.description}</p>
        </div>
      </article>
    </section>
  );
}
function HomePage() {
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        setParallaxY(window.scrollY || 0);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  const stageBackShift = Math.min(84, parallaxY * 0.13);
  const stageMidShift = Math.min(62, parallaxY * 0.09);
  const stageFrontShift = Math.min(44, parallaxY * 0.06);
  const glowLift = Math.min(96, parallaxY * 0.11);

  return (
    <div className="page-wrap">
      <section className="hero">
        <p className="eyebrow">
          <Sparkles size={14} /> Hyper AI Workforce Ecosystem | Global SaaS | White Label | Enterprise Cloud
        </p>
        <h1>
          Build an International Workforce Brand on
          <span> One Premium AI Operating System</span>
        </h1>
        <p className="hero-copy">
          ADH unifies HRMS, recruitment, recruiter marketplace, and workforce intelligence into one
          high-performance platform designed for modern global organizations.
        </p>
        <div className="hero-actions">
          <NavLink to="/contact" className="btn btn-primary">Book a Personalized Demo</NavLink>
          <NavLink to="/platform" className="btn btn-secondary">Explore Product Experience</NavLink>
        </div>
        <div className="hero-notes">
          <span>
            <BadgeCheck size={16} /> Rapid implementation with guided setup
          </span>
          <span>
            <Building2 size={16} /> Built for SMB, mid-market, and enterprise
          </span>
          <span>
            <Users size={16} /> Employee-first UX with manager productivity
          </span>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="section cinematic-intro">
        <article className="cinematic-surface reveal-up">
          <p className="kicker">Premium Motion Narrative</p>
          <h2>Scroll from boardroom strategy to workforce execution in one continuous story</h2>
          <p>
            Every block is designed as an intentional narrative layer so buyers feel product depth,
            implementation confidence, and global brand maturity while exploring.
          </p>
          <div className="cinematic-track" aria-hidden="true">
            <span />
            <small>Scroll to Experience</small>
          </div>
        </article>
      </section>

      <section className="section hero-cinema-stage" aria-label="Cinematic product storytelling">
        <div className="cinema-stage-frame reveal-up">
          <div className="cinema-glow" style={{ transform: `translate3d(0, ${-glowLift}px, 0)` }} aria-hidden="true" />

          <article className="cinema-layer cinema-layer-back" style={{ transform: `translate3d(0, ${stageBackShift}px, 0)` }}>
            <span className="cinema-chip">Global Command Layer</span>
            <h3>Board-Level Workforce Visibility</h3>
            <p>Monitor hiring demand, payroll exposure, attrition signals, and expansion readiness from one lens.</p>
          </article>

          <article className="cinema-layer cinema-layer-mid" style={{ transform: `translate3d(0, ${stageMidShift}px, 0)` }}>
            <span className="cinema-chip">AI Operations</span>
            <h3>Automations That Scale with Brand Ambition</h3>
            <p>Run recruitment, HR operations, and compliance journeys with premium UX and measurable outcomes.</p>
          </article>

          <article className="cinema-layer cinema-layer-front" style={{ transform: `translate3d(0, ${stageFrontShift}px, 0)` }}>
            <span className="cinema-chip">White Label Ready</span>
            <h3>Partner-Grade Experience on Every Screen</h3>
            <p>Deliver consistent enterprise-quality identity across regions, devices, and customer segments.</p>
          </article>
        </div>
      </section>

      <section className="section brand-proof" aria-label="Global brand confidence signals">
        <div className="section-head">
          <p className="kicker">International Brand Signals</p>
          <h2>Enterprise credibility, premium execution, and global growth readiness</h2>
          <p>
            Designed to look and operate like a world-class workforce platform with strong governance,
            AI depth, and market-ready expansion controls.
          </p>
        </div>
        <div className="proof-grid">
          {globalSignals.map((signal, index) => (
            <article key={signal.label} className="proof-card reveal-up" style={{ animationDelay: `${index * 60}ms` }}>
              <strong>{signal.value}</strong>
              <p>{signal.label}</p>
            </article>
          ))}
        </div>
        <div className="proof-ribbon">
          {trustSignals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </section>

      <PageVisualSection visual={pageVisuals.home} />

      <section className="metrics" aria-label="Key metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card reveal-up">
            <p>{metric.label}</p>
            <h3>{metric.value}</h3>
            <small>{metric.note}</small>
          </article>
        ))}
      </section>

      <section className="section story-section" aria-label="Workforce transformation storyline">
        <div className="section-head">
          <p className="kicker">Scroll Storytelling</p>
          <h2>The premium workforce transformation journey</h2>
          <p>
            A clear, stage-wise narrative that mirrors how modern companies move from fragmented tools
            to an AI-first workforce ecosystem.
          </p>
        </div>
        <div className="story-grid">
          {storyMoments.map((moment, index) => (
            <article key={moment.title} className="story-card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <span className="story-phase">{moment.phase}</span>
              <h3>{moment.title}</h3>
              <p>{moment.detail}</p>
              <strong>{moment.highlight}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Why ADH</p>
          <h2>One platform for every critical people workflow</h2>
          <p>
            Replace disconnected HR tools with a single operating layer that combines daily execution,
            automation, and leadership visibility.
          </p>
        </div>
        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="pillar-card reveal-up">
              <pillar.icon size={20} />
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Built for Every Stakeholder</p>
          <h2>Designed for HR, managers, employees, and operations teams</h2>
          <p>
            ADH adapts to each role with dedicated views, workflows, and insights while keeping data and
            decisions fully aligned.
          </p>
        </div>
        <div className="persona-grid">
          {personaProfiles.map((profile, index) => (
            <article key={profile.title} className="persona-card reveal-up" style={{ animationDelay: `${index * 70}ms` }}>
              <h3>{profile.title}</h3>
              <p>{profile.description}</p>
              <ul>
                {profile.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Automation Blueprints</p>
          <h2>From repetitive work to intelligent workflows</h2>
          <p>
            Deploy proven automation journeys for recruiting, payroll, performance, and learning with
            minimal operational overhead.
          </p>
        </div>
        <div className="automation-grid">
          {automationPlays.map((play, index) => (
            <article key={play.title} className="automation-card reveal-up" style={{ animationDelay: `${index * 70}ms` }}>
              <h3>{play.title}</h3>
              <ol>
                {play.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlatformPage() {
  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Platform Experience</p>
        <h1>A complete people operations cloud, built for scale</h1>
        <p className="lead">
          ADH delivers a connected experience across employee lifecycle workflows with enterprise controls
          and consumer-grade usability.
        </p>
      </section>

      <PageVisualSection visual={pageVisuals.platform} />

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Architecture</p>
          <h2>Engineered for speed, resilience, and global growth</h2>
          <p>
            Each layer is independently scalable and tightly integrated so your teams can move faster
            without compromising governance.
          </p>
        </div>
        <div className="layer-grid">
          {layers.map((layer, index) => (
            <article key={layer.name} className="layer-card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <h3>{layer.name}</h3>
              <p>{layer.subtitle}</p>
              <ul>
                {layer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Capability Stack</p>
          <h2>Everything teams need from hire to retire</h2>
          <p>
            A unified module architecture means fewer tool handoffs, cleaner data, and faster execution at
            every stage.
          </p>
        </div>
        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="pillar-card reveal-up">
              <pillar.icon size={20} />
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Execution Playbooks</p>
          <h2>Pre-defined automation flows for real HR outcomes</h2>
          <p>
            Activate high-impact operational playbooks to reduce manual work, improve turnaround times,
            and standardize delivery quality.
          </p>
        </div>
        <div className="automation-grid">
          {automationPlays.map((play, index) => (
            <article key={play.title} className="automation-card reveal-up" style={{ animationDelay: `${index * 60}ms` }}>
              <h3>{play.title}</h3>
              <ol>
                {play.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModulesPage() {
  const modules = [
    {
      title: "Recruitment and Hiring",
      description: "Source, screen, interview, and offer from one structured talent pipeline.",
      icon: UserRoundSearch,
      highlights: ["AI resume matching", "Interview orchestration", "Offer and eSign workflow"],
    },
    {
      title: "Smart Onboarding",
      description: "Create exceptional Day-0 to Day-90 experiences with automation-first onboarding.",
      icon: Users,
      highlights: ["Digital document collection", "Task and access automation", "Milestone journey tracking"],
    },
    {
      title: "Payroll and Statutory",
      description: "Run accurate payroll with built-in compliance and audit-ready outputs.",
      icon: HandCoins,
      highlights: ["Multi-component salary engine", "Compliance and deduction rules", "Bank and challan output"],
    },
    {
      title: "Performance and Goals",
      description: "Drive continuous performance with clear goals, feedback loops, and appraisal cycles.",
      icon: ChartNoAxesCombined,
      highlights: ["OKR + KPI tracking", "360 feedback collection", "Calibration and development plans"],
    },
    {
      title: "Learning and Skill Growth",
      description: "Develop role-based capabilities with personalized learning journeys.",
      icon: GraduationCap,
      highlights: ["Skill-gap intelligence", "Adaptive learning paths", "Certification and skill tracking"],
    },
    {
      title: "Engagement and Recognition",
      description: "Improve culture and productivity with social recognition and gamified progression.",
      icon: BadgeCheck,
      highlights: ["Recognition wall", "Levels and rewards", "Engagement analytics"],
    },
    {
      title: "Global Workforce Controls",
      description: "Manage entities, locations, and policies with centralized governance controls.",
      icon: Globe2,
      highlights: ["Multi-entity setup", "Policy and workflow templates", "Location-aware configurations"],
    },
    {
      title: "Document and Compliance Hub",
      description: "Centralize employee documents, eSign workflows, and compliance evidence trails.",
      icon: ShieldCheck,
      highlights: ["Template-based document lifecycle", "Bulk send and signature requests", "Tamper-proof audit trail"],
    },
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Modules</p>
        <h1>Modular by design, unified in experience</h1>
        <p className="lead">
          Choose the modules you need today and expand as your organization scales, while keeping one
          connected data and workflow foundation.
        </p>
      </section>

      <PageVisualSection visual={pageVisuals.modules} reverse />

      <section className="section">
        <div className="module-grid">
          {modules.map((module, index) => (
            <article key={module.title} className="module-card reveal-up" style={{ animationDelay: `${index * 55}ms` }}>
              <module.icon size={20} />
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <ul>
                {module.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="special-card">
          <h2>ADH Global Command Center</h2>
          <p>
            Control workflows, approvals, people analytics, and compliance posture from one premium
            operations cockpit built for international workforce teams.
          </p>
          <div className="special-points">
            <span>Role-based operational dashboards</span>
            <span>Cross-functional workflow orchestration</span>
            <span>Leadership-ready workforce insights</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function SecurityPage() {
  const securityAreas = [
    {
      title: "Identity and Access Governance",
      description: "Granular access architecture for secure enterprise collaboration.",
      controls: ["Custom RBAC matrices", "MFA, SSO, and session intelligence", "IP policies and delegated admin controls"],
    },
    {
      title: "Data Protection and Privacy",
      description: "Secure data controls across employee records, payroll, and documents.",
      controls: ["Encryption at rest and in transit", "Field-level protection for sensitive data", "Controlled storage access with signed URLs"],
    },
    {
      title: "Compliance and Audit Readiness",
      description: "Operational controls for internal governance and external audits.",
      controls: ["Immutable activity logs", "Data residency and retention controls", "Workflow support for DPDP and GDPR rights"],
    },
  ];

  const integrations = [
    { title: "Finance and ERP", items: ["Tally", "Zoho Books", "QuickBooks", "SAP B1", "NetSuite"] },
    { title: "Communication", items: ["Google Workspace", "Microsoft 365", "Teams", "Slack", "WhatsApp"] },
    { title: "Verification and eSign", items: ["IDfy", "AuthBridge", "DocuSign", "Aadhaar eSign"] },
    { title: "Banking and Payments", items: ["HDFC", "ICICI", "SBI", "Razorpay", "Cashfree"] },
    { title: "Learning Ecosystem", items: ["Coursera", "LinkedIn Learning", "Udemy Business", "Pluralsight"] },
    { title: "Govt and Statutory", items: ["EPFO", "ESIC", "MCA21", "DigiLocker", "Aadhaar UIDAI"] },
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Security and Integrations</p>
        <h1>Enterprise-grade trust with open ecosystem connectivity</h1>
        <p className="lead">
          ADH combines modern security posture, compliance-focused controls, and deep integration
          flexibility for high-growth and enterprise environments.
        </p>
      </section>

      <PageVisualSection visual={pageVisuals.security} />

      <section className="section">
        <div className="security-grid">
          {securityAreas.map((area, index) => (
            <article key={area.title} className="security-card reveal-up" style={{ animationDelay: `${index * 85}ms` }}>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
              <ul>
                {area.controls.map((control) => (
                  <li key={control}>{control}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="compliance-strip">
          <span>99.99% enterprise uptime target</span>
          <span>RTO under 1 hour</span>
          <span>RPO under 15 minutes</span>
          <span>Continuous backup and DR readiness</span>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Integrations</p>
          <h2>Connect ADH with your existing business stack</h2>
          <p>Deploy quickly with pre-built connectors and extend deeply with APIs and webhooks.</p>
        </div>
        <div className="integration-grid">
          {integrations.map((group, index) => (
            <article key={group.title} className="integration-card reveal-up" style={{ animationDelay: `${index * 60}ms` }}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function IntegrationsPage() {
  const integrationClusters = [
    {
      title: "Enterprise Systems",
      description: "Finance, ERP, and business systems connected through secure sync frameworks.",
      items: ["Tally Prime", "SAP Business One", "Oracle NetSuite", "Zoho Books", "QuickBooks"],
    },
    {
      title: "Collaboration and Identity",
      description: "Unify communication and access layers for frictionless employee operations.",
      items: ["Google Workspace", "Microsoft 365", "Slack", "Okta", "Azure AD"],
    },
    {
      title: "Hiring and Verification",
      description: "Automate candidate pipelines and trust checks across background partners.",
      items: ["LinkedIn Jobs", "Indeed", "Naukri", "IDfy", "AuthBridge"],
    },
    {
      title: "Payroll and Banking",
      description: "Execute payroll disbursement and statutory flows with reliable financial integrations.",
      items: ["HDFC APIs", "ICICI APIs", "SBI Corporate APIs", "Razorpay", "Cashfree"],
    },
    {
      title: "Learning and Productivity",
      description: "Connect external learning providers and productivity suites into one HR journey.",
      items: ["Coursera", "LinkedIn Learning", "Udemy Business", "Zoom", "Microsoft Teams"],
    },
    {
      title: "Government and Compliance",
      description: "Built-in connectors for statutory submissions and identity verifications.",
      items: ["EPFO", "ESIC", "MCA21", "DigiLocker", "Aadhaar UIDAI"],
    },
  ];

  const apiCapabilities = [
    "REST and GraphQL APIs with versioning",
    "OAuth 2.0 with scoped tokens",
    "Webhook events for real-time sync",
    "Rate limiting by plan tier",
    "Developer sandbox with sample payloads",
    "SDKs for Node.js, Python, and PHP",
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Integrations</p>
        <h1>Connect every people workflow with your business ecosystem</h1>
        <p className="lead">
          ADH provides connector-ready architecture with API-first controls so teams can integrate once and
          scale across departments, entities, and geographies.
        </p>
      </section>

      <PageVisualSection visual={pageVisuals.integrations} reverse />

      <section className="section">
        <div className="section-head">
          <p className="kicker">Connector Library</p>
          <h2>Pre-built integrations for high-velocity implementation</h2>
          <p>
            Launch fast with commonly used business integrations and govern data exchange through a
            centralized integration strategy.
          </p>
        </div>
        <div className="integration-grid">
          {integrationClusters.map((cluster, index) => (
            <article key={cluster.title} className="integration-card reveal-up" style={{ animationDelay: `${index * 60}ms` }}>
              <h3>{cluster.title}</h3>
              <p>{cluster.description}</p>
              <ul>
                {cluster.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="special-card">
          <h2>Developer Platform for Enterprise Extensions</h2>
          <p>
            Build advanced workflows, custom dashboards, and real-time automations with robust API and
            webhook tooling built for production reliability.
          </p>
          <div className="special-points">
            {apiCapabilities.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

type PricingCatKey = "hrms" | "recruitment" | "recruiter" | "combined" | "white-label";

type V11Plan = {
  title: string;
  price: string;
  priceNote: string;
  badge?: string;
  features: string[];
  cta: string;
};

type V11PricingCategory = {
  key: PricingCatKey;
  label: string;
  icon: string;
  description: string;
  plans: V11Plan[];
};

const v11PricingCategories: V11PricingCategory[] = [
  {
    key: "hrms",
    label: "HRMS",
    icon: "HR",
    description: "Plans for core HR operations, attendance, leave, payroll, and employee lifecycle.",
    plans: [
      {
        title: "HR Starter",
        price: "INR 999",
        priceNote: "per month",
        features: ["25 employees", "Attendance", "Leave management", "Employee profiles", "Basic reports"],
        cta: "Choose Starter",
      },
      {
        title: "HR Growth",
        price: "INR 2,999",
        priceNote: "per month",
        badge: "Popular",
        features: ["100 employees", "Multi-branch", "Payroll", "Performance", "Analytics"],
        cta: "Choose Growth",
      },
      {
        title: "HR Enterprise",
        price: "INR 7,999",
        priceNote: "per month",
        features: ["Unlimited employees", "AI HR assistant", "Advanced payroll", "API access", "Custom workflows"],
        cta: "Choose Enterprise",
      },
    ],
  },
  {
    key: "recruitment",
    label: "Recruitment",
    icon: "AT",
    description: "ATS and job platform plans for hiring automation and talent pipelines.",
    plans: [
      {
        title: "Recruit Starter",
        price: "INR 1,499",
        priceNote: "per month",
        features: ["10 job posts", "Applications", "Resume DB", "Interview scheduling", "Basic analytics"],
        cta: "Choose Starter",
      },
      {
        title: "Recruit Pro",
        price: "INR 3,999",
        priceNote: "per month",
        badge: "Most Popular",
        features: ["50 job posts", "AI parser", "Candidate pipeline", "Advanced filters", "Analytics"],
        cta: "Choose Pro",
      },
      {
        title: "Recruit Enterprise",
        price: "INR 9,999",
        priceNote: "per month",
        features: ["Unlimited jobs", "AI matching", "Video interviews", "Talent pool", "Advanced analytics"],
        cta: "Choose Enterprise",
      },
    ],
  },
  {
    key: "recruiter",
    label: "Recruiter",
    icon: "RC",
    description: "Marketplace plans for agency, freelance, and partner recruiters.",
    plans: [
      {
        title: "Recruiter Starter",
        price: "INR 999",
        priceNote: "per month",
        features: ["10 job posts", "Candidate database", "Basic dashboard"],
        cta: "Start Recruiting",
      },
      {
        title: "Recruiter Pro",
        price: "INR 2,999",
        priceNote: "per month",
        badge: "Recommended",
        features: ["50 job posts", "Candidate search", "Interview scheduling", "Hiring analytics"],
        cta: "Upgrade to Pro",
      },
      {
        title: "Recruiter Enterprise",
        price: "INR 7,999",
        priceNote: "per month",
        features: ["Unlimited jobs", "AI matching", "Marketplace access", "Commission earning"],
        cta: "Go Enterprise",
      },
    ],
  },
  {
    key: "combined",
    label: "Combined",
    icon: "CB",
    description: "All-in-one plans combining HRMS and recruitment modules.",
    plans: [
      {
        title: "Professional",
        price: "INR 4,999",
        priceNote: "per month",
        features: ["100 employees", "30 job posts", "Payroll", "Mobile app", "HR + ATS"],
        cta: "Choose Professional",
      },
      {
        title: "Corporate",
        price: "INR 9,999",
        priceNote: "per month",
        badge: "Best Value",
        features: ["500 employees", "Unlimited jobs", "AI HR", "AI recruitment", "Workforce analytics"],
        cta: "Choose Corporate",
      },
      {
        title: "Global Enterprise",
        price: "INR 19,999",
        priceNote: "per month",
        features: ["Unlimited", "White-label option", "Full API", "Dedicated support", "AI workforce intelligence"],
        cta: "Contact Sales",
      },
    ],
  },
  {
    key: "white-label",
    label: "White Label",
    icon: "WL",
    description: "Partner plans to rebrand and resell the platform globally.",
    plans: [
      {
        title: "WL Basic",
        price: "INR 25,000",
        priceNote: "per month",
        features: ["Custom branding", "Client management", "HRMS reselling"],
        cta: "Start Partnering",
      },
      {
        title: "WL Pro",
        price: "INR 50,000",
        priceNote: "per month",
        badge: "Partner Favorite",
        features: ["Custom domain", "Pricing control", "Client dashboard", "Recruitment marketplace"],
        cta: "Choose Pro",
      },
      {
        title: "WL Global",
        price: "INR 100,000",
        priceNote: "per month",
        features: ["Full platform branding", "API access", "Unlimited clients", "Revenue dashboard"],
        cta: "Go Global",
      },
    ],
  },
];

const v11AddOns: Array<{ name: string; price: string; desc: string }> = [
  { name: "AI HR Assistant", price: "INR 499/mo", desc: "AI chatbot for policy, leave, and payroll support." },
  { name: "WhatsApp Notifications", price: "INR 299/mo", desc: "Official WhatsApp updates for approvals and alerts." },
  { name: "Biometric Integration", price: "INR 999/mo", desc: "Fingerprint and face hardware device integration." },
  { name: "Advanced Recruitment AI", price: "INR 999/mo", desc: "Smart matching, auto-scoring, and shortlist recommendations." },
  { name: "Custom Reports", price: "INR 499/mo", desc: "Build and export custom analytics dashboards." },
];
function PricingPage() {
  const [activeCat, setActiveCat] = useState<PricingCatKey>("hrms");

  const cat = v11PricingCategories.find((c) => c.key === activeCat)!;

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Pricing</p>
        <h1>Simple, transparent pricing for every team</h1>
        <p className="lead">
          Choose from 5 plan categories — HRMS, Recruitment, Recruiter, Combined, or White Label.
          India-first pricing with global deployment.
        </p>
      </section>

      {/* Category Tabs */}
      <section className="section" style={{ paddingTop: "2rem", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "2.5rem" }}>
          {v11PricingCategories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              style={{
                padding: "0.55rem 1.2rem",
                borderRadius: 999,
                border: activeCat === c.key ? "1.5px solid var(--clr-gold, #d2ae52)" : "1.5px solid var(--clr-border, #2a3a52)",
                background: activeCat === c.key ? "rgba(210,174,82,0.12)" : "transparent",
                color: activeCat === c.key ? "var(--clr-gold, #d2ae52)" : "var(--clr-text-dim, #8ba0b8)",
                fontWeight: activeCat === c.key ? 700 : 400,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "var(--clr-text-dim, #8ba0b8)", fontSize: "0.9rem", marginBottom: "2.5rem" }}>
          {cat.description}
        </p>

        <div className="pricing-grid">
          {cat.plans.map((plan) => (
            <article key={plan.title} className={`pricing-card ${plan.badge ? "featured" : ""} reveal-up`}>
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <h3>{plan.title}</h3>
              <p className="price">
                {plan.price}
                <span>{plan.priceNote}</span>
              </p>
              <p className="audience" style={{ minHeight: 0 }}></p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <NavLink to="/contact" className="btn btn-secondary">{plan.cta}</NavLink>
            </article>
          ))}
        </div>
      </section>

      {/* Add-Ons */}
      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Add-Ons</p>
          <h2>Supercharge any plan with premium add-ons</h2>
          <p>Purchase individual features without upgrading your entire plan.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {v11AddOns.map((addon) => (
            <div key={addon.name} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 12,
              padding: "1.1rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--clr-text, #e8f0ff)" }}>{addon.name}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--clr-gold, #d2ae52)", whiteSpace: "nowrap", marginLeft: 8 }}>{addon.price}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{addon.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Model Summary */}
      <section className="section">
        <div className="section-head">
          <p className="kicker">Revenue Model</p>
          <h2>Multiple revenue streams, one unified platform</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Subscription Plans", pct: "60%", desc: "Monthly/annual HRMS, Recruitment, Combined plans" },
            { label: "Hiring Commission", pct: "15%", desc: "Commission on successful placements through marketplace" },
            { label: "Recruiter Job Postings", pct: "10%", desc: "₹299/job for non-subscribed recruiters" },
            { label: "White Label Licensing", pct: "10%", desc: "Monthly licensing fees from white-label partners" },
            { label: "Add-On Services", pct: "5%", desc: "Premium features purchased individually" },
          ].map((r) => (
            <div key={r.label} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 12,
              padding: "1.1rem 1.25rem",
            }}>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--clr-gold, #d2ae52)" }}>{r.pct}</p>
              <p style={{ margin: "0.25rem 0 0.4rem", fontWeight: 700, fontSize: "0.85rem", color: "var(--clr-text, #e8f0ff)" }}>{r.label}</p>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="special-card">
          <h2>Every plan includes premium implementation support</h2>
          <p>
            From setup to adoption, ADH provides onboarding guidance, migration best practices, and
            workflow recommendations to accelerate value realization.
          </p>
          <div className="special-points">
            <span>Structured onboarding framework</span>
            <span>Data migration assistance</span>
            <span>Role-based product enablement</span>
            <span>Scalable support and success model</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ForRecruitersPage() {
  const recruiterTypes = [
    { icon: "🏢", type: "Internal Recruiter", desc: "Company's in-house hiring team. Access your company's jobs and pipeline." },
    { icon: "🏬", type: "Agency Recruiter", desc: "Manage multiple client companies from a single dashboard." },
    { icon: "🧑‍💻", type: "Freelance Recruiter", desc: "Work solo — post jobs, source candidates, earn commission per placement." },
    { icon: "🌍", type: "Global Recruiter Partner", desc: "International partner with revenue share + commission model." },
    { icon: "🤖", type: "AI Recruiter Bot", desc: "Fully automated recruiter powered by our AI engine. Always on, always hiring." },
  ];

  const earnings = [
    { label: "Per Job Post (non-subscribed)", value: "₹299", note: "Pay only for what you post" },
    { label: "Commission per placement", value: "15%–20%", note: "Of first month's candidate salary" },
    { label: "Example: ₹30,000 salary hire", value: "₹5,000", note: "Commission earned per placement" },
    { label: "Premium placement bonus", value: "+₹2,000", note: "Enterprise plan recruiters only" },
  ];

  const steps = [
    { n: "01", title: "Register as Recruiter", desc: "Create your recruiter profile with specializations and industry focus." },
    { n: "02", title: "Post or Browse Jobs", desc: "Post jobs from companies you work with or browse open requisitions on the marketplace." },
    { n: "03", title: "AI-Assisted Sourcing", desc: "Our AI scans the candidate database and surfaces the best matches for your jobs." },
    { n: "04", title: "Manage Pipeline", desc: "Track candidates through a visual Kanban board from shortlist to offer." },
    { n: "05", title: "Schedule & Interview", desc: "AI-powered scheduling syncs with candidate and company calendars automatically." },
    { n: "06", title: "Earn Commission", desc: "Get paid automatically on successful placements. Track earnings in your revenue dashboard." },
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">For Recruiters</p>
        <h1>Build your recruitment business on the most powerful AI platform</h1>
        <p className="lead">
          Join 50,000+ recruiters using Akul Dravin to source candidates, manage hiring pipelines,
          and earn commission — all powered by AI.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
          <NavLink to="/contact" className="btn btn-primary">Join the Marketplace</NavLink>
          <NavLink to="/pricing" className="btn btn-secondary">View Recruiter Plans</NavLink>
        </div>
      </section>

      {/* Recruiter Types */}
      <section className="section">
        <div className="section-head">
          <p className="kicker">Recruiter Ecosystem</p>
          <h2>5 types of recruiters, one unified platform</h2>
          <p>Whether you're a freelancer or a global agency, the platform adapts to your model.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {recruiterTypes.map((r) => (
            <div key={r.type} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 14,
              padding: "1.4rem",
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>{r.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem" }}>{r.type}</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings */}
      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Revenue Model</p>
          <h2>Real earnings, transparent commission</h2>
          <p>Get paid for every successful placement with competitive commission rates.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {earnings.map((e) => (
            <div key={e.label} style={{
              background: "rgba(210,174,82,0.06)",
              border: "1px solid rgba(210,174,82,0.25)",
              borderRadius: 12,
              padding: "1.2rem 1.4rem",
            }}>
              <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--clr-gold, #d2ae52)" }}>{e.value}</p>
              <p style={{ margin: "0.3rem 0 0.2rem", fontWeight: 700, fontSize: "0.82rem" }}>{e.label}</p>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--clr-text-dim, #8ba0b8)" }}>{e.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="section">
        <div className="section-head">
          <p className="kicker">How It Works</p>
          <h2>From registration to commission in 6 steps</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {steps.map((s) => (
            <div key={s.n} style={{
              display: "flex",
              gap: "1rem",
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 12,
              padding: "1.2rem",
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(210,174,82,0.1)",
                border: "1.5px solid rgba(210,174,82,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.78rem",
                color: "var(--clr-gold, #d2ae52)",
                flexShrink: 0,
              }}>{s.n}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>{s.title}</p>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Tools */}
      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">AI-Powered Tools</p>
          <h2>Let AI do the heavy lifting</h2>
          <p>Your AI co-recruiter never sleeps — sourcing, scoring, and scheduling 24/7.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {[
            { icon: "🔍", title: "AI Candidate Scanning", desc: "Automatically scans entire candidate database when a job is posted." },
            { icon: "⭐", title: "Match Scoring", desc: "Ranks candidates by Skill, Experience, Location, Salary, and Culture Fit." },
            { icon: "📅", title: "Auto-Scheduling", desc: "AI syncs calendars and books interviews without back-and-forth emails." },
            { icon: "📊", title: "Recruiter Analytics", desc: "Track placement rate, time-to-hire, earnings, and performance metrics." },
            { icon: "💬", title: "AI Offer Suggestions", desc: "AI generates competitive offer packages based on market data." },
            { icon: "🏆", title: "Performance Ranking", desc: "Platform ranking based on placement rate and candidate quality." },
          ].map((tool) => (
            <div key={tool.title} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 12,
              padding: "1.2rem",
            }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "0.6rem" }}>{tool.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>{tool.title}</p>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="special-card">
          <h2>Ready to start earning?</h2>
          <p>Join the Akul Dravin Recruiter Marketplace and access thousands of open positions with AI-matched candidates ready for placement.</p>
          <div className="special-points">
            <span>Free to join the marketplace</span>
            <span>Commission on every placement</span>
            <span>AI-powered candidate matching</span>
            <span>Dedicated recruiter dashboard</span>
          </div>
          <NavLink to="/contact" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
            Apply as a Recruiter
          </NavLink>
        </div>
      </section>
    </div>
  );
}

function FindJobsPage() {
  const jobCategories = [
    { icon: "💻", name: "Technology", count: "2,400+ jobs" },
    { icon: "📊", name: "Finance", count: "1,200+ jobs" },
    { icon: "📣", name: "Sales & Marketing", count: "3,100+ jobs" },
    { icon: "🏥", name: "Healthcare", count: "890+ jobs" },
    { icon: "🎓", name: "Education", count: "670+ jobs" },
    { icon: "⚙️", name: "Operations", count: "1,450+ jobs" },
    { icon: "🧑‍🎨", name: "Design & Creative", count: "560+ jobs" },
    { icon: "📦", name: "Supply Chain", count: "740+ jobs" },
  ];

  const aiFeatures = [
    { icon: "🎯", title: "AI Job Matching", desc: "AI matches your profile with the best-fit roles from thousands of openings." },
    { icon: "📈", title: "Profile Strength Score", desc: "Get an AI-powered score and suggestions to increase your visibility to employers." },
    { icon: "⚡", title: "One-Click Apply", desc: "Auto-fill application forms from your profile. Apply to any job in seconds." },
    { icon: "💬", title: "AI Interview Prep", desc: "AI-generated practice questions tailored to the specific role you are applying for." },
    { icon: "💰", title: "Salary Benchmarking", desc: "Know your market value with AI-driven salary insights for your role and location." },
    { icon: "🔔", title: "Smart Job Alerts", desc: "Get notified instantly when new jobs matching your preferences are posted." },
  ];

  const candidateJourney = [
    { step: "1", title: "Create Your Profile", desc: "Add your skills, experience, education, portfolio, and expected salary." },
    { step: "2", title: "AI Enhancement", desc: "AI analyzes your profile and suggests improvements to increase recruiter visibility." },
    { step: "3", title: "Discover Opportunities", desc: "Browse AI-matched jobs or search by location, industry, and role type." },
    { step: "4", title: "One-Click Apply", desc: "Submit applications instantly with your auto-filled profile. No re-entering data." },
    { step: "5", title: "Attend Interviews", desc: "Schedule video or in-person interviews directly through the platform." },
    { step: "6", title: "Receive & Accept Offers", desc: "Review, negotiate, and sign offer letters digitally — all in one place." },
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Find Jobs</p>
        <h1>Discover your next career opportunity with AI</h1>
        <p className="lead">
          AI-matched job recommendations, one-click apply, and end-to-end career management —
          from job search to offer acceptance on a single platform.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
          <NavLink to="/careers" className="btn btn-primary">Browse Open Jobs</NavLink>
          <NavLink to="/contact" className="btn btn-secondary">Create Your Profile</NavLink>
        </div>
      </section>

      {/* Stats */}
      <section className="section section-alt" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", textAlign: "center" }}>
          {[
            { val: "10,000+", label: "Active Companies" },
            { val: "50,000+", label: "Recruiter Network" },
            { val: "95%+", label: "AI Match Accuracy" },
            { val: "5+", label: "Countries" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "rgba(210,174,82,0.06)",
              border: "1px solid rgba(210,174,82,0.2)",
              borderRadius: 12,
              padding: "1.25rem 1rem",
            }}>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--clr-gold, #d2ae52)" }}>{s.val}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Job Categories */}
      <section className="section">
        <div className="section-head">
          <p className="kicker">Job Categories</p>
          <h2>Explore opportunities across all industries</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
          {jobCategories.map((cat) => (
            <div key={cat.name} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 14,
              padding: "1.4rem 1rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>{cat.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{cat.name}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.73rem", color: "var(--clr-gold, #d2ae52)" }}>{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Candidate Journey */}
      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Candidate Journey</p>
          <h2>From profile to offer in 6 steps</h2>
          <p>The platform guides you through every stage of your job search automatically.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {candidateJourney.map((s) => (
            <div key={s.step} style={{
              display: "flex",
              gap: "1rem",
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 12,
              padding: "1.2rem",
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(210,174,82,0.1)",
                border: "1.5px solid rgba(210,174,82,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
                color: "var(--clr-gold, #d2ae52)",
                flexShrink: 0,
              }}>{s.step}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>{s.title}</p>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Features */}
      <section className="section">
        <div className="section-head">
          <p className="kicker">AI-Powered Career Tools</p>
          <h2>AI works for you, 24/7</h2>
          <p>Smart tools that give candidates a competitive edge in every application.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {aiFeatures.map((f) => (
            <div key={f.title} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 12,
              padding: "1.2rem",
            }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "0.6rem" }}>{f.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>{f.title}</p>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Candidate Profile fields */}
      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Your Profile</p>
          <h2>One profile. Unlimited opportunities.</h2>
          <p>Build a comprehensive professional profile that AI uses to match you with the right roles.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {[
            "Personal Info + Photo", "Professional Summary", "Skills + Proficiency",
            "Work Experience", "Education Credentials", "Portfolio + Projects",
            "Resume Upload (PDF/DOCX)", "Expected Salary + Preferences", "Job Type + Location Preferences",
          ].map((field) => (
            <div key={field} style={{
              background: "var(--clr-surface, rgba(255,255,255,0.04))",
              border: "1px solid var(--clr-border, #1e2d40)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              fontSize: "0.8rem",
              color: "var(--clr-text, #e8f0ff)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <span style={{ color: "var(--clr-gold, #d2ae52)" }}>✓</span>
              {field}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="special-card">
          <h2>Start your job search today</h2>
          <p>
            Create your free profile and let AI find the right opportunities for you.
            Join thousands of professionals already on the platform.
          </p>
          <div className="special-points">
            <span>Free candidate profile</span>
            <span>AI-matched job recommendations</span>
            <span>One-click apply</span>
            <span>Digital offer acceptance</span>
          </div>
          <NavLink to="/careers" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
            Browse Jobs Now
          </NavLink>
        </div>
      </section>
    </div>
  );
}

function EnterprisePage() {
  const capabilities = [
    { icon: "🏢", title: "Multi-Entity Management", desc: "Manage unlimited companies, branches, and subsidiaries from a single control plane with role-based access." },
    { icon: "🌍", title: "Global Payroll & Compliance", desc: "Multi-country payroll with local statutory compliance for India, GCC, Southeast Asia, and more." },
    { icon: "🔐", title: "Enterprise Security", desc: "SSO, IP whitelisting, 2FA, AES-256 encryption, SOC 2 Type II controls, and audit trails." },
    { icon: "⚡", title: "Full API Access", desc: "RESTful + GraphQL APIs with OAuth 2.0. Integrate with SAP, Salesforce, Workday, or any custom system." },
    { icon: "🤖", title: "Custom AI Training", desc: "Train the AI models on your company's data for hyper-accurate hiring predictions and workforce planning." },
    { icon: "📊", title: "Board-Grade Analytics", desc: "CEO dashboards, predictive workforce intelligence, and custom BI integrations with Power BI and Tableau." },
    { icon: "🎨", title: "Custom App Branding", desc: "White-label the mobile app and web platform with your logo, colors, and domain." },
    { icon: "🤝", title: "Dedicated CSM", desc: "Named Customer Success Manager, 24/7 SLA support, and tailored implementation blueprints." },
  ];

  const metrics = [
    { val: "99.99%", label: "Platform Uptime SLA" },
    { val: "<1 hr", label: "Recovery Point Objective" },
    { val: "50K+", label: "Enterprise Employee Records" },
    { val: "14 Days", label: "Typical Go-Live Velocity" },
  ];

  const integrations = [
    "SAP SuccessFactors", "Salesforce", "Workday", "Microsoft Teams", "Slack", "Zoom", "Google Workspace", "Razorpay", "Zoho Books", "QuickBooks",
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Enterprise</p>
        <h1>Built for the complexity of enterprise workforce operations</h1>
        <p className="lead">
          Unlimited scale, advanced security, global compliance, and dedicated support —
          designed for companies managing 500 to 100,000+ employees.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
          <NavLink to="/contact" className="btn btn-primary">Request Enterprise Demo</NavLink>
          <NavLink to="/pricing" className="btn btn-secondary">View Enterprise Pricing</NavLink>
        </div>
      </section>

      <section className="section section-alt" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", textAlign: "center" }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "rgba(210,174,82,0.06)", border: "1px solid rgba(210,174,82,0.2)", borderRadius: 12, padding: "1.25rem 1rem" }}>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--clr-gold, #d2ae52)" }}>{m.val}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)" }}>{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Enterprise Capabilities</p>
          <h2>Everything a global enterprise needs, built-in</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {capabilities.map(c => (
            <div key={c.title} style={{ background: "var(--clr-surface, rgba(255,255,255,0.04))", border: "1px solid var(--clr-border, #1e2d40)", borderRadius: 14, padding: "1.4rem" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{c.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem" }}>{c.title}</p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Integrations</p>
          <h2>Connects with your existing enterprise tech stack</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center" }}>
          {integrations.map(i => (
            <span key={i} style={{ padding: "0.5rem 1.1rem", borderRadius: 999, border: "1px solid var(--clr-border, #1e2d40)", background: "var(--clr-surface, rgba(255,255,255,0.04))", fontSize: "0.82rem", color: "var(--clr-text, #e8f0ff)" }}>{i}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="special-card">
          <h2>Talk to our Enterprise team</h2>
          <p>Our enterprise specialists will map the platform to your organizational structure, compliance requirements, and integration landscape.</p>
          <div className="special-points">
            <span>Custom implementation plan</span>
            <span>Dedicated migration support</span>
            <span>24/7 enterprise SLA</span>
            <span>Named account manager</span>
          </div>
          <NavLink to="/contact" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>Schedule Enterprise Call</NavLink>
        </div>
      </section>
    </div>
  );
}

function WhiteLabelPartnersPage() {
  const features = [
    { icon: "🎨", title: "Complete Brand Customization", desc: "Replace all platform branding with your logo, colors, fonts, and visual identity." },
    { icon: "🌐", title: "Custom Domain + SSL", desc: "Deliver the platform under your own domain (e.g., hr.yourbrand.com) with full SSL." },
    { icon: "💰", title: "Flexible Pricing Control", desc: "Set your own pricing for clients with minimum margin requirements. Keep 100% of your markup." },
    { icon: "👥", title: "Client Management Dashboard", desc: "Manage all your clients, their subscriptions, usage, and billing from a single partner dashboard." },
    { icon: "📱", title: "Branded Mobile App", desc: "iOS and Android apps with your brand — available on WL Pro and above plans." },
    { icon: "🔌", title: "Full API Access", desc: "Programmatic access for integrating with your existing systems and client workflows." },
    { icon: "📊", title: "Revenue Analytics", desc: "Track revenue, client growth, churn, and usage metrics across your entire client base." },
    { icon: "🎓", title: "Partner Training Program", desc: "Dedicated onboarding sessions, documentation, and custom training for your team." },
  ];

  const plans = [
    { name: "WL Basic", price: "₹25,000/mo", clients: "10", sla: "99.5%", highlights: ["Logo + colors", "HRMS reselling", "Basic dashboard"] },
    { name: "WL Pro", price: "₹50,000/mo", clients: "50", sla: "99.9%", highlights: ["Full UI custom", "Custom domain", "Recruitment + HRMS", "Advanced analytics"], popular: true },
    { name: "WL Global", price: "₹1,00,000/mo", clients: "Unlimited", sla: "99.99%", highlights: ["Complete white label", "Custom app", "Full API", "Dedicated manager"] },
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">White Label Partners</p>
        <h1>Resell the most powerful HRMS platform under your own brand</h1>
        <p className="lead">
          White label the entire Akul Dravin platform — HRMS, recruitment marketplace, and AI engine —
          and deliver it to your clients under your own brand, domain, and pricing.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
          <NavLink to="/contact" className="btn btn-primary">Become a Partner</NavLink>
          <NavLink to="/pricing" className="btn btn-secondary">View Partner Plans</NavLink>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">Platform Capabilities</p>
          <h2>Everything your clients need, under your brand</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {features.map(f => (
            <div key={f.title} style={{ background: "var(--clr-surface, rgba(255,255,255,0.04))", border: "1px solid var(--clr-border, #1e2d40)", borderRadius: 14, padding: "1.4rem" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{f.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{f.title}</p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">Partner Plans</p>
          <h2>Choose your partner tier</h2>
        </div>
        <div className="pricing-grid">
          {plans.map(p => (
            <article key={p.name} className={`pricing-card ${p.popular ? "featured" : ""} reveal-up`}>
              {p.popular && <span className="plan-badge">Most Popular</span>}
              <h3>{p.name}</h3>
              <p className="price">{p.price}<span>/ month</span></p>
              <p className="audience">Up to {p.clients} clients · {p.sla} SLA</p>
              <ul>{p.highlights.map(h => <li key={h}>{h}</li>)}</ul>
              <NavLink to="/contact" className="btn btn-secondary">Apply Now</NavLink>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="special-card">
          <h2>Ready to launch your HR platform?</h2>
          <p>Join our growing network of white-label partners delivering enterprise HRMS to their clients.</p>
          <div className="special-points">
            <span>Launch in 30 days</span>
            <span>100% margin control</span>
            <span>Dedicated partner support</span>
            <span>99.99% uptime SLA</span>
          </div>
          <NavLink to="/contact" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>Apply as Partner</NavLink>
        </div>
      </section>
    </div>
  );
}

function AIEnginePage() {
  const layers = [
    { n: "01", name: "AI HR Engine", status: "Live", color: "#40b77e", desc: "Policy enforcement, workflow automation, employee lifecycle management, and compliance monitoring." },
    { n: "02", name: "AI Recruitment Engine", status: "Live", color: "#40b77e", desc: "Job-candidate matching, resume parsing, automated screening, and hiring pipeline management." },
    { n: "03", name: "AI Talent Intelligence", status: "Live", color: "#40b77e", desc: "Skill matching, experience scoring, culture fit assessment, and candidate quality prediction." },
    { n: "04", name: "AI Workforce Analytics", status: "Live", color: "#40b77e", desc: "Turnover prediction, productivity analysis, demand forecasting, and workforce planning reports." },
    { n: "05", name: "AI Decision Engine", status: "Beta", color: "#d2ae52", desc: "Hiring decisions, promotion recommendations, resource allocation, and strategic workforce planning." },
    { n: "06", name: "AI Security Engine", status: "Live", color: "#40b77e", desc: "Anomaly detection, access monitoring, threat detection, and data protection compliance." },
    { n: "07", name: "AI Voice Assistant", status: "Beta", color: "#d2ae52", desc: "Conversational HR queries in Hindi and English — leave balance, payslips, HR policies, and more." },
    { n: "08", name: "AI Automation Engine", status: "Live", color: "#40b77e", desc: "Document generation, approval workflows, notification triggers, and process orchestration." },
  ];

  const metrics = [
    { val: "99%", label: "AI Workflow Coverage" },
    { val: "95%+", label: "Hiring Accuracy" },
    { val: "90%+", label: "Turnover Prediction" },
    { val: "8", label: "Specialized AI Layers" },
  ];

  const automations = [
    { icon: "📋", title: "Job Posted", desc: "AI immediately scans candidate database" },
    { icon: "🔍", title: "Smart Scan", desc: "AI matches candidates on 6 dimensions" },
    { icon: "⭐", title: "Auto-Shortlist", desc: "Top matches ranked and surfaced" },
    { icon: "🔔", title: "Recruiter Notified", desc: "AI sends ranked list to recruiter" },
    { icon: "📅", title: "Auto-Schedule", desc: "AI books interviews from availability" },
    { icon: "🎥", title: "Interview Analysis", desc: "AI scores candidate performance" },
    { icon: "📄", title: "Offer Generation", desc: "AI generates competitive offer package" },
    { icon: "🚀", title: "Onboarding Trigger", desc: "AI initiates onboarding automatically" },
  ];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">AI Engine</p>
        <h1>8-Layer Central AI Brain powering 99% of HR decisions</h1>
        <p className="lead">
          The Akul Dravin AI Engine is a purpose-built multi-layer intelligence system that automates hiring,
          HR operations, workforce planning, and compliance — end to end.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
          <NavLink to="/contact" className="btn btn-primary">See AI Demo</NavLink>
          <NavLink to="/platform" className="btn btn-secondary">Full Platform Overview</NavLink>
        </div>
      </section>

      <section className="section section-alt" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", textAlign: "center" }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "rgba(210,174,82,0.06)", border: "1px solid rgba(210,174,82,0.2)", borderRadius: 12, padding: "1.25rem 1rem" }}>
              <p style={{ margin: 0, fontSize: "1.7rem", fontWeight: 800, color: "var(--clr-gold, #d2ae52)" }}>{m.val}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)" }}>{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="kicker">AI Architecture</p>
          <h2>8 specialized AI layers working in concert</h2>
          <p>Each layer handles a distinct domain of HR intelligence, coordinated by the Central AI Brain.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {layers.map(l => (
            <div key={l.n} style={{ display: "flex", gap: "1rem", padding: "1rem 1.2rem", borderRadius: 12, background: "var(--clr-surface, rgba(255,255,255,0.04))", border: "1px solid var(--clr-border, #1e2d40)", alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${l.color}20`, border: `1.5px solid ${l.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.72rem", color: l.color, flexShrink: 0 }}>{l.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.3rem" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{l.name}</p>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: `${l.color}20`, color: l.color, border: `1px solid ${l.color}40` }}>{l.status}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.6 }}>{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-head">
          <p className="kicker">AI Hiring Automation</p>
          <h2>From job posting to onboarding — fully automated</h2>
          <p>The AI Hiring Engine runs end-to-end without manual intervention.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
          {automations.map((a, i) => (
            <div key={a.title} style={{ padding: "1rem", borderRadius: 12, background: "var(--clr-surface, rgba(255,255,255,0.04))", border: "1px solid var(--clr-border, #1e2d40)", position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12, fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-gold, #d2ae52)", opacity: 0.6 }}>STEP {i + 1}</div>
              <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{a.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem" }}>{a.title}</p>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.73rem", color: "var(--clr-text-dim, #8ba0b8)", lineHeight: 1.5 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="special-card">
          <h2>See the AI Engine in action</h2>
          <p>Request a live demo to see how the 8-layer AI system automates your entire HR and recruitment workflow.</p>
          <div className="special-points">
            <span>Live AI matching demo</span>
            <span>Workforce analytics walkthrough</span>
            <span>Custom AI training discussion</span>
            <span>ROI calculation session</span>
          </div>
          <NavLink to="/contact" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>Request AI Demo</NavLink>
        </div>
      </section>
    </div>
  );
}

function RoadmapPage() {
  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Roadmap</p>
        <h1>A clear path from operational excellence to global leadership</h1>
        <p className="lead">
          ADH is evolving through focused stages that strengthen user experience, automation depth, and
          international scalability.
        </p>
      </section>

      <PageVisualSection visual={pageVisuals.roadmap} />

      <section className="section section-alt">
        <div className="roadmap">
          {roadmap.map((phase, index) => (
            <article key={phase.title} className="roadmap-item reveal-up" style={{ animationDelay: `${index * 80}ms` }}>
              <h3>{phase.title}</h3>
              <p className="timeline">{phase.timeline}</p>
              <p className="target">{phase.target}</p>
              <p>{phase.focus}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function FaqPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">FAQ</p>
        <h1>Everything teams ask before switching to ADH</h1>
        <p className="lead">Quick answers for HR leaders, IT admins, finance teams, and implementation owners.</p>
      </section>

      <PageVisualSection visual={pageVisuals.faq} reverse />

      <section className="section">
        <div className="faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <article key={item.question} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                  <span>{item.question}</span>
                  <ChevronDown size={18} />
                </button>
                <p>{item.answer}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ContactPage({ partner }: ContactPageProps) {
  const [values, setValues] = useState<ContactFormValues>({
    fullName: "",
    workEmail: "",
    companySize: "",
    requirements: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<ContactSubmissionState>({ type: "idle", message: "" });

  const onFieldChange = (field: keyof ContactFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmission({ type: "idle", message: "" });

    try {
      const result = await submitContactLead(values);
      setSubmission({
        type: "success",
        message: `Request submitted successfully. Lead ID: ${result.leadId}`,
      });
      setValues({ fullName: "", workEmail: "", companySize: "", requirements: "" });
    } catch (error) {
      setSubmission({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">Contact</p>
        <h1>Talk to {partner.brandName} product specialists</h1>
        <p className="lead">
          Share your goals, current HR stack, and rollout priorities. We will help you design the right implementation path for your global workforce model.
        </p>
      </section>

      <PageVisualSection visual={pageVisuals.contact} />

      <section className="section contact-grid">
        <article className="contact-card">
          <h3>Connect With Us</h3>
          <ul className="contact-list">
            <li>
              <Mail size={16} /> {partner.supportEmail}
            </li>
            <li>
              <Phone size={16} /> +91 90000 00000
            </li>
            <li>
              <MapPin size={16} /> {partner.hq}
            </li>
          </ul>
          <p>
            {partner.brandName} specialists support solution discovery, migration planning, workflow architecture, and international readiness strategy.
          </p>
        </article>

        <article className="contact-card">
          <h3>Request a Strategy Demo</h3>
          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="field">
              Full Name
              <input
                type="text"
                placeholder="Your full name"
                value={values.fullName}
                onChange={(event) => onFieldChange("fullName", event.target.value)}
                required
              />
            </label>
            <label className="field">
              Work Email
              <input
                type="email"
                placeholder="name@company.com"
                value={values.workEmail}
                onChange={(event) => onFieldChange("workEmail", event.target.value)}
                required
              />
            </label>
            <label className="field">
              Company Size
              <select
                value={values.companySize}
                onChange={(event) => onFieldChange("companySize", event.target.value)}
                required
              >
                <option value="" disabled>Select size range</option>
                {COMPANY_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Requirements
              <textarea
                rows={4}
                placeholder="Tell us what you want to modernize first"
                value={values.requirements}
                onChange={(event) => onFieldChange("requirements", event.target.value)}
              />
            </label>
            {submission.type !== "idle" && (
              <p className={`form-feedback ${submission.type === "success" ? "success" : "error"}`}>
                {submission.message}
              </p>
            )}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

function ContentHubPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? contentPages[slug] : undefined;

  if (!page) {
    return <NotFoundPage />;
  }

  const visual = contentCategoryVisuals[page.category];

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <p className="kicker">{page.kicker}</p>
        <h1>{page.title}</h1>
        <p className="lead">{page.lead}</p>
      </section>

      <PageVisualSection visual={visual} reverse={page.category === "tools" || page.category === "links"} />

      <section className="section detail-grid">
        {page.sections.map((section, index) => (
          <article key={section.heading} className="detail-card reveal-up" style={{ animationDelay: `${index * 80}ms` }}>
            <h3>{section.heading}</h3>
            <p>{section.description}</p>
            <ul>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="section section-alt">
        <div className="special-card">
          <h2>Need a tailored walkthrough for {page.label}?</h2>
          <p>
            ADH specialists can map this area to your organization model, integration needs, and operating
            maturity so your rollout remains fast and controlled.
          </p>
          <div className="special-points">
            <span>Role-based rollout strategy</span>
            <span>Implementation blueprint and milestones</span>
            <span>Governance and compliance checkpoint model</span>
          </div>
          <NavLink to={page.ctaTo} className="btn btn-primary">{page.ctaLabel}</NavLink>
        </div>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page-wrap">
      <section className="notfound">
        <h1>Page not found</h1>
        <p>The route you opened does not exist. Use the main navigation to continue.</p>
        <NavLink to="/" className="btn btn-primary">Back to Home</NavLink>
      </section>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [footerTab, setFooterTab] = useState<FooterTabKey>("company");
  const [activePartnerId, setActivePartnerId] = useState<PartnerId>(() => resolvePartnerIdFromRuntime());
  const activePartner = useMemo(
    () => partnerProfiles.find((partner) => partner.id === activePartnerId) ?? partnerProfiles[0],
    [activePartnerId],
  );
  const [themeOverride, setThemeOverride] = useState<BrandTheme | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedTheme = window.localStorage.getItem(BRAND_THEME_STORAGE_KEY);
    return savedTheme === "imperial" || savedTheme === "onyx" || savedTheme === "emerald" || savedTheme === "sunset"
      ? savedTheme
      : null;
  });
  const brandTheme = themeOverride ?? activePartner.theme;
  const location = useLocation();
  const auth = useContext(AuthContext);

  const footerRows = activePartner.id === "akul"
    ? footerNoticeRows
    : [
      `${activePartner.brandName} Workforce Platform | White Label Global SaaS Operations`,
      "BEWARE OF SPURIOUS / FRAUD PHONE CALLS!",
    ];

  const footerSubsidiaryItems = activePartner.id === "akul"
    ? footerSubsidiaries
    : [
      `${activePartner.brandName} Talent Cloud`,
      `${activePartner.brandName} Payroll Services`,
      `${activePartner.brandName} Recruitment Marketplace`,
      `${activePartner.brandName} Partner Network`,
      `${activePartner.brandName} AI Labs`,
      `${activePartner.brandName} Compliance Systems`,
      `${activePartner.brandName} Global Integrations`,
    ];

  const isAppRoute = location.pathname === "/login" || location.pathname.startsWith("/app") || location.pathname === "/careers";

  useEffect(() => {
    const meta = resolveSeoMeta(location.pathname);
    const absoluteUrl = buildAbsoluteUrl(location.pathname);
    const pageTitle = `${meta.title} | ${activePartner.brandName} ${activePartner.platformLabel}`;

    document.title = pageTitle;
    upsertMetaTag("name", "description", meta.description);
    upsertMetaTag("name", "robots", "index,follow");
    upsertMetaTag("property", "og:type", "website");
    upsertMetaTag("property", "og:title", pageTitle);
    upsertMetaTag("property", "og:description", meta.description);
    upsertMetaTag("property", "og:url", absoluteUrl);
    upsertMetaTag("name", "twitter:card", "summary_large_image");
    upsertMetaTag("name", "twitter:title", pageTitle);
    upsertMetaTag("name", "twitter:description", meta.description);
    upsertCanonicalLink(absoluteUrl);
  }, [location.pathname, activePartner.brandName, activePartner.platformLabel]);


  useEffect(() => {
    document.documentElement.setAttribute("data-brand-theme", brandTheme);
    document.documentElement.setAttribute("data-partner-id", activePartner.id);
    window.localStorage.setItem(BRAND_THEME_STORAGE_KEY, brandTheme);
    window.localStorage.setItem(PARTNER_STORAGE_KEY, activePartner.id);
  }, [brandTheme, activePartner.id]);

  useEffect(() => {
    setMenuOpen(false);
    setOpenSubmenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".nav-item.has-submenu")) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // App routes render without marketing chrome
  if (isAppRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={auth?.isLoading ? null : <AppShell />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="site">
      <div className="site-bg" aria-hidden="true" />

      <header className="header">
        <NavLink
          to="/"
          className="brand"
          aria-label={`${activePartner.brandName} ${activePartner.platformLabel} home`}
          onClick={() => {
            setMenuOpen(false);
            setOpenSubmenu(null);
          }}
        >
          <img
            src="/branding/akul-dravin-icon.svg"
            alt={`${activePartner.brandName} icon`}
            className="brand-icon"
            loading="eager"
            decoding="async"
          />
          <span className="brand-name">
            <span className="brand-title">{activePartner.brandName}</span>
            <span className="brand-sub">{activePartner.platformLabel}</span>
            <span className="brand-edition">{activePartner.edition}</span>
          </span>
        </NavLink>

        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => {
            if (!item.submenu?.length && item.to) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenSubmenu(null);
                  }}
                >
                  {item.label}
                </NavLink>
              );
            }

            const isOpen = openSubmenu === item.label;
            const isActive = item.submenu?.some(
              (sub) => location.pathname === sub.to || location.pathname.startsWith(`${sub.to}/`),
            );

            return (
              <div key={item.label} className={`nav-item has-submenu ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className={`nav-trigger ${isActive ? "active" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenSubmenu((prev) => (prev === item.label ? null : item.label));
                  }}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                >
                  <span>{item.label}</span>
                  <ChevronDown size={14} className="nav-caret" />
                </button>

                <div className="nav-submenu" role="menu">
                  {item.submenu.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      className={({ isActive: subActive }) => `nav-submenu-link ${subActive ? "active" : ""}`}
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenSubmenu(null);
                      }}
                    >
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="header-controls">
          <div className="partner-switcher">
            <label htmlFor="partner-switcher">Partner</label>
            <select
              id="partner-switcher"
              value={activePartnerId}
              onChange={(event) => setActivePartnerId(event.target.value as PartnerId)}
            >
              {partnerProfiles.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.label}</option>
              ))}
            </select>
          </div>

          <div className="theme-switcher" role="group" aria-label="White-label theme presets">
            {brandThemes.map((theme) => (
              <button
                key={theme.key}
                type="button"
                className={brandTheme === theme.key ? "active" : ""}
                onClick={() => setThemeOverride(theme.key)}
              >
                {theme.label}
              </button>
            ))}
          </div>

          <div className="header-cta">
            <NavLink to="/contact" className="btn btn-secondary">Book Demo</NavLink>
            <NavLink to="/login" className="btn btn-primary">Sign In</NavLink>
          </div>
        </div>

        <button
          className="menu-btn"
          onClick={() => {
            setMenuOpen((prev) => {
              const next = !prev;
              if (!next) {
                setOpenSubmenu(null);
              }
              return next;
            });
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <main className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/enterprise" element={<EnterprisePage />} />
          <Route path="/for-recruiters" element={<ForRecruitersPage />} />
          <Route path="/find-jobs" element={<FindJobsPage />} />
          <Route path="/white-label-partners" element={<WhiteLabelPartnersPage />} />
          <Route path="/ai-engine" element={<AIEnginePage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage partner={activePartner} />} />
          <Route path="/pages/:slug" element={<ContentHubPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="footer footer-rich">
        <div className="footer-top-rows">
          {footerRows.map((row) => (
            <div key={row} className="footer-row">
              <p>{row}</p>
              <button type="button" className="footer-row-plus" aria-label="Expand row">+</button>
            </div>
          ))}
        </div>

        <section className="footer-subsidiaries">
          <h3>OUR SUBSIDIARIES / ASSOCIATE COMPANIES</h3>
          <div className="footer-subsidiary-list">
            {footerSubsidiaryItems.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </section>

        <section className="footer-main-grid">
          <div className="footer-brand-panel">
            <div className="footer-brand-card">
              <img src="/branding/akul-dravin-icon.svg" alt={activePartner.brandName} />
              <div>
                <strong>{activePartner.brandName}</strong>
                <p>{activePartner.platformLabel}</p>
              </div>
            </div>
            <div className="footer-call-card">
              <span>Toll Free Number</span>
              <strong>{activePartner.tollFree}</strong>
            </div>
          </div>

          <div className="footer-links-panel">
            <div className="footer-link-tabs" role="tablist" aria-label="Footer links tabs">
              {footerTabItems.map((item) => (
                <button
                  key={item.key}
                  className={footerTab === item.key ? "active" : ""}
                  onClick={() => setFooterTab(item.key)}
                  role="tab"
                  aria-selected={footerTab === item.key}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="footer-link-list" key={footerTab}>
              {footerTabLinks[footerTab].map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="footer-download-panel">
            <div className="footer-app-icon">{activePartner.appTag}</div>
            <p>Download {activePartner.label}</p>
            <div className="footer-store-buttons">
              <button type="button">Playstore</button>
              <button type="button">Appstore</button>
            </div>
          </div>
        </section>

        <section className="footer-bottom-bar">
          <small>© 2026, {activePartner.brandName} Technologies. All Rights Reserved.</small>
          <div className="footer-socials" aria-label="Social links">
            <button type="button" aria-label="Facebook">f</button>
            <button type="button" aria-label="X">x</button>
            <button type="button" aria-label="Instagram">ig</button>
            <button type="button" aria-label="LinkedIn">in</button>
            <button type="button" aria-label="YouTube">yt</button>
          </div>
        </section>
      </footer>
    </div>
  );
}

export default App;




























































