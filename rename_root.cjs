const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const files = fs.readdirSync(rootDir);

let modifiedFiles = 0;

for (const file of files) {
  const filepath = path.join(rootDir, file);
  const stats = fs.statSync(filepath);
  
  if (stats.isFile()) {
    const ext = path.extname(filepath);
    if (['.md', '.env', '.json', '.txt', '.yaml', '.yml'].includes(ext) || filepath.includes('.env')) {
      const content = fs.readFileSync(filepath, 'utf8');
      let newContent = content;
      
      newContent = newContent.replace(/OMNIX_A2Z/g, 'AKUL_DRAVIN_A2Z');
      newContent = newContent.replace(/OMNIX/g, 'AKUL DRAVIN');
      newContent = newContent.replace(/Omnix/g, 'AKUL DRAVIN');
      newContent = newContent.replace(/omnix/g, 'akul-dravin');
      
      if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log(`Modified: ${filepath}`);
        modifiedFiles++;
      }
    }
  }
}
console.log(`Total root files modified: ${modifiedFiles}`);
