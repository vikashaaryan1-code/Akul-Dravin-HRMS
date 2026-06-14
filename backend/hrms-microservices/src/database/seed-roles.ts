import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: 'postgres',
  password: '', // Connect as superuser
  database: process.env.DB_NAME || 'akul_dravin_hrms',
  entities: [RoleEntity, PermissionEntity],
  synchronize: true,
});

const DEFAULT_PERMISSIONS = [
  { slug: 'view_all_employees', name: 'View All Employees', description: 'Can view all employees across the organization' },
  { slug: 'run_payroll', name: 'Run Payroll', description: 'Can execute payroll batches' },
  { slug: 'view_payroll_others', name: 'View Payroll of Others', description: 'Can view payslips of other employees' },
  { slug: 'approve_leave', name: 'Approve Leave', description: 'Can approve or reject leave requests' },
  { slug: 'create_job_postings', name: 'Create Job Postings', description: 'Can create and publish jobs' },
  { slug: 'view_ai_analytics_full', name: 'View Full AI Analytics', description: 'Full access to global AI analytics' },
  { slug: 'view_ai_analytics_company', name: 'View Company AI Analytics', description: 'Access to company-level AI analytics' },
  { slug: 'view_ai_analytics_dept', name: 'View Dept AI Analytics', description: 'Access to department-level AI analytics' },
  { slug: 'view_ai_analytics_team', name: 'View Team AI Analytics', description: 'Access to team-level AI analytics' },
  { slug: 'access_white_label', name: 'Access White Label', description: 'Can manage white label configurations' },
  { slug: 'configure_ai_rules_global', name: 'Configure Global AI Rules', description: 'Manage global AI configurations' },
  { slug: 'configure_ai_rules_company', name: 'Configure Company AI Rules', description: 'Manage company AI configurations' },
  { slug: 'generate_offer_letters', name: 'Generate Offer Letters', description: 'Can generate and send offer letters' },
  { slug: 'view_compliance_dashboard', name: 'View Compliance Dashboard', description: 'Can view compliance metrics' },
];

const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    description: 'Level 1: All companies, all branches, all data',
    isSystemRole: true,
    permissions: ['view_all_employees', 'run_payroll', 'view_payroll_others', 'approve_leave', 'create_job_postings', 'view_ai_analytics_full', 'access_white_label', 'configure_ai_rules_global', 'generate_offer_letters', 'view_compliance_dashboard'],
  },
  {
    name: 'Company Admin',
    description: 'Level 3: One company, all branches',
    isSystemRole: true,
    permissions: ['view_all_employees', 'run_payroll', 'view_payroll_others', 'approve_leave', 'create_job_postings', 'view_ai_analytics_company', 'configure_ai_rules_company', 'generate_offer_letters', 'view_compliance_dashboard'],
  },
  {
    name: 'HR Manager',
    description: 'Level 4: One company or branch',
    isSystemRole: true,
    permissions: ['view_all_employees', 'run_payroll', 'view_payroll_others', 'approve_leave', 'create_job_postings', 'view_ai_analytics_dept', 'generate_offer_letters', 'view_compliance_dashboard'],
  },
  {
    name: 'Team Leader',
    description: 'Level 5: Own team members only',
    isSystemRole: true,
    permissions: ['approve_leave', 'view_ai_analytics_team'],
  },
  {
    name: 'Employee',
    description: 'Level 6: Base level access',
    isSystemRole: true,
    permissions: [],
  },
];

async function seedRoles() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected for role seeding');

    const permRepo = AppDataSource.getRepository(PermissionEntity);
    const roleRepo = AppDataSource.getRepository(RoleEntity);

    // 1. Seed Permissions
    const permMap = new Map<string, PermissionEntity>();
    for (const p of DEFAULT_PERMISSIONS) {
      let perm = await permRepo.findOne({ where: { slug: p.slug } });
      if (!perm) {
        perm = permRepo.create(p);
        await permRepo.save(perm);
      }
      permMap.set(perm.slug, perm);
    }
    console.log('✅ Permissions seeded');

    // 2. Seed Roles
    for (const r of DEFAULT_ROLES) {
      let role = await roleRepo.findOne({ where: { name: r.name } });
      if (!role) {
        role = roleRepo.create({
          name: r.name,
          description: r.description,
          isSystemRole: r.isSystemRole,
          tenantId: '00000000-0000-0000-0000-000000000000', // Use zero-UUID for system roles
        });
      }
      
      const permissionsToAssign = r.permissions.map(slug => permMap.get(slug)).filter(Boolean) as PermissionEntity[];
      role.permissions = permissionsToAssign;
      
      await roleRepo.save(role);
    }
    console.log('✅ Roles seeded');

  } catch (error) {
    console.error('❌ Role seed failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seedRoles();
