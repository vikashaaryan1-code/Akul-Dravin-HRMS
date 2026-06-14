import { Injectable, Logger } from '@nestjs/common';

/**
 * AiHttpClientService
 *
 * Thin HTTP client that proxies requests from the NestJS HRMS backend
 * to the Python FastAPI AI engine.
 *
 * Base URL is controlled via AI_ENGINE_URL env var (default: http://localhost:8001).
 * All methods fail gracefully with null so callers can fall back to stubs.
 *
 * Supported FastAPI routes:
 *   GET  /health                       — liveness check
 *   POST /attrition/predict            — attrition risk prediction
 *   POST /candidate/match              — candidate-job match scoring
 *   POST /workforce/analytics          — workforce analytics summary
 *   POST /resume/parse                 — resume parsing
 *   POST /hr-assistant/query           — HR assistant natural language query
 */
@Injectable()
export class AiHttpClientService {
  private readonly logger = new Logger(AiHttpClientService.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.AI_ENGINE_URL ?? 'http://localhost:8001').replace(/\/$/, '');
  }

  // ── Health check ──────────────────────────────────────────────────────────

  async ping(): Promise<{ status: string; version: string } | null> {
    return this.get<{ status: string; version: string }>('/health');
  }

  // ── Attrition prediction ──────────────────────────────────────────────────

  async predictAttrition(payload: {
    employeeId: string;
    tenure?: number;
    performanceScore?: number;
    recentAbsenteeism?: number;
    salaryGrowth?: number;
  }): Promise<{ riskScore: number; label: 'Low' | 'Medium' | 'High'; factors: string[] } | null> {
    return this.post('/attrition/predict', payload);
  }

  // ── Candidate matching ────────────────────────────────────────────────────

  async scoreCandidate(payload: {
    resumeText?: string;
    jobDescription?: string;
    skills?: string[];
    experienceYears?: number;
  }): Promise<{ matchScore: number; recommendation: string; strengths: string[]; gaps: string[] } | null> {
    return this.post('/candidate/match', payload);
  }

  // ── Workforce analytics ───────────────────────────────────────────────────

  async getWorkforceAnalytics(payload: {
    tenantId?: string;
    period?: string;
  }): Promise<{
    healthScore: number;
    retentionRisk: string;
    efficiencyScore: number;
    insights: string[];
  } | null> {
    return this.post('/workforce/analytics', payload);
  }

  // ── Resume parsing ────────────────────────────────────────────────────────

  async parseResume(payload: {
    resumeText: string;
  }): Promise<{
    name?: string;
    email?: string;
    skills: string[];
    experience: { title: string; company: string; years: number }[];
    education: string[];
  } | null> {
    return this.post('/resume/parse', payload);
  }

  // ── HR assistant ──────────────────────────────────────────────────────────

  async hrAssistantQuery(payload: {
    query: string;
    context?: Record<string, unknown>;
  }): Promise<{ answer: string; confidence: number; sources?: string[] } | null> {
    return this.post('/hr-assistant/query', payload);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async get<T>(path: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method:  'GET',
        headers: { 'Content-Type': 'application/json' },
        signal:  AbortSignal.timeout(5_000), // 5s timeout
      });

      if (!response.ok) {
        this.logger.warn(`AI_ENGINE_GET_ERROR path=${path} status=${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`AI_ENGINE_GET_FAILED path=${path} error="${msg}"`);
      return null;
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(10_000), // 10s timeout for inference
      });

      if (!response.ok) {
        this.logger.warn(`AI_ENGINE_POST_ERROR path=${path} status=${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`AI_ENGINE_POST_FAILED path=${path} error="${msg}"`);
      return null;
    }
  }
}
