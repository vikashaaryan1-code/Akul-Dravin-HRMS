# 07. Globalization and SLO Strategy

## Target SLO
- Availability target: 99.999% for critical API and auth paths.
- Error budget enforced by release gates.

## Reliability Architecture
- Multi-region active-active routing.
- Cell-based failure isolation.
- Automated failover and rollback playbooks.
- Chaos testing and quarterly DR simulation.

## 150+ Language Strategy
- ICU message format for localization catalogs.
- Real-time translation fallback (human-curated for compliance/legal flows).
- Voice AI language packs per region.
- NLP model routing by locale and domain.

## Compliance and Residency
- Regional data planes by jurisdiction.
- Tenant-level residency policy engine.
- Encryption and key residency controls.
