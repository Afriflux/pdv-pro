const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{app,components}/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Only replace style={{ ... }} if it doesn't contain a ternary or complex logic spanning multiple lines easily
  // Actually, string replacement is tricky due to nested objects.
  
  // Easier: replace `style={{` with `style={Object.assign({}, {`
  // and close it properly... wait, closing it properly is hard with regex.
  
  // Instead of auto-replacing the codebase with a fragile regex, let's just do it cleanly using babel!
});
