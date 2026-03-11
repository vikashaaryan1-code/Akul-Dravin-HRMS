import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiMatchingController } from './ai-matching.controller';
import { AiMatchingService } from './ai-matching.service';
import { AiMatch } from './ai-match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiMatch])],
  controllers: [AiMatchingController],
  providers: [AiMatchingService],
  exports: [AiMatchingService],
})
export class AiMatchingModule {}
