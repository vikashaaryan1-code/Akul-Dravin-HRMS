import { IsEnum, IsArray, IsString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyScope, PolicyRuleType, ExecutionMode } from '../types/policy.types';

export class PolicyRuleConditionDto {
  @IsOptional() @IsNumber() max_percent?: number;
  @IsOptional() @IsNumber() gte?: number;
  @IsOptional() @IsNumber() lte?: number;
  @IsOptional() @IsString() risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  @IsOptional() @IsString() budget_impact?: string;
}

export class PolicyRuleDto {
  @IsString() id!: string;
  @IsEnum(PolicyRuleType) type!: PolicyRuleType;
  @IsOptional() @IsString() target?: string;
  @ValidateNested() @Type(() => PolicyRuleConditionDto) condition!: PolicyRuleConditionDto;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsEnum(ExecutionMode) mode?: ExecutionMode;
}

export class CreatePolicyDto {
  @IsEnum(PolicyScope) scope!: PolicyScope;
  @IsOptional() @IsString() scopeId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PolicyRuleDto) rules!: PolicyRuleDto[];
  @IsOptional() @IsString() description?: string;
}
