import { createServer } from 'node:net';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { microserviceDefinitions } from './config/microservice.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { validateEnvironment, printEnvReport } from './config/env-validation';
import { initSentry } from './common/observability/observability';
import { initTracing } from './common/observability/tracing';



const isPortAvailable = async (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
};

type NestMicroserviceHost = {
  connectMicroservice: (options: { transport: Transport; options: { host: string; port: number } }) => void;
};

const bindMicroservices = async (app: NestMicroserviceHost): Promise<{ running: string[]; skipped: string[] }> => {
  const running: string[] = [];
  const skipped: string[] = [];
  const shouldSkipAll = String(process.env.SKIP_MICROSERVICES ?? 'false').toLowerCase() === 'true';

  if (shouldSkipAll) {
    return {
      running,
      skipped: microserviceDefinitions.map((service) => `${service.name}:disabled`),
    };
  }

  for (const service of microserviceDefinitions) {
    const available = await isPortAvailable(service.port);

    if (!available) {
      skipped.push(`${service.name}:port-${service.port}`);
      continue;
    }

    app.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: service.port,
      },
    });

    running.push(`${service.name}:port-${service.port}`);
  }

  return { running, skipped };
};
import { GlobalLoggerService } from './common/logger/logger.service';
import * as os from 'node:os';
import { WorkerType } from './config/worker.config';

async function bootstrap() {
  const workerType = (process.env.WORKER_TYPE || 'all') as WorkerType;
  const isWorkerMode = workerType !== 'all' && !!process.env.WORKER_TYPE;

  // ── Comprehensive environment validation ────────────────────────────────
  const envReport = validateEnvironment();
  printEnvReport(envReport);
  // Note: printEnvReport calls process.exit(1) if CRITICAL_MISSING

  // ── Distributed Tracing (OTel) — must initialize BEFORE any module ──────
  await initTracing();

  // ── Error tracking (Sentry) ───────────────────────────────────────────────
  await initSentry();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,    // Required for Stripe webhook signature verification
  });
  const logger = app.get(GlobalLoggerService);
  app.useLogger(logger);

  if (isWorkerMode) {
    // ── Worker-only mode ───────────────────────────────────────────────────
    // No HTTP server, no middleware, no CORS — pure BullMQ worker process.
    // The full AppModule is still loaded (for DI), but only the relevant
    // processor registers with BullMQ.
    await app.init();
    logger.log(
      `[WORKER] Started: type=${workerType} ` +
      `pid=${process.pid} host=${os.hostname()} ` +
      `redis=${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    );
    logger.log(`[WORKER] HTTP server NOT started — worker-only mode.`);
    return;
  }

  // ── Full monolith mode (default) ─────────────────────────────────────────
  app.use(helmet({
    // Strict CSP for production — adjust if you add external CDN assets
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // CORS — strict whitelist in production, open in development
  const isProd  = process.env.NODE_ENV === 'production';
  // In Docker, frontend container → backend is http://backend:4001 (internal).
  // But host browser → frontend → proxy → backend needs localhost:4001.
  // ALLOWED_ORIGINS env var is the override for Railway / custom domains.
  const defaultOrigins = isProd
    ? 'https://app.akuldravin.com,http://localhost:3000,http://frontend:3000'
    : 'http://localhost:3000,http://localhost:3001';
  const origins = (process.env.ALLOWED_ORIGINS ?? defaultOrigins).split(',').map(o => o.trim());

  app.enableCors({
    origin:      origins,
    credentials: true,
    methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Correlation-ID',   // Required for OTel distributed trace propagation
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Correlation-ID'], // Allow frontend to read trace ID from response
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new (await import('./common/interceptors/response.interceptor')).ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );


  const { running, skipped } = await bindMicroservices(app);
  logger.log(`Starting microservices: ${running.length ? running.join(', ') : 'none'}`);

  if (skipped.length > 0) {
    logger.warn(`Skipped microservices (ports in use or unavailable): ${skipped.join(', ')}`);
    logger.warn('Set unique service ports via *_SERVICE_PORT env vars or set SKIP_MICROSERVICES=true to run without microservices until ports are freed.');
  }

  await app.startAllMicroservices();
  const port = Number(process.env.PORT ?? 4001);
  await app.listen(port, '0.0.0.0'); // Bind all interfaces — required in Docker
}

// ── Global safety net ────────────────────────────────────────────────────────
// BullMQ / ioredis emit unhandledRejection on Redis connection loss during
// shutdown or startup. This prevents those from crashing the process.
// All actual application errors are caught by GlobalExceptionFilter.
process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  // Only suppress Redis connection errors — rethrow everything else
  if (
    msg.includes('ECONNREFUSED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('Connection is closed') ||
    msg.includes('connect ETIMEDOUT')
  ) {
    // Swallow Redis connection noise — health endpoint reports redis:down
    return;
  }
  // Re-emit for everything else so real bugs still surface
  console.error('[UNHANDLED_REJECTION]', reason);
});

bootstrap();

