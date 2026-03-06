import { Injectable, NotFoundException } from '@nestjs/common';

type PermissionRoleRecord = {
  id: string;
  roleName: string;
  canView: string;
  canEdit: string;
  canApprove: string;
  canAccessReports: string;
};

type PermissionAuditRecord = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
};

@Injectable()
export class PermissionControlService {
  private roles: PermissionRoleRecord[] = [
    {
      id: 'PRM-1',
      roleName: 'Platform Super Admin',
      canView: 'All modules',
      canEdit: 'All modules',
      canApprove: 'Global approvals',
      canAccessReports: 'Executive + Audit',
    },
    {
      id: 'PRM-2',
      roleName: 'Company Admin',
      canView: 'Company scope',
      canEdit: 'Company scope',
      canApprove: 'Company approvals',
      canAccessReports: 'Org + Compliance',
    },
    {
      id: 'PRM-3',
      roleName: 'HR Manager',
      canView: 'HR + Payroll + Docs',
      canEdit: 'HR operations',
      canApprove: 'Leave + HR requests',
      canAccessReports: 'HR analytics',
    },
    {
      id: 'PRM-4',
      roleName: 'Team Manager',
      canView: 'Team data',
      canEdit: 'Tasks + schedules',
      canApprove: 'Timesheets',
      canAccessReports: 'Team performance',
    },
    {
      id: 'PRM-5',
      roleName: 'Guest',
      canView: 'Approved read-only pages',
      canEdit: 'None',
      canApprove: 'None',
      canAccessReports: 'Limited shared',
    },
  ];

  private audits: PermissionAuditRecord[] = [
    {
      id: 'AUD-1',
      actor: 'Platform Super Admin',
      action: 'Granted Performance Dashboard access to Team Manager role',
      timestamp: '2026-03-05T09:30:00.000Z',
    },
    {
      id: 'AUD-2',
      actor: 'Company Admin',
      action: 'Revoked payroll edit access from Team Leader role',
      timestamp: '2026-03-05T08:50:00.000Z',
    },
    {
      id: 'AUD-3',
      actor: 'HR Manager',
      action: 'Enabled attendance approval permission for Sales Manager role',
      timestamp: '2026-03-05T08:12:00.000Z',
    },
  ];

  getRoles() {
    return this.roles;
  }

  getAudits() {
    return this.audits;
  }

  updateRole(id: string, payload: Partial<PermissionRoleRecord>) {
    const role = this.roles.find((item) => item.id === id);

    if (!role) {
      throw new NotFoundException('Role permission record not found');
    }

    Object.assign(role, payload);

    this.audits.unshift({
      id: `AUD-${Date.now()}`,
      actor: 'Permission API',
      action: `Updated permission template for ${role.roleName}`,
      timestamp: new Date().toISOString(),
    });

    this.audits = this.audits.slice(0, 100);

    return role;
  }
}
