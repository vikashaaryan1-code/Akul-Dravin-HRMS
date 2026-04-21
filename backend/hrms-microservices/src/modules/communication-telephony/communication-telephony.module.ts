import { Module } from '@nestjs/common';
import { CommunicationTelephonyService } from './communication-telephony.service';

@Module({
  providers: [CommunicationTelephonyService],
  exports: [CommunicationTelephonyService],
})
export class CommunicationTelephonyModule {}
