import fs from 'fs';

const catalog = JSON.parse(fs.readFileSync('scratch/pure_bodyweight_catalog.json', 'utf8'));

const keywords = ['all fours', 'dog', 'quadruped', 'kickback', 'superman', 'prone', 'bird', 'arm raise', 'opposite'];

keywords.forEach(k => {
  const matches = catalog.filter(e => e.name.toLowerCase().includes(k));
  console.log(`Matches for '${k}':`, matches.map(m => `[${m.id}] ${m.name} (${m.target})`));
});
