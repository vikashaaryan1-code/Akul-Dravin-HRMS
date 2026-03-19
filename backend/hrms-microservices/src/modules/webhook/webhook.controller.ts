import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { JobService } from '../job/job.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly jobService: JobService) {}

  @Post('job-posting')
  async autoPostJob(@Body() data: any, @Headers('x-api-key') apiKey: string) {
    const validApiKey = process.env.WEBHOOK_API_KEY || 'your-secret-webhook-key';
    
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    const jobData = {
      companyId: data.companyId || '00000000-0000-0000-0000-000000000000',
      title: data.title,
      description: data.description,
      location: data.location || 'Remote',
      employmentType: data.employmentType || 'Full-time',
      experienceLevel: data.experienceLevel || 'Mid-level',
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      skills: data.skills || '',
      openings: data.openings || 1,
      closingDate: data.closingDate,
      status: 'open',
    };

    return this.jobService.create(jobData);
  }
}
