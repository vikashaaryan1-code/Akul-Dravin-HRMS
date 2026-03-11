import { Controller, Post, Get, Put, Body, Param, Query } from '@nestjs/common';
import { VideoInterviewService } from './video-interview.service';

@Controller('api/v1/video-interview')
export class VideoInterviewController {
  constructor(private readonly videoInterviewService: VideoInterviewService) {}

  @Post('create')
  async createInterview(@Body() data: any) {
    return await this.videoInterviewService.createVideoInterview(data);
  }

  @Post(':id/start')
  async startInterview(@Param('id') id: string) {
    return await this.videoInterviewService.startInterview(id);
  }

  @Post(':id/complete')
  async completeInterview(@Param('id') id: string, @Body() body: { duration: number }) {
    return await this.videoInterviewService.completeInterview(id, body.duration);
  }

  @Post(':id/cancel')
  async cancelInterview(@Param('id') id: string) {
    return await this.videoInterviewService.cancelInterview(id);
  }

  @Put(':id/recording')
  async saveRecording(@Param('id') id: string, @Body() body: { recordingUrl: string }) {
    return await this.videoInterviewService.saveRecording(id, body.recordingUrl);
  }

  @Put(':id/ai-analysis')
  async saveAIAnalysis(@Param('id') id: string, @Body() body: { analysis: any }) {
    return await this.videoInterviewService.saveAIAnalysis(id, body.analysis);
  }

  @Put(':id/scorecard')
  async saveScorecard(@Param('id') id: string, @Body() body: { scorecard: any; overallScore: number }) {
    return await this.videoInterviewService.saveScorecard(id, body.scorecard, body.overallScore);
  }

  @Put(':id/notes')
  async addNotes(@Param('id') id: string, @Body() body: { notes: string }) {
    return await this.videoInterviewService.addNotes(id, body.notes);
  }

  @Get(':id')
  async getInterview(@Param('id') id: string) {
    return await this.videoInterviewService.getInterview(id);
  }

  @Get('room/:roomId')
  async getInterviewByRoom(@Param('roomId') roomId: string) {
    return await this.videoInterviewService.getInterviewByRoomId(roomId);
  }

  @Get('candidate/:candidateId')
  async getInterviewsByCandidate(@Param('candidateId') candidateId: string) {
    return await this.videoInterviewService.getInterviewsByCandidate(candidateId);
  }

  @Get('scheduled/list')
  async getScheduledInterviews() {
    return await this.videoInterviewService.getScheduledInterviews();
  }

  @Get()
  async getAllInterviews() {
    return await this.videoInterviewService.getAllInterviews();
  }

  @Post('generate-token')
  async generateToken(@Body() body: { roomId: string; participantName: string }) {
    const token = this.videoInterviewService.generateJoinToken(body.roomId, body.participantName);
    return { token };
  }

  @Post('verify-token')
  async verifyToken(@Body() body: { token: string }) {
    const result = this.videoInterviewService.verifyJoinToken(body.token);
    return result ? { valid: true, ...result } : { valid: false };
  }
}
