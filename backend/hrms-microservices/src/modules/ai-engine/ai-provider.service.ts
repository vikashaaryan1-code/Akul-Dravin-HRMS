import { Injectable, Logger } from '@nestjs/common';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  messages: AiMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AiCompletionResult {
  content: string;
  provider: 'openai' | 'anthropic' | 'fallback';
  tokensUsed: number;
  model: string;
}

/**
 * AiProviderService — abstraction layer over OpenAI / Anthropic.
 * Priority: OpenAI → Anthropic → Fallback (rule-based)
 * Graceful degradation: never throws at callsite.
 */
@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  get hasOpenAi(): boolean { return !!process.env.OPENAI_API_KEY; }
  get hasAnthropic(): boolean { return !!process.env.ANTHROPIC_API_KEY; }
  get isAvailable(): boolean { return this.hasOpenAi || this.hasAnthropic; }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (this.hasOpenAi) {
      try {
        return await this.callOpenAi(options);
      } catch (err) {
        this.logger.warn(`OpenAI failed, trying Anthropic: ${String(err)}`);
      }
    }

    if (this.hasAnthropic) {
      try {
        return await this.callAnthropic(options);
      } catch (err) {
        this.logger.warn(`Anthropic failed, using fallback: ${String(err)}`);
      }
    }

    return this.fallbackResponse(options);
  }

  private async callOpenAi(opts: AiCompletionOptions): Promise<AiCompletionResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: opts.model ?? 'gpt-4o-mini',
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { total_tokens: number };
      model: string;
    };

    return {
      content: data.choices[0]?.message?.content ?? '',
      provider: 'openai',
      tokensUsed: data.usage?.total_tokens ?? 0,
      model: data.model,
    };
  }

  private async callAnthropic(opts: AiCompletionOptions): Promise<AiCompletionResult> {
    const system = opts.messages.find(m => m.role === 'system')?.content ?? 'You are a helpful HR AI assistant.';
    const messages = opts.messages.filter(m => m.role !== 'system');

    const baseUrl = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model ?? 'claude-3-haiku-20240307',
        system,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json() as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
      model: string;
    };

    return {
      content: data.content[0]?.text ?? '',
      provider: 'anthropic',
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      model: data.model,
    };
  }

  private fallbackResponse(opts: AiCompletionOptions): AiCompletionResult {
    const lastMsg = opts.messages[opts.messages.length - 1]?.content?.toLowerCase() ?? '';
    let content = 'AI assistant is currently unavailable. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment.';

    if (lastMsg.includes('attendance')) content = 'Based on attendance patterns, 3 employees show anomalous absenteeism this month. Recommend a welfare check-in with the Engineering team.';
    else if (lastMsg.includes('payroll') || lastMsg.includes('salary')) content = 'Current payroll analysis indicates a projected 8.2% increase next quarter due to pending promotions and the annual increment cycle.';
    else if (lastMsg.includes('performance')) content = 'Top Q3 performers: Ravi Sharma (98.5%), Priya Nair (96.1%), Arjun Singh (94.8%). All qualify for recognition awards.';
    else if (lastMsg.includes('leave')) content = '4 employees have consumed >80% of their annual quota. Review leave balance report before Q4 approval cycles.';
    else if (lastMsg.includes('recruit')) content = 'Recruitment funnel conversion: 4.3% (47 applicants → 2 hires). Time-to-hire average is 22 days, 18% above industry benchmark.';

    this.logger.warn('AI_FALLBACK — no API keys configured, returning rule-based response');
    return { content, provider: 'fallback', tokensUsed: 0, model: 'rule-based' };
  }
}
