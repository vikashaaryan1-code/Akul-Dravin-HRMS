import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerGrowthService } from './career-growth.service';
import { CareerGrowthController } from './career-growth.controller';
import { CareerGrowthEntity } from '../../database/entities/career-growth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CareerGrowthEntity])],
  controllers: [CareerGrowthController],
  providers: [CareerGrowthService],
  exports: [CareerGrowthService],
})
export class CareerGrowthModule {}

