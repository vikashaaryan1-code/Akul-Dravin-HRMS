#!/usr/bin/env ts-node
/**
 * GOVERNANCE SCANNER CI RUNNER — Commit 12 (Baseline Mode)
 *
 * Standalone script that runs the governance static analysis scan
 * and exits with a non-zero code if NEW (non-baseline) violations are found.
 *
 * ── BASELINE MODE ─────────────────────────────────────────────────────────────
 *
 * If governance/baseline/governance-baseline.json exists (committed to Git),
 * violations are split into:
 *   NEW violations      → fail CI (exit 1/2/3 per severity)
 *   BASELINE violations → reported as non-blocking, shown separately
 *
 * This enables brownfield adoption: existing debt is accepted,
 * only regressions block PRs.
 *
 * To generate/refresh the baseline:
 *   npm run governance:baseline
 *
 * ── USAGE ─────────────────────────────────────────────────────────────────────
 *
 *   npm run governance:scan
 *   npm run governance:scan -- --format=sarif
 *   npm run governance:scan -- --mode=dashboard
 *   npm run governance:baseline       (write current violations as accepted)
 *
 * ── EXIT CODES ───────────────────────────────────────────────────────────────
 *
 *   0  — clean (no NEW violations)
 *   1  — NEW critical violations
 *   2  — NEW high violations (no critical)
 *   3  — NEW medium violations only (informational in most CI configs)
 *  99  — Fatal scanner error (ts-morph missing in CI, tsconfig not found, etc.)
 *
 * ── OUTPUT FORMATS ───────────────────────────────────────────────────────────
 *
 *   --format=table   (default) — aligned terminal table with baseline split
 *   --format=json    — structured JSON with baseline metadata
 *   --format=sarif   — SARIF v2.1.0 (GitHub Code Scanning)
 */

import * as path from 'path';
import { GovernanceScannerService, ScanResult, ScanViolation } from './governance-scanner.service';
import { GovernanceBaselineService, BaselineDiffResult } from './governance-baseline';
import { ViolationSeverity } from '../../../database/entities/violation-log.entity';
import { sarifExporter } from './sarif-exporter';

// ─────────────────────────────────────────────────────────────────────────────
// CLI Arguments
// ─────────────────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const mode        = args.find((a) => a.startsWith('--mode='))?.split('=')[1] ?? 'ci';
const format      = args.find((a) => a.startsWith('--format='))?.split('=')[1] ?? 'table';
const exitOnHigh  = !args.includes('--no-exit-on-high');
const isBaseline  = args.includes('--baseline');  // write baseline mode

// ─────────────────────────────────────────────────────────────────────────────
// ANSI Colours
// ─────────────────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const GREY   = '\x1b[90m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatters
// ─────────────────────────────────────────────────────────────────────────────

