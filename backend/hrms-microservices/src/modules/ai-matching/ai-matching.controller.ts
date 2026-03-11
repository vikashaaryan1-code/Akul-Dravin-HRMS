import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AiMatchingService } from './ai-matching.service';
import { AiMatch } from './ai-match.entity';

@Controller('ai-matching')
export class AiMatchingController {
  constructor(private readonly service: AiMatchingService) {}

  @Post('match')
  matchCandidateToJob(@Body() data: { candidateId: string; jobId: string; candidateData: any; jobData: any }): Promise<AiMatch> {
    return this.service.matchCandidateToJob(data.candidateId, data.jobId, data.candidateData, data.jobData);
  }

  @Get('job/:jobId/top-matches')
  findTopMatches(@Param('jobId') jobId: string, @Query('limit') limit?: number): Promise<AiMatch[]> {
    return this.service.findTopMatches(jobId, limit ? parseInt(limit.toString()) : 10);
  }

  @Get('candidate/:candidateId/matches')
  findCandidateMatches(@Param('candidateId') candidateId: string): Promise<AiMatch[]> {
    return this.service.findCandidateMatches(candidateId);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.service.getStats();
  }

  @Get()
  findAll(): Promise<AiMatch[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AiMatch> {
    return this.service.findOne(id);
  }
}
