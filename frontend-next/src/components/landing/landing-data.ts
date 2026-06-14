import {
  ArrowUpRight,
  BarChart3,  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,  FileStack,
  FileText,
  Globe,
  Handshake,
  IdCard,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
};

export type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type AutomationItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  tag: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

export type StatItem = {
  value: string;
  label: string;
};

export type TestimonialItem = {
  name: string;
  company: string;
  quote: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type SocialLink = {
  label: string;
  short: string;
  href: string;
};

export type MarketplaceItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ServiceItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  image: string;
  videoUrl?: string;
  badge: string;
};


export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '/dashboard?role=platform-admin' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'AI Automation', href: '/automation?role=platform-admin' },
  { label: 'Marketplace', href: '/marketplace?role=recruiter' },
  { label: 'Contact', href: '#contact' },
];

export const FEATURE_ITEMS: FeatureItem[] = [
  {
    title: 'Advanced Role-Based Permission Control',
    description: 'Grant or revoke access by role, company, team, and module with enterprise audit visibility.',
    icon: ShieldCheck,
  },
  {
    title: 'Work Activity & Productivity Tracking',
    description: 'Track login/logout, tasks completed, project effort, and productive hours in realtime.',
    icon: TimerReset,
  },
  {
    title: 'GPS + Geofencing Location Monitoring',
    description: 'Monitor office presence, work-from-home mode, field movement, and location history.',
    icon: MapPinned,
  },
  {
    title: 'Attendance & Workday Intelligence',
    description: 'Automate check-in/out, leave deduction, shift analytics, overtime, and workday reporting.',
    icon: CalendarDays,
  },
  {
    title: 'Performance & Team Leaderboard',
    description: 'Measure target achievement, task completion, AI score, and team comparison dashboards.',
    icon: Target,
  },
  {
    title: 'Payroll + Commission Automation',
    description: 'Run days-wise salary, target incentives, and sales commission with integrated payroll controls.',
    icon: CircleDollarSign,
  },
  {
    title: '150+ Smart Documents & Certificates',
    description: 'Generate letters, salary slips, certificates, ID cards, and branded documents instantly.',
    icon: FileText,
  },
  {
    title: '200+ Workflow Automations',
    description: 'Execute attendance, approvals, alerts, and document triggers through event-driven automation.',
    icon: Workflow,
  },
];

export const AUTOMATION_ITEMS: AutomationItem[] = [
  {
    title: 'BullMQ Background Engine',
    description: 'Nine dedicated queues (email, AI, reports, payroll, webhooks, search, activity, automation, cron) with retry, dead-letter, and graceful degradation.',
    icon: Workflow,
    tag: '9 Queue Types',
  },
  {
    title: 'Event-Driven Workflow Engine',
    description: 'Trigger automations on HR events — employee created, leave approved, payroll generated — with condition branching and step-based orchestration.',
    icon: ArrowUpRight,
    tag: 'Event-Triggered',
  },
  {
    title: 'AI Memory + Semantic Search',
    description: 'pgvector-backed conversation memory and cross-module entity indexing with OpenAI embeddings and IVFFlat cosine similarity search.',
    icon: Sparkles,
    tag: 'pgvector · RAG',
  },
  {
    title: 'Document Generation',
    description: 'Generate letters, certificates, salary slips, and ID cards from event-based templates with BullMQ background processing.',
    icon: FileStack,
    tag: '150+ Templates',
  },
  {
    title: 'OpenTelemetry Observability',
    description: 'Distributed tracing across HTTP, PostgreSQL, Redis, and AI calls. Prometheus metrics endpoint, Sentry error tracking, correlation ID propagation.',
    icon: ShieldCheck,
    tag: 'OTel + Sentry',
  },
  {
    title: 'Deterministic Governance Kernel',
    description: 'A layered coordination substrate with SHA-256 state hashing, human-sovereign overrides, and forensic replay isolation for institutional-grade auditability.',
    icon: ShieldCheck,
    tag: 'Sovereign Kernel',
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Startup',
    price: '$59 / month',
    description: 'For teams digitizing attendance, tasks, and core HR operations quickly.',
    cta: 'Start Free Trial',
    features: ['Up to 75 employees', 'Attendance + Task Tracking', 'Employee Dashboard', 'Email + Chat Support'],
  },
  {
    name: 'Professional',
    price: '$179 / month',
    description: 'For growing organizations automating payroll, performance, and manager governance.',
    cta: 'Start Free Trial',
    featured: true,
    features: ['Up to 300 employees', 'Performance + Location Tracking', 'Payroll + Commission Sync', 'RBAC Controls'],
  },
  {
    name: 'Business',
    price: '$449 / month',
    description: 'For multi-team businesses requiring advanced analytics and workflow orchestration.',
    cta: 'Book Business Demo',
    features: ['Up to 1500 employees', '200+ Workflow Automations', 'AI Workforce Intelligence', 'Priority Success Manager'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For global enterprises with multi-company architecture and strict compliance requirements.',
    cta: 'Talk to Enterprise Sales',
    features: ['Unlimited employees', 'Custom RBAC + SSO + SCIM', 'Dedicated support team', 'Security + SLA controls'],
  },
];

export const PLATFORM_STATS: StatItem[] = [
  { value: '99.99%', label: 'Platform Uptime SLA' },
  { value: '9', label: 'BullMQ Queue Types' },
  { value: '200+', label: 'Workflow Automations' },
  { value: '~35ms', label: 'Avg API Latency' },
  { value: 'pgvector', label: 'AI Memory Layer' },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Rhea Malhotra',
    company: 'PeopleOps Director, NexaCom Global',
    quote:
      'We unified attendance, task monitoring, and payroll in one portal and reduced manual HR operations by more than 60%.',
  },
  {
    name: 'Aarav Menon',
    company: 'Chief People Officer, Finaxis Enterprise Group',
    quote:
      'Role-based controls and live productivity dashboards gave our managers clear visibility without compromising data security.',
  },
  {
    name: 'Sanjana Iyer',
    company: 'VP Talent & Operations, Orion Workforce Labs',
    quote:
      'Location monitoring, AI performance scoring, and workflow automation helped us improve team efficiency quarter over quarter.',
  },
];

