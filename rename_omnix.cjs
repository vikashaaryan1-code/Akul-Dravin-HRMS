const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  path.join(__dirname, 'backend', 'hrms-microservices', 'src'),
  path.join(__dirname, 'frontend-next', 'src'),
  path.join(__dirname, 'frontend-next', 'public')
];

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath);
    }
  }
}

let modifiedFiles = 0;

DIRECTORIES.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkSync(dir, (filepath) => {
      // Ignore non-text files and git
      if (filepath.includes('node_modules') || filepath.includes('.git') || filepath.includes('.next') || filepath.includes('dist') || filepath.includes('coverage')) return;
      
      const ext = path.extname(filepath);
      if (!['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.html'].includes(ext)) return;

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
    });
  }
});

console.log(`Total files modified: ${modifiedFiles}`);
