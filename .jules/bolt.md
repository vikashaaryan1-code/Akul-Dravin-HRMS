## 2026-06-05 - [PostgreSQL Conditional Aggregation for Microservices]
**Learning:** Consolidating multiple database count operations into a single query using the PostgreSQL `FILTER` clause (e.g., `COUNT(*) FILTER (WHERE status = 'active')`) significantly reduces network overhead and database load. This is especially critical in microservice environments where the application-database roundtrip latency can be high.
**Action:** Always look for patterns of multiple `count()` calls in the same service method and refactor them into a single `createQueryBuilder` call with conditional aggregation.

## 2026-06-05 - [Organizational Identifier Mismatch]
**Learning:** Discovered a naming inconsistency where the `Employee` entity uses `companyId` for its tenant/organizational scope, while the initial service code used `tenantId`. This mismatch leads to empty results even when data is present.
**Action:** Verify the entity's organizational field name (often `companyId` or `tenantId`) before implementing filters to ensure data consistency.
