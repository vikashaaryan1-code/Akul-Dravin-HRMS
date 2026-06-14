/**
 * SARIF EXPORTER — Commit 11
 *
 * Converts GovernanceScannerService output to SARIF v2.1.0 format.
 * SARIF (Static Analysis Results Interchange Format) is the standard
 * accepted by GitHub Advanced Security, Azure DevOps, and VS Code.
 *
 * GitHub Code Scanning integration:
 *   1. Run: npm run governance:scan:json > governance-results.sarif.json
 *      (with --format=sarif flag added to runner)
 *   2. Upload in CI:
 *      uses: github/codeql-action/upload-sarif@v3
 *      with: sarif_file: governance-results.sarif.json
 *   3. Violations appear directly in GitHub PR diff views and Security tab.
 *
 * SARIF v2.1.0 schema: https://json.schemastore.org/sarif-2.1.0.json
 *
 * Severity mapping:
 *   critical  → level: error   (blocks merge in GitHub Code Scanning)
 *   high      → level: error   (blocks merge in GitHub Code Scanning)
 *   medium    → level: warning  (informational in PR diff)
 *   low       → level: note    (advisory only)
 *
 * RULE ID STABILITY:
 *   SARIF uses ruleId to correlate findings across PR runs.
 *   If ruleId changes, GitHub loses the correlation history for that rule.
 *   This is why GovernanceRuleId enum values are IMMUTABLE once published.
 */

import * as path from 'path';
import { ScanResult, ScanViolation } from './governance-scanner.service';
import { FORBIDDEN_DEPENDENCY_MATRIX } from './forbidden-dependency-matrix';
import { GovernanceRuleId, RULE_SARIF_LEVEL } from './governance-rule-id.enum';

// ─────────────────────────────────────────────────────────────────────────────
// SARIF v2.1.0 Types (minimal subset needed for governance export)
// ─────────────────────────────────────────────────────────────────────────────

export interface SarifLog {
  $schema: string;
  version: '2.1.0';
  runs:    SarifRun[];
}

export interface SarifRun {
  tool:        SarifTool;
  results:     SarifResult[];
  /** URI base IDs allow relative paths in locations. */
  originalUriBaseIds: Record<string, { uri: string }>;
}

export interface SarifTool {
  driver: SarifDriver;
}

export interface SarifDriver {
  name:             string;
  version:          string;
  informationUri:   string;
  rules:            SarifRule[];
}

export interface SarifRule {
  id:                   string;
  name:                 string;
  shortDescription:     { text: string };
  fullDescription:      { text: string };
  defaultConfiguration: { level: 'error' | 'warning' | 'note' };
  helpUri?:             string;
  properties?:          { tags: string[]; severity: string };
}

export interface SarifResult {
  ruleId:    string;
  level:     'error' | 'warning' | 'note';
  message:   { text: string };
  locations: SarifLocation[];
  fingerprints?: Record<string, string>;
  partialFingerprints?: Record<string, string>;
}

export interface SarifLocation {
  physicalLocation: {
    artifactLocation: {
      uri:     string;
      uriBaseId: '%SRCROOT%';
    };
    region: {
      startLine:   number;
      startColumn?: number;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exporter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SARIF_EXPORTER
 *
 * Pure function (no state, no DI) — converts ScanResult to SARIF log.
 * The export can be called from the CI runner (--format=sarif) or from
 * the GovernanceDashboardController (/governance/scan/sarif endpoint).
 *
 * The tool.driver.rules section lists ALL rules in the matrix, not just
 * rules that triggered violations — so GitHub Code Scanning shows the
 * full rule catalog even for clean scans.
 */
export class SarifExporter {
  private readonly toolVersion = '11.0.0';
  private readonly toolName    = 'AkulDravinGovernanceScanner';
  private readonly infoUri     = 'https://docs.akuldravin.internal/governance';

  /**
   * Convert a ScanResult into a SARIF v2.1.0 log.
   *
   * @param result       The ScanResult from GovernanceScannerService.scan().
   * @param projectRoot  Absolute path to the project root (used to compute relative URIs).
   */
  export(result: ScanResult, projectRoot: string): SarifLog {
    return {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs:    [this.buildRun(result, projectRoot)],
    };
  }

  private buildRun(result: ScanResult, projectRoot: string): SarifRun {
    return {
      tool: {
        driver: {
          name:           this.toolName,
          version:        this.toolVersion,
          informationUri: this.infoUri,
          rules:          this.buildRuleDescriptors(),
        },
      },
      originalUriBaseIds: {
        '%SRCROOT%': { uri: `file:///${projectRoot.replace(/\\/g, '/')}/` },
      },
      results: result.violations.map((v) => this.buildResult(v, projectRoot)),
    };
  }

  private buildRuleDescriptors(): SarifRule[] {
    return FORBIDDEN_DEPENDENCY_MATRIX.map((rule) => {
      const level = RULE_SARIF_LEVEL[rule.severity] ?? 'warning';

      // Convert SCREAMING_SNAKE_CASE to PascalCase for SARIF rule name
      const pascalName = rule.id
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

      return {
        id:               rule.id,
        name:             pascalName,
        shortDescription: {
          text: rule.forbiddenImports[0]?.reason ?? rule.rationale.slice(0, 100),
        },
        fullDescription: { text: rule.rationale },
        defaultConfiguration: { level },
        helpUri: `${this.infoUri}/rules/${rule.id}`,
        properties: {
          tags:     ['governance', `severity:${rule.severity}`, rule.violationType],
          severity: rule.severity,
        },
      };
    });
  }

  private buildResult(violation: ScanViolation, projectRoot: string): SarifResult {
    const level       = RULE_SARIF_LEVEL[violation.severity.toLowerCase()] ?? 'warning';
    const relPath     = path.relative(projectRoot, violation.filePath).replace(/\\/g, '/');

    return {
      ruleId:  violation.ruleId,
      level,
      message: { text: violation.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri:       relPath,
              uriBaseId: '%SRCROOT%',
            },
            region: { startLine: violation.lineNumber },
          },
        },
      ],
      /**
       * fingerprints: Used by GitHub Code Scanning to deduplicate findings
       * across PR runs — must match the ViolationLogEntity fingerprint for
       * correlation between the SARIF upload and the DB governance record.
       */
      fingerprints: {
        'governance/v1': violation.fingerprint,
      },
    };
  }
}

// Singleton export for runner and controller usage
export const sarifExporter = new SarifExporter();
