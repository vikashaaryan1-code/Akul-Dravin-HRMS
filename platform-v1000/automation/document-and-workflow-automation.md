# Document and Workflow Automation Architecture (v1000.0)

## 1. Automation components
- `workflow_service`: receives domain events and resolves automation rules.
- `document_service`: template selection, rendering, signing, distribution.
- `notification_service`: delivery across email/SMS/WhatsApp/push.
- `print_integration_worker`: ID card and visiting card print dispatch.

## 2. Event flow
1. Domain service emits event (example: `offer.accepted`).
2. Workflow service loads active trigger rules by `event_key` and tenant.
3. Idempotency gate checks if event already processed.
4. Actions are expanded into execution plan (documents, approvals, service enrollments, payouts).
5. Execution status is tracked per action with retry and DLQ handling.

## 3. Trigger classes
- Recruitment events.
- Employment events.
- Exit events.
- Time/system events.
- Target/compensation events.
- Service enrollment events.

## 4. Document categories
- HR letters (offer, appointment, transfer, appraisal, relieving).
- Certificates (skill, compliance, achievement).
- Identity artifacts (ID cards, badges, visiting cards).
- Compliance forms (Form 16, PF/ESI statements, declarations).

## 5. Template architecture
- HTML template + JSON schema data contract.
- Render to PDF/PNG with signature and watermark options.
- Versioned template lifecycle: `draft -> approved -> published -> retired`.
- Locale-aware variants per template.

## 6. Resilience controls
- Outbox pattern for event publication.
- Per-action idempotency key (`event_id + action_key`).
- Retry policy with exponential backoff.
- Dead-letter queues with operator replay controls.

## 7. Compliance controls
- Immutable hash of generated document payload.
- Policy checks before rendering PII-heavy documents.
- Access logging for document views/downloads.
- Retention and purge by compliance region policy.
