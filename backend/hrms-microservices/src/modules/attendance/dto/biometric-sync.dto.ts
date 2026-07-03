import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BiometricLogEntry {
  @ApiProperty({ example: 'EMP-1029', description: 'Employee external biometric ID or card ID' })
  @IsString()
  @IsNotEmpty()
  biometricId: string;

  @ApiProperty({ example: '2026-07-02T09:15:00Z', description: 'ISO 8601 timestamp from device' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ enum: ['IN', 'OUT'], example: 'IN' })
  @IsString()
  @IsNotEmpty()
  direction: 'IN' | 'OUT';

  @ApiProperty({ example: 'DEV-MUM-01', description: 'Source biometric device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}

export class BiometricSyncDto {
  @ApiProperty({ example: 'ZKTeco-9500', description: 'Biometric provider/device model name' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ type: [BiometricLogEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BiometricLogEntry)
  logs: BiometricLogEntry[];

  @ApiPropertyOptional({ example: 'sha256-signature-payload-hash' })
  @IsOptional()
  @IsString()
  signature?: string;
}
