import type { Metadata } from 'next';
import { ObservabilityDashboard } from '@/components/dashboards/ObservabilityDashboard';

export const metadata: Metadata = {
  title: 'Observability Center — AKUL DRAVIN',
  description: 'Platform telemetry: API latency percentiles, queue throughput, AI token usage, service health and worker node vitals.',
};

export default function ObservabilityPage() {
  return <ObservabilityDashboard />;
}
