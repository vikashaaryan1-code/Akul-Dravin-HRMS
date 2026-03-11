import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExitController } from './exit.controller';
import { ExitService } from './exit.service';
import { Exit } from './exit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exit])],
  controllers: [ExitController],
  providers: [ExitService],
  exports: [ExitService],
})
export class ExitModule {}
