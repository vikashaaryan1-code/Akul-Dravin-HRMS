import { IsBoolean, IsInt, Min, Max, Equals } from 'class-validator';

export class FinancialSettingsSchema {
  @IsBoolean()
  @Equals(false, { message: 'Invariance Violation: FinancialSettings.allowNegativeBalance must always be false' })
  allowNegativeBalance: false = false;

  @IsInt()
  @Min(0)
  @Max(4)
  precision: number = 2;

  @IsInt()
  version: number = 1;
}
