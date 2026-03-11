import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class DocumentGeneratorService {
  async generateOfferLetter(data: {
    candidateName: string;
    position: string;
    ctc: number;
    joiningDate: string;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text('OFFER LETTER', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      doc.text(`Dear ${data.candidateName},`);
      doc.moveDown();
      doc.text(`We are pleased to offer you the position of ${data.position} at ${data.companyName}.`);
      doc.moveDown();
      doc.text(`Annual CTC: INR ${data.ctc.toLocaleString()}`);
      doc.text(`Joining Date: ${data.joiningDate}`);
      doc.moveDown();
      doc.text('We look forward to welcoming you to our team.');
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.text('HR Department');
      doc.text(data.companyName);

      doc.end();
    });
  }

  async generateAppointmentLetter(data: {
    employeeName: string;
    position: string;
    department: string;
    joiningDate: string;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text('APPOINTMENT LETTER', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Dear ${data.employeeName},`);
      doc.moveDown();
      doc.text(`This confirms your appointment as ${data.position} in ${data.department} at ${data.companyName}.`);
      doc.moveDown();
      doc.text(`Employment commenced: ${data.joiningDate}`);
      doc.moveDown();
      doc.text('You are required to adhere to all company policies.');
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.text('HR Department');

      doc.end();
    });
  }

  async generateExperienceLetter(data: {
    employeeName: string;
    position: string;
    joiningDate: string;
    lastWorkingDate: string;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text('EXPERIENCE CERTIFICATE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('To Whom It May Concern,');
      doc.moveDown();
      doc.text(`This certifies that ${data.employeeName} was employed with ${data.companyName} as ${data.position}.`);
      doc.moveDown();
      doc.text(`Period: ${data.joiningDate} to ${data.lastWorkingDate}`);
      doc.moveDown();
      doc.text('We wish them success in their future endeavors.');
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.text('HR Department');

      doc.end();
    });
  }

  async generateRelievingLetter(data: {
    employeeName: string;
    position: string;
    lastWorkingDate: string;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text('RELIEVING LETTER', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('To Whom It May Concern,');
      doc.moveDown();
      doc.text(`This certifies that ${data.employeeName}, ${data.position}, has been relieved from ${data.companyName} effective ${data.lastWorkingDate}.`);
      doc.moveDown();
      doc.text('All company assets have been returned.');
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.text('HR Department');

      doc.end();
    });
  }

  async generatePromotionLetter(data: {
    employeeName: string;
    currentPosition: string;
    newPosition: string;
    newCtc: number;
    effectiveDate: string;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text('PROMOTION LETTER', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Dear ${data.employeeName},`);
      doc.moveDown();
      doc.text(`Congratulations! You are promoted from ${data.currentPosition} to ${data.newPosition}.`);
      doc.moveDown();
      doc.text(`New CTC: INR ${data.newCtc.toLocaleString()}`);
      doc.text(`Effective: ${data.effectiveDate}`);
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.text('HR Department');

      doc.end();
    });
  }

  async generateSalaryCertificate(data: {
    employeeName: string;
    position: string;
    ctc: number;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text('SALARY CERTIFICATE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('To Whom It May Concern,');
      doc.moveDown();
      doc.text(`This certifies that ${data.employeeName} is employed with ${data.companyName} as ${data.position}.`);
      doc.moveDown();
      doc.text(`Current CTC: INR ${data.ctc.toLocaleString()}`);
      doc.moveDown(2);
      doc.text('Sincerely,');
      doc.text('HR Department');

      doc.end();
    });
  }

  async generateIDCard(data: {
    employeeId: string;
    employeeName: string;
    position: string;
    department: string;
    photoUrl?: string;
    companyName: string;
    validUntil: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A7', margin: 20 });
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text(data.companyName, { align: 'center' });
      doc.fontSize(10).text('EMPLOYEE ID CARD', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(data.employeeName);
      doc.fontSize(10).text(`ID: ${data.employeeId}`);
      doc.text(`Position: ${data.position}`);
      doc.text(`Department: ${data.department}`);
      doc.text(`Valid Until: ${data.validUntil}`);

      doc.end();
    });
  }

  async generateVisitingCard(data: {
    employeeName: string;
    position: string;
    email: string;
    phone: string;
    companyName: string;
    companyAddress?: string;
    website?: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A7', margin: 20 });
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text(data.companyName);
      doc.moveDown();
      doc.fontSize(14).text(data.employeeName);
      doc.fontSize(10).text(data.position);
      doc.moveDown();
      doc.fontSize(9).text(`Email: ${data.email}`);
      doc.text(`Phone: ${data.phone}`);
      if (data.website) {
        doc.text(`Web: ${data.website}`);
      }

      doc.end();
    });
  }

  async generateAgreement(data: {
    partyA: string;
    partyB: string;
    agreementType: string;
    terms: string[];
    effectiveDate: string;
    expiryDate?: string;
    companyName: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(25).text(data.agreementType.toUpperCase(), { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Effective Date: ${data.effectiveDate}`);
      doc.moveDown();
      doc.text(`Party A: ${data.partyA}`);
      doc.text(`Party B: ${data.partyB}`);
      doc.moveDown();
      doc.text('TERMS AND CONDITIONS:');
      doc.moveDown();
      data.terms.forEach((term, idx) => {
        doc.text(`${idx + 1}. ${term}`);
      });
      doc.moveDown();
      if (data.expiryDate) {
        doc.text(`Valid until: ${data.expiryDate}`);
      }
      doc.moveDown(2);
      doc.text('_____________________     _____________________');
      doc.text(`${data.partyA}                ${data.partyB}`);

      doc.end();
    });
  }
}
