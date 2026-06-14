/**
 * OpenTelemetry distributed tracing for Akul Dravin HRMS.
 *
 * This MUST be imported at the very top of main.ts (before any NestJS imports)
 * so instrumentation patches Node.js HTTP/PG/Redis clients before they load.
 *
 * ENVIRONMENT:
 *   OTEL_SERVICE_NAME=akul-dravin-hrms
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318   (Jaeger/Grafana Tempo)
 *   OTEL_TRACES_SAMPLER=parentbased_traceidratio
 *   OTEL_TRACES_SAMPLER_ARG=0.1   (10% sampling in production)
 *   OTEL_ENABLED=true              (set false to disable)
 *
 * UPGRADE PATH:
 *   This is a no-op when OTEL_ENABLED is not set.
 *   To enable: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
 *
 * Supports:
 *   - HTTP request tracing (all routes)
 *   - PostgreSQL query tracing (pg)
 *   - Redis command tracing (ioredis)
 *   - HTTP outbound tracing (AI provider calls)
 *   - BullMQ job tracing (via HTTP spans)
 *   - Correlation ID → TraceID bridging
 */

export async function initTracing(): Promise<void> {
  if (process.env.OTEL_ENABLED !== 'true') {
    // Silently skip — zero overhead when disabled
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'akul-dravin-hrms';
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

  try {
    // Dynamic imports — optional peer deps. App runs fine without them.
    const [
      { NodeSDK },
      { getNodeAutoInstrumentations },
      { OTLPTraceExporter },
      { Resource },
      { SemanticResourceAttributes },
    ] = await Promise.all([
      import('@opentelemetry/sdk-node'),
      import('@opentelemetry/auto-instrumentations-node'),
      import('@opentelemetry/exporter-trace-otlp-http'),
      import('@opentelemetry/resources'),
      import('@opentelemetry/semantic-conventions'),
    ]);

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version ?? '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${endpoint}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            // Don't trace health checks — reduces noise
            ignoreIncomingRequestHook: (req) => {
              return req.url?.includes('/health') || req.url?.includes('/metrics') || false;
            },
          },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-pg': { enabled: true },
          '@opentelemetry/instrumentation-ioredis': { enabled: true },
          // Disable noisy instrumentations
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-dns': { enabled: false },
        }),
      ],
    });

    sdk.start();

    // Graceful shutdown — flush remaining spans before process exits
    process.on('SIGTERM', async () => {
      await sdk.shutdown().catch(err => console.error('OTel shutdown error:', err));
    });

    console.log(`[OTEL] Distributed tracing enabled → ${endpoint} (service: ${serviceName})`);
  } catch (err) {
    // OTel packages not installed — degrade silently
    console.warn(`[OTEL] Packages not installed — tracing disabled. Install @opentelemetry/sdk-node to enable. (${String(err).slice(0, 80)})`);
  }
}

/**
 * Extracts the current TraceID from the active OTel span.
 * Used to correlate HTTP logs with distributed traces.
 * Returns null when OTel is not active.
 */
export async function getCurrentTraceId(): Promise<string | null> {
  try {
    const { trace, context } = await import('@opentelemetry/api');
    const span = trace.getSpan(context.active());
    if (!span) return null;
    const { traceId } = span.spanContext();
    return traceId ?? null;
  } catch {
    return null;
  }
}

/**
 * Creates a manual span for custom business operations.
 * Falls back to a no-op when OTel is disabled.
 *
 * @example
 * await withSpan('payroll.generate', { tenantId }, async () => {
 *   return await payrollService.generate(tenantId);
 * });
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const { trace } = await import('@opentelemetry/api');
    const tracer = trace.getTracer('akul-dravin-hrms');
    return await tracer.startActiveSpan(name, async (span) => {
      span.setAttributes(attributes);
      try {
        const result = await fn();
        span.setStatus({ code: 1 }); // SpanStatusCode.OK
        return result;
      } catch (err) {
        span.setStatus({ code: 2, message: String(err) }); // SpanStatusCode.ERROR
        span.recordException(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        span.end();
      }
    });
  } catch {
    // OTel not available — execute directly
    return fn();
  }
}
