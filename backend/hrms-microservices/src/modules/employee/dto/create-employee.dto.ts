import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsUUID()
  companyId!: string;

  @IsNotEmpty()
  @IsString()
  employeeCode!: string;

  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty()
  @IsEmail()
  workEmail!: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsNotEmpty()
  @IsString()
  designation!: string;

  @IsNotEmpty()
  @IsString()
  department!: string;

  @IsNotEmpty()
  @IsDateString()
  joinDate!: string;

  @IsOptional()
  @IsString()
  monthlyCtc?: string;

  @IsOptional()
  @IsString()
  employmentType?: string;
}
