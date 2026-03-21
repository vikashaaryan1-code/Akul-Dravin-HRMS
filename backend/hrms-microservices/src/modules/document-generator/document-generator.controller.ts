import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentGeneratorService } from './document-generator.service';

@Controller('documents')
export class DocumentGeneratorController {
  constructor(private readonly documentService: DocumentGeneratorService) {}

  @Post('offer-letter')
  async generateOfferLetter(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateOfferLetter({
      ...data,
      ctc: Number(data.ctc)
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${data.candidateName}.pdf`);
    res.send(pdf);
  }

  @Post('appointment-letter')
  async generateAppointmentLetter(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateAppointmentLetter(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=appointment_letter_${data.employeeName}.pdf`);
    res.send(pdf);
  }

  @Post('experience-letter')
  async generateExperienceLetter(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateExperienceLetter(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=experience_letter_${data.employeeName}.pdf`);
    res.send(pdf);
  }

  @Post('relieving-letter')
  async generateRelievingLetter(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateRelievingLetter(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relieving_letter_${data.employeeName}.pdf`);
    res.send(pdf);
  }

  @Post('promotion-letter')
  async generatePromotionLetter(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generatePromotionLetter({
      ...data,
      newCtc: Number(data.newCtc)
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=promotion_letter_${data.employeeName}.pdf`);
    res.send(pdf);
  }

  @Post('salary-certificate')
  async generateSalaryCertificate(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateSalaryCertificate({
      ...data,
      ctc: Number(data.ctc)
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=salary_certificate_${data.employeeName}.pdf`);
    res.send(pdf);
  }

  @Post('id-card')
  async generateIDCard(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateIDCard(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=id_card_${data.employeeId}.pdf`);
    res.send(pdf);
  }

  @Post('visiting-card')
  async generateVisitingCard(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateVisitingCard(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=visiting_card_${data.employeeName}.pdf`);
    res.send(pdf);
  }

  @Post('agreement')
  async generateAgreement(@Body() data: any, @Res() res: Response) {
    const pdf = await this.documentService.generateAgreement({
      ...data,
      terms: typeof data.terms === 'string' ? data.terms.split(',').map(t => t.trim()) : data.terms
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=agreement_${data.agreementType}.pdf`);
    res.send(pdf);
  }
}
