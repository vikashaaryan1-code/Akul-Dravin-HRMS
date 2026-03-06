# Compensation Engine Blueprint (v1000.0)

## 1. Target-based salary model

### Inputs
- `base_salary`: fixed monthly pay.
- `variable_salary`: target-linked variable pay.
- `target_value`: target assigned for period.
- `achieved_value`: actual achieved value.
- `spiff_bonus`: optional extra bonus.

### Achievement formula
`achievement_percent = (achieved_value / target_value) * 100`

### Tier table
| Tier | Achievement % | Multiplier | Rule |
|---|---:|---:|---|
| T1 | 0 - <50 | 0.00 | No variable payout |
| T2 | 50 - <75 | 0.25 | `variable_salary * 0.25` |
| T3 | 75 - <90 | 0.50 | `variable_salary * 0.50` |
| T4 | 90 - <100 | 0.75 | `variable_salary * 0.75` |
| T5 | 100 - <120 | 1.00 + overflow | Full variable + 50% overflow uplift |
| T6 | >=120 | 1.50 + spiff | `variable_salary * 1.50 + spiff_bonus` |

### Tier 5 overflow
`overflow_percent = min(achievement_percent - 100, 20)`
`overflow_amount = variable_salary * (overflow_percent / 100)`
`tier5_variable_payout = variable_salary + (overflow_amount * 0.5)`

### Output
- tier code, multiplier, variable payout, total gross payout.
- optional month-end forecast based on elapsed days.

## 2. Days-wise salary model

### Inputs
- `monthly_base_salary`
- `working_days_in_month`
- `paid_leave_days`
- `unpaid_leave_days`
- `half_days`
- `on_duty_days`
- `wfh_days`
- `deductions[]`

### Calculation
`daily_rate = monthly_base_salary / working_days_in_month`

`gross_salary = monthly_base_salary
- (unpaid_leave_days * daily_rate)
- (half_days * 0.5 * daily_rate)
+ (paid_leave_days * daily_rate)
+ (on_duty_days * daily_rate)
+ (wfh_days * daily_rate)`

`total_deductions = sum(deductions.amount)`
`net_salary = gross_salary - total_deductions`

## 3. Combined monthly payout
`final_monthly_payment = net_salary + target_bonus_payout`

## 4. Auditability requirements
- Persist input snapshot and computed outputs with algorithm version.
- Store tier decision metadata and rule version id.
- Capture actor (`system`, `manager`, `payroll_admin`) for overrides.

## 5. API contracts
- `POST /api/v1/payroll/calculate/target-based`
- `POST /api/v1/payroll/calculate/days-wise`

Both endpoints must return deterministic numeric breakdown and currency fields.

## 6. Example API payloads

### Target-based salary
Request:
```json
{
  "baseSalary": 50000,
  "variableSalary": 30000,
  "targetValue": 1000000,
  "achievedValue": 1150000,
  "spiffBonus": 5000,
  "elapsedDaysInMonth": 20,
  "totalDaysInMonth": 31,
  "currency": "INR"
}
```

Response (shape):
```json
{
  "algorithmVersion": "v1000.0-target-tier",
  "tier": "T5",
  "status": "Exceeded Target",
  "achievementPercent": 115,
  "multiplier": 1,
  "variablePayout": 32250,
  "grossPayout": 82250,
  "forecast": {
    "forecastAchievedValue": 1782500,
    "forecastAchievementPercent": 178.25,
    "projectedTier": "T6",
    "projectedGrossPayout": 100000
  }
}
```

### Days-wise salary
Request:
```json
{
  "monthlyBaseSalary": 50000,
  "workingDaysInMonth": 23,
  "paidLeaveDays": 1,
  "unpaidLeaveDays": 2,
  "halfDays": 1,
  "deductions": [
    { "name": "PF", "amount": 5608.7 },
    { "name": "ESI", "amount": 350.54 },
    { "name": "Income Tax", "amount": 2100 },
    { "name": "Professional Tax", "amount": 200 },
    { "name": "Loan EMI", "amount": 1000 },
    { "name": "Advance Recovery", "amount": 500 }
  ],
  "targetBonus": 35000,
  "currency": "INR"
}
```

Response (shape):
```json
{
  "algorithmVersion": "v1000.0-days-wise",
  "dailyRate": 2173.913,
  "grossSalary": 46739.13,
  "totalDeductions": 9759.24,
  "netSalary": 36979.89,
  "targetBonus": 35000,
  "finalMonthlyPayment": 71979.89
}
```
