import { Injectable } from '@nestjs/common';
const Razorpay = require('razorpay');

@Injectable()
export class PaymentService {
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
    });
  }

  async createOrder(amount: number, currency: string = 'INR', receipt: string) {
    return await this.razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt,
    });
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const crypto = require('crypto');
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret')
      .update(text)
      .digest('hex');
    return generated_signature === razorpaySignature;
  }

  async createSubscription(planId: string, customerId: string, totalCount: number) {
    return await this.razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount,
    });
  }
}
