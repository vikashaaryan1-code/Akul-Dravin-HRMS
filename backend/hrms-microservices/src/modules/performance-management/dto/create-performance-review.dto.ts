import { IsNotEmpty, IsUUID, IsString, IsNumber, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreatePerformanceReviewDto {
  @IsNotEmpty()
  @IsUUID()
  employeeId!: string;

  @IsNotEmpty()
  @IsString()
  reviewPeriod!: string; // e.g., "2026-04"

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100)
  objectiveScore!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100)
  subjectiveScore!: number;

  @IsOptional()
  @IsString()
  managerComments?: string;
}
