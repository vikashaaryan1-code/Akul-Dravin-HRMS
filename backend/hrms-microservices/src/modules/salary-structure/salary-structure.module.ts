import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryStructureController } from './salary-structure.controller';
import { SalaryStructureService } from './salary-structure.service';
import { SalaryStructure } from './salary-structure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryStructure])],
  controllers: [SalaryStructureController],
  providers: [SalaryStructureService],
  exports: [SalaryStructureService],
})
export class SalaryStructureModule {}
