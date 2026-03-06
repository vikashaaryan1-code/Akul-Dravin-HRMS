# React Native Mobile Architecture v1000.0

## Objective
Deliver secure, high-performance mobile access for employee self-service, manager approvals, and workforce operations.

## Stack
- React Native + TypeScript
- Zustand / Redux Toolkit
- React Navigation
- Secure storage for tokens
- WebSocket notifications

## Mobile App Modules
1. Employee Home
- Daily check-in/check-out
- Leave balance and requests
- Payslip and salary card
- Task and target progress

2. Manager Workspace
- Leave approvals
- Attendance anomaly approvals
- Team performance snapshot
- Quick workflow triggers

3. Recruiter Mobile
- Candidate shortlist updates
- Interview pipeline status
- Offer response tracking

4. Notifications
- Salary update alerts
- Target milestone alerts
- Leave approval alerts
- System and policy alerts

## Offline and Sync
- Local queue for attendance punches.
- Retry with idempotency token.
- Delta sync for dashboard summaries.

## Security
- Biometric unlock.
- Token refresh and device binding.
- Role-based feature gating from backend policy payload.

## API Integration
- REST endpoints for write operations.
- GraphQL read gateway for consolidated mobile dashboards.
- WebSocket for realtime notification stream.

## Release Channels
- Internal QA channel.
- Staged production rollout.
- Region-wise feature flags.
