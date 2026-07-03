const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const logPath = path.join(__dirname, '.gemini', 'antigravity', 'brain', '3018e185-4c18-4375-a065-9e0ed3fe277f', '.system_generated', 'tasks', 'task-178.log');
// Wait, the path to the log is C:/Users/pc/... I need the absolute path.
const absoluteLogPath = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\3018e185-4c18-4375-a065-9e0ed3fe277f\\.system_generated\\tasks\\task-178.log';

if (fs.existsSync(absoluteLogPath)) {
  const logContent = fs.readFileSync(absoluteLogPath, 'utf8');
  const lines = logContent.split('\n');
  
  const filesToRestore = [];
  for (const line of lines) {
    const match = line.match(/^Updated theme in: (.+)$/);
    if (match) {
      filesToRestore.push(match[1].trim());
    }
  }

  console.log(`Found ${filesToRestore.length} files to restore.`);

  // Restore the files using git
  for (const file of filesToRestore) {
    try {
      execSync(`git checkout -- "${file}"`, { cwd: __dirname, stdio: 'ignore' });
      console.log(`Restored: ${file}`);
    } catch (e) {
      console.error(`Failed to restore: ${file}`);
    }
  }
} else {
  console.error('Log file not found');
}
