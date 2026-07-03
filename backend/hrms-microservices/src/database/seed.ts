/**
 * Akul Dravin HRMS — Enterprise Demo Seed
 *
 * Creates a richly realistic multi-tenant demo environment that demonstrates
 * the full platform capability when a prospect clicks "Enter Platform".
 *
 * What is seeded:
 *   - 3 tenant companies (tech, staffing, retail)
 *   - 35 employees across departments with realistic Indian names & salaries
 *   - 90 days of attendance history (weekday-aware)
 *   - 8 projects with 80 realistic tasks (real titles, not "Task 0")
 *   - Wallets + 8 transaction history entries per employee
 *   - 4 completed payroll batches + 1 pending (current month)
 *   - Performance records for all employees (last 3 months)
 *   - Loans (10% of employees)
 *   - Invoices (5 per company)
 *
 * Run: npm run seed
 * Safe to re-run: uses upsert patterns, does NOT wipe DB by default.
 * Pass --fresh to drop and recreate schema (dev only).
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { CompanyEntity } from './entities/company.entity';
import { EmployeeEntity } from './entities/employee.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { AnalyticsEventEntity } from './entities/analytics-event.entity';
import { ProjectEntity } from './entities/project.entity';
import { TaskEntity } from './entities/task.entity';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { LoanEntity } from './entities/loan.entity';
import { PerformanceEntity } from './entities/performance.entity';
import { PayrollBatchEntity, PayrollBatchStatus } from './entities/payroll-batch.entity';
import { PayrollItemEntity, PayrollItemExecutionStatus } from './entities/payroll-item.entity';
import { LedgerTransactionEntity } from './entities/ledger-transaction.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { WhiteLabelConfigEntity } from './entities/white-label-config.entity';
import { LeaveTypeEntity } from './entities/leave-type.entity';
import { LeaveRequestEntity } from './entities/leave-request.entity';
import { SalesCommissionEntity } from './entities/sales-commission.entity';
import { SalesTargetEntity } from './entities/sales-target.entity';
import { SalesLeadEntity } from './entities/sales-lead.entity';
import { SalesDealEntity } from './entities/sales-deal.entity';

dotenv.config();

const isFresh = process.argv.includes('--fresh');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: 'postgres',
  password: '', // Connect as superuser to bypass RLS policies
  database: process.env.DB_NAME || 'akul_dravin_hrms',
  entities: [
    CompanyEntity, EmployeeEntity, AttendanceEntity, AnalyticsEventEntity,
    ProjectEntity, TaskEntity, WalletEntity, TransactionEntity,
    InvoiceEntity, LoanEntity, PerformanceEntity, PayrollBatchEntity, PayrollItemEntity,
    LedgerTransactionEntity, SubscriptionEntity, WhiteLabelConfigEntity, LeaveTypeEntity, LeaveRequestEntity,
    SalesCommissionEntity, SalesTargetEntity, SalesLeadEntity, SalesDealEntity
  ],
  synchronize: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function monthsAgo(n: number) { const d = new Date(); d.setMonth(d.getMonth() - n); return d; }
function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6; }

const FIRST_NAMES = [
  'Arjun', 'Sanya', 'Kabir', 'Zoya', 'Ishaan', 'Aria', 'Advait', 'Myra',
  'Vihaan', 'Kaira', 'Rohan', 'Priya', 'Karan', 'Nisha', 'Aditya',
  'Sneha', 'Rahul', 'Meera', 'Vijay', 'Pooja', 'Nikhil', 'Riya',
  'Suresh', 'Ananya', 'Deepak',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Kapoor', 'Malhotra',
  'Sethi', 'Bose', 'Nair', 'Pillai', 'Mehta', 'Joshi', 'Singh', 'Kumar',
  'Shetty', 'Patel', 'Rao', 'Menon', 'Ghosh',
];
const DESIGNATIONS_BY_DEPT: Record<string, string[]> = {
  Engineering: ['Senior Engineer', 'Lead Engineer', 'Staff Engineer', 'Engineering Manager', 'Principal Engineer'],
  Product: ['Product Manager', 'Senior PM', 'Associate PM', 'Director of Product'],
  Design: ['UI/UX Designer', 'Senior Designer', 'Design Lead', 'Motion Designer'],
  HR: ['HR Business Partner', 'Talent Acquisition Lead', 'HR Manager', 'People Ops Specialist'],
  Finance: ['Finance Analyst', 'Senior Accountant', 'CFO', 'Finance Controller'],
  Sales: ['Account Executive', 'Sales Manager', 'Business Development Lead', 'Enterprise AE'],
  Operations: ['Operations Analyst', 'Operations Manager', 'Process Lead', 'COO'],
};
const DEPTS = Object.keys(DESIGNATIONS_BY_DEPT);

// Realistic project data
const PROJECT_TEMPLATES = [
  { name: 'HRMS Platform v2.0', description: 'Next-generation workforce management with AI-powered insights' },
  { name: 'CRM Revenue Intelligence', description: 'End-to-end sales pipeline automation and forecasting engine' },
  { name: 'Mobile Employee Portal', description: 'Native iOS/Android app for employee self-service workflows' },
  { name: 'Payroll Compliance Engine', description: 'Automated statutory compliance: PF, ESIC, TDS, PT' },
  { name: 'AI Workforce Insights', description: 'pgvector-powered semantic search and predictive analytics' },
  { name: 'Multi-Tenant Infrastructure', description: 'Kubernetes-ready tenant isolation and provisioning layer' },
  { name: 'Recruitment Marketplace', description: 'Partner recruiter network with AI candidate ranking' },
  { name: 'Document Generation Suite', description: '150+ smart templates: offer letters, payslips, certificates' },
];

// Realistic task titles per project
const TASK_TITLES: Record<string, string[]> = {
  'HRMS Platform v2.0': [
    'Design attendance module API', 'Implement leave balance calculation', 'Build shift scheduling UI',
    'Add bulk employee import', 'Integrate biometric device sync', 'QA payroll edge cases',
    'Write employee onboarding workflow', 'Optimize dashboard query performance',
  ],
  'CRM Revenue Intelligence': [
    'Build pipeline stage drag-and-drop', 'Integrate email tracking', 'Design deal forecast model',
    'Implement lead scoring algorithm', 'Create revenue dashboard charts', 'Add webhook deal triggers',
    'CRM-HRMS commission link', 'Automate follow-up reminder queue',
  ],
  'Mobile Employee Portal': [
    'Design splash screen + onboarding', 'Implement biometric login', 'Build attendance check-in screen',
    'Create leave request flow', 'Add payslip PDF viewer', 'Implement push notifications',
    'Offline mode sync queue', 'App Store submission checklist',
  ],
  'Payroll Compliance Engine': [
    'PF calculation module', 'TDS slab computation', 'ESIC eligibility check',
    'Professional tax state rules', 'Payslip PDF generation', 'Bank file NEFT format export',
    'Statutory report automation', 'Year-end Form 16 generation',
  ],
  'AI Workforce Insights': [
    'pgvector schema migration', 'OpenAI embedding pipeline', 'Semantic employee search',
    'Attrition risk scoring model', 'AI chat context memory', 'Performance prediction model',
    'Workforce analytics dashboard', 'Insight notification BullMQ job',
  ],
  'Multi-Tenant Infrastructure': [
    'Helm chart production values', 'HPA autoscaling policies', 'Tenant DB isolation layer',
    'Redis cluster configuration', 'OTel trace propagation', 'PodDisruptionBudget setup',
    'Zero-downtime deployment pipeline', 'Health probe endpoints',
  ],
  'Recruitment Marketplace': [
    'Recruiter onboarding flow', 'Job posting API', 'Candidate ranking algorithm',
    'ATS integration webhook', 'Interview scheduling calendar', 'Offer letter automation',
    'Recruiter commission tracking', 'Talent pipeline dashboard',
  ],
  'Document Generation Suite': [
    'Offer letter template engine', 'Payslip dynamic layout', 'Experience certificate generator',
    'Relieving letter automation', 'ID card design system', 'Appointment letter workflow',
    'NOC document template', 'Bulk document generation queue',
  ],
};

// ── Companies ────────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    tenantCode: 'AKUL-FINANCE',
    legalName: 'Akul Dravin Finance Pvt Ltd',
    displayName: 'Akul Dravin Finance',
    industry: 'Financial Services',
    country: 'India',
    employeeCount: 20,
    baseSalaryRange: [60000, 300000] as [number, number],
  },
  {
    tenantCode: 'AKUL-SCHOOL',
    legalName: 'Akul Dravin School',
    displayName: 'Akul Dravin School',
    industry: 'Education',
    country: 'India',
    employeeCount: 15,
    baseSalaryRange: [30000, 150000] as [number, number],
  },
  {
    tenantCode: 'AKUL-AYURVEDA',
    legalName: 'Akul Dravin Ayurveda',
    displayName: 'Akul Dravin Ayurveda',
    industry: 'Wellness & Healthcare',
    country: 'India',
    employeeCount: 15,
    baseSalaryRange: [30000, 120000] as [number, number],
  },
  {
    tenantCode: 'AKUL-DIGITAL',
    legalName: 'Akul Dravin Digital World',
    displayName: 'Akul Dravin Digital World',
    industry: 'Digital Marketing & IT',
    country: 'India',
    employeeCount: 18,
    baseSalaryRange: [70000, 350000] as [number, number],
  },
  {
    tenantCode: 'AKUL-HRMS',
    legalName: 'Akul Dravin HRMS',
    displayName: 'Akul Dravin HRMS',
    industry: 'HR Tech',
    country: 'India',
    employeeCount: 12,
    baseSalaryRange: [80000, 400000] as [number, number],
  },
  {
    tenantCode: 'AKUL-LOGISTICS',
    legalName: 'Akul Dravin Logistics',
    displayName: 'Akul Dravin Logistics',
    industry: 'Supply Chain & Transport',
    country: 'India',
    employeeCount: 25,
    baseSalaryRange: [25000, 90000] as [number, number],
  },
  {
    tenantCode: 'AKUL-REALESTATE',
    legalName: 'Akul Dravin Real Estate',
    displayName: 'Akul Dravin Real Estate',
    industry: 'Real Estate & Construction',
    country: 'India',
    employeeCount: 15,
    baseSalaryRange: [50000, 250000] as [number, number],
  },
  {
    tenantCode: 'AKUL-HEALTHCARE',
    legalName: 'Akul Dravin Healthcare',
    displayName: 'Akul Dravin Healthcare',
    industry: 'Clinics & Diagnostics',
    country: 'India',
    employeeCount: 20,
    baseSalaryRange: [40000, 200000] as [number, number],
  },
  {
    tenantCode: 'AKUL-FRANCHISE',
    legalName: 'Akul Dravin Franchise Network',
    displayName: 'Akul Dravin Franchise Network',
    industry: 'Franchise Operations',
    country: 'India',
    employeeCount: 10,
    baseSalaryRange: [45000, 180000] as [number, number],
  },
];

// ── Transaction categories ────────────────────────────────────────────────────

const TX_TEMPLATES = [
  { type: 'CREDIT' as const, category: 'SALARY', description: 'Monthly salary credit' },
  { type: 'CREDIT' as const, category: 'PERFORMANCE_BONUS', description: 'Q4 performance incentive' },
  { type: 'CREDIT' as const, category: 'PROJECT_ALLOWANCE', description: 'Project completion allowance' },
  { type: 'DEBIT' as const, category: 'TDS_DEDUCTION', description: 'TDS deduction - Section 192' },
  { type: 'DEBIT' as const, category: 'PF_DEDUCTION', description: 'Employee PF contribution' },
  { type: 'DEBIT' as const, category: 'ESIC_DEDUCTION', description: 'ESIC premium deduction' },
  { type: 'CREDIT' as const, category: 'REIMBURSEMENT', description: 'Travel expense reimbursement' },
  { type: 'DEBIT' as const, category: 'LOAN_EMI', description: 'Salary advance EMI recovery' },
];

// ── Invoice clients ───────────────────────────────────────────────────────────

const INVOICE_CLIENTS = [
  'InfraCloud Systems', 'Zenith Analytics Pvt Ltd', 'FutureTech Global',
  'Meridian Consulting', 'BluePeak Ventures', 'CoreEdge Software',
  'QuantumOps Ltd', 'Velox Digital', 'Apex Workforce Solutions', 'Kratos Enterprises',
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('\n🚀 Akul Dravin HRMS — Enterprise Demo Seed\n');

    if (isFresh) {
      console.log('⚠️  --fresh flag detected: wiping and recreating schema...');
      const clean = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'akul_dravin_hrms',
        entities: [],
        synchronize: false,
      });
      await clean.initialize();
      await clean.query(`
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
            FOR r IN (SELECT typname FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
                EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            END LOOP;
        END $$;
      `);
      await clean.destroy();
      console.log('✅ Schema wiped\n');
    }

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const companyRepo      = AppDataSource.getRepository(CompanyEntity);
    const employeeRepo     = AppDataSource.getRepository(EmployeeEntity);
    const attendanceRepo   = AppDataSource.getRepository(AttendanceEntity);
    const projectRepo      = AppDataSource.getRepository(ProjectEntity);
    const taskRepo         = AppDataSource.getRepository(TaskEntity);
    const walletRepo       = AppDataSource.getRepository(WalletEntity);
    const transactionRepo  = AppDataSource.getRepository(TransactionEntity);
    const invoiceRepo      = AppDataSource.getRepository(InvoiceEntity);
    const loanRepo         = AppDataSource.getRepository(LoanEntity);
    const performanceRepo  = AppDataSource.getRepository(PerformanceEntity);
    const payrollBatchRepo = AppDataSource.getRepository(PayrollBatchEntity);
    const payrollItemRepo  = AppDataSource.getRepository(PayrollItemEntity);
    const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);
    const whiteLabelRepo   = AppDataSource.getRepository(WhiteLabelConfigEntity);
    const leaveTypeRepo    = AppDataSource.getRepository(LeaveTypeEntity);
    const leaveRequestRepo = AppDataSource.getRepository(LeaveRequestEntity);
    const salesCommissionRepo = AppDataSource.getRepository(SalesCommissionEntity);
    const salesTargetRepo = AppDataSource.getRepository(SalesTargetEntity);
    const salesLeadRepo = AppDataSource.getRepository(SalesLeadEntity);
    const salesDealRepo = AppDataSource.getRepository(SalesDealEntity);

    let totalEmployees = 0;

    for (const companyDef of COMPANIES) {
      console.log(`\n🏢 Seeding company: ${companyDef.displayName}`);

      // ── Company ────────────────────────────────────────────────────────────
      let company = await companyRepo.findOne({ where: { tenantCode: companyDef.tenantCode } });
      if (!company) {
        const newId = crypto.randomUUID();
        company = companyRepo.create({
          id: newId,
          tenantId: newId,
          tenantCode: companyDef.tenantCode,
          legalName: companyDef.legalName,
          displayName: companyDef.displayName,
          industry: companyDef.industry,
          country: companyDef.country,
          status: 'active',
        });
        await companyRepo.save(company);
      }
      const tenantId = company.id;

      // ── Subscription ────────────────────────────────────────────────────────
      let subscription = await subscriptionRepo.findOne({ where: { tenantId } });
      if (!subscription) {
        subscription = subscriptionRepo.create({
          tenantId,
          companyId: tenantId,
          planName: 'Enterprise SaaS HRMS Plus',
          billingCycle: 'monthly',
          price: '29999.00',
          features: { recruitment: true, performance: true, sales: true, lms: true },
          startDate: daysAgo(120).toISOString().split('T')[0],
          status: 'active',
        });
        await subscriptionRepo.save(subscription);
      }

      // ── White Label Config ───────────────────────────────────────────────────
      let whiteLabel = await whiteLabelRepo.findOne({ where: { tenantId } });
      if (!whiteLabel) {
        whiteLabel = whiteLabelRepo.create({
          tenantId,
          brandName: companyDef.displayName,
          primaryColor: '#FF6B35', // Akul Dravin Brand Color
          secondaryColor: '#FFD700',
          accentColor: '#00D4FF',
          customDomain: `${companyDef.tenantCode.toLowerCase()}.akuldravin.com`,
        });
        await whiteLabelRepo.save(whiteLabel);
      }

      // ── Projects ───────────────────────────────────────────────────────────
      console.log(`  📂 Seeding ${PROJECT_TEMPLATES.length} projects...`);
      const seededProjects: ProjectEntity[] = [];
      for (const tpl of PROJECT_TEMPLATES) {
        let project = await projectRepo.findOne({ where: { name: tpl.name, tenantId } });
        if (!project) {
          project = projectRepo.create({ name: tpl.name, description: tpl.description, tenantId });
          await projectRepo.save(project);
        }
        seededProjects.push(project);
      }

      // ── Employees ──────────────────────────────────────────────────────────
      console.log(`  👥 Seeding ${companyDef.employeeCount} employees...`);
      const seededEmployees: EmployeeEntity[] = [];
      const [salMin, salMax] = companyDef.baseSalaryRange;

      for (let i = 0; i < companyDef.employeeCount; i++) {
        const prefix = companyDef.tenantCode.split('-')[1]?.substring(0, 3) || 'EMP';
        const code = `${prefix}-EMP${String(i + 1).padStart(3, '0')}`;
        let emp = await employeeRepo.findOne({ where: { employeeCode: code, tenantId } });
        if (!emp) {
          const dept = DEPTS[i % DEPTS.length];
          const firstName = FIRST_NAMES[(totalEmployees + i) % FIRST_NAMES.length];
          const lastName = LAST_NAMES[(totalEmployees + i) % LAST_NAMES.length];
          const designation = pick(DESIGNATIONS_BY_DEPT[dept]);
          const ctc = rnd(salMin, salMax);

          emp = employeeRepo.create({
            firstName,
            lastName,
            workEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDef.tenantCode.toLowerCase()}.in`,
            employeeCode: code,
            designation,
            monthlyCtc: ctc.toString(),
            joinDate: daysAgo(rnd(90, 730)).toISOString().split('T')[0],
            tenantId,
            companyId: tenantId,
          });
          await employeeRepo.save(emp);
        }
        seededEmployees.push(emp);
      }
      totalEmployees += companyDef.employeeCount;

      // ── Attendance (90 days) ───────────────────────────────────────────────
      console.log(`  🕒 Seeding 90 days attendance for ${seededEmployees.length} employees...`);
      for (const emp of seededEmployees) {
        for (let d = 0; d < 90; d++) {
          const date = daysAgo(d);
          if (isWeekend(date)) continue;
          const dateStr = date.toISOString().split('T')[0];

          const exists = await attendanceRepo.findOne({ where: { employeeId: emp.id, attendanceDate: dateStr, tenantId } });
          if (!exists) {
            const roll = Math.random();
            const status = roll > 0.08 ? 'present' : roll > 0.04 ? 'leave' : 'absent';
            const checkIn = status === 'present' ? new Date(new Date(date).setHours(rnd(8, 10), rnd(0, 59), 0)) : null;
            const checkOut = status === 'present' ? new Date(new Date(date).setHours(rnd(17, 20), rnd(0, 59), 0)) : null;

            await attendanceRepo.save(attendanceRepo.create({
              employeeId: emp.id, attendanceDate: dateStr,
              checkInAt: checkIn, checkOutAt: checkOut, status, tenantId,
            }));
          }
        }
      }

      // ── Leave Types ────────────────────────────────────────────────────────
      console.log(`  🌴 Seeding 3 leave types...`);
      const leaveTypes = [
        { code: 'CL', name: 'Casual Leave', days: '12.00', carry: '0.00', paid: true },
        { code: 'SL', name: 'Sick Leave', days: '8.00', carry: '0.00', paid: true },
        { code: 'EL', name: 'Earned Leave', days: '18.00', carry: '18.00', paid: true },
      ];
      const seededLeaveTypes: LeaveTypeEntity[] = [];
      for (const lt of leaveTypes) {
        let type = await leaveTypeRepo.findOne({ where: { leaveCode: lt.code, tenantId } });
        if (!type) {
          type = leaveTypeRepo.create({
            tenantId,
            companyId: tenantId,
            leaveCode: lt.code,
            leaveName: lt.name,
            daysPerYear: lt.days,
            carryForwardLimit: lt.carry,
            encashable: lt.code === 'EL',
            isActive: true,
          });
          await leaveTypeRepo.save(type);
        }
        seededLeaveTypes.push(type);
      }

      // ── Leave Requests ─────────────────────────────────────────────────────
      console.log(`  📝 Seeding leave requests...`);
      for (const emp of seededEmployees) {
        const hasLeave = Math.random() > 0.5;
        if (hasLeave) {
          const lType = pick(seededLeaveTypes);
          const status = pick(['approved', 'pending', 'rejected']);
          const days = rnd(1, 4);
          const start = daysAgo(rnd(5, 60));
          const end = new Date(start);
          end.setDate(end.getDate() + days - 1);

          const exists = await leaveRequestRepo.findOne({ where: { employeeId: emp.id, startDate: start.toISOString().split('T')[0] } });
          if (!exists) {
            await leaveRequestRepo.save(leaveRequestRepo.create({
              tenantId,
              employeeId: emp.id,
              leaveTypeId: lType.id,
              startDate: start.toISOString().split('T')[0],
              endDate: end.toISOString().split('T')[0],
              totalDays: days.toString(),
              status,
              reason: 'Personal reasons',
              approvedBy: status !== 'pending' ? emp.id : null,
              approvedAt: status !== 'pending' ? new Date() : null,
            }));
          }
        }
      }

      // ── Tasks ──────────────────────────────────────────────────────────────
      console.log(`  ✅ Seeding tasks across ${seededProjects.length} projects...`);
      for (const project of seededProjects) {
        const titles = TASK_TITLES[project.name] ?? [];
        for (let t = 0; t < titles.length; t++) {
          const title = titles[t];
          const exists = await taskRepo.findOne({ where: { title, tenantId } });
          if (!exists) {
            const roll = Math.random();
            const status = roll > 0.5 ? 'completed' : roll > 0.25 ? 'in_progress' : 'pending';
            await taskRepo.save(taskRepo.create({
              title,
              description: `Part of ${project.name} sprint`,
              status,
              priority: (['high', 'medium', 'low'] as const)[t % 3],
              projectId: project.id,
              assigneeId: seededEmployees[t % seededEmployees.length].id,
              dueDate: new Date(Date.now() + (rnd(-10, 20)) * 86400000).toISOString(),
              tenantId,
            }));
          }
        }
      }

      // ── Wallets & Transactions ─────────────────────────────────────────────
      console.log(`  💰 Seeding wallets & transactions...`);
      for (const emp of seededEmployees) {
        let wallet = await walletRepo.findOne({ where: { employeeId: emp.id, tenantId } });
        if (!wallet) {
          wallet = walletRepo.create({ employeeId: emp.id, tenantId, balance: '0', currency: 'INR' });
          await walletRepo.save(wallet);
        }

        const existingTx = await transactionRepo.count({ where: { walletId: wallet.id } });
        if (existingTx === 0) {
          let balance = 0;
          const ctc = parseFloat(emp.monthlyCtc || '60000');

          for (let m = 0; m < 8; m++) {
            const tpl = TX_TEMPLATES[m % TX_TEMPLATES.length];
            const amount = tpl.type === 'CREDIT'
              ? tpl.category === 'SALARY' ? ctc : rnd(2000, 15000)
              : tpl.category === 'TDS_DEDUCTION' ? Math.round(ctc * 0.1) : rnd(1000, 5000);

            await transactionRepo.save(transactionRepo.create({
              walletId: wallet.id, tenantId,
              amount: amount.toString(),
              type: tpl.type,
              category: tpl.category,
              description: tpl.description,
              createdAt: daysAgo(m * 12),
            }));
            balance += tpl.type === 'CREDIT' ? amount : -amount;
          }
          wallet.balance = Math.max(0, balance).toString();
          await walletRepo.save(wallet);
        }
      }

      // ── Performance Records ────────────────────────────────────────────────
      console.log(`  📊 Seeding performance records...`);
      for (const emp of seededEmployees) {
        for (let m = 1; m <= 3; m++) {
          const period = monthsAgo(m).toISOString().slice(0, 7); // YYYY-MM
          const exists = await performanceRepo.findOne({ where: { employeeId: emp.id, tenantId } });
          if (!exists) {
            const objScore = rnd(60, 100);
            const subScore = rnd(60, 100);
            const finScore = Math.round((objScore * 0.7 + subScore * 0.3) * 100) / 100;
            await performanceRepo.save(performanceRepo.create({
              employeeId: emp.id, 
              tenantId,
              reviewPeriod: period,
              objectiveScore: objScore,
              subjectiveScore: subScore,
              finalScore: finScore,
              managerComments: `Monthly review for ${period}`,
              status: 'approved',
            }));
            break; // One performance record per employee to avoid constraint violations
          }
        }
      }

      // ── Loans (10% of employees) ───────────────────────────────────────────
      const loanEligible = seededEmployees.filter((_, i) => i % 10 === 0);
      if (loanEligible.length > 0) {
        console.log(`  🏦 Seeding ${loanEligible.length} loans...`);
        for (const emp of loanEligible) {
          const exists = await loanRepo.findOne({ where: { employeeId: emp.id, tenantId } });
          if (!exists) {
            const principal = rnd(50000, 300000);
            await loanRepo.save(loanRepo.create({
              employeeId: emp.id, 
              tenantId,
              employeeCode: emp.employeeCode,
              amount: principal.toString(),
              purpose: 'Personal Emergency / Salary Advance',
              tenure: 24,
              status: 'DISBURSED',
              riskScore: 'LOW',
              appliedAt: daysAgo(rnd(90, 180)),
            }));
          }
        }
      }

      // ── Invoices ───────────────────────────────────────────────────────────
      console.log(`  📄 Seeding 5 invoices...`);
      for (let i = 0; i < 5; i++) {
        const prefix = companyDef.tenantCode.split('-')[1]?.substring(0, 3) || 'COM';
        const invoiceNum = `INV-${prefix}-2025-${String(i + 1).padStart(3, '0')}`;
        const exists = await invoiceRepo.findOne({ where: { invoiceNumber: invoiceNum, tenantId } });
        if (!exists) {
          const amount = rnd(50000, 500000);
          await invoiceRepo.save(invoiceRepo.create({
            invoiceNumber: invoiceNum,
            tenantId,
            subscriptionId: subscription.id,
            amount: amount.toString(),
            status: (['paid', 'pending', 'overdue'] as const)[i % 3],
            dueDate: daysAgo(rnd(-30, 5)).toISOString().split('T')[0],
          }));
        }
      }

      // ── Payroll Batches (5 months: 4 approved + 1 current draft) ──────────
      console.log(`  🗓️  Seeding 5 payroll batches...`);
      const now = new Date();
      for (let m = 0; m <= 4; m++) {
        const batchDate = monthsAgo(m);
        const year = batchDate.getFullYear();
        const month = batchDate.getMonth() + 1;
        const isCurrentMonth = m === 0;

        let batch = await payrollBatchRepo.findOne({ where: { year, month, tenantId } });
        if (!batch) {
          const batchStatus = isCurrentMonth ? PayrollBatchStatus.DRAFT : PayrollBatchStatus.COMPLETED;

          batch = payrollBatchRepo.create({
            year, month, tenantId,
            status: batchStatus,
            totalGross: '0', totalDeductions: '0', totalNet: '0',
          });
          await payrollBatchRepo.save(batch);

          const items = seededEmployees.map(emp => {
            const gross = parseFloat(emp.monthlyCtc || '60000');
            const pf = Math.round(gross * 0.12);
            const tds = Math.round(gross * 0.1);
            const deductions = pf + tds;
            const net = gross - deductions;
            return payrollItemRepo.create({
              tenantId,
              batchId: batch!.id,
              employeeId: emp.id,
              grossSalary: gross.toFixed(2),
              deductions: deductions.toFixed(2),
              netPayable: net.toFixed(2),
              calculationStatus: 'calculated',
              executionStatus: isCurrentMonth
                ? PayrollItemExecutionStatus.PENDING
                : PayrollItemExecutionStatus.SUCCESS,
            });
          });
          await payrollItemRepo.save(items);

          const totalGross = items.reduce((s, i) => s + parseFloat(i.grossSalary), 0);
          const totalNet = items.reduce((s, i) => s + parseFloat(i.netPayable), 0);
          batch.totalGross = totalGross.toFixed(2);
          batch.totalNet = totalNet.toFixed(2);
          batch.totalDeductions = (totalGross - totalNet).toFixed(2);
          await payrollBatchRepo.save(batch);
        }
      }

      console.log(`  ✅ ${companyDef.displayName} seeded successfully`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   Akul Dravin HRMS — Seed Complete             ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log(`║  Companies:    ${COMPANIES.length}                               ║`);
    console.log(`║  Employees:    ${totalEmployees} across ${COMPANIES.length} tenants            ║`);
    console.log(`║  Projects:     ${PROJECT_TEMPLATES.length} per company                    ║`);
    console.log(`║  Attendance:   90 days per employee (weekdays) ║`);
    console.log(`║  Leaves:       3 types & mock requests         ║`);
    console.log(`║  Payroll:      5 batches per company           ║`);
    console.log(`║  Transactions: 8 per employee wallet           ║`);
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log('👉 Login credentials:');
    console.log('   Platform Admin: admin@akuldravin.com / Admin@123!');
    console.log('   HR Manager:     hr@akuldravin.com   / Admin@123!');
    console.log('   Demo Employee:  arjun.sharma@akul-tech-in.in / Admin@123!\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
