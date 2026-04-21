import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { PunchInDto } from './dto/punch-in.dto';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class AttendanceService {
  private get attendanceRepo() {
    return TenantContext.getRepository(AttendanceEntity);
  }

  async findAll(): Promise<AttendanceEntity[]> {
    return this.attendanceRepo.find({
      order: { attendanceDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AttendanceEntity> {
    const record = await this.attendanceRepo.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Attendance record ${id} not found`);
    }
    return record;
  }

  async create(dto: CreateAttendanceDto): Promise<AttendanceEntity> {
    const tenantId = TenantContext.getTenantId();
    const entity = this.attendanceRepo.create({
      ...dto,
      tenantId,
    });
    return this.attendanceRepo.save(entity);
  }

  async punchIn(employeeId: string, companyId: string, dto: PunchInDto): Promise<AttendanceEntity> {
    const tenantId = TenantContext.getTenantId();
    const date = new Date().toISOString().split('T')[0];

    // Check if already punched in
    const existing = await this.attendanceRepo.findOne({
      where: { employeeId, attendanceDate: date },
    });

    if (existing) {
      throw new BadRequestException('Already punched in for today');
    }

    const entity = this.attendanceRepo.create({
      employeeId,
      companyId,
      attendanceDate: date,
      checkInAt: new Date(),
      status: 'present',
      geoLocation: dto.geoLocation,
      tenantId,
    });

    return this.attendanceRepo.save(entity);
  }

  async punchOut(employeeId: string): Promise<AttendanceEntity> {
    const date = new Date().toISOString().split('T')[0];

    const record = await this.attendanceRepo.findOne({
      where: { employeeId, attendanceDate: date },
    });

    if (!record) {
      throw new NotFoundException('No punch-in record found for today');
    }

    if (record.checkOutAt) {
      throw new BadRequestException('Already punched out for today');
    }

    record.checkOutAt = new Date();
    return this.attendanceRepo.save(record);
  }

  async getSummary() {
    const total = await this.attendanceRepo.count();
    if (total === 0) return { presentRate: 0, absentRate: 0, leaveRate: 0, status: 'healthy' };

    const present = await this.attendanceRepo.count({ where: { status: 'present' } });
    const absent = await this.attendanceRepo.count({ where: { status: 'absent' } });
    const leave = await this.attendanceRepo.count({ where: { status: 'leave' } });

    const presentRate = Math.round((present / total) * 100);
    return {
      presentRate,
      absentRate: Math.round((absent / total) * 100),
      leaveRate: Math.round((leave / total) * 100),
      status: presentRate > 85 ? 'healthy' : presentRate > 70 ? 'warning' : 'critical',
    };
  }
}
