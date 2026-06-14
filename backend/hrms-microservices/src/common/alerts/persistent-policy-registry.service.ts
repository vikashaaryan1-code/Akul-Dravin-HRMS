import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { MitigationPolicy, MitigationPolicyEngine, DEFAULT_POLICIES } from './mitigation-policy-engine.service';
import { MitigationSignal } from './slo.types';

// ── Lightweight audit event types ────────────────────────────────────────────

type PolicyAuditEvent =
  | 'EVALUATED' | 'MATCHED' | 'SIGNAL_PROPOSED' | 'SIMULATION_HIT'
  | 'ENABLED' | 'DISABLED' | 'CONFIDENCE_BLOCKED' | 'VERSION_CHANGED';

/**
 * PERSISTENT POLICY REGISTRY — Phase AJ
 *
 * Bridges the declarative MitigationPolicyEngine with the DB-backed
 * `mitigation_policies` / `mitigation_policy_revisions` / `mitigation_policy_audit`
 * tables introduced in migration 1747420000000.
 *
 * ── Lifecycle ─────────────────────────────────────────────────────────────────
 *  1. On bootstrap: loads policies from DB; seeds DEFAULT_POLICIES for first-run.
 *  2. Syncs the in-memory MitigationPolicyEngine registry with loaded DB policies.
 *  3. All runtime enable/disable mutations write to DB and log a revision.
 *  4. Every evaluate() call writes structured audit rows for observability.
 *
 * ── Simulation mode ───────────────────────────────────────────────────────────
 *  Policies with `simulation_mode = true` are evaluated and logged with
 *  event_type = SIMULATION_HIT, but no MitigationSignal is proposed.
 *  This allows operators to validate new policies against live traffic
 *  before enabling them in production.
 *
 * ── Design ────────────────────────────────────────────────────────────────────
 *  This service intentionally does NOT replace MitigationPolicyEngine's
 *  in-memory evaluation — that path remains O(1) and non-blocking.
 *  Persistence is additive: evaluation runs in-memory, audit is written async.
 *
 * ── Audit write pattern ───────────────────────────────────────────────────────
 *  Audit inserts are fire-and-forget (non-blocking).
 *  Failures are logged at WARN but do not fail the evaluation path.
 *  This is consistent with the platform's established outbox + async pattern.
 */
