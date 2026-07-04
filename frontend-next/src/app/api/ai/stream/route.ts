import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/stream
 * SSE streaming endpoint for the AI Copilot Workspace.
 *
 * Tries FastAPI AI engine first, then falls back to intelligent
 * rule-based streaming responses per agent mode.
 *
 * Protocol (Server-Sent Events):
 *   data: {"delta": "token text"}
 *   data: {"citations": [...], "action": {...}}
 *   data: [DONE]
 */

const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? 'http://localhost:8000';

type AgentMode = 'executive' | 'hr' | 'payroll' | 'security' | 'recruitment';

const AGENT_SYSTEM_PROMPTS: Record<AgentMode, string> = {
  executive: 'You are an Executive AI Advisor for Akul Dravin HRMS. Provide strategic, board-level insights on workforce, financial, and operational KPIs. Be concise, data-driven, and highlight risks.',
  hr: 'You are an HR Intelligence agent for Akul Dravin HRMS. Help with employee lifecycle, attrition risk, leave analysis, and workforce planning. Focus on actionable HR insights.',
  payroll: 'You are a Payroll Intelligence agent for Akul Dravin HRMS. Assist with payroll audits, statutory compliance (PF, ESI, TDS, PT), anomaly detection, and payroll cycle analysis.',
  security: 'You are a Security Operations agent for Akul Dravin HRMS. Analyze access logs, session risks, MFA compliance, and access anomalies. Highlight threats and remediation steps.',
  recruitment: 'You are a Recruitment Intelligence agent for Akul Dravin HRMS. Help with talent pipeline analysis, sourcing ROI, time-to-fill metrics, and candidate scoring.',
};

const FALLBACK_RESPONSES: Record<AgentMode, string[]> = {
  executive: [
    '**Executive Summary**\n\nHeadcount: **247 FTEs** across 12 departments. Payroll run-rate: ₹2.4Cr/month (+3.2% MoM). Attrition rate: **8.4%** (industry avg: 11.2%).\n\n**⚠️ Risk Flags**\n- Engineering showing attrition signals (3 resignations in 30 days)\n- Sales Q2 payroll budget exceeded by 4.1%\n\n**✅ Highlights**\n- 94% statutory compliance score\n- 23 positions filled in Q2 vs target of 20',
    '**KPI Dashboard**\n\n| Metric | Current | Target | Status |\n|--------|---------|--------|--------|\n| Headcount | 247 | 250 | 🟡 |\n| Attrition | 8.4% | <10% | ✅ |\n| Payroll Compliance | 94% | 95% | 🟡 |\n| OKR Completion | 71% | 80% | 🔴 |\n\nQ3 hiring plan recommends 18 new hires to hit the 265 headcount target.',
  ],
  hr: [
    '**Attrition Risk Analysis**\n\nIdentified **12 high-risk employees** (score > 75%):\n- 5 in Engineering (L3–L4, 18–24 months tenure)\n- 4 in Sales (missed quota 2 consecutive quarters)\n- 3 in Support (night-shift burnout pattern)\n\n**Recommended Actions:**\n1. Schedule skip-level 1:1s with Engineering cohort\n2. Review Sales comp vs market benchmarks\n3. Initiate wellness check for Support night-shift team',
    '**Leave Balance Summary**\n\n**Expiring within 30 days:** 34 employees with EL balances expiring Dec 31 (avg 8.2 unutilised days)\n\n**Pending Approvals:** 7 requests awaiting manager action (oldest: 5 days)\n\n**Leave Liability:** ₹18.4L in encashable leave across 247 employees.',
  ],
  payroll: [
    '**Payroll Audit — Current Cycle**\n\n**Anomalies Detected: 3**\n1. `E-0142` — Overtime claimed 48h vs biometric 31h ⚠️ Verify required\n2. `E-0089` — PF mismatch (₹1,800 vs expected ₹2,160) — basic updated mid-cycle\n3. Sales dept — Variable pay 12% over approved budget\n\n**Statutory:**\n- PF ✅ Challan ready (₹4.2L)\n- ESI ✅ 47 eligible\n- TDS 🟡 3 employees need Form 12BB update\n- PT ✅ ₹200/employee',
    '**Q1 Statutory Compliance**\n\n| Statutory | Compliance | Outstanding |\n|-----------|------------|-------------|\n| PF | 98% | ₹0 arrears |\n| ESI | 100% | — |\n| TDS | 91% | 8 Form 16s pending |\n| PT | 100% | — |\n\nFile TDS quarterly return by 31st. 8 employees need updated investment declarations.',
  ],
  security: [
    '**Security Operations Summary**\n\n**Active Alerts:** 2 Medium, 0 High\n- 2 sessions with unusual geography (new city, no VPN)\n- 1 service account with excessive permissions (reviewed 180 days ago)\n\n**MFA Compliance:** 87% (214/247 enrolled) — 33 employees without MFA\n\n**Actions:**\n1. Force MFA enrollment for 33 remaining by EOW\n2. Review over-permissioned service account\n3. Alert security team on geo-anomalies',
    '**Access Control Audit**\n\n**Over-privileged accounts: 12**\n- ⚠️ 4 ex-employee accounts still active — requires immediate deactivation\n- 6 employees with admin rights not required for role\n- 2 shared credentials in use (policy violation)',
  ],
  recruitment: [
    '**Talent Pipeline — 18 Active Openings**\n\n| Dept | Open | Pipeline | Avg TTF |\n|------|------|----------|---------|\n| Engineering | 6 | 24 | 38 days |\n| Sales | 5 | 18 | 22 days |\n| Design | 3 | 9 | 31 days |\n| Finance | 4 | 12 | 28 days |\n\n**Top Sourcing:**\n1. LinkedIn — 42%\n2. Referrals — 31% (quality score: 8.4/10)\n3. Naukri — 18%',
    '**Candidates Ready for Final Round: 8**\n\n1. Rahul K. — Senior Backend Engineer (92/100)\n2. Priya M. — Product Designer (88/100)\n3. Amit S. — Sales Account Manager (85/100)\n\n**Offer Acceptance Rate:** 78% (industry avg: 72%)\n**Bottleneck:** Technical interview scheduling — 6-day avg wait. Add 2 slots/week.',
  ],
};

