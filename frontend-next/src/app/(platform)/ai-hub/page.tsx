import type { Metadata } from 'next';
import { AiCopilotWorkspace } from '@/components/dashboards/AiCopilotWorkspace';

export const metadata: Metadata = {
  title: 'AI Copilot Workspace — AKUL DRAVIN',
  description: 'Sovereign AI intelligence layer: conversational analytics, predictive models, attrition risk and workforce forecasting.',
};

export default function AiHubPage() {
  return <AiCopilotWorkspace />;
}
