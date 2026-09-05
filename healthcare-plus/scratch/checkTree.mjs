import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const res = await fetchUrl('https://api.github.com/repos/omercotkd/exercises-gifs/git/trees/main?recursive=1');
  if (res.status === 200) {
    const tree = JSON.parse(res.data).tree || [];
    console.log('Total files in omercotkd/exercises-gifs:', tree.length);
    const filenames = tree.map(t => t.path).filter(p => p.endsWith('.gif'));
    console.log('Sample gif filenames:', filenames.slice(0, 10));
  } else {
    console.log('API error or rate limit:', res.status, res.data.slice(0, 100));
  }
}

run();
