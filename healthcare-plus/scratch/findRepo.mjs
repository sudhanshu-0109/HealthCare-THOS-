import https from 'https';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: { 'User-Agent': 'NodeJS' }
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ error: e.message, data: data.slice(0, 200) }); }
      });
    }).on('error', reject);
  });
}

async function findRepo() {
  const meta = await fetchJson('https://api.github.com/repos/omercotkd/exercises-gifs');
  console.log('omercotkd/exercises-gifs parent:', meta.parent?.full_name);

  // Also check popular ExerciseDB json repos
  const possible = [
    'https://raw.githubusercontent.com/Cyber-Abl/exercise-db/main/exercises.json',
    'https://raw.githubusercontent.com/Ebrahim-Ramadan/Fitness-App/main/data/exercises.json',
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
  ];

  for (const p of possible) {
    const res = await fetchJson(p);
    if (Array.isArray(res)) {
      console.log(p, 'is array with length:', res.length);
      // find glute bridge
      const bridges = res.filter(x => (x.name || '').toLowerCase().includes('bridge') || (x.name || '').toLowerCase().includes('bird'));
      console.log('Found bridges in', p, bridges.slice(0, 5).map(x => ({ name: x.name, id: x.id, equipment: x.equipment, gifUrl: x.gifUrl })));
    }
  }
}

findRepo();
