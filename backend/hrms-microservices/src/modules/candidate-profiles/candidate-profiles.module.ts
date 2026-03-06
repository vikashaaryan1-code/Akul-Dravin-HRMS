import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateProfilesController } from './candidate-profiles.controller';
import { CandidateProfilesService } from './candidate-profiles.service';
import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateProfileEntity])],
  controllers: [CandidateProfilesController],
  providers: [CandidateProfilesService, RolesGuard],
  exports: [CandidateProfilesService],
})
export class CandidateProfilesModule {}
