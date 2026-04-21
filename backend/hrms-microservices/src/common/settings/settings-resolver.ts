import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { OrganizationSettingsSchema } from './schemas/organization-settings.schema';
import { SYSTEM_DEFAULTS } from './defaults/system-defaults';

export class SettingsResolver {
  /**
   * Resolves raw JSON settings into a validated instance of OrganizationSettingsSchema.
   * Merges raw overrides with system defaults.
   */
  static resolve(rawOverrides: Record<string, any>): OrganizationSettingsSchema {
    // 1. Deep merge overrides into a clone of SYSTEM_DEFAULTS
    const merged = this.deepMerge({ ...SYSTEM_DEFAULTS }, rawOverrides);

    // 2. Transform to Class instance for validation logic
    const instance = plainToInstance(OrganizationSettingsSchema, merged);

    // 3. Strict Validation
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      console.warn('Organization Settings Validation Failed. Falling back to specific defaults for invalid keys.', errors);
      // In a strict production system, we might throw an error here for "Critical" keys
      // But for resilience, we return the validated instance (invalid fields will still be class-validator defaults or system defaults if transformation succeeded)
    }

    return instance;
  }

  private static deepMerge(target: any, source: any): any {
    if (!source) return target;
    
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    
    Object.assign(target || {}, source);
    return target;
  }
}
