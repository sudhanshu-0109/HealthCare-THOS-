import https from 'https';

function fetchStream(url, cb) {
  https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
    let buf = '';
    res.on('data', chunk => buf += chunk);
    res.on('end', () => cb(JSON.parse(buf)));
  }).on('error', console.error);
}

fetchStream('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json', (data) => {
  const bodyweightItems = data.filter(e => {
    const eq = (e.equipment || '').toLowerCase();
    return eq === 'body weight' || eq === 'none' || eq === 'bodyweight';
  });

  const queries = [
    'twist', 'burpee', 'squat', 'lunge', 'bridge', 'superman',
    'pose', 'stretch', 'hip', 'abduction', 'push'
  ];

  queries.forEach(q => {
    const res = bodyweightItems.filter(e => (e.name || '').toLowerCase().includes(q));
    console.log(`\n=== "${q}" ===`);
    res.forEach(r => console.log(`[${r.id}] ${r.name} (target: ${r.target})`));
  });
});