function printTableOutput(result: ScanResult, diff: BaselineDiffResult): void {
  const hasBaseline     = diff.baseline !== null;
  const newViolations   = diff.newViolations;
  const baselineViol    = diff.baselineViolations;
  const resolvedCount   = diff.resolvedBaseline.length;

  console.log('');
  console.log(`${BOLD}🔍 Governance Static Analysis Scanner${RESET}`);
  console.log(`${CYAN}Mode: ${result.mode} | Engine: ${result.astMode ? 'AST (ts-morph)' : 'Regex (fallback)'}${RESET}`);
  console.log(`Scanned at: ${result.scannedAt}`);

  if (hasBaseline) {
    console.log(`${DIM}Baseline: active (${diff.baseline!.violations.length} accepted violations)${RESET}`);
  } else {
    console.log(`${DIM}Baseline: none${RESET}`);
  }
  console.log('─'.repeat(80));

  // ── Summary ────────────────────────────────────────────────────────────────

  if (newViolations.length === 0 && result.totalViolations === 0) {
    console.log(`\n${GREEN}${BOLD}✅ CLEAN — No governance violations detected.${RESET}\n`);
    return;
  }

  if (newViolations.length === 0 && result.totalViolations > 0) {
    console.log(`\n${GREEN}${BOLD}✅ NO REGRESSIONS — All ${result.totalViolations} violation(s) are in the accepted baseline.${RESET}`);
    printBaselineSummary(baselineViol, resolvedCount);
    return;
  }

  // New (blocking) violations
  console.log('');
  const newCritical = newViolations.filter((v) => v.severity === ViolationSeverity.CRITICAL).length;
  const newHigh     = newViolations.filter((v) => v.severity === ViolationSeverity.HIGH).length;
  const newMedium   = newViolations.filter((v) => v.severity === ViolationSeverity.MEDIUM).length;

  console.log(`${BOLD}New violations (not in baseline):${RESET}  ${newViolations.length} total`);
  if (newCritical > 0) console.log(`  ${RED}${BOLD}● CRITICAL: ${newCritical}${RESET}`);
  if (newHigh > 0)     console.log(`  ${YELLOW}${BOLD}▲ HIGH:     ${newHigh}${RESET}`);
  if (newMedium > 0)   console.log(`  ${CYAN}◆ MEDIUM:   ${newMedium}${RESET}`);

  if (hasBaseline && baselineViol.length > 0) {
    console.log('');
    console.log(`${DIM}Baseline (accepted, non-blocking):  ${baselineViol.length} total`);
    const bCrit = baselineViol.filter((v) => v.severity === ViolationSeverity.CRITICAL).length;
    const bHigh = baselineViol.filter((v) => v.severity === ViolationSeverity.HIGH).length;
    const bMed  = baselineViol.filter((v) => v.severity === ViolationSeverity.MEDIUM).length;
    if (bCrit > 0) console.log(`  Critical: ${bCrit} / High: ${bHigh} / Medium: ${bMed}${RESET}`);
    else           console.log(`  High: ${bHigh} / Medium: ${bMed}${RESET}`);
  }
  console.log('');

  // Print new violation details
  printViolationGroups(newViolations, /* isBaseline= */ false);

  // Print baseline violations (dimmed, folded)
  if (hasBaseline && baselineViol.length > 0) {
    console.log(`${DIM}── Baseline violations (accepted — non-blocking) ────────────────────────────────${RESET}`);
    console.log('');
    printViolationGroups(baselineViol, /* isBaseline= */ true);
  }

  // Resolved baseline entries (stale)
  if (resolvedCount > 0) {
    console.log(`${GREEN}── ${resolvedCount} baseline violation(s) appear to be fixed! ──${RESET}`);
    for (const entry of diff.resolvedBaseline) {
      console.log(`  ${GREEN}✓${RESET} ${entry.file}:${entry.line}  [${entry.ruleId}]`);
    }
    console.log(`${GREEN}  → Run: npm run governance:baseline  (to refresh the baseline file)${RESET}`);
    console.log('');
  }

  // Final verdict
  console.log('─'.repeat(80));
  if (newCritical > 0) {
    console.log(`${RED}${BOLD}❌ BUILD FAILED: ${newCritical} new critical violation(s) — replay safety boundary breach.${RESET}`);
    if (hasBaseline) {
      console.log(`${RED}   These violations are NOT in the accepted baseline. Fix before merging.${RESET}`);
    }
  } else if (newHigh > 0) {
    console.log(`${YELLOW}${BOLD}⚠  BUILD BLOCKED: ${newHigh} new high violation(s) detected.${RESET}`);
  } else {
    console.log(`${CYAN}${BOLD}ℹ  INFORMATIONAL: ${newMedium} new medium violation(s) — not blocking.${RESET}`);
  }
  console.log('');
}

function printViolationGroups(violations: ScanViolation[], isBaselineGroup: boolean): void {
  const bySeverity = groupBy(violations, (v) => v.severity);
  const severityOrder: ViolationSeverity[] = [
    ViolationSeverity.CRITICAL,
    ViolationSeverity.HIGH,
    ViolationSeverity.MEDIUM,
  ];

  for (const severity of severityOrder) {
    const group = bySeverity.get(severity);
    if (!group || group.length === 0) continue;

    const color = isBaselineGroup ? DIM
                : severity === ViolationSeverity.CRITICAL ? RED
                : severity === ViolationSeverity.HIGH     ? YELLOW
                : CYAN;

    const label = isBaselineGroup ? `${severity} [baseline]` : severity;
    console.log(`${color}${BOLD}── ${label} (${group.length}) ──────────────────────────────────────────────${RESET}`);
    console.log('');

    const byRule = groupBy(group, (v) => v.ruleId);
    for (const [ruleId, ruleViolations] of byRule) {
      console.log(`  ${BOLD}Rule: ${ruleId}${RESET}`);
      for (const v of ruleViolations) {
        const rel = path.relative(process.cwd(), v.filePath).replace(/\\/g, '/');
        console.log(`    ${color}→${RESET} ${rel}:${v.lineNumber}`);
        console.log(`       ${isBaselineGroup ? DIM : ''}${v.message}${isBaselineGroup ? RESET : ''}`);
      }
      console.log('');
    }
  }
}

function printBaselineSummary(baselineViol: ScanViolation[], resolvedCount: number): void {
  if (baselineViol.length > 0) {
    console.log(`${DIM}  ${baselineViol.length} baseline violation(s) still present (non-blocking).${RESET}`);
    console.log(`${DIM}  Run: npm run governance:scan -- --format=table  for full list.${RESET}`);
  }
  if (resolvedCount > 0) {
    console.log(`${GREEN}  ${resolvedCount} baseline violation(s) were fixed! Run: npm run governance:baseline${RESET}`);
  }
  console.log('');
}

