import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsIn,
  IsPositive,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const LEAD_STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
  'Discovery Requested',
  'A2Z Workflow Requested',
] as const;
export type LeadStage = typeof LEAD_STAGES[number];

export const LEAD_SOURCES = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Campaign', 'Partner', 'Event', 'Other'] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

export const INTERACTION_CHANNELS = ['Email', 'Phone', 'WhatsApp', 'In-Person', 'LinkedIn', 'Video Call'] as const;
export const INTERACTION_TYPES    = ['General', 'Demo', 'Proposal', 'Follow-up', 'Support', 'Renewal'] as const;

export const CUSTOMER_HEALTH_STATUSES = ['Healthy', 'At Risk', 'Churning'] as const;

// ── CreateLeadDto ─────────────────────────────────────────────────────────────

export class CreateLeadDto {
  @ApiProperty({ example: 'Raj Sharma', description: 'Full name of the lead contact' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  leadName: string;

  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Organization name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string;

  @ApiPropertyOptional({ example: 'raj@acmecorp.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: LEAD_STAGES, default: 'New' })
  @IsOptional()
  @IsIn(LEAD_STAGES)
  stage?: LeadStage;

  @ApiPropertyOptional({ example: 'Amit Kumar', description: 'Sales owner name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerName?: string;

  @ApiPropertyOptional({ example: 75, minimum: 0, maximum: 100, description: 'Lead quality score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score?: number;

  @ApiPropertyOptional({ enum: LEAD_SOURCES })
  @IsOptional()
  @IsIn(LEAD_SOURCES)
  source?: LeadSource;

  @ApiPropertyOptional({ example: 'Interested in enterprise HRMS plan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: 500000, description: 'Expected deal value in INR' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  expectedValue?: number;
}

// ── UpdateLeadDto ─────────────────────────────────────────────────────────────

export class UpdateLeadDto extends CreateLeadDto {}

// ── UpdateLeadStageDto ────────────────────────────────────────────────────────

export class UpdateLeadStageDto {
  @ApiProperty({ enum: LEAD_STAGES, description: 'New stage for the lead' })
  @IsIn(LEAD_STAGES)
  stage: LeadStage;
}

// ── CreateCustomerDto ─────────────────────────────────────────────────────────

export class CreateCustomerDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  accountName: string;

  @ApiPropertyOptional({ example: 'Information Technology' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: 'Priya Singh' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerName?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_HEALTH_STATUSES, default: 'Healthy' })
  @IsOptional()
  @IsIn(CUSTOMER_HEALTH_STATUSES)
  healthStatus?: string;

  @ApiPropertyOptional({ example: 1200000, description: 'Annual contract value in INR' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  annualValue?: number;

  @ApiPropertyOptional({ example: 'contact@acmecorp.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '2027-03-31', description: 'Contract end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  contractEnd?: string;
}

// ── UpdateCustomerDto ─────────────────────────────────────────────────────────

export class UpdateCustomerDto extends CreateCustomerDto {}

// ── CreateInteractionDto ──────────────────────────────────────────────────────

export class CreateInteractionDto {
  @ApiPropertyOptional({ example: 'uuid-lead-id', description: 'Related lead ID' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ example: 'uuid-customer-id', description: 'Related customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerName?: string;

  @ApiPropertyOptional({ enum: INTERACTION_CHANNELS, default: 'Email' })
  @IsOptional()
  @IsIn(INTERACTION_CHANNELS)
  channel?: string;

  @ApiPropertyOptional({ enum: INTERACTION_TYPES, default: 'General' })
  @IsOptional()
  @IsIn(INTERACTION_TYPES)
  interactionType?: string;

  @ApiPropertyOptional({ example: '2026-07-01T10:00:00Z', description: 'When the interaction occurred' })
  @IsOptional()
  @IsDateString()
  happenedAt?: string;

  @ApiPropertyOptional({ example: 'Discussed pricing for enterprise plan' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  summary?: string;

  @ApiPropertyOptional({ example: 'Amit Kumar' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  createdBy?: string;
}

// ── LeadQueryDto ─────────────────────────────────────────────────────────────

export class LeadQueryDto {
  @ApiPropertyOptional({ enum: LEAD_STAGES, description: 'Filter by stage' })
  @IsOptional()
  @IsIn(LEAD_STAGES)
  stage?: LeadStage;

  @ApiPropertyOptional({ description: 'Text search across lead name, organization, email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 50, description: 'Items per page (max 200)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(200)
  @Type(() => Number)
  limit?: number;
}
