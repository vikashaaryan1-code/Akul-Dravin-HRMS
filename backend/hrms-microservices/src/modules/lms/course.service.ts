import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  mandatory: boolean;
  aiSuggested: boolean;
  estimatedHours: number;
}

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  async getCoursesForEmployee(employeeId: string): Promise<Course[]> {
    const tenantId = TenantContext.getTenantId();
    this.logger.log(`Fetching LMS courses for employee ${employeeId} in tenant ${tenantId}`);
    
    return [
      {
        id: 'c-1',
        title: 'Information Security & Data Privacy 2026',
        description: 'Mandatory annual compliance training covering ISO 27001 policies and GDPR data handling.',
        progress: 100,
        mandatory: true,
        aiSuggested: false,
        estimatedHours: 2
      },
      {
        id: 'c-2',
        title: 'AI Prompt Engineering for Engineering Teams',
        description: 'AI-suggested course based on your recent activity in the internal AI Copilot usage.',
        progress: 25,
        mandatory: false,
        aiSuggested: true,
        estimatedHours: 4
      }
    ];
  }

  async generatePersonalizedLearningPath(employeeId: string): Promise<any> {
    this.logger.log(`Generating AI learning path for ${employeeId}`);
    return {
      skillGap: ['GraphQL Federation', 'Rust for high-perf microservices'],
      recommendedPath: 'Advanced Distributed Systems Mastery',
      autoEnrolledCourses: ['c-3', 'c-4']
    };
  }
}
