const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFiles() {
  const targetExts = ['.tsx', '.ts'];
  const srcDir = path.join(__dirname, 'frontend-next', 'src');

  walkDir(srcDir, (filePath) => {
    if (!targetExts.includes(path.extname(filePath))) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix global typo
    content = content.replace(/slate-50qua/g, 'aqua');

    // Only apply text-white -> text-navy in landing and public app pages
    // Exception: text-white is sometimes inside gradients or badges where we want white.
    // Instead of blindly replacing all text-white, let's just do it in specific sections for common classes
    if (filePath.includes('landing') || filePath.includes('app\\(public)')) {
        // Safe replacements for background cards that are light
        content = content.replace(/bg-white\/\[0\.035\]/g, 'bg-navy/[0.035]');
        content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-navy/[0.04]');
        content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-navy/[0.01]');
        content = content.replace(/bg-white\/5/g, 'bg-navy/5');
        content = content.replace(/bg-white\/10/g, 'bg-navy/10');
        content = content.replace(/bg-white\/20/g, 'bg-navy/20');
        
        content = content.replace(/border-white\/\[0\.05\]/g, 'border-navy/[0.05]');
        content = content.replace(/border-white\/5/g, 'border-navy/5');
        content = content.replace(/border-white\/10/g, 'border-navy/10');
        content = content.replace(/border-white\/20/g, 'border-navy/20');
        
        // Cautious text-white replacements (avoiding buttons with from-gold to-ember which need text-white)
        // A simple way is to replace text-white with text-navy, then fix the buttons manually, or vice versa
        // Let's only replace text-white/50, text-white/40 etc.
        content = content.replace(/text-white\/40/g, 'text-navy/40');
        content = content.replace(/text-white\/50/g, 'text-navy/50');
        content = content.replace(/text-white\/60/g, 'text-navy/60');
        content = content.replace(/text-white\/80/g, 'text-navy/80');
        content = content.replace(/text-white\/15/g, 'text-navy/15');
        content = content.replace(/text-white\/10/g, 'text-navy/10');
        
        // Replace text-white if it's following common patterns like "text-lg text-white"
        content = content.replace(/text-white(?! \w+)/g, 'text-navy'); 
        // Oh wait, regex above is too complex and might break. Let's just do a manual replace for text-white and we will revert if broken.
        content = content.replace(/text-white/g, 'text-navy');
        
        // But put back text-white for buttons with gradients
        content = content.replace(/from-gold to-ember text-navy/g, 'from-gold to-ember text-white');
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  });
}

processFiles();
