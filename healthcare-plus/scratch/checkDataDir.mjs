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
  const res = await fetchUrl('https://api.github.com/repos/hasaneyldrm/exercises-dataset/contents/data');
  console.log(res.data);
}

run();
