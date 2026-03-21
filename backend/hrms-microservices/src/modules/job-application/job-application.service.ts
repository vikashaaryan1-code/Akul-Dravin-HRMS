import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JobApplication } from '../../database/entities/job-application.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { Employee } from '../employee/employee.entity';
import { Job } from '../../database/entities/job.entity';
import { EmailService } from '../email/email.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class JobApplicationService {
  constructor(
    @InjectRepository(JobApplication)
    private jobApplicationRepository: Repository<JobApplication>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private emailService: EmailService,
  ) {}

  async create(data: any) {
    const application = this.jobApplicationRepository.create(data);
    return this.jobApplicationRepository.save(application);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.status) where.status = filters.status;
    return this.jobApplicationRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.jobApplicationRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.jobApplicationRepository.update(id, data);
    return this.findOne(id);
  }

  /**
   * Admin shortlists a candidate → sends interview invite email
   */
  async shortlist(id: string, companyName: string) {
    const application = await this.findOne(id);
    if (!application) throw new NotFoundException('Application not found');

    await this.jobApplicationRepository.update(id, { status: 'shortlisted' });

    const job = await this.jobRepository.findOne({ where: { id: application.jobId } });
    const jobTitle = job?.title ?? 'the position';
    const orgName = companyName ?? 'Our Company';

    await this.emailService.sendInterviewInvite(
      application.email,
      application.fullName,
      jobTitle,
      orgName,
    );

    return { success: true, message: `Interview invite sent to ${application.email}` };
  }

  /**
   * Admin clears/selects a candidate after interview →
   * creates user account + employee record + sends login credentials email
   */
  async select(id: string, companyName: string, tenantId: string, companyId: string) {
    const application = await this.findOne(id);
    if (!application) throw new NotFoundException('Application not found');

    const job = await this.jobRepository.findOne({ where: { id: application.jobId } });
    const jobTitle = job?.title ?? 'the position';
    const orgName = companyName ?? 'Our Company';

    // Generate a random password
    const rawPassword = this.generatePassword();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Check if user already exists
    let user = await this.userRepository.findOne({ where: { email: application.email } });
    if (!user) {
      user = this.userRepository.create({
        tenantId: tenantId ?? null,
        email: application.email,
        passwordHash,
        fullName: application.fullName,
        role: Role.EMPLOYEE,
        isActive: true,
      });
      await this.userRepository.save(user);
    }

    // Create employee record
    const nameParts = application.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';

    const existing = await this.employeeRepository.findOne({ where: { email: application.email } });
    if (!existing) {
      const employee = this.employeeRepository.create({
        employeeId: `EMP-${Date.now()}`,
        companyId: companyId ?? job?.companyId ?? '00000000-0000-0000-0000-000000000000',
        firstName,
        lastName,
        email: application.email,
        phone: application.phone,
        joiningDate: new Date(),
        status: 'active',
        salary: 0,
      });
      await this.employeeRepository.save(employee);
    }

    // Update application status
    await this.jobApplicationRepository.update(id, { status: 'selected' });

    // Send login credentials email
    await this.emailService.sendLoginCredentials(
      application.email,
      application.fullName,
      jobTitle,
      orgName,
      rawPassword,
    );

    return { success: true, message: `Employee account created and credentials sent to ${application.email}` };
  }

  /**
   * Admin rejects a candidate
   */
  async reject(id: string) {
    await this.jobApplicationRepository.update(id, { status: 'rejected' });
    return { success: true };
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
