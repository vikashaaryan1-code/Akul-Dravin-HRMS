import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AiResumeParserService } from './ai-resume-parser.service';
import { ParsedResume } from './parsed-resume.entity';

@Controller('ai-resume-parser')
export class AiResumeParserController {
  constructor(private readonly service: AiResumeParserService) {}

  @Post('parse')
  parseResume(@Body() data: { candidateId: string; resumeText: string }): Promise<ParsedResume> {
    return this.service.parseResume(data.candidateId, data.resumeText);
  }

  @Get()
  findAll(): Promise<ParsedResume[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ParsedResume> {
    return this.service.findOne(id);
  }

  @Get('candidate/:candidateId')
  findByCandidate(@Param('candidateId') candidateId: string): Promise<ParsedResume[]> {
    return this.service.findByCandidate(candidateId);
  }
}
