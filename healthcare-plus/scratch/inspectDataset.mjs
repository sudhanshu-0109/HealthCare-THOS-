import https from 'https';
import fs from 'fs';

function fetchStream(url, cb) {
  https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
    let buf = '';
    res.on('data', chunk => {
      buf += chunk;
      // parse objects as they come or wait
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(buf);
        cb(json);
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    });
  }).on('error', console.error);
}

fetchStream('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json', (data) => {
  console.log('Total items in dataset:', data.length);
  console.log('Sample item:', data[0]);

  // Find exact pure bodyweight movements
  const searchTerms = [
    'bridge', 'bird', 'abduction', 'squat', 'push-up', 'push up',
    'lunge', 'plank', 'climber', 'dead bug', 'child', 'jack', 'cat'
  ];

  const bodyweightItems = data.filter(e => {
    const eq = (e.equipment || '').toLowerCase();
    return eq === 'body weight' || eq === 'none' || eq === 'bodyweight';
  });
  console.log('Total body weight items:', bodyweightItems.length);

  searchTerms.forEach(term => {
    const matches = bodyweightItems.filter(e => (e.name || '').toLowerCase().includes(term));
    console.log(`\n=== Matches for '${term}' (${matches.length}) ===`);
    matches.slice(0, 8).forEach(m => {
      console.log(`- ${m.name} | ID: ${m.id} | equip: ${m.equipment} | gif: ${m.gifUrl || m.gifPath || m.images?.[0]}`);
    });
  });
});
