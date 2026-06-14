import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { A2zEngineService } from './a2z-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('a2z-engine')
export class A2zEngineController {
  constructor(private readonly a2zEngineService: A2zEngineService) {}

  @Get('workflows')
  getWorkflows() {
    return this.a2zEngineService.getWorkflows();
  }

  @Post('preview')
  generatePreview(@Body() config: any) {
    return this.a2zEngineService.generatePreview(config);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('submit')
  @HttpCode(202)
  submitRollout(@Body() config: any, @Request() req: any) {
    const userId = req?.user?.sub as string | undefined;
    const companyId = req?.user?.tenantId as string | undefined;
    return this.a2zEngineService.submitRollout(config, userId, companyId);
  }

  @Get('status/:requestId')
  getRolloutStatus(@Param('requestId') requestId: string) {
    return this.a2zEngineService.getRolloutStatus(requestId);
  }
}
