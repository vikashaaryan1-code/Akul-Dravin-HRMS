import { Module, Global } from '@nestjs/common';
import { CommunicationHubService } from './communication-hub.service';

@Global()
@Module({
  providers: [CommunicationHubService],
  exports: [CommunicationHubService],
})
export class CommunicationModule {}
