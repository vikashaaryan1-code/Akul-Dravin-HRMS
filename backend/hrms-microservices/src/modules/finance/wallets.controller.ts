import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Query('employeeId') employeeId?: string) {
    return this.walletService.getBalance(employeeId);
  }

  @Get('history')
  async getHistory(@Query('employeeId') employeeId?: string) {
    return this.walletService.getHistory(employeeId);
  }
}
