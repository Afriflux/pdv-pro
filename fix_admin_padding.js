const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Skip app/admin/page.tsx
      if (fullPath.endsWith('app/admin/page.tsx')) {
        // Just remove the -m-4 md:-m-8 pb-20 since the layout will handle pb-20 or we can keep it
        content = content.replace('className="-m-4 md:-m-8 pb-20 min-h-screen', 'className="min-h-screen');
        fs.writeFileSync(fullPath, content);
        continue;
      }

      // Find the first <div className="... animate-in fade-in ...">
      const regex = /<div\s+className="([^"]*animate-in fade-in[^"]*)"/i;
      const match = content.match(regex);
      if (match) {
        let classes = match[1];
        
        // Add p-4 md:p-8 if it doesn't have p-
        if (!classes.includes('p-')) {
          classes = `p-4 md:p-8 ${classes}`;
        }
        
        // Add max-w-7xl mx-auto if it doesn't have max-w
        if (!classes.includes('mx-auto') && !classes.includes('max-w-')) {
          classes = `${classes} max-w-7xl mx-auto`;
        }
        
        const newClassStr = `<div className="${classes}"`;
        content = content.replace(match[0], newClassStr);
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'app/admin'));
