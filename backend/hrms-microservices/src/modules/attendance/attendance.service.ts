import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../../database/entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {}

  findAll(): Promise<AttendanceEntity[]> {
    return this.attendanceRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<AttendanceEntity | null> {
    return this.attendanceRepository.findOne({ where: { id } });
  }

  create(payload: Partial<AttendanceEntity>): Promise<AttendanceEntity> {
    const entity = this.attendanceRepository.create(payload);
    return this.attendanceRepository.save(entity);
  }

  async update(id: string, payload: Partial<AttendanceEntity>): Promise<AttendanceEntity | null> {
    await this.attendanceRepository.update(id, payload);
    return this.findOne(id);
  }
}
