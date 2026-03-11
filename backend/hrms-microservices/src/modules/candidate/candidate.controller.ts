import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { Candidate } from './candidate.entity';

@Controller('candidates')
export class CandidateController {
  constructor(private readonly service: CandidateService) {}
  @Get() findAll(): Promise<Candidate[]> { return this.service.findAll(); }
  @Get('stats') getStats(): Promise<any> { return this.service.getStats(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<Candidate> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<Candidate>): Promise<Candidate> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<Candidate>): Promise<Candidate> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
