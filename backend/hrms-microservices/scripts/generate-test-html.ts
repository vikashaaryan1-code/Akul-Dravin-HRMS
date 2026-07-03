import { TemplateEngineService } from '../src/modules/document-center/template-engine.service';
import { DocumentType, DesignMode } from '../src/modules/document-center/dto/render-document.dto';
import * as fs from 'fs';
import * as path from 'path';

async function generateHtml() {
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

  const artifactsDir = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\ea452584-7b94-4842-ad79-a5a98e283022';

  fs.writeFileSync(path.join(artifactsDir, 'offer_letter.html'), offerHtml);
  fs.writeFileSync(path.join(artifactsDir, 'salary_slip.html'), salaryHtml);
  fs.writeFileSync(path.join(artifactsDir, 'id_card.html'), idCardHtml);

  console.log('Done generating HTML artifacts.');
}

generateHtml().catch(console.error);
