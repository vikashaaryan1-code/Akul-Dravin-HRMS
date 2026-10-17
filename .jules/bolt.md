## 2025-01-01 - TypeORM setParameters overwrites TenantQueryPolicy parameters
**Learning:** Calling `.setParameters({...})` on a TypeORM `SelectQueryBuilder` replaces the internal parameter map completely, wiping out parameters injected by `TenantQueryPolicy.enforce()` (such as `_governedTenantId`).
**Action:** Always pass parameters directly inside `.andWhere('...', { ... })` or use `.setParameter(key, value)` to safely merge parameters into the existing parameter map.
