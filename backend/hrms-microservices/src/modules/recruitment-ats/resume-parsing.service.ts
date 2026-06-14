import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_AI_JOBS } from '../../common/queues/queue-names';
import { AiMatchingService } from '../ai-engine/ai-matching.service';

@Injectable()
export class ResumeParsingService {
  private readonly logger = new Logger(ResumeParsingService.name);

  constructor(
    @InjectQueue(QUEUE_AI_JOBS) private readonly aiJobQueue: Queue,
    private readonly aiMatching: AiMatchingService,
  ) {}

  /**
   * Accepts a file buffer, extracts text (stubbed for now), and pushes a job to BullMQ
   * to score it against a given job ID.
   */
  async uploadAndParseResume(
    tenantId: string,
    jobId: string,
    candidateId: string,
    fileBuffer: Buffer,
    fileName: string,
  ) {
    this.logger.log(`Parsing resume ${fileName} for candidate ${candidateId}`);
    
    // In a real implementation, we'd use pdf-parse or tesseract to extract text here.
    const extractedText = `Stubbed resume text for ${fileName}. Experience in React, Node.js, and TypeScript.`;

    // Push an async job to the AI queue to perform heavy NLP scoring
    const job = await this.aiJobQueue.add('parse-resume', {
      type: 'insight', // Leveraging existing insight processor or a custom one
      tenantId,
      payload: {
        insightType: 'resume-match',
        context: {
          candidateId,
          jobId,
          resumeText: extractedText,
        }
      }
    });

    return {
      message: 'Resume uploaded and queued for AI analysis',
      jobId: job.id,
      candidateId,
    };
  }

  /**
   * Synchronous fallback for scoring a candidate's profile against a job description
   * using the existing deterministic matching service.
   */
  async scoreCandidate(candidateId: string, jobId: string) {
    return this.aiMatching.scoreCandidateForJob(candidateId, jobId);
  }
}
