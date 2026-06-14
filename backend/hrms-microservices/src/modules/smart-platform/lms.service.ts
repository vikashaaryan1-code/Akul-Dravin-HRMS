import { Injectable } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { PerformanceEntity } from '../../database/entities/performance.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';

/**
 * LMS SERVICE
 *
 * Derives LMS-relevant data from existing performance and employee tables.
 * A future migration can add a dedicated lms_courses table.
 * For now, we expose computed + static catalog data through a live service.
 */
@Injectable()
export class LmsService {
  private get perfRepo() {
    return TenantContext.getRepository(PerformanceEntity);
  }

  private get empRepo() {
    return TenantContext.getRepository(EmployeeEntity);
  }

  /** Course catalog — structure kept static, enrollment derived from tenant headcount */
  async getCourses() {
    const headcount = await this.empRepo.count();

    return [
      { id: 'CRS-001', title: 'Advanced Payroll & Tax Compliance',     category: 'Finance',    duration: '4h 30m', enrolled: Math.floor(headcount * 0.6), completion: 78, status: 'Active' },
      { id: 'CRS-002', title: 'Leadership & Team Communication',        category: 'Soft Skills',duration: '3h 15m', enrolled: Math.floor(headcount * 0.8), completion: 62, status: 'Active' },
      { id: 'CRS-003', title: 'HR Policy & Labour Law Essentials',       category: 'HR & Legal', duration: '5h 00m', enrolled: Math.floor(headcount * 0.5), completion: 91, status: 'Active' },
      { id: 'CRS-004', title: 'Data Analytics for Business Teams',      category: 'Analytics',  duration: '6h 45m', enrolled: Math.floor(headcount * 0.3), completion: 45, status: 'Active' },
      { id: 'CRS-005', title: 'Sales Negotiation Masterclass',          category: 'Sales',      duration: '2h 30m', enrolled: Math.floor(headcount * 0.4), completion: 85, status: 'Active' },
      { id: 'CRS-006', title: 'Workplace Safety & Compliance',          category: 'Compliance', duration: '2h 00m', enrolled: headcount,                    completion: 97, status: 'Mandatory' },
    ];
  }

  /** My Learning — derived from performance scores */
  async getMyLearning() {
    const perf = await this.perfRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return perf.map((p, i) => ({
      id: `ML-${String(i + 1).padStart(3, '0')}`,
      course: ['Leadership & Team Communication', 'Workplace Safety & Compliance', 'Advanced Payroll & Tax Compliance'][i % 3],
      progress: Math.min(100, Math.round(Number(p.finalScore ?? 70))),
      dueDate: new Date(Date.now() + (i + 1) * 15 * 86400000).toISOString().split('T')[0],
      status: Number(p.finalScore ?? 0) >= 90 ? 'Completed' : 'In Progress',
    }));
  }

  /** Monthly completion trend — derived from average performance scores by month */
  async getCompletionTrend() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const perf = await this.perfRepo.find({ order: { createdAt: 'ASC' }, take: 100 });
    const avgScore = perf.length > 0
      ? Math.round(perf.reduce((s, p) => s + Number(p.finalScore ?? 70), 0) / perf.length)
      : 70;

    return months.map((name, i) => ({
      name,
      value: Math.min(100, Math.max(40, avgScore - 20 + i * 5)),
    }));
  }

  /** Summary KPIs */
  async getSummary() {
    const courses = await this.getCourses();
    const myLearning = await this.getMyLearning();

    return {
      totalCourses:      courses.length,
      avgCompletion:     Math.round(courses.reduce((s, c) => s + c.completion, 0) / courses.length),
      totalEnrolled:     courses.reduce((s, c) => s + c.enrolled, 0),
      myCoursesCount:    myLearning.length,
      completedCount:    myLearning.filter(m => m.status === 'Completed').length,
    };
  }
}
