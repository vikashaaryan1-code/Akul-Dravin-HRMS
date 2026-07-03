import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ApplicationStage } from '../ats-pipeline.service';

export class UploadResumeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  candidateId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fileContentBase64: string;
}

export class CreateJobDto {
  @ApiProperty({ description: 'Title of the job requisition' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Department ID or name' })
  @IsNotEmpty()
  @IsString()
  department: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMarketplaceVisible?: boolean;
}

export class CreateApplicationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  candidateId: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ApplicationStage)
  stage?: ApplicationStage;
}

export class MoveStageDto {
  @ApiProperty({ enum: ApplicationStage })
  @IsNotEmpty()
  @IsEnum(ApplicationStage)
  toStage: ApplicationStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  forceMove?: boolean;
}

export class RejectApplicationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class HireApplicationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class ScheduleInterviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  candidateId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  roundNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  interviewType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString({ each: true })
  interviewerIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class CompleteInterviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  overallRating: number;

  @ApiProperty({ enum: ['proceed', 'hold', 'reject'] })
  @IsNotEmpty()
  @IsEnum(['proceed', 'hold', 'reject'])
  recommendation: 'proceed' | 'hold' | 'reject';

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  scorecard: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class CreateOfferDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  candidateId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  offeredDesignation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  offeredCtc: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  joiningDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerExpiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  salaryBreakdown?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class OfferActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}
