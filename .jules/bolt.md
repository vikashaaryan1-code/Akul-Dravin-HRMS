# Bolt's Journal - Critical Learnings Only

## 2026-08-06 - Consolidating 3N+1 Bottlenecks in Performance Management Service
**Learning:** In nested loops where each employee executes multiple repository count/find queries, database round-trips scale linearly at $O(N)$. Combining subqueries in QueryBuilder's `addSelect()` and left joins with the main query allows us to fetch all metrics (attendance rates, task completion, and subjective review scores) in exactly 1 single database round-trip ($O(1)$ complexity) while perfectly preserving isolation via `TenantQueryPolicy.enforce`.
**Action:** When optimizing loop-based query bottlenecks, design a single QueryBuilder query utilizing `addSelect()` with subquery callbacks for independent aggregate counts, and leftJoin for related entities. Always mock the subquery callbacks in Jest to avoid 'TypeError: Cannot read properties of undefined'.
