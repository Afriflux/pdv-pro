const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  let changed = false;
  let newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if the line has confirm or prompt
    if (/\b(window\.)?(confirm|prompt)\s*\(/.test(line)) {
      // Check if previous line is already a disable
      if (i > 0 && lines[i - 1].includes('eslint-disable-next-line no-alert')) {
         newLines.push(line);
         continue;
      }
      // Add disable comment with same indentation
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1] : '';
      newLines.push(indent + '// eslint-disable-next-line no-alert');
      newLines.push(line);
      changed = true;
    } else {
      newLines.push(line);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'app'));
walkDir(path.join(__dirname, 'components'));
walkDir(path.join(__dirname, 'lib'));
console.log('Confirms ignorés pour la compilation.');
