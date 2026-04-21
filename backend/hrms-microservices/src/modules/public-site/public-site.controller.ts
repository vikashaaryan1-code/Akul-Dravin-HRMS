import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateA2zWorkflowRequestDto } from './dto/create-a2z-workflow-request.dto';
import { CreatePublicInquiryDto } from './dto/create-public-inquiry.dto';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { PublicSiteService } from './public-site.service';

@Controller('public-site')
export class PublicSiteController {
  constructor(private readonly publicSiteService: PublicSiteService) {}

  @Get('landing')
  getLandingPage() {
    return this.publicSiteService.getLandingPage();
  }

  @Get('a2z')
  getA2zPage() {
    return this.publicSiteService.getA2zPage();
  }

  @Post('inquiries')
  @HttpCode(HttpStatus.ACCEPTED)
  createInquiry(@Body() payload: CreatePublicInquiryDto) {
    return this.publicSiteService.createInquiry(payload);
  }

  @Post('a2z/requests')
  @HttpCode(HttpStatus.ACCEPTED)
  createA2zWorkflowRequest(@Body() payload: CreateA2zWorkflowRequestDto) {
    return this.publicSiteService.createA2zWorkflowRequest(payload);
  }

  @Post('newsletter')
  @HttpCode(HttpStatus.CREATED)
  subscribeNewsletter(@Body() payload: SubscribeNewsletterDto) {
    return this.publicSiteService.subscribeNewsletter(payload);
  }
}
