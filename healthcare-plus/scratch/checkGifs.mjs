import fs from 'fs';

const content = fs.readFileSync('c:/Users/heart/Desktop/HealthCare+/healthcare-plus/frontend/src/data/physicalWellnessMockData.js', 'utf8');

const regex = /name:\s*['"]([^'"]+)['"][^}]+gifUrl:\s*['"]([^'"]+)['"]/gs;
let match;
const found = [];
while ((match = regex.exec(content)) !== null) {
  found.push({ name: match[1], gifUrl: match[2] });
}

console.log(`Found ${found.length} exercises with gifUrl:`);
found.forEach((f, idx) => console.log(`${idx + 1}. ${f.name} -> ${f.gifUrl}`));
