import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Feedback } from './feedback.entity';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  findAll(): Promise<Feedback[]> {
    return this.feedbackService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.feedbackService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Feedback> {
    return this.feedbackService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Feedback>): Promise<Feedback> {
    return this.feedbackService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Feedback>): Promise<Feedback> {
    return this.feedbackService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.feedbackService.remove(id);
  }
}
