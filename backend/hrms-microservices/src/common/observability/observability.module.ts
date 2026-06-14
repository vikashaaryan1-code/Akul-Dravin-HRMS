import { Global, Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { MetricsService, HRMS_METRICS } from './metrics.service';
import { QueueMetricsService } from '../queues/queue-metrics.service';

const metricProviders = (HRMS_METRICS as any[]).map(metric => {
  switch (metric.type) {
    case 'Counter':
      return makeCounterProvider({
        name: metric.name,
        help: metric.help,
        labelNames: metric.labelNames,
      });
    case 'Gauge':
      return makeGaugeProvider({
        name: metric.name,
        help: metric.help,
        labelNames: metric.labelNames,
      });
    case 'Histogram':
      return makeHistogramProvider({
        name: metric.name,
        help: metric.help,
        labelNames: metric.labelNames,
        buckets: (metric as any).buckets,
      });
    default:
      throw new Error(`Unsupported metric type: ${metric.type}`);
  }
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [MetricsService, QueueMetricsService, ...metricProviders],
  exports: [MetricsService, QueueMetricsService, ...metricProviders],
})
export class ObservabilityModule {}

