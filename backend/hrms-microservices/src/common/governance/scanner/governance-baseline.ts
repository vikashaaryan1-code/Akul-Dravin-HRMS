import * as fs from 'fs';
import * as path from 'path';
import { ScanViolation } from './governance-scanner.service';

/**
 * GOVERNANCE BASELINE
 *
 * Stores a set of "accepted" violation fingerprints in a JSON file committed to Git.
 * Violations in the baseline are reported but do NOT fail CI.
 * Only NEW violations (fingerprints not in the baseline) fail CI.
 *
 * ── WHY GIT-BASELINE OVER DB-BASELINE ────────────────────────────────────────
 *
 * | Git Baseline                  | DB Baseline                 |
 * |-------------------------------|-----------------------------|
 * | Deterministic in CI           | Environment-dependent       |
 * | Reviewable in PRs             | Opaque mutations            |
 * | Branch-aware                  | Shared mutable state        |
 * | Works in ephemeral runners    | Requires DB sync            |
 * | Auditable diff history        | Weaker traceability         |
 *
 * DB-backed suppression (ViolationStatus.SUPPRESSED with expiry) is more
 * appropriate for temporary team-level waivers. Git baseline is for
 * permanent, reviewed, tech-debt acceptance.
 *
 * ── FILE FORMAT ──────────────────────────────────────────────────────────────
 *
 * File location: <projectRoot>/governance/baseline/governance-baseline.json
 *
 * {
 *   "version": 1,
 *   "generatedAt": "2026-05-13T00:00:00.000Z",
 *   "description": "Accepted baseline violations as of platform adoption.",
 *   "violations": [
 *     {
 *       "fingerprint": "abc123...",
 *       "ruleId": "HANDLER_NO_DOMAIN_ENTITY_IMPORT",
 *       "file": "src/common/domain-events/handlers/audit.projection-handler.ts",
 *       "line": 42,
 *       "severity": "critical",
 *       "message": "Handler imports PayrollBatchEntity from database/entities"
 *     }
 *   ]
 * }
 *
 * ── CI BEHAVIOUR ─────────────────────────────────────────────────────────────
 *
 * Without baseline:  ALL violations fail CI
 * With baseline:     Only NEW violations fail CI
 *                    Baseline violations are reported as "baseline" (non-blocking)
 *                    Resolved baseline violations show as "fixed" (stale baseline entry)
 *
 * ── PROGRESSIVE DEBT REDUCTION ───────────────────────────────────────────────
 *
 * Teams can burn down baseline debt by:
 *   1. Fixing the violation in code
 *   2. Running: npm run governance:baseline  (regenerates baseline without the fixed entry)
 *   3. Committing the updated baseline file
 *
 * This creates a PR-reviewable record of architectural improvements.
 */

export const BASELINE_VERSION = 1;
export const BASELINE_FILE_NAME = 'governance-baseline.json';

/** Default baseline location relative to project root. */
export const DEFAULT_BASELINE_DIR = 'governance/baseline';

export interface BaselineViolationEntry {
  fingerprint: string;
  ruleId:      string;
  file:        string;
  line:        number;
  severity:    string;
  message:     string;
}

export interface GovernanceBaseline {
  version:     number;
  generatedAt: string;
  description: string;
  violations:  BaselineViolationEntry[];
}

/**
 * Result of diffing live scan violations against a baseline.
 */
export interface BaselineDiffResult {
  /** New violations not in the baseline — these FAIL CI. */
  newViolations:      ScanViolation[];
  /** Violations also in the baseline — reported but non-blocking. */
  baselineViolations: ScanViolation[];
  /** Fingerprints in baseline that were NOT found in the current scan — violation was fixed. */
  resolvedBaseline:   BaselineViolationEntry[];
  /** The loaded baseline (or null if none exists). */
  baseline:           GovernanceBaseline | null;
}

export class GovernanceBaselineService {
  private readonly baselineDir:  string;
  private readonly baselinePath: string;

  constructor(projectRoot: string) {
    this.baselineDir  = path.join(projectRoot, DEFAULT_BASELINE_DIR);
    this.baselinePath = path.join(this.baselineDir, BASELINE_FILE_NAME);
  }

  /**
   * Load the baseline file from disk.
   * Returns null if no baseline file exists (first run, or baseline mode not enabled).
   */
  load(): GovernanceBaseline | null {
    if (!fs.existsSync(this.baselinePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(this.baselinePath, 'utf-8');
      const parsed = JSON.parse(raw) as GovernanceBaseline;

      if (parsed.version !== BASELINE_VERSION) {
        // Emit a warning but don't crash — version mismatch is recoverable
        process.stderr.write(
          `[GovernanceBaseline] WARNING: baseline version ${parsed.version} ` +
          `differs from expected ${BASELINE_VERSION}. Regenerate with: ` +
          `npm run governance:baseline\n`,
        );
      }

      return parsed;
    } catch (err) {
      process.stderr.write(
        `[GovernanceBaseline] ERROR: failed to parse baseline file at ${this.baselinePath}: ` +
        `${(err as Error).message}\n`,
      );
      return null;
    }
  }

  /**
   * Write a new baseline file from the current scan violations.
   * Overwrites any existing baseline.
   *
   * Called by: npm run governance:baseline
   */
  write(violations: ScanViolation[], description?: string): void {
    const baseline: GovernanceBaseline = {
      version:     BASELINE_VERSION,
      generatedAt: new Date().toISOString(),
      description: description ??
        `Accepted baseline as of ${new Date().toISOString().slice(0, 10)}. ` +
        `Review each entry and remove once fixed.`,
      violations: violations.map((v) => ({
        fingerprint: v.fingerprint,
        ruleId:      v.ruleId,
        file:        v.filePath,
        line:        v.lineNumber,
        severity:    v.severity,
        message:     v.message,
      })),
    };

    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true });
    }

    fs.writeFileSync(this.baselinePath, JSON.stringify(baseline, null, 2) + '\n', 'utf-8');

    process.stdout.write(
      `[GovernanceBaseline] Wrote ${violations.length} violations to baseline:\n` +
      `  ${this.baselinePath}\n\n` +
      `Commit this file to Git to activate baseline mode.\n` +
      `Only violations NOT in this file will fail future CI runs.\n`,
    );
  }

  /**
   * Diff live scan violations against a loaded baseline.
   *
   * Returns a structured diff:
   *   newViolations      → fail CI
   *   baselineViolations → report but don't fail
   *   resolvedBaseline   → stale baseline entries (violation was fixed)
   */
  diff(violations: ScanViolation[], baseline: GovernanceBaseline | null): BaselineDiffResult {
    if (!baseline) {
      // No baseline — everything is "new"
      return {
        newViolations:      violations,
        baselineViolations: [],
        resolvedBaseline:   [],
        baseline:           null,
      };
    }

    const baselineFingerprints = new Set(baseline.violations.map((e) => e.fingerprint));
    const liveFingerprints     = new Set(violations.map((v) => v.fingerprint));

    const newViolations      = violations.filter((v) => !baselineFingerprints.has(v.fingerprint));
    const baselineViolations = violations.filter((v) =>  baselineFingerprints.has(v.fingerprint));
    const resolvedBaseline   = baseline.violations.filter((e) => !liveFingerprints.has(e.fingerprint));

    return {
      newViolations,
      baselineViolations,
      resolvedBaseline,
      baseline,
    };
  }

  /** Returns the absolute path of the baseline file (for error messages). */
  get filePath(): string {
    return this.baselinePath;
  }

  /** True if a baseline file currently exists on disk. */
  get exists(): boolean {
    return fs.existsSync(this.baselinePath);
  }
}
