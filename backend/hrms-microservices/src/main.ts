import { createServer } from 'node:net';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { microserviceDefinitions } from './config/microservice.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

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

async function bootstrap() {
  const logger = new Logger('Server');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: ['http://localhost:3000'], // later your domain
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
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
  await app.listen(port);
}

bootstrap();