function printJsonOutput(result: ScanResult, diff: BaselineDiffResult): void {
  const output = {
    scannedAt:          result.scannedAt,
    engine:             result.astMode ? 'ast' : 'regex',
    mode:               result.mode,
    baseline:           diff.baseline ? {
      generatedAt:      diff.baseline.generatedAt,
      totalAccepted:    diff.baseline.violations.length,
    } : null,
    summary: {
      total:            result.totalViolations,
      new:              diff.newViolations.length,
      baseline:         diff.baselineViolations.length,
      resolvedFromBaseline: diff.resolvedBaseline.length,
      newCritical:      diff.newViolations.filter((v) => v.severity === ViolationSeverity.CRITICAL).length,
      newHigh:          diff.newViolations.filter((v) => v.severity === ViolationSeverity.HIGH).length,
      newMedium:        diff.newViolations.filter((v) => v.severity === ViolationSeverity.MEDIUM).length,
      baselineCritical: diff.baselineViolations.filter((v) => v.severity === ViolationSeverity.CRITICAL).length,
      baselineHigh:     diff.baselineViolations.filter((v) => v.severity === ViolationSeverity.HIGH).length,
    },
    newViolations: diff.newViolations.map(formatViolationJson),
    baselineViolations: diff.baselineViolations.map(formatViolationJson),
    resolvedBaseline: diff.resolvedBaseline,
  };
  console.log(JSON.stringify(output, null, 2));
}

function formatViolationJson(v: ScanViolation) {
  return {
    ruleId:        v.ruleId,
    severity:      v.severity,
    violationType: v.violationType,
    file:          v.filePath,
    line:          v.lineNumber,
    pattern:       v.pattern,
    message:       v.message,
    fingerprint:   v.fingerprint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const scanner     = new GovernanceScannerService(projectRoot);
  const baseline    = new GovernanceBaselineService(projectRoot);

  // ── Baseline write mode ──────────────────────────────────────────────────
  if (isBaseline) {
    console.log(`${BOLD}🔍 Governance Scanner — Baseline Write Mode${RESET}`);
    console.log(`Running scan to capture current violations as accepted baseline...`);
    console.log('');

    // Use dashboard mode (no CI hard-fail on ts-morph) since we want a complete picture
    const result = await scanner.scan({ mode: 'dashboard' });

    baseline.write(result.violations);

    console.log('');
    if (result.totalViolations === 0) {
      console.log(`${GREEN}${BOLD}Codebase is clean — baseline written with 0 violations.${RESET}`);
      console.log(`${GREEN}All future CI runs will fail only if new violations appear.${RESET}`);
    } else {
      console.log(`${YELLOW}${BOLD}Baseline written with ${result.totalViolations} violation(s).${RESET}`);
      console.log(`${YELLOW}These are now ACCEPTED and will not block CI.${RESET}`);
      console.log(`${YELLOW}Remove them from the baseline file as you fix the underlying issues.${RESET}`);
    }

    process.exit(0);
  }

  // ── Normal scan mode ─────────────────────────────────────────────────────

  const result = await scanner.scan({
    mode: mode as 'ci' | 'dashboard',
    // Note: DB persister is not wired here (no TypeORM connection in CLI context).
    // Violations are persisted to DB when the scan is triggered via:
    //   POST /governance/scan  (GovernanceDashboardController)
  });

  // Load baseline and diff
  const baselineData = baseline.load();
  const diff = baseline.diff(result.violations, baselineData);

  // Output
  if (format === 'sarif') {
    // SARIF always shows ALL violations (new + baseline) for complete GitHub Code Scanning visibility.
    // GitHub Code Scanning suppresses known issues separately via its own UI.
    const sarif = sarifExporter.export(result, projectRoot);
    console.log(JSON.stringify(sarif, null, 2));
  } else if (format === 'json') {
    printJsonOutput(result, diff);
  } else {
    printTableOutput(result, diff);
  }

  // ── Exit codes (based on NEW violations only, not baseline) ───────────────
  if (mode === 'dashboard') {
    process.exit(0);
  }

  const newCritical = diff.newViolations.filter((v) => v.severity === ViolationSeverity.CRITICAL).length;
  const newHigh     = diff.newViolations.filter((v) => v.severity === ViolationSeverity.HIGH).length;
  const newMedium   = diff.newViolations.filter((v) => v.severity === ViolationSeverity.MEDIUM).length;

  if (newCritical > 0) {
    process.exit(1);
  }
  if (newHigh > 0 && exitOnHigh) {
    process.exit(2);
  }
  if (newMedium > 0 && newCritical === 0 && newHigh === 0) {
    process.exit(3);
  }
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function groupBy<T, K>(arr: T[], fn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of arr) {
    const key = fn(item);
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────

main().catch((err: Error) => {
  console.error(`\n${RED}${BOLD}[GovernanceScanner] Fatal error:${RESET}`, err.message);
  if (err.message.includes('ts-morph')) {
    // ts-morph fatal is already well-formatted — don't print stack
    process.exit(99);
  }
  console.error(err.stack);
  process.exit(99);
});