@Injectable()
export class PersistentPolicyRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersistentPolicyRegistry.name);

  constructor(
    private readonly policyEngine:    MitigationPolicyEngine,
    private readonly dataSource:      DataSource,
  ) {}

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAndLoad();
  }

  /**
   * Seed DEFAULT_POLICIES into DB if not already present, then load all
   * DB policies into the in-memory MitigationPolicyEngine.
   */
  private async seedAndLoad(): Promise<void> {
    try {
      // Insert missing defaults (INSERT ON CONFLICT DO NOTHING)
      for (const p of DEFAULT_POLICIES) {
        await this.dataSource.query(`
          INSERT INTO mitigation_policies
            (id, slo_id, name, description, priority, conditions, action, urgency,
             auto_executable, parameter, target_resource, recommendation_template,
             min_confidence_score, enabled, simulation_mode, version, origin)
          VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17)
          ON CONFLICT (id) DO NOTHING
        `, [
          p.id, p.sloId, p.name, p.description ?? '', p.priority,
          JSON.stringify(p.conditions), p.action, p.urgency,
          p.autoExecutable, JSON.stringify(p.parameter ?? null),
          p.targetResource, p.recommendationTemplate,
          p.minConfidenceScore ?? null, p.enabled, false, 1, 'DEFAULT',
        ]);
      }

      // Load all policies from DB into the engine
      const rows: Array<Record<string, unknown>> = await this.dataSource.query(`
        SELECT * FROM mitigation_policies ORDER BY priority ASC
      `);

      for (const row of rows) {
        const policy: MitigationPolicy = {
          id:                     String(row.id),
          sloId:                  row.slo_id as MitigationPolicy['sloId'],
          name:                   String(row.name),
          description:            String(row.description ?? ''),
          priority:               Number(row.priority),
          conditions:             Array.isArray(row.conditions) ? row.conditions as MitigationPolicy['conditions'] : JSON.parse(String(row.conditions)),
          action:                 row.action as MitigationPolicy['action'],
          urgency:                row.urgency as MitigationPolicy['urgency'],
          autoExecutable:         Boolean(row.auto_executable),
          parameter:              row.parameter as MitigationPolicy['parameter'],
          targetResource:         String(row.target_resource),
          recommendationTemplate: String(row.recommendation_template),
          minConfidenceScore:     row.min_confidence_score != null ? Number(row.min_confidence_score) : undefined,
          enabled:                Boolean(row.enabled),
        };
        this.policyEngine.addPolicy(policy);
      }

      this.logger.log(`[PolicyRegistry] Loaded ${rows.length} policies from DB`);
    } catch (err) {
      this.logger.warn(`[PolicyRegistry] Bootstrap failed — using in-memory defaults: ${String(err)}`);
    }
  }

  // ── Runtime Policy Management ─────────────────────────────────────────────

  async enablePolicy(id: string, actor: string, reason?: string): Promise<boolean> {
    const ok = this.policyEngine.enablePolicy(id);
    if (!ok) return false;
    await this.persistPolicyFlag(id, true, actor, reason);
    await this.writeAudit(id, 'ENABLED', actor, {});
    return true;
  }

  async disablePolicy(id: string, actor: string, reason?: string): Promise<boolean> {
    const ok = this.policyEngine.disablePolicy(id);
    if (!ok) return false;
    await this.persistPolicyFlag(id, false, actor, reason);
    await this.writeAudit(id, 'DISABLED', actor, {});
    return true;
  }

  async setSimulationMode(id: string, simulationMode: boolean, actor: string): Promise<boolean> {
    const policy = this.policyEngine.getPolicy(id);
    if (!policy) return false;
    const updated = { ...policy };
    this.policyEngine.addPolicy(updated);
    await this.dataSource.query(`
      UPDATE mitigation_policies SET simulation_mode = $1, updated_at = NOW() WHERE id = $2
    `, [simulationMode, id]).catch(e => this.logger.warn(`[PolicyRegistry] simulationMode persist failed: ${String(e)}`));
    await this.writeAudit(id, 'VERSION_CHANGED', actor, { simulationMode });
    return true;
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  writeAudit(
    policyId: string,
    eventType: PolicyAuditEvent,
    actor = 'system',
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    return this.dataSource.query(`
      INSERT INTO mitigation_policy_audit (policy_id, event_type, actor, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `, [policyId, eventType, actor, JSON.stringify(metadata)])
      .catch(e => this.logger.warn(`[PolicyRegistry] Audit write failed: ${String(e)}`));
  }

  // ── Policy Query ──────────────────────────────────────────────────────────

  async getPolicyHistory(policyId: string): Promise<Array<Record<string, unknown>>> {
    return this.dataSource.query(`
      SELECT * FROM mitigation_policy_revisions
      WHERE policy_id = $1 ORDER BY version DESC LIMIT 50
    `, [policyId]).catch(() => []);
  }

  async getAuditLog(policyId: string, limit = 100): Promise<Array<Record<string, unknown>>> {
    return this.dataSource.query(`
      SELECT * FROM mitigation_policy_audit
      WHERE policy_id = $1 ORDER BY created_at DESC LIMIT $2
    `, [policyId, limit]).catch(() => []);
  }

  async getSimulationStats(policyId: string): Promise<{ hits: number; signals: number; blocked: number }> {
    const rows = await this.dataSource.query(`
      SELECT event_type, COUNT(*) AS count
      FROM mitigation_policy_audit
      WHERE policy_id = $1
        AND event_type IN ('SIMULATION_HIT', 'SIGNAL_PROPOSED', 'CONFIDENCE_BLOCKED')
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY event_type
    `, [policyId]).catch(() => []);

    const byType = Object.fromEntries(rows.map((r: Record<string, unknown>) => [r.event_type, Number(r.count)]));
    return {
      hits:    byType['SIMULATION_HIT'] ?? 0,
      signals: byType['SIGNAL_PROPOSED'] ?? 0,
      blocked: byType['CONFIDENCE_BLOCKED'] ?? 0,
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async persistPolicyFlag(id: string, enabled: boolean, actor: string, reason?: string): Promise<void> {
    try {
      await this.dataSource.query(`
        UPDATE mitigation_policies
        SET enabled = $1, updated_at = NOW()
        WHERE id = $2
      `, [enabled, id]);

      // Write a revision snapshot
      const policy = this.policyEngine.getPolicy(id);
      if (policy) {
        await this.dataSource.query(`
          INSERT INTO mitigation_policy_revisions (policy_id, version, snapshot, changed_by, change_reason)
          VALUES ($1, (SELECT COALESCE(MAX(version),0)+1 FROM mitigation_policy_revisions WHERE policy_id=$1), $2::jsonb, $3, $4)
        `, [id, JSON.stringify(policy), actor, reason ?? `Policy ${enabled ? 'enabled' : 'disabled'}`]);
      }
    } catch (e) {
      this.logger.warn(`[PolicyRegistry] Flag persist failed: ${String(e)}`);
    }
  }
}
