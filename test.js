const fs = require('fs');
const code = fs.readFileSync('app/dashboard/abonnements/AbonnementsClient.tsx', 'utf-8');
let openCount = 0;
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const opens = (lines[i].match(/<div[ >]/g) || []).length;
  const closes = (lines[i].match(/<\/div>/g) || []).length;
  openCount += opens - closes;
  console.log(`Line ${i + 1}: +${opens} -${closes} = ${openCount}`);
}
