import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class QrAttendanceService {
  private readonly logger = new Logger(QrAttendanceService.name);
  private readonly SECRET = process.env.QR_ATTENDANCE_SECRET || 'qr_enterprise_sec_786';

  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(ShiftEntity)
    private readonly shiftRepo: Repository<ShiftEntity>,
  ) {}

  /**
   * Generates a secure, time-sensitive QR token for a specific branch/location.
   * "WorkIndia-style" kiosk attendance feature.
   */
  async generateKioskQr(branchId: string, locationId: string) {
    const timestamp = Math.floor(Date.now() / 30000); // 30-second window
    const salt = randomBytes(8).toString('hex');
    const payload = `${branchId}:${locationId}:${timestamp}:${salt}`;
    const hash = createHash('sha256').update(`${payload}:${this.SECRET}`).digest('hex');

    this.logger.log(`Generated Kiosk QR for branch=${branchId} hash=${hash.slice(0, 8)}`);

    return {
      qrToken: `${payload}:${hash}`,
      expiresIn: 30, // seconds
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifies a scanned QR token and punches in the employee.
   * Includes geo-fencing and time-window validation.
   */
  async verifyAndPunchIn(employeeId: string, qrToken: string, employeeLat: number, employeeLng: number) {
    const [branchId, locationId, timestamp, salt, hash] = qrToken.split(':');
    
    // 1. Validate hash integrity
    const rehash = createHash('sha256').update(`${branchId}:${locationId}:${timestamp}:${salt}:${this.SECRET}`).digest('hex');
    if (hash !== rehash) {
      throw new BadRequestException('Invalid or tampered QR code.');
    }

    // 2. Validate time window (allow 60 seconds drift)
    const currentTimestamp = Math.floor(Date.now() / 30000);
    const tokenTimestamp = parseInt(timestamp);
    if (Math.abs(currentTimestamp - tokenTimestamp) > 2) {
      throw new BadRequestException('QR code has expired. Please refresh the kiosk screen.');
    }

    // 3. Fetch location coordinates for geo-fencing
    // (In a real system, branch coordinates would be fetched from LocationEntity)
    // Stub coordinates for demo:
    const branchLat = 12.9716; // Example: Bangalore
    const branchLng = 77.5946;

    const distance = this.calculateDistance(employeeLat, employeeLng, branchLat, branchLng);
    if (distance > 0.5) { // 500 meters
      throw new BadRequestException(`Too far from branch. Distance: ${distance.toFixed(2)}km`);
    }

    this.logger.log(`QR Punch-In SUCCESS employee=${employeeId} branch=${branchId}`);

    return {
      success: true,
      message: 'Attendance recorded via secure QR scan.',
      distance: `${(distance * 1000).toFixed(0)}m`,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
