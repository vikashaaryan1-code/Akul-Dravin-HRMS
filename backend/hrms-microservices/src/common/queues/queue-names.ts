/**
 * Queue names — single source of truth for all BullMQ queues.
 * Import this file in both producers and consumers to avoid typo bugs.
 *
 * Queue domain taxonomy:
 *  AI        — attrition scans, candidate scoring, workforce forecasting
 *  Analytics — KPI snapshots, cache warming, trend materialization
 *  Payroll   — salary generation, commission calculation, tax computation
 *  Notifications — email, Slack, webhook delivery, escalations
 *  Governance    — audit persistence, compliance scans, policy re-evaluation
 *  Reports   — async report generation
 *  Automation    — workflow triggers
 *  Webhooks  — outbound HTTP event delivery
 *  SearchIndex   — Elasticsearch/OpenSearch sync
 *  ActivityFeed  — user activity stream writes
 *  Emails    — transactional email rendering + SMTP dispatch
 */
export const QUEUE_NOTIFICATIONS  = 'notifications';
export const QUEUE_EMAILS         = 'emails';
export const QUEUE_AI_JOBS        = 'ai-jobs';
export const QUEUE_ANALYTICS      = 'analytics';
export const QUEUE_REPORTS        = 'reports';
export const QUEUE_AUTOMATION     = 'automation';
export const QUEUE_PAYROLL        = 'payroll';
export const QUEUE_WEBHOOKS       = 'webhooks';
export const QUEUE_SEARCH_INDEX   = 'search-index';
export const QUEUE_ACTIVITY_FEED  = 'activity-feed';
export const QUEUE_GOVERNANCE     = 'governance';
export const QUEUE_DOMAIN_EVENTS  = 'domain-events';

export const ALL_QUEUES = [
  QUEUE_NOTIFICATIONS,
  QUEUE_EMAILS,
  QUEUE_AI_JOBS,
  QUEUE_ANALYTICS,
  QUEUE_REPORTS,
  QUEUE_AUTOMATION,
  QUEUE_PAYROLL,
  QUEUE_WEBHOOKS,
  QUEUE_SEARCH_INDEX,
  QUEUE_ACTIVITY_FEED,
  QUEUE_GOVERNANCE,
  QUEUE_DOMAIN_EVENTS,
] as const;

export type QueueName = typeof ALL_QUEUES[number];
