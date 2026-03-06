import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class SubscriptionBillingController {
  constructor(private readonly subscriptionBillingService: SubscriptionBillingService) {}

  @Get('subscriptions')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  findAllSubscriptions() {
    return this.subscriptionBillingService.findAllSubscriptions();
  }

  @Post('subscriptions')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  createSubscription(@Body() payload: Partial<SubscriptionEntity>) {
    return this.subscriptionBillingService.createSubscription(payload);
  }

  @Patch('subscriptions/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  updateSubscription(@Param('id') id: string, @Body() payload: Partial<SubscriptionEntity>) {
    return this.subscriptionBillingService.updateSubscription(id, payload);
  }

  @Get('invoices')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  findAllInvoices() {
    return this.subscriptionBillingService.findAllInvoices();
  }

  @Post('invoices')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  createInvoice(@Body() payload: Partial<InvoiceEntity>) {
    return this.subscriptionBillingService.createInvoice(payload);
  }

  @Patch('invoices/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  updateInvoice(@Param('id') id: string, @Body() payload: Partial<InvoiceEntity>) {
    return this.subscriptionBillingService.updateInvoice(id, payload);
  }
}
