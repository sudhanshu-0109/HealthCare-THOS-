import https from 'https';
import fs from 'fs';

function fetchStream(url, cb) {
  https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
    let buf = '';
    res.on('data', chunk => buf += chunk);
    res.on('end', () => cb(JSON.parse(buf)));
  }).on('error', console.error);
}

fetchStream('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json', (data) => {
  const pureBodyweight = data.filter(e => {
    const eq = (e.equipment || '').toLowerCase().trim();
    return eq === 'body weight' || eq === 'none';
  });

  console.log('Total pure bodyweight exercises:', pureBodyweight.length);

  const mapped = pureBodyweight.map(e => ({
    id: String(e.id).padStart(4, '0'),
    name: e.name,
    target: e.target,
    bodyPart: e.body_part || e.bodyPart,
    equipment: e.equipment,
    gifUrl: `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${String(e.id).padStart(4, '0')}.gif`
  }));

  fs.writeFileSync('scratch/pure_bodyweight_catalog.json', JSON.stringify(mapped, null, 2));
  console.log('Saved scratch/pure_bodyweight_catalog.json');
});
