const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'components/shared/storefront/HelpdeskWidget.tsx');
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace('<>', '<div style={{ "--accent": accentColor, "--accent-rgb": accentRgb } as React.CSSProperties}>');
content1 = content1.replace('</>', '</div>');

content1 = content1.replace(/style=\{\{ backgroundColor: accentColor, boxShadow: `0 10px 25px rgba\(\$\{accentRgb\}, 0\.5\)` \}\}/g, 'className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[80] w-14 h-14 rounded-full text-white shadow-[0_10px_25px_rgba(var(--accent-rgb),0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all bg-[var(--accent)]"');

content1 = content1.replace(/className="p-6 text-white shrink-0 relative overflow-hidden rounded-t-\[32px\]" style=\{\{ backgroundColor: accentColor \}\}/g, 'className="p-6 text-white shrink-0 relative overflow-hidden rounded-t-[32px] bg-[var(--accent)]"');

content1 = content1.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm outline-none transition-shadow" style=\{\{ '--tw-ring-color': accentColor \} as any\}/g, 'className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]"');

content1 = content1.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm outline-none transition-shadow cursor-pointer" style=\{\{ '--tw-ring-color': accentColor \} as any\}/g, 'className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow cursor-pointer focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]"');

content1 = content1.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-shadow resize-none" style=\{\{ '--tw-ring-color': accentColor \} as any\}/g, 'className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-shadow resize-none focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]"');

content1 = content1.replace(/style=\{\{ backgroundColor: accentColor, boxShadow: `0 8px 20px rgba\(\$\{accentRgb\}, 0\.3\)` \}\}/g, 'className="w-full mt-2 py-3.5 rounded-xl font-black text-sm text-white shadow-[0_8px_20px_rgba(var(--accent-rgb),0.3)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all bg-[var(--accent)]"');

// Fix ARIA
content1 = content1.replace('<button \n        onClick={() => setIsOpen(true)}', '<button onClick={() => setIsOpen(true)} aria-label="Aide" title="Aide"');
content1 = content1.replace('<button onClick={() => setIsOpen(false)} className="absolute top-4 right-4', '<button onClick={() => setIsOpen(false)} aria-label="Fermer" title="Fermer" className="absolute top-4 right-4');
content1 = content1.replace(/<select required value=\{form\.subject\}/g, '<select required aria-label="Sujet" title="Sujet" value={form.subject}');

fs.writeFileSync(file1, content1);
