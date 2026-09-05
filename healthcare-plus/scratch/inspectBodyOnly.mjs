import https from 'https';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const data = await fetchJson('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  const eqMap = {};
  data.forEach(e => {
    eqMap[e.equipment] = (eqMap[e.equipment] || 0) + 1;
  });
  console.log('Equipment values:', eqMap);

  const bodyOnly = data.filter(e => e.equipment === 'body only' || e.equipment === null);
  console.log('Total body only or null:', bodyOnly.length);

  // Search for leg, hip, mobility exercises
  const terms = ['abduction', 'lunge', 'step', 'squat', 'kick', 'jump', 'neck', 'cat', 'dog', 'child', 'hip', 'knee', 'glute'];
  terms.forEach(t => {
    const hits = bodyOnly.filter(e => e.name.toLowerCase().includes(t));
    console.log(`Hits for '${t}':`, hits.map(h => `${h.name} (${h.images[0]})`));
  });
}

run();
