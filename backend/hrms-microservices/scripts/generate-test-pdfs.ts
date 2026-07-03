import { TemplateEngineService } from '../src/modules/document-center/template-engine.service';
import { DocumentType, DesignMode } from '../src/modules/document-center/dto/render-document.dto';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function generatePdfs() {
  const engine = new TemplateEngineService();
  
  const mockDto = {
    type: DocumentType.OFFER_LETTER,
    design: DesignMode.PRINT_CLEAN,
    employee: {
      name: 'John Doe',
      designation: 'Senior Software Engineer',
      department: 'Engineering',
      doj: '2026-08-01',
      compensation: { ctc: 150000, currency: 'USD' }
    },
    company: {
      name: 'AKUL DRAVIN HRMS AI',
      address: '123 Innovation Drive, Silicon Valley, CA',
      website: 'www.akuldravin.com'
    }
  };

  const offerHtml = engine.render(mockDto, 'VERIF-12345', 'data:image/png;base64,mockqr');
  
  mockDto.type = DocumentType.SALARY_SLIP as any;
  const salaryHtml = engine.render(mockDto, 'VERIF-67890', 'data:image/png;base64,mockqr');
  
  mockDto.type = DocumentType.ID_CARD as any;
  const idCardHtml = engine.render(mockDto, 'VERIF-11111', 'data:image/png;base64,mockqr');

  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const artifactsDir = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\ea452584-7b94-4842-ad79-a5a98e283022';

  await page.setContent(offerHtml, { waitUntil: 'networkidle0' });
  await page.pdf({ path: path.join(artifactsDir, 'offer_letter.pdf'), format: 'A4', printBackground: true });
  console.log('Generated Offer Letter PDF');

  await page.setContent(salaryHtml, { waitUntil: 'networkidle0' });
  await page.pdf({ path: path.join(artifactsDir, 'salary_slip.pdf'), format: 'A4', printBackground: true });
  console.log('Generated Salary Slip PDF');

  await page.setContent(idCardHtml, { waitUntil: 'networkidle0' });
  await page.pdf({ path: path.join(artifactsDir, 'id_card.pdf'), width: '1016px', height: '640px', printBackground: true });
  console.log('Generated ID Card PDF');

  await browser.close();
  console.log('Done.');
}

generatePdfs().catch(console.error);
