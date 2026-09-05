import https from 'https';
import fs from 'fs';

const sources = [
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/exercises.json',
  'https://raw.githubusercontent.com/neptunusecosystem/exercises-database/main/dist/exercises.json',
  'https://raw.githubusercontent.com/exercisedb/exercisedb/main/exercises.json',
  'https://raw.githubusercontent.com/haikali707/ExerciseDB/main/exercises.json',
  'https://raw.githubusercontent.com/brent-white3/exercise-db/main/exercises.json',
  'https://raw.githubusercontent.com/jonathan-lemos/ExerciseDB/master/exercises.json',
  'https://raw.githubusercontent.com/alifianadhip/GymBro-Backend/main/data/exercises.json'
];

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  for (const s of sources) {
    console.log('Testing', s);
    const data = await fetchUrl(s);
    if (data && Array.isArray(data)) {
      console.log('FOUND DATA! Count:', data.length, 'from', s);
      fs.writeFileSync('scratch/exercisedb_full.json', JSON.stringify(data, null, 2));
      return;
    }
  }
  console.log('No direct hit among tested sources.');
}

run();
