/**
 * Environment variable validation at startup.
 *
 * Extends the basic check in main.ts with:
 * - Required vs recommended classification
 * - Type checking (numbers, booleans, URLs)
 * - Warnings with feature impact descriptions
 * - Startup summary report
 */

type EnvLevel = 'CRITICAL' | 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';

interface EnvSpec {
  key: string;
  level: EnvLevel;
  description: string;
  /** Feature degraded if missing */
  impact?: string;
  validator?: (val: string) => boolean;
  default?: string;
}

const ENV_SPECS: EnvSpec[] = [
  // Critical — app will not function at all
  { key: 'JWT_SECRET', level: 'CRITICAL', description: 'JWT signing secret (min 32 chars)', validator: v => v.length >= 32 },
  { key: 'DB_HOST', level: 'CRITICAL', description: 'PostgreSQL host' },

  // Required — core features broken
  { key: 'DB_USER', level: 'REQUIRED', description: 'PostgreSQL username', default: 'postgres' },
  { key: 'DB_PASSWORD', level: 'REQUIRED', description: 'PostgreSQL password' },
  { key: 'DB_NAME', level: 'REQUIRED', description: 'PostgreSQL database name', default: 'akul_dravin_hrms' },
  { key: 'DB_PORT', level: 'REQUIRED', description: 'PostgreSQL port', default: '5432', validator: v => !isNaN(Number(v)) },

  // Recommended — features degraded
  { key: 'REDIS_HOST', level: 'RECOMMENDED', description: 'Redis host for caching, queues, brute-force protection', impact: 'BullMQ queues, brute-force protection, rate limiting disabled' },
  { key: 'REDIS_PORT', level: 'RECOMMENDED', description: 'Redis port', default: '6379' },
  { key: 'OPENAI_API_KEY', level: 'RECOMMENDED', description: 'OpenAI API key for AI Hub', impact: 'AI chat falls back to Anthropic then rule-based responses' },
  { key: 'ANTHROPIC_API_KEY', level: 'RECOMMENDED', description: 'Anthropic API key (fallback AI provider)', impact: 'AI falls back to rule-based responses only' },
  { key: 'STRIPE_SECRET', level: 'RECOMMENDED', description: 'Stripe secret key for billing', impact: 'Billing and subscription features disabled' },
  { key: 'STRIPE_WEBHOOK_SECRET', level: 'RECOMMENDED', description: 'Stripe webhook signing secret', impact: 'Stripe webhook verification disabled (security risk)' },
  { key: 'AWS_SES_ACCESS_KEY', level: 'RECOMMENDED', description: 'AWS SES access key for transactional email', impact: 'Emails fall back to SMTP or no-op' },
  { key: 'AWS_SES_SECRET', level: 'RECOMMENDED', description: 'AWS SES secret key', impact: 'AWS SES email sending disabled' },
  { key: 'AWS_SES_FROM_EMAIL', level: 'RECOMMENDED', description: 'Verified SES sender address', impact: 'Email notifications disabled' },
  { key: 'SMTP_HOST', level: 'RECOMMENDED', description: 'SMTP host (fallback email)', impact: 'Email falls back to console logger only' },
  { key: 'TWILIO_ACCOUNT_SID', level: 'RECOMMENDED', description: 'Twilio Account SID for SMS', impact: 'SMS notifications disabled' },
  { key: 'TWILIO_AUTH_TOKEN', level: 'RECOMMENDED', description: 'Twilio Auth Token', impact: 'SMS notifications disabled' },
  { key: 'TOTP_ENCRYPTION_KEY', level: 'RECOMMENDED', description: '64-char hex key for TOTP secret encryption (AES-256)', impact: '2FA secrets stored with degraded encryption' },
  { key: 'ALLOWED_ORIGINS', level: 'RECOMMENDED', description: 'Comma-separated allowed CORS origins', impact: 'CORS uses default whitelist (may block custom domains)' },

  // Optional — nice to have
  { key: 'SKIP_MICROSERVICES', level: 'OPTIONAL', description: 'Set true to skip TCP microservice binding' },
  { key: 'WORKER_TYPE', level: 'OPTIONAL', description: 'Worker mode (all | email | ai-jobs | reports)' },
  { key: 'PORT', level: 'OPTIONAL', description: 'HTTP listen port', default: '4001' },
  { key: 'NODE_ENV', level: 'OPTIONAL', description: 'Environment (production | development)', default: 'development' },
];

export interface EnvValidationReport {
  status: 'OK' | 'DEGRADED' | 'CRITICAL_MISSING';
  critical: string[];
  required: string[];
  recommended: string[];
  optional: string[];
  impacts: string[];
}

export function validateEnvironment(): EnvValidationReport {
  const report: EnvValidationReport = {
    status: 'OK',
    critical: [],
    required: [],
    recommended: [],
    optional: [],
    impacts: [],
  };

  for (const spec of ENV_SPECS) {
    const val = process.env[spec.key] ?? spec.default;
    const missing = !val && !spec.default;
    const invalid = val && spec.validator && !spec.validator(val);

    if (missing || invalid) {
      const msg = invalid
        ? `${spec.key}: invalid value — ${spec.description}`
        : `${spec.key}: ${spec.description}`;

      switch (spec.level) {
        case 'CRITICAL':  report.critical.push(msg); break;
        case 'REQUIRED':  report.required.push(msg); break;
        case 'RECOMMENDED': report.recommended.push(msg); if (spec.impact) report.impacts.push(spec.impact); break;
        case 'OPTIONAL':  report.optional.push(msg); break;
      }
    }
  }

  if (report.critical.length > 0) report.status = 'CRITICAL_MISSING';
  else if (report.required.length > 0 || report.recommended.length > 0) report.status = 'DEGRADED';

  return report;
}

export function printEnvReport(report: EnvValidationReport, logger = console): void {
  const sep = '━'.repeat(60);
  logger.log(`\n${sep}`);
  logger.log('  AKUL DRAVIN HRMS — Environment Validation Report');
  logger.log(sep);

  if (report.critical.length > 0) {
    logger.error(`  ❌ CRITICAL MISSING (${report.critical.length})`);
    report.critical.forEach(m => logger.error(`     • ${m}`));
  }

  if (report.required.length > 0) {
    logger.warn(`  ⚠️  REQUIRED MISSING (${report.required.length})`);
    report.required.forEach(m => logger.warn(`     • ${m}`));
  }

  if (report.recommended.length > 0) {
    logger.warn(`  💡 RECOMMENDED MISSING (${report.recommended.length})`);
    report.recommended.forEach(m => logger.warn(`     • ${m}`));
  }

  if (report.impacts.length > 0) {
    logger.warn(`\n  Feature impacts:`);
    report.impacts.forEach(i => logger.warn(`     ⬦ ${i}`));
  }

  const statusEmoji = { OK: '✅', DEGRADED: '⚠️', CRITICAL_MISSING: '❌' }[report.status];
  logger.log(`\n  ${statusEmoji} Status: ${report.status}`);
  logger.log(`${sep}\n`);

  if (report.status === 'CRITICAL_MISSING') {
    logger.error('  Cannot start — critical environment variables missing. Exiting.');
    process.exit(1);
  }
}
