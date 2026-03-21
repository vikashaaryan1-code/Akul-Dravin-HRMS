import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from '../../database/entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async checkIn(employeeId: string, location?: { lat: number; lng: number; address: string }) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.attendanceRepository.findOne({
      where: { employeeId, date: new Date(today) },
    });

    if (existing) throw new Error('Already checked in today');

    const now = new Date();
    const attendance = this.attendanceRepository.create({
      employeeId,
      date: new Date(today),
      checkIn: now.toTimeString().split(' ')[0],
      checkInLocation: location?.address,
      checkInLat: location?.lat,
      checkInLng: location?.lng,
      status: 'present',
    });

    return this.attendanceRepository.save(attendance);
  }

  async checkOut(employeeId: string, location?: { lat: number; lng: number; address: string }) {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await this.attendanceRepository.findOne({
      where: { employeeId, date: new Date(today) },
    });

    if (!attendance) throw new Error('No check-in found for today');
    if (attendance.checkOut) throw new Error('Already checked out');

    const now = new Date();
    const checkInTime = new Date(`${today}T${attendance.checkIn}`);
    const checkOutTime = now;
    const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    attendance.checkOut = now.toTimeString().split(' ')[0];
    attendance.checkOutLocation = location?.address ?? '';
    attendance.checkOutLat = location?.lat ?? 0;
    attendance.checkOutLng = location?.lng ?? 0;
    attendance.totalHours = parseFloat(hours.toFixed(2));

    return this.attendanceRepository.save(attendance);
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.startDate && filters.endDate) {
      where.date = Between(new Date(filters.startDate), new Date(filters.endDate));
    }
    return this.attendanceRepository.find({ where, relations: ['employee'], order: { date: 'DESC' } });
  }

  async getStats(employeeId: string, month: string, year: number) {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(year, parseInt(month), 0);
    
    const records = await this.attendanceRepository.find({
      where: { employeeId, date: Between(startDate, endDate) },
    });

    return {
      totalDays: records.length,
      presentDays: records.filter(r => r.status === 'present').length,
      totalHours: records.reduce((sum, r) => sum + (r.totalHours || 0), 0),
    };
  }
}
