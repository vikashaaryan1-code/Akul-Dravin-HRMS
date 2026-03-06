import type { PlatformRole } from '@/types/platform';

export type PlatformAction =
  | 'dashboard.book-demo'
  | 'dashboard.export'
  | 'sales.import-leads'
  | 'sales.create-deal'
  | 'sales.move-pipeline'
  | 'documents.preview'
  | 'documents.download'
  | 'permissions.grant'
  | 'permissions.revoke'
  | 'settings.update-preferences'
  | 'helpdesk.resolve-ticket'
  | 'helpdesk.escalate-ticket'
  | 'procurement.create-po'
  | 'procurement.approve-po';

const ALL_NON_GUEST_ROLES: PlatformRole[] = [
  'platform-admin',
  'company-admin',
  'hr-manager',
  'team-manager',
  'team-leader',
  'sales-manager',
  'recruiter',
  'employee',
];

const ACTION_ACCESS: Record<PlatformAction, PlatformRole[]> = {
  'dashboard.book-demo': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager'],
  'dashboard.export': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager', 'recruiter'],

  'sales.import-leads': ['platform-admin', 'company-admin', 'hr-manager', 'sales-manager', 'recruiter'],
  'sales.create-deal': ['platform-admin', 'company-admin', 'sales-manager', 'team-manager', 'team-leader'],
  'sales.move-pipeline': ['platform-admin', 'company-admin', 'sales-manager', 'team-manager'],

  'documents.preview': ALL_NON_GUEST_ROLES,
  'documents.download': ALL_NON_GUEST_ROLES,

  'permissions.grant': ['platform-admin', 'company-admin', 'hr-manager'],
  'permissions.revoke': ['platform-admin', 'company-admin', 'hr-manager'],

  'settings.update-preferences': ALL_NON_GUEST_ROLES,

  'helpdesk.resolve-ticket': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'team-leader'],
  'helpdesk.escalate-ticket': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager'],

  'procurement.create-po': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager'],
  'procurement.approve-po': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager'],
};

export const canPerformAction = (role: PlatformRole, action: PlatformAction) =>
  ACTION_ACCESS[action]?.includes(role) ?? false;
