# Bolt's Performance Optimization Journal

## 2026-07-17 - TypeORM raw aggregation aliases and grouped counting
**Learning:** When using TypeORM's `createQueryBuilder` for conditional aggregation (like SUM/CASE), PostgreSQL unquoted aliases default to lowercase (e.g., `promoterscount`), which breaks strict camelCase properties required by the API. Double-quoting the select alias (e.g., `SUM(CASE...) AS "promotersCount"`) preserves the exact camelCase naming across database dialects.
Additionally, resolving N+1 query loops can be cleanly done by executing a single grouped COUNT query mapped via a JS Map, which keeps the code clean and is much simpler to unit-test and mock compared to nesting subqueries inside `addSelect`.
**Action:** Always use double quotes for raw select property aliases in conditional aggregations, and prioritize grouped querying with Map lookups to replace N+1 loops in a testable manner.
