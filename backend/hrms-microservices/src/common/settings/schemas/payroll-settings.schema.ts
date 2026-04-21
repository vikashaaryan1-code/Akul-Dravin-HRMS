import { IsBoolean, IsNumber, IsEnum, IsInt } from 'class-validator';

export enum RoundingStrategy {
  BANKERS = 'BANKERS',
  CEIL = 'CEIL',
  FLOOR = 'FLOOR',
}

export class PayrollSettingsSchema {
  @IsBoolean()
  tdsEnabled: boolean = true;

  @IsNumber()
  pfRate: number = 12.0;

  @IsNumber()
  esiRate: number = 0.75;

  @IsEnum(RoundingStrategy)
  roundingStrategy: RoundingStrategy = RoundingStrategy.BANKERS;

  @IsInt()
  version: number = 1;
}
