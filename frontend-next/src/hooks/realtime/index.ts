/**
 * hooks/realtime/index.ts
 * Realtime hooks barrel — single import point for all WebSocket/SSE hooks.
 *
 * Usage:
 *   import { useNotificationStream, useAiStream, useQueueTelemetry } from '@/hooks/realtime';
 */

export {
  useNotificationStream,
  useQueueTelemetry,
  type NotificationEvent,
} from './useNotificationStream';


export {
  useAiStream,
  AGENT_META,
  type AgentMode,
  type StreamMessage,
  type PendingAction,
  type CitationSource,
  type StreamStatus,
  type AiStreamContext,
} from './useAiStream';
