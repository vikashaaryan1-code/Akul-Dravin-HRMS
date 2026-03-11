import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiResumeParserController } from './ai-resume-parser.controller';
import { AiResumeParserService } from './ai-resume-parser.service';
import { ParsedResume } from './parsed-resume.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParsedResume])],
  controllers: [AiResumeParserController],
  providers: [AiResumeParserService],
  exports: [AiResumeParserService],
})
export class AiResumeParserModule {}
