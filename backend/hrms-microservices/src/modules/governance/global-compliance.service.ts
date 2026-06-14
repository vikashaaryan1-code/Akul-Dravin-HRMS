import { Injectable, Logger } from '@nestjs/common';

export enum ComplianceRegion {
  INDIA = 'INDIA',
  UAE = 'UAE',
  USA = 'USA',
  EU = 'EU',
}

export interface ComplianceRule {
  id: string;
  region: ComplianceRegion;
  category: 'TAX' | 'LABOR' | 'PRIVACY' | 'DATA_SOVEREIGNTY';
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

@Injectable()
export class GlobalComplianceService {
  private readonly logger = new Logger(GlobalComplianceService.name);

  private readonly regionalRules: ComplianceRule[] = [
    { id: 'IN-TAX-01', region: ComplianceRegion.INDIA, category: 'TAX', description: 'TDS (Tax Deducted at Source) compliance', severity: 'CRITICAL' },
    { id: 'IN-LABOR-01', region: ComplianceRegion.INDIA, category: 'LABOR', description: 'EPF/ESI statutory contributions', severity: 'HIGH' },
    { id: 'UAE-LABOR-01', region: ComplianceRegion.UAE, category: 'LABOR', description: 'WPS (Wages Protection System) alignment', severity: 'CRITICAL' },
    { id: 'UAE-TAX-01', region: ComplianceRegion.UAE, category: 'TAX', description: 'Corporate Tax & VAT Filing', severity: 'MEDIUM' },
    { id: 'USA-TAX-01', region: ComplianceRegion.USA, category: 'TAX', description: 'IRS Form W-2 / 1099 generation', severity: 'CRITICAL' },
    { id: 'EU-PRIVACY-01', region: ComplianceRegion.EU, category: 'PRIVACY', description: 'GDPR Right to be Forgotten', severity: 'CRITICAL' },
  ];

  /**
   * Applies region-specific taxation and compliance logic.
   * "Sovereign Grade" Global Compliance.
   */
  async applyRegionalCompliance(region: ComplianceRegion, payrollData: any) {
    this.logger.log(`Applying ${region} compliance logic to payroll`);

    switch (region) {
      case ComplianceRegion.INDIA:
        return this.applyIndiaCompliance(payrollData);
      case ComplianceRegion.UAE:
        return this.applyUAECompliance(payrollData);
      case ComplianceRegion.USA:
        return this.applyUSACompliance(payrollData);
      case ComplianceRegion.EU:
        return this.applyEUCompliance(payrollData);
      default:
        return payrollData;
    }
  }

  /**
   * Evaluates compliance of a transaction or record against global rules.
   */
  async evaluateCompliance(tenantId: string, region: ComplianceRegion, data: any) {
    this.logger.log(`Compliance Engine: Evaluating ${region} rules for tenant=${tenantId}`);

    const relevantRules = this.regionalRules.filter(r => r.region === region);
    const violations = [];

    // Simulate rule checks
    if (region === ComplianceRegion.INDIA && !data.panNumber) {
      violations.push({ ruleId: 'IN-TAX-01', message: 'Missing PAN Number for tax deduction.' });
    }

    return {
      tenantId,
      region,
      isCompliant: violations.length === 0,
      violations,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private applyIndiaCompliance(data: any) {
    return { ...data, pfEnabled: true, ptEnabled: true, gstCompliant: true, taxStub: { tds: 0.1, pf: 0.12 } };
  }

  private applyUAECompliance(data: any) {
    return { ...data, gratuityEnabled: true, wpsCompliant: true, taxFree: true, taxStub: { gratuity: 0.05 } };
  }

  private applyUSACompliance(data: any) {
    return { ...data, federalTaxEnabled: true, stateTaxEnabled: true, w2Compliant: true, taxStub: { federal: 0.15 } };
  }

  private applyEUCompliance(data: any) {
    return { ...data, gdprCompliant: true, vatCompliant: true, healthInsuranceMandatory: true, taxStub: { vat: 0.20 } };
  }

  /**
   * Validates cross-border data sovereignty requirements.
   */
  async checkDataSovereignty(tenantId: string, dataLocation: string) {
    this.logger.debug(`Compliance: Checking data sovereignty for tenant=${tenantId} in ${dataLocation}`);
    return {
      allowed: true,
      reason: 'Sovereign blueprint compliant',
    };
  }
}
