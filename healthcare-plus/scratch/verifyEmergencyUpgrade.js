const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${data.message || res.statusText}`);
    error.data = data;
    error.status = res.status;
    throw error;
  }
  return data;
}

async function testFullEmergencyFlow() {
  console.log('=== HEALTHCARE+ EMERGENCY UPGRADE END-TO-END VERIFICATION ===\n');

  // 1. Log in Patient
  console.log('1. Logging in patient (patient@healthcareplus.dev)...');
  const patientLogin = await req(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'patient@healthcareplus.dev',
      password: 'Password123!',
    }),
  });
  const patientToken = patientLogin.data?.accessToken || patientLogin.accessToken;
  const patientAuth = { headers: { Authorization: `Bearer ${patientToken}` } };
  console.log('   Patient logged in successfully.');

  // 2. Log in Driver
  console.log('2. Logging in driver (driver@sterling.dev)...');
  const driverLogin = await req(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'driver@sterling.dev',
      password: 'Password123!',
    }),
  });
  const driverToken = driverLogin.data?.accessToken || driverLogin.accessToken;
  const driverAuth = { headers: { Authorization: `Bearer ${driverToken}` } };
  console.log('   Driver logged in successfully.');

  // 3. Driver goes online with initial GPS
  console.log('3. Driver goes online at Vadodara location (22.3188, 73.1670)...');
  await req(`${BASE_URL}/driver/go-online`, {
    method: 'POST',
    body: JSON.stringify({ latitude: 22.3188, longitude: 73.1670 }),
    ...driverAuth,
  });
  console.log('   Driver is online.');

  // 4. Patient creates SOS Emergency Request
  console.log('4. Patient triggers SOS at Akota, Vadodara (22.3020, 73.1890)...');
  const sosRes = await req(`${BASE_URL}/emergency`, {
    method: 'POST',
    body: JSON.stringify({ latitude: 22.3020, longitude: 73.1890 }),
    ...patientAuth,
  });
  const emergencyId = sosRes.data?.id || sosRes.id;
  console.log(`   Emergency request created: ID = ${emergencyId}`);

  // 5. Patient checks status — verify hospital is assigned!
  console.log('5. Patient verifies emergency status and assigned hospital details...');
  const statusRes = await req(`${BASE_URL}/emergency/${emergencyId}/status`, {
    method: 'GET',
    ...patientAuth,
  });
  const reqData = statusRes.data || statusRes;
  console.log(`   Status: ${reqData.status}`);
  console.log(`   Assigned Hospital: ${reqData.hospital?.name} (${reqData.hospital?.address})`);
  console.log(`   Hospital Coords: (${reqData.hospital?.latitude}, ${reqData.hospital?.longitude})`);
  if (!reqData.hospital) {
    throw new Error('FAILED: Hospital was not populated in emergency status!');
  }

  // 6. Driver claims request
  console.log('6. Driver accepts emergency request...');
  const acceptRes = await req(`${BASE_URL}/driver/requests/${emergencyId}/accept`, {
    method: 'POST',
    body: JSON.stringify({}),
    ...driverAuth,
  });
  const acceptData = acceptRes.data || acceptRes;
  console.log('   Accept response:', acceptData);
  if (!acceptData.hospital) {
    throw new Error('FAILED: Hospital details not returned on driver accept!');
  }

  // 7. Driver updates live GPS location with heading & speed
  console.log('7. Driver streams live GPS with heading (315 deg) and speed (45 km/h)...');
  await req(`${BASE_URL}/driver/location`, {
    method: 'POST',
    body: JSON.stringify({
      latitude: 22.3050,
      longitude: 73.1860,
      heading: 315.0,
      speed: 45.2,
    }),
    ...driverAuth,
  });
  console.log('   Location updated in DB.');

  // 8. Driver marks en route
  console.log('8. Driver marks EN_ROUTE...');
  await req(`${BASE_URL}/driver/requests/${emergencyId}/en-route`, {
    method: 'POST',
    body: JSON.stringify({}),
    ...driverAuth,
  });
  console.log('   Driver is EN_ROUTE.');

  // 9. Driver marks PICKED_UP (Transition to Phase B)
  console.log('9. Driver arrives at patient and marks PICKED_UP...');
  const pickedUpRes = await req(`${BASE_URL}/driver/requests/${emergencyId}/picked-up`, {
    method: 'POST',
    body: JSON.stringify({}),
    ...driverAuth,
  });
  const pickedData = pickedUpRes.data || pickedUpRes;
  console.log('   Picked up response:', pickedData);
  console.log(`   Destination Hospital: ${pickedData.hospital?.name} (${pickedData.hospital?.address})`);
  if (!pickedData.hospital?.name) {
    throw new Error('FAILED: Destination hospital details not returned on markPickedUp!');
  }

  // 10. Patient checks status after pickup — verify Phase B destination is Hospital!
  console.log('10. Patient checks status after pickup (Phase B verification)...');
  const patientPhaseB = await req(`${BASE_URL}/emergency/${emergencyId}/status`, {
    method: 'GET',
    ...patientAuth,
  });
  const phaseBData = patientPhaseB.data || patientPhaseB;
  console.log(`    Status: ${phaseBData.status}`);
  console.log(`    Destination Hospital: ${phaseBData.hospital?.name}`);
  console.log(`    Hospital Phone: ${phaseBData.hospital?.contactPhone}`);
  if (phaseBData.status !== 'PICKED_UP') {
    throw new Error(`FAILED: Expected status PICKED_UP, got ${phaseBData.status}`);
  }

  // 11. Driver checks state — verify activeRequest has hospital
  console.log('11. Driver checks dashboard state (getDriverState)...');
  const driverState = await req(`${BASE_URL}/driver/me`, {
    method: 'GET',
    ...driverAuth,
  });
  const activeReq = driverState.data?.activeRequest;
  console.log(`    Active Request Status: ${activeReq?.status}`);
  console.log(`    Active Request Hospital: ${activeReq?.hospital?.name}`);
  if (!activeReq?.hospital?.name) {
    throw new Error('FAILED: Hospital not populated in driver activeRequest!');
  }

  // 12. Driver marks ARRIVED at Hospital (Completion)
  console.log('12. Driver reaches hospital emergency bay and marks ARRIVED...');
  await req(`${BASE_URL}/driver/requests/${emergencyId}/arrived`, {
    method: 'POST',
    body: JSON.stringify({}),
    ...driverAuth,
  });
  console.log('    Emergency successfully completed.');

  // 13. Final patient verification
  console.log('13. Final patient verification of completed trip...');
  const finalStatus = await req(`${BASE_URL}/emergency/${emergencyId}/status`, {
    method: 'GET',
    ...patientAuth,
  });
  const finalData = finalStatus.data || finalStatus;
  console.log(`    Final Status: ${finalData.status}`);
  if (finalData.status !== 'ARRIVED') {
    throw new Error(`FAILED: Expected final status ARRIVED, got ${finalData.status}`);
  }

  console.log('\n>>> ALL 13 END-TO-END ACCEPTANCE CRITERIA VERIFICATIONS PASSED SUCCESSFULLY! <<<\n');
}

testFullEmergencyFlow().catch((err) => {
  console.error('\nTEST FAILED:', err.data || err.message);
  process.exit(1);
});
