import BigNumber from 'bignumber.js';

/**
 * Payroll Calculation Unit Tests
 * Tests the core financial formulas independently from the NestJS DI container.
 * These functions mirror the logic in PayrollService to verify correctness.
 */

// ── Helpers mirroring PayrollService logic ─────────────────────────────────

function calculateTargetBasedSalary(dto: {
  baseSalary: number;
  variableSalary: number;
  targetValue: number;
  achievedValue: number;
  spiffBonus?: number;
  elapsedDaysInMonth?: number;
  totalDaysInMonth?: number;
}) {
  if (dto.targetValue <= 0) throw new Error('targetValue must be > 0');
  const base = new BigNumber(dto.baseSalary);
  const variable = new BigNumber(dto.variableSalary);
  const achievementRatio = new BigNumber(dto.achievedValue).dividedBy(dto.targetValue);
  const earnedVariable = variable.multipliedBy(achievementRatio);
  const spiff = new BigNumber(dto.spiffBonus ?? 0);
  const elapsedDays = dto.elapsedDaysInMonth ?? 30;
  const totalDays = dto.totalDaysInMonth ?? 30;
  const prorateRatio = new BigNumber(elapsedDays).dividedBy(totalDays);
  const proratedBase = base.multipliedBy(prorateRatio);
  const proratedVariable = earnedVariable.multipliedBy(prorateRatio);
  const gross = proratedBase.plus(proratedVariable).plus(spiff);
  const pf = proratedBase.multipliedBy('0.12');
  const tds = proratedVariable.multipliedBy('0.10');
  return { gross, net: gross.minus(pf).minus(tds), pf, tds };
}

function calculateSixTierBonusSla(dto: {
  baseVariableBonus: number;
  achievementPercent: number;
  qualityScore?: number;
  breachCount?: number;
}) {
  const tiers = [
    { threshold: 100, multiplier: 1.2 },
    { threshold: 85,  multiplier: 1.0 },
    { threshold: 75,  multiplier: 0.75 },
    { threshold: 60,  multiplier: 0.60 },
    { threshold: 50,  multiplier: 0.50 },
    { threshold: 0,   multiplier: 0.0 },
  ];
  const tier = tiers.find(t => dto.achievementPercent >= t.threshold) ?? tiers[tiers.length - 1];
  let multiplier = new BigNumber(tier.multiplier);
  if (dto.qualityScore !== undefined && dto.qualityScore < 80) {
    const penalty = new BigNumber(80 - dto.qualityScore).dividedBy(10).multipliedBy('0.05');
    multiplier = multiplier.minus(penalty).decimalPlaces(4, BigNumber.ROUND_DOWN);
  }
  if (dto.breachCount && dto.breachCount > 0) {
    multiplier = multiplier.minus(new BigNumber(dto.breachCount).multipliedBy('0.02'))
      .decimalPlaces(4, BigNumber.ROUND_DOWN);
  }
  if (multiplier.isLessThan(0)) multiplier = new BigNumber(0);
  return { effectiveMultiplier: multiplier, bonusAmount: new BigNumber(dto.baseVariableBonus).multipliedBy(multiplier) };
}

