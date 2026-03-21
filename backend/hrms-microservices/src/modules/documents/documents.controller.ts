import { Controller, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':type')
  async generateDocument(
    @Param('type') type: string,
    @Body() data: any,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.documentsService.generatePDF(type, data);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to generate document',
        error: error.message,
      });
    }
  }
}
