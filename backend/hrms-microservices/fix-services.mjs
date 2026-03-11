import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const serviceDirs = [
  'src/modules/announcement',
  'src/modules/appraisal',
  'src/modules/benefit',
  'src/modules/candidate',
  'src/modules/certificate',
  'src/modules/client',
  'src/modules/commission',
  'src/modules/employee',
  'src/modules/exit',
  'src/modules/feedback',
  'src/modules/goal',
  'src/modules/holiday',
  'src/modules/invoice',
  'src/modules/meeting',
  'src/modules/onboarding',
  'src/modules/placement',
  'src/modules/policy',
  'src/modules/project',
  'src/modules/salary-structure',
  'src/modules/skill',
  'src/modules/ticket',
  'src/modules/timesheet',
  'src/modules/ai-matching',
  'src/modules/ai-resume-parser'
];

serviceDirs.forEach(dir => {
  const serviceFile = join(dir, dir.split('/').pop() + '.service.ts');
  try {
    let content = readFileSync(serviceFile, 'utf8');
    
    // Add NotFoundException import if not present
    if (!content.includes('NotFoundException')) {
      content = content.replace(
        /from '@nestjs\/common';/,
        ", NotFoundException } from '@nestjs/common';"
      ).replace(
        /import { Injectable/,
        "import { Injectable, NotFoundException"
      );
    }
    
    // Fix findOne methods to throw instead of return null
    content = content.replace(
      /async findOne\(id: string\): Promise<(\w+) \| null> \{\s+return this\.(\w+)\.findOne\(\{ where: \{ id \} \}\);/g,
      'async findOne(id: string): Promise<$1> {\n    const result = await this.$2.findOne({ where: { id } });\n    if (!result) throw new NotFoundException(`$1 not found`);\n    return result;'
    );
    
    writeFileSync(serviceFile, content);
    console.log(`Fixed ${serviceFile}`);
  } catch (e) {
    console.log(`Skipped ${serviceFile}`);
  }
});
