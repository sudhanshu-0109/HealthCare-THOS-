import https from 'https';

function fetchStream(url, cb) {
  https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
    let buf = '';
    res.on('data', chunk => buf += chunk);
    res.on('end', () => cb(JSON.parse(buf)));
  }).on('error', console.error);
}

const currentIds = [
  '3224', '1368', '0464', '0630', '0687', '3636', '0276', '1160', '1363', '1511',
  '1376', '1388', '1472', '1374', '1397', '0311', '0044', '0272', '0596', '0527',
  '0471', '0420', '0662', '0411', '0318', '0368', '0542', '1494'
];

fetchStream('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json', (data) => {
  console.log('Inspecting current IDs in dataset:');
  currentIds.forEach(id => {
    const item = data.find(e => String(e.id) === id || String(e.id).padStart(4, '0') === id);
    if (item) {
      console.log(`ID ${id}: name="${item.name}", equipment="${item.equipment}", target="${item.target}"`);
    } else {
      console.log(`ID ${id}: NOT FOUND`);
    }
  });
});