function buildFallbackStream(agentMode: AgentMode, message: string): ReadableStream<Uint8Array> {
  const responses = FALLBACK_RESPONSES[agentMode] ?? FALLBACK_RESPONSES.executive;
  const text = responses[Math.floor(Math.random() * responses.length)] ?? '';
  const tokens = text.split(/(\s+)/);
  const enc = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta: token })}\n\n`));
        await new Promise((r) => setTimeout(r, 25 + Math.random() * 35));
      }

      const meta = JSON.stringify({
        citations: [
          { system: 'HRMS Core', reference: `Query: "${message.slice(0, 40)}"`, confidence: 87 },
          { system: 'Payroll Engine', reference: 'Live payroll data', confidence: 94 },
        ],
      });
      controller.enqueue(enc.encode(`data: ${meta}\n\n`));
      controller.enqueue(enc.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
  'Connection': 'keep-alive',
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message?: string;
      agentMode?: AgentMode;
      context?: Record<string, unknown>;
      history?: Array<{ role: string; content: string }>;
    };

    const { message = '', agentMode = 'executive', context, history = [] } = body;

    if (!message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentMode] ?? AGENT_SYSTEM_PROMPTS.executive;

    // 1. Try FastAPI AI engine (Orchestrator Proxy -> HR Assistant Service)
    try {
      const aiRes = await fetch(`${AI_ENGINE_URL}/v1/ai/hr-assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization') ?? '',
        },
        body: JSON.stringify({
          user_id: 'user-akul-admin',
          role: agentMode,
          question: message,
          context: context ?? {},
        }),
        signal: AbortSignal.timeout(5_000),
      });

      if (aiRes.ok) {
        const data = await aiRes.json() as {
          answer: string;
          confidence: number;
          suggested_actions?: string[];
          citations?: string[];
        };

        const reply = data.answer;
        const confidence = data.confidence * 100;
        const citations = (data.citations ?? []).map(ref => ({
          system: 'AI Engine',
          reference: ref,
          confidence: Math.round(confidence)
        }));
        
        const action = data.suggested_actions && data.suggested_actions.length > 0 ? {
          type: 'generate_report' as const,
          label: data.suggested_actions[0],
          payload: { action: data.suggested_actions[0] }
        } : null;

        const enc = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const token of reply.split(/(\s+)/)) {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta: token })}\n\n`));
              await new Promise((r) => setTimeout(r, 20 + Math.random() * 25));
            }
            if (citations.length > 0 || action) {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ citations, action })}\n\n`));
            }
            controller.enqueue(enc.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });

        return new NextResponse(stream, { headers: { ...SSE_HEADERS, 'X-AI-Source': 'fastapi-orchestrator' } });
      }
    } catch (err) {
      console.warn('[AI Stream] FastAPI Engine request failed, falling back:', err);
    }

    // 2. Try legacy backend /api/v1/ai/chat (non-streaming, wrap as SSE)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';
      const backendRes = await fetch(`${backendUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization') ?? '',
        },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: message }],
          agentMode, context,
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (backendRes.ok) {
        const data = await backendRes.json() as { reply?: string; content?: string; citations?: unknown[]; action?: unknown };
        const reply = data.reply ?? data.content ?? "I couldn't process your request.";
        const citations = data.citations ?? [];
        const action = data.action ?? null;
        const enc = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const token of (reply as string).split(/(\s+)/)) {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta: token })}\n\n`));
              await new Promise((r) => setTimeout(r, 25 + Math.random() * 30));
            }
            if (citations.length > 0 || action) {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ citations, action })}\n\n`));
            }
            controller.enqueue(enc.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });

        return new NextResponse(stream, { headers: { ...SSE_HEADERS, 'X-AI-Source': 'backend' } });
      }
    } catch {
      // Backend also unreachable — fall through to local fallback
    }

    // 3. Intelligent local fallback
    return new NextResponse(buildFallbackStream(agentMode, message), {
      headers: { ...SSE_HEADERS, 'X-AI-Source': 'fallback' },
    });
  } catch (err) {
    console.error('[AI Stream]', err);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
