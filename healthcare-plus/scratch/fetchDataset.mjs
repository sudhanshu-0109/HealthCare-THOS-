import https from 'https';
import fs from 'fs';

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
  const urls = [
    'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/exercises.json',
    'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/master/exercises.json',
    'https://raw.githubusercontent.com/jtaoufik/fitexercisedb-api/main/exercises.json',
    'https://raw.githubusercontent.com/jtaoufik/fitexercisedb-api/master/exercises.json',
    'https://raw.githubusercontent.com/jtaoufik/fitexercisedb-api/master/src/data/exercises.json',
    'https://raw.githubusercontent.com/XZE3N/ExerciseGifDownloader/main/exercises.json'
  ];

  for (const u of urls) {
    const data = await fetchUrl(u);
    if (data && Array.isArray(data)) {
      console.log('SUCCESS! Found array length:', data.length, 'from', u);
      fs.writeFileSync('scratch/exercisedb_1324.json', JSON.stringify(data));
      return;
    }
  }
  console.log('None of the direct URLs matched.');
}

run();
