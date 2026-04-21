import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
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
import { PayrollBatchEntity } from './entities/payroll-batch.entity';
import { PayrollItemEntity } from './entities/payroll-item.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'akul_dravin_hrms',
  entities: [
    CompanyEntity, 
    EmployeeEntity, 
    AttendanceEntity, 
    AnalyticsEventEntity,
    ProjectEntity,
    TaskEntity,
    WalletEntity,
    TransactionEntity,
    InvoiceEntity,
    LoanEntity,
    PerformanceEntity,
    PayrollBatchEntity,
    PayrollItemEntity
  ],
  synchronize: true,
});

async function seed() {
  try {
    console.log('🌱 Starting OMNIX High-Fidelity Database Seeding...');
    
    // PERFORM A CLEAN WIPE: Ensure a fresh state for high-certainty seeding
    const resetDataSource = new DataSource({
      ...AppDataSource.options,
      synchronize: false,
    });
    await resetDataSource.initialize();
    console.log('🧹 Cleaning database for fresh OMNIX installation...');
    await resetDataSource.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await resetDataSource.query(`CREATE SCHEMA public;`);
    await resetDataSource.query(`GRANT ALL ON SCHEMA public TO public;`);
    await resetDataSource.destroy();

    await AppDataSource.initialize();
    
    const companyRepo = AppDataSource.getRepository(CompanyEntity);
    const employeeRepo = AppDataSource.getRepository(EmployeeEntity);
    const attendanceRepo = AppDataSource.getRepository(AttendanceEntity);
    const projectRepo = AppDataSource.getRepository(ProjectEntity);
    const taskRepo = AppDataSource.getRepository(TaskEntity);
    const walletRepo = AppDataSource.getRepository(WalletEntity);
    const transactionRepo = AppDataSource.getRepository(TransactionEntity);
    const invoiceRepo = AppDataSource.getRepository(InvoiceEntity);
    const loanRepo = AppDataSource.getRepository(LoanEntity);
    const performanceRepo = AppDataSource.getRepository(PerformanceEntity);
    const payrollBatchRepo = AppDataSource.getRepository(PayrollBatchEntity);
    const payrollItemRepo = AppDataSource.getRepository(PayrollItemEntity);

    // 1. Create/Upsert Master Company
    let company = await companyRepo.findOne({ where: { tenantCode: 'OMNIX-GLOBAL' } });
    if (!company) {
      company = companyRepo.create({
        tenantCode: 'OMNIX-GLOBAL',
        legalName: 'Akul Dravin Global OS',
        displayName: 'OMNIX ∞',
        industry: 'Technology & AI',
        country: 'India',
        status: 'active',
      });
      await companyRepo.save(company);
    }

    const tenantId = company.id;

    // 2. Create Projects
    console.log('🏗️ Seeding Projects...');
    const projectNames = ['Skyline UI', 'Core Ledger', 'AI Recruiter', 'Quantum HR', 'Mesh Finance'];
    const seededProjects = [];
    for (const name of projectNames) {
      let project = await projectRepo.findOne({ where: { name, tenantId } });
      if (!project) {
        project = projectRepo.create({ 
          name, 
          tenantId,
          description: `Internal initiative for ${name}`
        });
        await projectRepo.save(project);
      }
      seededProjects.push(project);
    }

    // 3. Create Employees (20)
    console.log('👥 Seeding 20 Employees...');
    const depts = ['Engineering', 'Product', 'Design', 'HR', 'Finance', 'Sales'];
    const seededEmployees = [];
    for (let i = 0; i < 20; i++) {
      const code = `EMP${100 + i}`;
      let emp = await employeeRepo.findOne({ where: { employeeCode: code, tenantId } });
      if (!emp) {
        emp = employeeRepo.create({
          firstName: ['Arjun', 'Sanya', 'Kabir', 'Zoya', 'Ishaan', 'Aria', 'Advait', 'Myra', 'Vihaan', 'Kaira'][i % 10],
          lastName: ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Kapoor', 'Malhotra', 'Sethi', 'Bose', 'Nair'][i % 10],
          workEmail: `emp${i}@omnix.app`,
          employeeCode: code,
          designation: i === 0 ? 'Director' : 'Lead Specialist',
          monthlyCtc: (Math.floor(Math.random() * 100) + 50) * 1000 + '',
          joinDate: '2024-01-01',
          tenantId,
          companyId: tenantId
        });
        await employeeRepo.save(emp);
      }
      seededEmployees.push(emp);
    }

    // 4. Create Wallets & Transactions
    console.log('💰 Seeding Wallets & Transactions...');
    for (const emp of seededEmployees) {
      let wallet = await walletRepo.findOne({ where: { employeeId: emp.id, tenantId } });
      if (!wallet) {
        wallet = walletRepo.create({ employeeId: emp.id, tenantId, balance: '0', currency: 'INR' });
        await walletRepo.save(wallet);
      }

      // Seed 5 historical transactions
      const existingTx = await transactionRepo.count({ where: { walletId: wallet.id } });
      if (existingTx === 0) {
        let currentBalance = 0;
        for (let j = 0; j < 5; j++) {
            const amount = Math.floor(Math.random() * 5000) + 500;
            const isCredit = Math.random() > 0.3;
            const tx = transactionRepo.create({
                walletId: wallet.id,
                tenantId,
                amount: amount.toString(),
                type: isCredit ? 'CREDIT' : 'DEBIT',
                category: isCredit ? 'SALARY_BONUS' : 'EQUIPMENT_PURCHASE',
                description: isCredit ? 'Performance Bonus' : 'Software Subscription',
                createdAt: new Date(Date.now() - j * 86400000 * 5)
            });
            await transactionRepo.save(tx);
            currentBalance += isCredit ? amount : -amount;
        }
        wallet.balance = Math.max(0, currentBalance).toString();
        await walletRepo.save(wallet);
      }
    }

    // 5. Create Attendance History (45 days)
    console.log('🕒 Seeding Attendance (45 days)...');
    for (const emp of seededEmployees) {
      for (let i = 0; i < 45; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Skip weekends for more realism
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        let attn = await attendanceRepo.findOne({ where: { employeeId: emp.id, attendanceDate: dateString, tenantId } });
        if (!attn) {
          const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'leave');
          attn = attendanceRepo.create({
            employeeId: emp.id,
            attendanceDate: dateString,
            checkInAt: status === 'present' ? new Date(new Date(date).setHours(9, Math.floor(Math.random() * 45), 0)) : null,
            checkOutAt: status === 'present' ? new Date(new Date(date).setHours(18, Math.floor(Math.random() * 45), 0)) : null,
            status,
            tenantId
          });
          await attendanceRepo.save(attn);
        }
      }
    }

    // 6. Create Tasks (50)
    console.log('✅ Seeding 50 Tasks...');
    for (let i = 0; i < 50; i++) {
      const proj = seededProjects[i % seededProjects.length];
      const emp = seededEmployees[i % seededEmployees.length];
      let task = await taskRepo.findOne({ where: { title: `Task ${i}`, tenantId } });
      if (!task) {
        task = taskRepo.create({
          title: `Task ${i}`,
          description: `Deliverable for ${proj.name} phase ${Math.floor(i/10)}`,
          status: Math.random() > 0.4 ? 'completed' : (Math.random() > 0.5 ? 'in_progress' : 'pending'),
          priority: (['high', 'medium', 'low'] as const)[i % 3],
          projectId: proj.id,
          assigneeId: emp.id,
          dueDate: new Date(Date.now() + (Math.random() * 10 - 5) * 86400000).toISOString(),
          tenantId
        });
        await taskRepo.save(task);
      }
    }
    
    // 8. Create Sample Payroll Batch (March 2024)
    console.log('🗓️ Seeding Sample Payroll Batch (March 2024)...');
    let batch = await payrollBatchRepo.findOne({ where: { year: 2024, month: 3, tenantId } });
    if (!batch) {
      batch = payrollBatchRepo.create({
        year: 2024,
        month: 3,
        tenantId,
        status: (require('./entities/payroll-batch.entity').PayrollBatchStatus.DRAFT),
        totalGross: '0',
        totalDeductions: '0',
        totalNet: '0'
      });
      await payrollBatchRepo.save(batch);

      const items = seededEmployees.map(emp => payrollItemRepo.create({
        tenantId,
        batchId: batch!.id,
        employeeId: emp.id,
        grossSalary: emp.monthlyCtc || '50000.0000',
        deductions: (parseFloat(emp.monthlyCtc || '50000') * 0.1).toFixed(4),
        netPayable: (parseFloat(emp.monthlyCtc || '50000') * 0.9).toFixed(4),
        calculationStatus: 'calculated'
      }));
      await payrollItemRepo.save(items);
      
      // Update totals
      const gross = items.reduce((sum, item) => sum + parseFloat(item.grossSalary), 0);
      const net = items.reduce((sum, item) => sum + parseFloat(item.netPayable), 0);
      batch.totalGross = gross.toFixed(4);
      batch.totalNet = net.toFixed(4);
      batch.totalDeductions = (gross - net).toFixed(4);
      await payrollBatchRepo.save(batch);
    }

    console.log('🚀 OMNIX High-Fidelity Seeding Complete.');
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
