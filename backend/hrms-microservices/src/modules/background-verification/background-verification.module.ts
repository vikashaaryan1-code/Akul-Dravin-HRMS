import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackgroundVerificationController } from './background-verification.controller';
import { BackgroundVerificationService } from './background-verification.service';
import { BackgroundVerification } from '../../database/entities/background-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BackgroundVerification])],
  controllers: [BackgroundVerificationController],
  providers: [BackgroundVerificationService],
  exports: [BackgroundVerificationService],
})
export class BackgroundVerificationModule {}
