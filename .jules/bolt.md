# Bolt's Journal - Critical Learnings

## 2026-11-04 - Grouped Aggregation for Ledger Reporting to Eliminate N+1 Queries
**Learning:** `ReportingService.getTrialBalance` and `ReportingService.getLiabilityReport` iterated through all tenant accounts and executed 2 individual queries per account (`calculateAccountTotals`), creating an O(N) query bottleneck (1 + 2N queries). Furthermore, those queries lacked tenant isolation checks. By using `TenantQueryPolicy.enforce` with `groupBy('entry.debitAccountId')` and `groupBy('entry.creditAccountId')`, all debit and credit sums across accounts can be retrieved in a constant 2 queries, reducing total round trips to 3 queries.
**Action:** When calculating ledger balances across multiple accounts, always aggregate entries at the database level grouped by account ID instead of issuing sequential per-account sum queries.
