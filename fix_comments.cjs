const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Find all '// ...' patterns and try to terminate them.
      // We look for '// ' followed by text, ending right before a common keyword
      // like 'const', 'let', 'setTimeout', 'if', 'return', 'import', 'export', 'function', 'interface', 'type', or '}'
      const regex = /\/\/ (.*?)\s+(?=(const|let|var|if|return|setTimeout|import|export|function|interface|type|class|\}))/g;
      
      content = content.replace(regex, (match, p1) => {
        changed = true;
        return `/* ${p1} */ `;
      });
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed comments in:', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'frontend-next', 'src'));
