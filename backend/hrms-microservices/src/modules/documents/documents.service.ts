import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class DocumentsService {
  async generatePDF(type: string, data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        switch (type) {
          case 'offer-letter':
            this.generateOfferLetter(doc, data);
            break;
          case 'id-card':
            this.generateIDCard(doc, data);
            break;
          case 'visiting-card':
            this.generateVisitingCard(doc, data);
            break;
          case 'agreement':
            this.generateAgreement(doc, data);
            break;
          default:
            throw new Error('Invalid document type');
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateOfferLetter(doc: typeof PDFDocument, data: any) {
    doc.fontSize(20).text(data.companyName || 'Company Name', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('OFFER LETTER', { align: 'center', underline: true });
    doc.moveDown(2);
    
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    
    doc.text(`Dear ${data.candidateName},`);
    doc.moveDown();
    
    doc.text(`We are pleased to offer you the position of ${data.position} at ${data.companyName}.`);
    doc.moveDown();
    
    doc.text('Position Details:', { underline: true });
    doc.text(`Position: ${data.position}`);
    doc.text(`Annual CTC: ₹${data.ctc}`);
    doc.text(`Joining Date: ${data.joiningDate}`);
    doc.moveDown();
    
    doc.text('We look forward to welcoming you to our team.');
    doc.moveDown(2);
    
    doc.text('Sincerely,');
    doc.moveDown();
    doc.text('HR Department');
    doc.text(data.companyName);
  }

  private generateIDCard(doc: typeof PDFDocument, data: any) {
    doc.rect(50, 50, 300, 200).stroke();
    
    doc.fontSize(16).text(data.companyName || 'Company Name', 60, 70, { width: 280, align: 'center' });
    doc.fontSize(14).text('EMPLOYEE ID CARD', 60, 100, { width: 280, align: 'center' });
    
    doc.fontSize(12);
    doc.text(`ID: ${data.employeeId}`, 70, 140);
    doc.text(`Name: ${data.employeeName}`, 70, 160);
    doc.text(`Position: ${data.position}`, 70, 180);
    doc.text(`Department: ${data.department}`, 70, 200);
    doc.text(`Valid Until: ${data.validUntil}`, 70, 220);
  }

  private generateVisitingCard(doc: typeof PDFDocument, data: any) {
    doc.rect(50, 50, 350, 200).stroke();
    
    doc.fontSize(18).text(data.companyName || 'Company Name', 60, 70, { width: 330, align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(data.employeeName, 60, 110, { width: 330, align: 'center' });
    doc.fontSize(11).text(data.position, 60, 130, { width: 330, align: 'center' });
    
    doc.moveDown(2);
    doc.fontSize(10);
    doc.text(`Email: ${data.email}`, 60, 170);
    doc.text(`Phone: ${data.phone}`, 60, 190);
    if (data.website) {
      doc.text(`Website: ${data.website}`, 60, 210);
    }
  }

  private generateAgreement(doc: typeof PDFDocument, data: any) {
    doc.fontSize(18).text('AGREEMENT', { align: 'center', underline: true });
    doc.moveDown(2);
    
    doc.fontSize(12);
    doc.text(`This ${data.agreementType} is entered into on ${data.effectiveDate}`);
    doc.moveDown();
    
    doc.text(`BETWEEN:`);
    doc.text(`Party A: ${data.partyA}`);
    doc.text(`Party B: ${data.partyB}`);
    doc.moveDown();
    
    doc.text('TERMS AND CONDITIONS:', { underline: true });
    doc.moveDown();
    
    const terms = data.terms.split(',').map((t: string) => t.trim());
    terms.forEach((term: string, index: number) => {
      doc.text(`${index + 1}. ${term}`);
    });
    
    doc.moveDown(2);
    doc.text(`Effective Date: ${data.effectiveDate}`);
    if (data.expiryDate) {
      doc.text(`Expiry Date: ${data.expiryDate}`);
    }
    
    doc.moveDown(3);
    doc.text('_____________________', 100, doc.y);
    doc.text('Party A Signature', 100, doc.y + 5);
    
    doc.text('_____________________', 350, doc.y - 20);
    doc.text('Party B Signature', 350, doc.y + 5);
  }
}
