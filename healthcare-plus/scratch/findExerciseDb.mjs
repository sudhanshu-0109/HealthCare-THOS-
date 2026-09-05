import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  const urls = [
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
    'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises.json',
    'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/exercises.json'
  ];

  for (const u of urls) {
    try {
      const res = await fetchUrl(u);
      console.log(u, 'status:', res.status, 'len:', res.data.length);
      if (res.status === 200 && res.data.length > 100) {
        const json = JSON.parse(res.data);
        console.log('Sample item:', Object.keys(json[0] || {}), json.slice(0, 2));
      }
    } catch (e) {
      console.log(u, 'error:', e.message);
    }
  }
}

test();
