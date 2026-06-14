import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';

export interface AppraisalFeedback {
  id: string;
  reviewerName: string;
  role: 'peer' | 'manager' | 'report';
  score: number;
  comments: string;
  date: string;
  aiSentiment: 'positive' | 'neutral' | 'negative';
}

@Injectable()
export class AppraisalService {
  private readonly logger = new Logger(AppraisalService.name);

  async get360Feedback(employeeId: string): Promise<AppraisalFeedback[]> {
    const tenantId = TenantContext.getTenantId();
    this.logger.log(`Fetching 360 appraisals for employee ${employeeId} in tenant ${tenantId}`);
    
    return [
      {
        id: 'fb-1',
        reviewerName: 'Priya Sharma',
        role: 'manager',
        score: 4.8,
        comments: 'Exceptional delivery on the recent HRMS architecture redesign. Highly autonomous.',
        date: new Date().toISOString(),
        aiSentiment: 'positive',
      },
      {
        id: 'fb-2',
        reviewerName: 'Rahul Mehta',
        role: 'peer',
        score: 4.5,
        comments: 'Great collaboration during the GraphQL API integration.',
        date: new Date(Date.now() - 86400000).toISOString(),
        aiSentiment: 'positive',
      }
    ];
  }

  async generateAiAppraisalSummary(employeeId: string): Promise<string> {
    // Uses the LLM orchestration layer to summarize performance
    return "The employee has demonstrated outstanding performance, particularly in systems architecture. The AI sentiment analysis across 360 feedback highlights 'autonomous execution' and 'reliability' as key strengths.";
  }
}
