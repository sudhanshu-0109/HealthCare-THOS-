import https from 'https';
import fs from 'fs';

const catalog = JSON.parse(fs.readFileSync('scratch/pure_bodyweight_catalog.json', 'utf8'));

function checkHead(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false)).end();
  });
}

async function test() {
  console.log('Testing GIF existence for selected pure bodyweight candidates:');
  const candidates = [
    '3013', // low glute bridge on floor
    '3561', // glute bridge march
    '1422', // pelvic tilt into bridge
    '0710', // side hip abduction
    '1774', // side bridge hip abduction
    '0662', // push-up
    '0493', // incline push-up
    '0283', // diamond push-up
    '0464', // front plank with twist
    '0630', // mountain climber
    '3224', // jack jump (jumping jack)
    '0687', // russian twist
    '0276', // dead bug
    '1160', // burpee
    '3470', // forward lunge
    '1460', // walking lunge
    '3119', // potty squat (deep bodyweight squat)
    '2368', // split squats
    '0514', // jump squat
    '1363', // spine stretch
    '1511', // hamstring stretch
    '1494', // butterfly yoga pose
    '0690', // seated lower back stretch
    '1424', // seated glute stretch
    '3639', // bent knee lying twist
    '0613', // lying side quads stretch
    '2571', // rocking frog stretch
    '1585', // runners stretch
  ];

  for (const id of candidates) {
    const item = catalog.find(c => c.id === id);
    const exists = await checkHead(item?.gifUrl);
    console.log(`[${id}] ${item?.name} -> exists: ${exists} (${item?.gifUrl})`);
  }
}

test();
