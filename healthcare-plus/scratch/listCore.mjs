import fs from 'fs';

const catalog = JSON.parse(fs.readFileSync('scratch/pure_bodyweight_catalog.json', 'utf8'));

const absAndGlutes = catalog.filter(e => e.target === 'abs' || e.target === 'glutes' || e.target === 'spine');
console.log('Abs, glutes, and spine exercises:', absAndGlutes.length);
absAndGlutes.slice(0, 30).forEach(e => {
  console.log(`[${e.id}] ${e.name} (${e.target})`);
});
