const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') {
        console.warn(`Skipping ${dirFile} due to permission or missing file`);
      }
    }
  });
  return filelist;
};

const rootDir = path.join(__dirname, 'frontend-next', 'src');
const files = walkSync(rootDir);

let modifiedCount = 0;

for (const filepath of files) {
  if (!['.tsx', '.ts', '.jsx', '.js'].includes(path.extname(filepath))) continue;
  
  const original = fs.readFileSync(filepath, 'utf8');
  let content = original;
  
  // Remove dark: variants
  content = content.replace(/dark:[a-zA-Z0-9-\/:]+[ \t]?/g, '');
  
  // Replace dark backgrounds with light equivalents
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-950/g, 'bg-slate-50');
  content = content.replace(/bg-slate-800/g, 'bg-slate-50');
  content = content.replace(/bg-gray-900/g, 'bg-white');
  content = content.replace(/bg-gray-800/g, 'bg-gray-50');
  content = content.replace(/bg-[#020617]/g, 'bg-white');
  content = content.replace(/bg-[#0f172a]/g, 'bg-slate-50');
  content = content.replace(/bg-\[\#0f1c3a\]/g, 'bg-white');
  
  // Replace dark borders
  content = content.replace(/border-slate-700/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-gray-700/g, 'border-gray-200');
  content = content.replace(/border-gray-800/g, 'border-gray-200');
  
  // Replace dark text
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  content = content.replace(/text-gray-200/g, 'text-gray-700');
  content = content.replace(/text-gray-300/g, 'text-gray-600');
  content = content.replace(/text-gray-400/g, 'text-gray-500');
  
  // Replace specific text-white if it's likely a heading/paragraph not a button
  // A heuristic: if it's next to text-xl, text-2xl, etc.
  content = content.replace(/text-white([ \t]+text-[2-6]xl)/g, 'text-navy$1');
  content = content.replace(/(text-[2-6]xl[ \t]+)text-white/g, '$1text-navy');
  content = content.replace(/text-white([ \t]+font-bold)/g, 'text-navy$1');
  content = content.replace(/(font-bold[ \t]+)text-white/g, '$1text-navy');
  
  // Clean up extra spaces left by dark: removal, preserving newlines
  content = content.replace(/[ \t]{2,}/g, ' ');
  
  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated theme in: ${filepath}`);
    modifiedCount++;
  }
}

console.log(`Total files updated for light theme: ${modifiedCount}`);
