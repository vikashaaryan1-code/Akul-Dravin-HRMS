import { Controller, Get, Param, UseGuards, Post } from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('lms')
export class LmsController {
  constructor(private readonly courseService: CourseService) {}

  @Get('courses')
  async getLmsCourses() {
    return [
      { id: 'c-1', title: 'Information Security 2026', category: 'Compliance', duration: '2h', enrolled: 450, completion: 98, status: 'Mandatory' },
      { id: 'c-2', title: 'AI Prompt Engineering', category: 'Engineering', duration: '4h', enrolled: 120, completion: 65, status: 'Optional' },
      { id: 'c-3', title: 'Advanced React Patterns', category: 'Engineering', duration: '6h', enrolled: 85, completion: 40, status: 'Optional' },
      { id: 'c-4', title: 'Leadership & OKRs', category: 'Management', duration: '3h', enrolled: 45, completion: 80, status: 'Recommended' },
      { id: 'c-5', title: 'ISO 27001 Refresh', category: 'Compliance', duration: '1h', enrolled: 500, completion: 15, status: 'Mandatory' }
    ];
  }

  @Get('my-learning')
  async getMyLearning() {
    return [
      { id: 'ml-1', course: 'Information Security 2026', progress: 100, dueDate: '2026-06-30', status: 'Completed' },
      { id: 'ml-2', course: 'AI Prompt Engineering', progress: 45, dueDate: '2026-07-15', status: 'In Progress' },
      { id: 'ml-3', course: 'Leadership & OKRs', progress: 0, dueDate: '2026-08-01', status: 'Not Started' }
    ];
  }

  @Get('completion-trend')
  async getCompletionTrend() {
    return [
      { name: 'Jan', value: 45 }, { name: 'Feb', value: 52 }, { name: 'Mar', value: 68 },
      { name: 'Apr', value: 74 }, { name: 'May', value: 85 }, { name: 'Jun', value: 91 }
    ];
  }

  @Get('summary')
  async getSummary() {
    return {
      totalCourses: 42,
      avgCompletion: 78,
      totalEnrolled: 1245,
      myCoursesCount: 3,
      completedCount: 1
    };
  }
}
