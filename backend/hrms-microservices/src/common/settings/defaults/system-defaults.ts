import { OrganizationSettingsSchema } from '../schemas/organization-settings.schema';
import { RoundingStrategy } from '../schemas/payroll-settings.schema';

export const SYSTEM_DEFAULTS: OrganizationSettingsSchema = {
  payroll: {
    tdsEnabled: true,
    pfRate: 12.0,
    esiRate: 0.75,
    roundingStrategy: RoundingStrategy.BANKERS,
    version: 1,
  },
  financial: {
    allowNegativeBalance: false,
    precision: 2,
    version: 1,
  },
};
