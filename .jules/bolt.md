## 2025-05-22 - [Optimized TicketService stats query]
**Learning:** Consolidating multiple sequential `count()` operations into a single database query using conditional aggregation (`SUM(CASE WHEN...)`) significantly reduces database round-trips and improves performance, especially when scaling.
**Action:** Always look for patterns where multiple counts or sums are performed on the same entity and consolidate them into a single query using `createQueryBuilder` and conditional aggregation.