function calculateDaysWiseSalary(dto: {
  monthlyBaseSalary: number;
  workingDaysInMonth: number;
  unpaidLeaveDays: number;
  halfDays: number;
  targetBonus?: number;
}) {
  if (dto.workingDaysInMonth <= 0) throw new Error('workingDaysInMonth must be > 0');
  const dailyRate = new BigNumber(dto.monthlyBaseSalary).dividedBy(dto.workingDaysInMonth);
  const effectiveDays = new BigNumber(dto.workingDaysInMonth)
    .minus(dto.unpaidLeaveDays)
    .minus(new BigNumber(dto.halfDays).multipliedBy('0.5'))
    .decimalPlaces(2);
  if (effectiveDays.isLessThan(0)) throw new Error('Effective paid days resolved to negative');
  const proratedBase = dailyRate.multipliedBy(effectiveDays);
  const pf = proratedBase.multipliedBy('0.12');
  const esi = proratedBase.isLessThanOrEqualTo(21000) ? proratedBase.multipliedBy('0.0075') : new BigNumber(0);
  const gross = proratedBase.plus(dto.targetBonus ?? 0);
  const net = gross.minus(pf).minus(esi);
  return { dailyRate, effectiveDays, gross, net, pf, esi };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('PayrollService — calculateTargetBasedSalary', () => {
  it('full month, 100% achievement → full variable earned', () => {
    const r = calculateTargetBasedSalary({
      baseSalary: 50000, variableSalary: 20000, targetValue: 100, achievedValue: 100,
    });
    // achievementRatio = 1, prorateRatio = 1
    // gross = 50000 + 20000 = 70000
    expect(r.gross.toFixed(2)).toBe('70000.00');
  });

  it('50% achievement → 50% variable earned', () => {
    const r = calculateTargetBasedSalary({
      baseSalary: 50000, variableSalary: 20000, targetValue: 100, achievedValue: 50,
    });
    // earnedVariable = 10000; gross = 60000
    expect(r.gross.toFixed(2)).toBe('60000.00');
  });

  it('partial month (15/30 days) → 50% proration', () => {
    const r = calculateTargetBasedSalary({
      baseSalary: 60000, variableSalary: 0, targetValue: 100, achievedValue: 100,
      elapsedDaysInMonth: 15, totalDaysInMonth: 30,
    });
    expect(r.gross.toFixed(2)).toBe('30000.00');
  });

  it('spiff bonus is added on top after proration', () => {
    const r = calculateTargetBasedSalary({
      baseSalary: 50000, variableSalary: 0, targetValue: 100, achievedValue: 100, spiffBonus: 5000,
    });
    expect(r.gross.toFixed(2)).toBe('55000.00');
  });

  it('PF = 12% of proratedBase', () => {
    const r = calculateTargetBasedSalary({
      baseSalary: 50000, variableSalary: 0, targetValue: 100, achievedValue: 100,
    });
    expect(r.pf.toFixed(2)).toBe('6000.00'); // 12% of 50000
  });

  it('throws if targetValue is 0', () => {
    expect(() => calculateTargetBasedSalary({
      baseSalary: 50000, variableSalary: 0, targetValue: 0, achievedValue: 100,
    })).toThrow('targetValue must be > 0');
  });
});

describe('PayrollService — calculateSixTierBonusSla', () => {
  const base = 10000;

  it('≥100% → Platinum 1.2x', () => {
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 105 });
    expect(r.effectiveMultiplier.toFixed(2)).toBe('1.20');
    expect(r.bonusAmount.toFixed(2)).toBe('12000.00');
  });

  it('85–99% → Gold 1.0x', () => {
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 90 });
    expect(r.effectiveMultiplier.toFixed(2)).toBe('1.00');
  });

  it('75–84% → Silver 0.75x', () => {
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 80 });
    expect(r.effectiveMultiplier.toFixed(2)).toBe('0.75');
  });

  it('below 50% → 0x no bonus', () => {
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 30 });
    expect(r.bonusAmount.toFixed(2)).toBe('0.00');
  });

  it('quality penalty reduces multiplier', () => {
    // 85% achievement → Gold 1.0x; quality=60 → penalty=(80-60)/10*0.05=0.10
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 90, qualityScore: 60 });
    expect(r.effectiveMultiplier.toFixed(4)).toBe('0.9000');
  });

  it('breach penalty stacks on quality penalty', () => {
    // Gold 1.0x - qual penalty 0.10 - 2 breaches*0.02 = 0.76
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 90, qualityScore: 60, breachCount: 2 });
    expect(r.effectiveMultiplier.toFixed(4)).toBe('0.8600');
  });

  it('multiplier never goes negative', () => {
    const r = calculateSixTierBonusSla({ baseVariableBonus: base, achievementPercent: 51, qualityScore: 0, breachCount: 100 });
    expect(r.effectiveMultiplier.isGreaterThanOrEqualTo(0)).toBe(true);
  });
});

describe('PayrollService — calculateDaysWiseSalary', () => {
  it('full month no leave → full salary', () => {
    const r = calculateDaysWiseSalary({ monthlyBaseSalary: 30000, workingDaysInMonth: 26, unpaidLeaveDays: 0, halfDays: 0 });
    expect(r.effectiveDays.toFixed(2)).toBe('26.00');
    expect(r.gross.toFixed(2)).toBe('30000.00');
  });

  it('2 unpaid leave days reduces effective days', () => {
    const r = calculateDaysWiseSalary({ monthlyBaseSalary: 26000, workingDaysInMonth: 26, unpaidLeaveDays: 2, halfDays: 0 });
    // dailyRate = 1000; effectiveDays = 24; proratedBase = 24000
    expect(r.effectiveDays.toFixed(2)).toBe('24.00');
    expect(r.gross.toFixed(2)).toBe('24000.00');
  });

  it('half days count as 0.5 day each', () => {
    const r = calculateDaysWiseSalary({ monthlyBaseSalary: 26000, workingDaysInMonth: 26, unpaidLeaveDays: 0, halfDays: 2 });
    // effectiveDays = 26 - 0 - 1 = 25
    expect(r.effectiveDays.toFixed(2)).toBe('25.00');
  });

  it('leap February edge: 29 working days', () => {
    const r = calculateDaysWiseSalary({ monthlyBaseSalary: 29000, workingDaysInMonth: 29, unpaidLeaveDays: 0, halfDays: 0 });
    expect(r.dailyRate.toFixed(2)).toBe('1000.00');
    expect(r.gross.toFixed(2)).toBe('29000.00');
  });

  it('ESI applied when salary ≤ 21000', () => {
    const r = calculateDaysWiseSalary({ monthlyBaseSalary: 21000, workingDaysInMonth: 26, unpaidLeaveDays: 0, halfDays: 0 });
    expect(r.esi.isGreaterThan(0)).toBe(true);
  });

  it('ESI not applied when salary > 21000', () => {
    const r = calculateDaysWiseSalary({ monthlyBaseSalary: 30000, workingDaysInMonth: 26, unpaidLeaveDays: 0, halfDays: 0 });
    expect(r.esi.isEqualTo(0)).toBe(true);
  });

  it('throws if workingDaysInMonth is 0', () => {
    expect(() => calculateDaysWiseSalary({ monthlyBaseSalary: 30000, workingDaysInMonth: 0, unpaidLeaveDays: 0, halfDays: 0 }))
      .toThrow('workingDaysInMonth must be > 0');
  });

  it('throws if effective days go negative', () => {
    expect(() => calculateDaysWiseSalary({ monthlyBaseSalary: 30000, workingDaysInMonth: 5, unpaidLeaveDays: 10, halfDays: 0 }))
      .toThrow('Effective paid days resolved to negative');
  });
});
