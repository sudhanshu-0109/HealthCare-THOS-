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
  console.log('Total exercises:', data.length);
  const bodyweight = data.filter(e => e.equipment === 'body only');
  console.log('Body only exercises count:', bodyweight.length);

  // Group by category
  const categories = {};
  bodyweight.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + 1;
  });
  console.log('Categories:', categories);

  // Search for our specific names
  const targets = [
    'bridge', 'squat', 'push-up', 'pushup', 'lunge', 'plank', 'climber', 'bird', 'dead bug',
    'child', 'twist', 'jumping jack', 'stretch', 'superman', 'wall sit', 'burpee', 'crunch'
  ];

  targets.forEach(t => {
    const matches = bodyweight.filter(e => e.name.toLowerCase().includes(t));
    console.log(`\nMatches for '${t}' (${matches.length}):`);
    matches.slice(0, 5).forEach(m => {
      console.log(`  - ${m.name} [id: ${m.id}, category: ${m.category}] image: ${m.images[0]}`);
    });
  });
}

run();
