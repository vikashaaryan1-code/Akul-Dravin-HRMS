import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the company' })
  @IsNotEmpty()
  @IsUUID()
  companyId!: string;

  @ApiProperty({ example: 'EMP-001', description: 'Unique employee code' })
  @IsNotEmpty()
  @IsString()
  employeeCode!: string;

  @ApiProperty({ example: 'John', description: 'First name of the employee' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name of the employee' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@company.com', description: 'Official work email' })
  @IsNotEmpty()
  @IsEmail()
  workEmail!: string;

  @ApiPropertyOptional({ example: 'john.doe@gmail.com', description: 'Personal email address' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job designation' })
  @IsNotEmpty()
  @IsString()
  designation!: string;

  @ApiProperty({ example: 'Engineering', description: 'Department name' })
  @IsNotEmpty()
  @IsString()
  department!: string;

  @ApiProperty({ example: '2026-07-01', description: 'Expected or actual join date' })
  @IsNotEmpty()
  @IsDateString()
  joinDate!: string;

  @ApiPropertyOptional({ example: '5000', description: 'Monthly CTC amount' })
  @IsOptional()
  @IsString()
  monthlyCtc?: string;

  @ApiPropertyOptional({ example: 'Full-Time', description: 'Type of employment' })
  @IsOptional()
  @IsString()
  employmentType?: string;
}
