import https from 'https';

function checkHead(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false)).end();
  });
}

async function test() {
  const dbIds = [
    '0410', // dumbbell squat
    '0336', // dumbbell lunge
    '0308', // dumbbell goblet squat
    '0318', // dumbbell press / curl
    '0368', // dumbbell row
    '0411', // dumbbell RDL / single leg squat
  ];
  for (const id of dbIds) {
    const url = `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${id}.gif`;
    const ok = await checkHead(url);
    console.log(`Dumbbell [${id}] exists:`, ok);
  }
}

test();
