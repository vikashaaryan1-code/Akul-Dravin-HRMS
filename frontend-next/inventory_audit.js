const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const inventory = [];

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relPath = path.relative(srcDir, filePath);
    
    const hasHover = /hover:/g.test(content);
    const hasActive = /active:/g.test(content);
    const hasFocus = /focus:/g.test(content);
    const hasGlass = /backdrop-blur|bg-white\/[0-9]+|bg-black\/[0-9]+/g.test(content);
    const hasResponsive = /sm:|md:|lg:|xl:/g.test(content);
    const hasEmptyState = /length === 0|length === 0 \?|No [a-zA-Z]+ found/g.test(content);

    inventory.push({
      file: relPath,
      hover: hasHover,
      active: hasActive,
      focus: hasFocus,
      glass: hasGlass,
      responsive: hasResponsive,
      emptyState: hasEmptyState
    });
  }
});

const modules = inventory.filter(i => i.file.includes('components\\modules') || i.file.includes('components/modules'));

const missingHover = modules.filter(m => !m.hover).length;
const missingFocus = modules.filter(m => !m.focus).length;
const missingGlass = modules.filter(m => !m.glass).length;
const missingResponsive = modules.filter(m => !m.responsive).length;

console.log(`Total TS/TSX files: ${inventory.length}`);
console.log(`Module files: ${modules.length}`);
console.log(`Modules missing hover: ${missingHover}`);
console.log(`Modules missing focus: ${missingFocus}`);
console.log(`Modules missing glassmorphism: ${missingGlass}`);
console.log(`Modules missing responsive breakpoints: ${missingResponsive}`);

fs.writeFileSync('audit_report.json', JSON.stringify({ summary: { total: inventory.length, modules: modules.length }, modules }, null, 2));
console.log('Detailed report saved to audit_report.json');
