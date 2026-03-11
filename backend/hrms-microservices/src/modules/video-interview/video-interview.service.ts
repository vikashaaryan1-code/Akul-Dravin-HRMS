import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoInterview } from '../../database/entities/video-interview.entity';
import * as crypto from 'crypto';

@Injectable()
export class VideoInterviewService {
  constructor(
    @InjectRepository(VideoInterview)
    private videoInterviewRepo: Repository<VideoInterview>,
  ) {}

  generateRoomId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async createVideoInterview(data: {
    interviewId: string;
    candidateId: string;
    candidateName: string;
    interviewerName: string;
    position: string;
    scheduledAt: Date;
  }) {
    const roomId = this.generateRoomId();
    const interview = this.videoInterviewRepo.create({
      ...data,
      roomId,
      status: 'scheduled',
    });
    return await this.videoInterviewRepo.save(interview);
  }

  async startInterview(id: string) {
    await this.videoInterviewRepo.update(id, {
      status: 'in_progress',
      startedAt: new Date(),
    });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async completeInterview(id: string, duration: number) {
    await this.videoInterviewRepo.update(id, {
      status: 'completed',
      completedAt: new Date(),
      duration,
    });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async cancelInterview(id: string) {
    await this.videoInterviewRepo.update(id, { status: 'cancelled' });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async saveRecording(id: string, recordingUrl: string) {
    await this.videoInterviewRepo.update(id, { recordingUrl });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async saveAIAnalysis(id: string, analysis: any) {
    await this.videoInterviewRepo.update(id, { aiAnalysis: analysis });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async saveScorecard(id: string, scorecard: any, overallScore: number) {
    await this.videoInterviewRepo.update(id, { scorecard, overallScore });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async addNotes(id: string, notes: string) {
    await this.videoInterviewRepo.update(id, { notes });
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async getInterview(id: string) {
    return await this.videoInterviewRepo.findOne({ where: { id } });
  }

  async getInterviewByRoomId(roomId: string) {
    return await this.videoInterviewRepo.findOne({ where: { roomId } });
  }

  async getInterviewsByCandidate(candidateId: string) {
    return await this.videoInterviewRepo.find({ where: { candidateId }, order: { scheduledAt: 'DESC' } });
  }

  async getScheduledInterviews() {
    return await this.videoInterviewRepo.find({ where: { status: 'scheduled' }, order: { scheduledAt: 'ASC' } });
  }

  async getAllInterviews() {
    return await this.videoInterviewRepo.find({ order: { scheduledAt: 'DESC' } });
  }

  generateJoinToken(roomId: string, participantName: string): string {
    const payload = { roomId, participantName, timestamp: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  verifyJoinToken(token: string): { roomId: string; participantName: string } | null {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return { roomId: decoded.roomId, participantName: decoded.participantName };
    } catch {
      return null;
    }
  }
}
