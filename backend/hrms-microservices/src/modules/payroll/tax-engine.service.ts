import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';

export interface TaxCalculationResult {
  grossSalary: string;
  deductions: {
    tds: string;
    pf: string;
    esi: string;
    professionalTax: string;
    lwf: string;
    total: string;
  };
  accruals: {
    gratuity: string;
    bonus: string;
  };
  netPayable: string;
  currency: string;
  taxRegime: 'OLD' | 'NEW';
}

@Injectable()
export class TaxEngineService {
  private readonly ROUND_MODE = BigNumber.ROUND_HALF_EVEN;

  /**
   * Calculates comprehensive statutory deductions for Indian Payroll (v1).
   * Supports both Old and New Tax Regimes (stubs).
   */
  calculateIndianTax(monthlyGross: string, regime: 'OLD' | 'NEW' = 'NEW'): TaxCalculationResult {
    const gross = new BigNumber(monthlyGross);
    
    // 1. Provident Fund (PF) - 12% of Basic (Assuming Basic is 50% of Gross)
    const basic = gross.multipliedBy(0.5);
    const pf = basic.multipliedBy(0.12).decimalPlaces(2, this.ROUND_MODE);

    // 2. ESI - 0.75% of Gross if Gross <= 21,000
    const esi = gross.isLessThanOrEqualTo(21000) 
      ? gross.multipliedBy(0.0075).decimalPlaces(2, this.ROUND_MODE)
      : new BigNumber(0);

    // 3. Professional Tax (PT) - Standard slab (e.g., ₹200)
    const pt = gross.isGreaterThan(15000) ? new BigNumber(200) : new BigNumber(0);

    // 4. Labour Welfare Fund (LWF) - Standard stub (e.g., ₹20 in Maharashtra/Karnataka)
    const lwf = new BigNumber(20);

    // 5. TDS (Income Tax) - simplified slab-based calculation
    const annualGross = gross.multipliedBy(12);
    let annualTax = new BigNumber(0);

    if (regime === 'NEW') {
      // New Regime Slabs (FY 2024-25 stubs)
      if (annualGross.isGreaterThan(700000)) {
        annualTax = annualGross.multipliedBy(0.10); // Simplified 10% flat above 7L for demo
      }
    } else {
      // Old Regime Slabs (Simplified)
      if (annualGross.isGreaterThan(500000)) {
        annualTax = annualGross.multipliedBy(0.15); // Simplified 15% flat above 5L for demo
      }
    }

    const tds = annualTax.dividedBy(12).decimalPlaces(2, this.ROUND_MODE);

    const totalDeductions = pf.plus(esi).plus(pt).plus(lwf).plus(tds);
    const net = gross.minus(totalDeductions).decimalPlaces(2, this.ROUND_MODE);

    // Accruals (Employer Liability, doesn't affect net payable immediately)
    // Gratuity: 4.81% of Basic
    const gratuity = basic.multipliedBy(0.0481).decimalPlaces(2, this.ROUND_MODE);
    // Bonus: 8.33% of Basic (Statutory minimum)
    const bonus = basic.multipliedBy(0.0833).decimalPlaces(2, this.ROUND_MODE);

    return {
      grossSalary: gross.toFixed(2),
      deductions: {
        tds: tds.toFixed(2),
        pf: pf.toFixed(2),
        esi: esi.toFixed(2),
        professionalTax: pt.toFixed(2),
        lwf: lwf.toFixed(2),
        total: totalDeductions.toFixed(2),
      },
      accruals: {
        gratuity: gratuity.toFixed(2),
        bonus: bonus.toFixed(2),
      },
      netPayable: net.toFixed(2),
      currency: 'INR',
      taxRegime: regime,
    };
  }

  /**
   * Calculates international contractor payouts with currency conversion stubs.
   * "Deel/Rippling-style" global payroll feature.
   */
  calculateInternationalContractorPayout(amount: string, currency: string, countryCode: string) {
    const baseAmount = new BigNumber(amount);
    
    // Stub exchange rates vs INR (for demo)
    const rates: Record<string, number> = { USD: 83.5, EUR: 90.2, GBP: 105.1, AED: 22.7 };
    const rate = rates[currency] || 1.0;
    
    const inrEquivalent = baseAmount.multipliedBy(rate).decimalPlaces(2, this.ROUND_MODE);

    // Compliance fee based on country risk (stub)
    const complianceFeePercent = countryCode === 'US' ? 0.02 : 0.05; // 2% for US, 5% others
    const complianceFee = baseAmount.multipliedBy(complianceFeePercent).decimalPlaces(2, this.ROUND_MODE);
    
    const netPayout = baseAmount.minus(complianceFee).decimalPlaces(2, this.ROUND_MODE);

    return {
      payoutAmount: amount,
      currency,
      inrEquivalent: inrEquivalent.toFixed(2),
      fees: {
        compliance: complianceFee.toFixed(2),
        platform: '10.00', // Flat $10 platform fee
      },
      netPayable: netPayout.minus(10).toFixed(2),
      complianceStatus: 'VERIFIED',
      estimatedArrival: '2-3 Business Days',
    };
  }
}
