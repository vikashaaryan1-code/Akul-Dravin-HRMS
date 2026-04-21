import { IsNotEmpty, IsUUID, IsOptional, IsDateString, IsString, IsNumber } from 'class-validator';

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsUUID()
  employeeId!: string;

  @IsNotEmpty()
  @IsUUID()
  companyId!: string;

  @IsNotEmpty()
  @IsDateString()
  attendanceDate!: string;

  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsDateString()
  checkOutAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  geoLocation?: string;
}
