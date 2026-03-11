import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('api/v1/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(@Body() body: { amount: number; receipt: string }) {
    return await this.paymentService.createOrder(body.amount, 'INR', body.receipt);
  }

  @Post('verify')
  async verifyPayment(@Body() body: { orderId: string; paymentId: string; signature: string }) {
    const isValid = await this.paymentService.verifyPayment(body.orderId, body.paymentId, body.signature);
    return { success: isValid };
  }

  @Post('subscription')
  async createSubscription(@Body() body: { planId: string; customerId: string; totalCount: number }) {
    return await this.paymentService.createSubscription(body.planId, body.customerId, body.totalCount);
  }
}
