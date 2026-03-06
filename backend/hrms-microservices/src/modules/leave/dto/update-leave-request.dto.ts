import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum LeaveApprovalStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsEnum(LeaveApprovalStatus)
  status!: LeaveApprovalStatus;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;
}
