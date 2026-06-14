import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { PunchInDto } from './dto/punch-in.dto';
import { TenantContext } from '../../common/context/tenant-context';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';

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
    const tenantId = TenantContext.getRequiredTenantId();
    const entity = this.attendanceRepo.create({
      ...dto,
      tenantId,
    } as any) as unknown as AttendanceEntity;
    return this.attendanceRepo.save(entity);
  }

  async punchIn(employeeId: string, companyId: string, dto: PunchInDto): Promise<AttendanceEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const date = new Date().toISOString().split('T')[0];

    // 1. Fetch Employee & Shift
    const employee = await TenantContext.getRepository(EmployeeEntity).findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    if (employee.shiftId) {
      const shift = await TenantContext.getRepository(ShiftEntity).findOne({
        where: { id: employee.shiftId },
      });

      if (shift) {
        // 2. IP Restriction Check
        if (shift.allowedIps && dto.ipAddress) {
          const allowed = shift.allowedIps.split(',').map(ip => ip.trim());
          if (!allowed.includes(dto.ipAddress)) {
            throw new BadRequestException(`Punch-in restricted for IP: ${dto.ipAddress}`);
          }
        }

        // 3. Geo-fencing Check
        if (shift.geoFenceCenterLat && shift.geoFenceCenterLng && shift.geoFenceRadiusMeters) {
          if (!dto.lat || !dto.lng) {
            throw new BadRequestException('Geo-location coordinates required for this shift');
          }

          const distance = this.calculateDistance(
            shift.geoFenceCenterLat,
            shift.geoFenceCenterLng,
            dto.lat,
            dto.lng
          );

          if (distance > shift.geoFenceRadiusMeters) {
            throw new BadRequestException(`Out of geo-fence range (${Math.round(distance)}m > ${shift.geoFenceRadiusMeters}m)`);
          }
        }
      }
    }

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
      geoLocation: dto.geoLocation || (dto.lat ? `${dto.lat},${dto.lng}` : undefined),
      tenantId,
    } as any) as unknown as AttendanceEntity;

    return this.attendanceRepo.save(entity);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
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
