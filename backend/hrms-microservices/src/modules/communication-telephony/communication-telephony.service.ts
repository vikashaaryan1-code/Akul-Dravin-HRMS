import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * CommunicationTelephonyService — TELEPHONY GATEWAY (NOT CONFIGURED)
 *
 * This service requires a Twilio / SIP provider to be operational.
 * To enable:
 *   1. Set TELEPHONY_PROVIDER=twilio in .env
 *   2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   3. Replace assertConfigured() bodies with real Twilio SDK calls.
 *
 * Until configured, ALL methods throw 503 so callers fail loudly instead of
 * silently returning a fake success response.
 */
@Injectable()
export class CommunicationTelephonyService {
  private readonly logger = new Logger(CommunicationTelephonyService.name);

  private assertConfigured(): never {
    this.logger.error(
      '[CTL] Telephony provider is not configured. ' +
        'Set TELEPHONY_PROVIDER, TWILIO_ACCOUNT_SID, and TWILIO_AUTH_TOKEN to enable.',
    );
    throw new ServiceUnavailableException(
      'Telephony service is not configured. Contact your system administrator.',
    );
  }

  async initiateAiCall(_payload: {
    to: string;
    template: string;
    metadata: Record<string, unknown>;
  }): Promise<never> {
    return this.assertConfigured();
  }
}