export const DASHBOARD_PREVIEWS: FeatureItem[] = [
  {
    title: 'Manager Dashboard',
    description: 'Team attendance, task completion, location pulse, and approval backlog in one view.',
    icon: Users,
  },
  {
    title: 'Employee Portal',
    description: 'Attendance status, assigned tasks, performance score, salary forecast, and certificates.',
    icon: IdCard,
  },
  {
    title: 'Performance Dashboard',
    description: 'Target achievement trends, AI scoring, and team leaderboard analytics for leaders.',
    icon: BarChart3,
  },
  {
    title: 'Security & Permission Console',
    description: 'Role permission matrix, audit logs, and access control automation for enterprise governance.',
    icon: ShieldCheck,
  },
];

export const FOOTER_LINKS = {
  company: [
    { label: 'About', href: '#home' },
    { label: 'Customers', href: '#testimonials' },
    { label: 'Careers', href: '/signup' },
    { label: 'Press', href: '/analytics?role=platform-admin' },
  ] as FooterLink[],
  product: [
    { label: 'Employee Portal', href: '/dashboard?role=employee' },
    { label: 'Attendance', href: '/attendance?role=hr-manager' },
    { label: 'Performance', href: '/performance?role=team-manager' },
    { label: 'Location Tracking', href: '/location?role=team-manager' },
    { label: 'Permission Control', href: '/permissions?role=platform-admin' },
  ] as FooterLink[],
  legal: [
    { label: 'Privacy Policy', href: '/settings?role=company-admin' },
    { label: 'Terms of Service', href: '/settings?role=company-admin' },
    { label: 'Security', href: '/permissions?role=platform-admin' },
    { label: 'Compliance', href: '/settings?role=company-admin' },
  ] as FooterLink[],
};

export const DASHBOARD_BULLETS = ['RBAC Governance', 'Live Work Tracking', 'GPS Monitoring', 'AI Performance'];

export const PRICING_BULLET_ICON = CheckCircle2;

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    title: 'Recruiter Marketplace',
    description: 'Collaborate with trusted recruiters and map hiring outcomes directly into workforce planning.',
    icon: Handshake,
  },
  {
    title: 'Global Talent Network',
    description: 'Access verified candidates across regions with AI ranking and role-fit recommendations.',
    icon: Globe,
  },
  {
    title: 'Enterprise Hiring Control',
    description: 'Apply budgets, SLA policies, and approval workflows across all hiring partners.',
    icon: Building2,
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', short: 'in', href: '#' },
  { label: 'X', short: 'x', href: '#' },
  { label: 'YouTube', short: 'yt', href: '#' },
  { label: 'Instagram', short: 'ig', href: '#' },
];

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'hrms',
    badge: 'Enterprise HRMS + Payroll',
    title: 'AI-Orchestrated Workforce Platform',
    subtitle: 'End-to-End Workforce Intelligence — From Hire to Retire',
    description: 'A complete workforce platform with attendance, payroll, performance, leave management, and recruitment — all backed by a BullMQ background engine, pgvector AI memory, and OpenTelemetry distributed tracing. Built for multi-tenant enterprise deployment from day one.',
    features: [
      'Payroll with BullMQ background processing',
      'pgvector semantic AI memory & recall',
      'Deterministic Governance with Forensic Replay',
      'Sovereign Multi-Party Quorum Overrides',
      'RFC 6238 TOTP 2FA with AES-256-GCM encryption',
      'SHA-256 refresh token family rotation',
      'Complexity-Bounded Adaptive Regulation',
    ],
    image: '/images/landing/hrms-ai.png',
  },
  {
    id: 'business-os',
    badge: 'ERP + CRM + Automation',
    title: 'Unified Enterprise Operating System',
    subtitle: 'One Platform — CRM, Finance, Procurement, Workflows',
    description: 'A multi-tenant business OS integrating CRM pipeline management, vendor procurement, financial reconciliation, and a 200+ workflow automation engine — orchestrated by an event-driven BullMQ architecture with Kubernetes Helm charts, HPA autoscaling, and full OpenTelemetry observability.',
    features: [
      'Kubernetes-ready Helm chart with HPA + PDB',
      'OpenTelemetry traces (HTTP, PG, Redis, AI calls)',
      'Prometheus /metrics endpoint',
      'dnd-kit drag-and-drop workflow canvas',
      'Webhook delivery with retry + dead-letter queues',
      'Tenant-isolated multi-company architecture',
    ],
    image: '/images/landing/business-os.png',
  },
];


