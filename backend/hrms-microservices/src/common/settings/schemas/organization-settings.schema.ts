import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PayrollSettingsSchema } from './payroll-settings.schema';
import { FinancialSettingsSchema } from './financial-settings.schema';

export class OrganizationSettingsSchema {
  @ValidateNested()
  @Type(() => PayrollSettingsSchema)
  payroll: PayrollSettingsSchema = new PayrollSettingsSchema();

  @ValidateNested()
  @Type(() => FinancialSettingsSchema)
  financial: FinancialSettingsSchema = new FinancialSettingsSchema();
}
