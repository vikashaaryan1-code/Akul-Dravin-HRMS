import { Controller, Post, Body, Get } from '@nestjs/common';
import { MfaService } from './mfa.service';

@Controller('api/v1/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  async setupMfa(@Body() body: { email: string }) {
    const { secret, otpauthUrl } = this.mfaService.generateSecret(body.email);
    const qrCode = await this.mfaService.generateQRCode(otpauthUrl);
    const backupCodes = this.mfaService.generateBackupCodes();
    
    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  @Post('verify')
  async verifyMfa(@Body() body: { secret: string; token: string }) {
    const isValid = this.mfaService.verifyToken(body.secret, body.token);
    return { success: isValid };
  }
}
