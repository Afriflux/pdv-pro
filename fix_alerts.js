const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Search for whole words "alert" followed by "("
  const alertRegex = /\balert\s*\(/g;
  
  if (!alertRegex.test(content)) return;
  console.log(`Processing: ${filePath}`);

  // Replace alerts with toast
  content = content.replace(/\balert\s*\((.*?)\)/g, (match, p1) => {
    p1Lower = p1.toLowerCase();
    if (p1Lower.includes('✅') || p1Lower.includes('succès')) {
      return `toast.success(${p1})`;
    } else if (p1Lower.includes('❌') || p1Lower.includes('erreur') || p1Lower.includes('échec') || p1Lower.includes('impossible') || p1Lower.includes('echec')) {
      return `toast.error(${p1})`;
    } else {
      return `toast(${p1})`;
    }
  });

  if (content !== originalContent) {
    // Add import { toast } from 'sonner' if not present
    if (!content.includes("from 'sonner'") && !content.includes('from "sonner"')) {
      // Find the last import line
      const importRegex = /^import .+ from .+;/gm;
      let lastImportIndex = 0;
      let m;
      while ((m = importRegex.exec(content)) !== null) {
        lastImportIndex = m.index + m[0].length;
      }
      
      const importStatement = "\nimport { toast } from 'sonner';";
      if (lastImportIndex > 0) {
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
      } else {
        // If no imports, append to top but after "use client" if it exists
        if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
           const lines = content.split('\n');
           lines.splice(1, 0, importStatement);
           content = lines.join('\n');
        } else {
           content = importStatement + '\n' + content;
        }
      }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'app'));
walkDir(path.join(__dirname, 'components'));
console.log('Terminé.');
