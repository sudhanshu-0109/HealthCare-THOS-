import {
  resolveTripDestination,
  calculateBearing,
  pointToPolylineDistanceMeters,
  ARRIVAL_THRESHOLD_METERS,
  DEVIATION_THRESHOLD_METERS
} from '../frontend/src/utils/emergencyRouting.js';
import assert from 'assert';

console.log('Testing emergencyRouting.js...');

// 1. Destination resolver
const pat = { lat: 22.3072, lng: 73.1812 };
const hosp = { lat: 22.3200, lng: 73.1900, name: 'Sterling Hospital', address: 'Race Course' };

const destA = resolveTripDestination('EN_ROUTE', pat, hosp);
assert.strictEqual(destA.type, 'PATIENT');
assert.strictEqual(destA.isPhaseB, false);
assert.strictEqual(destA.lat, 22.3072);

const destB = resolveTripDestination('PICKED_UP', pat, hosp);
assert.strictEqual(destB.type, 'HOSPITAL');
assert.strictEqual(destB.isPhaseB, true);
assert.strictEqual(destB.name, 'Sterling Hospital');
assert.strictEqual(destB.lat, 22.3200);

// 2. Bearing calculator
// Heading directly North (lat increases, lng constant) -> 0°
const northBearing = calculateBearing(22.0, 73.0, 23.0, 73.0);
assert(Math.abs(northBearing - 0) < 0.1, `Expected ~0, got ${northBearing}`);

// Heading directly East (lat constant, lng increases) -> ~90°
const eastBearing = calculateBearing(22.0, 73.0, 22.0, 74.0);
assert(Math.abs(eastBearing - 90) < 1.0, `Expected ~90, got ${eastBearing}`);

// 3. Point-to-polyline distance
const line = [
  { lat: 22.0, lng: 73.0 },
  { lat: 22.0, lng: 73.01 }, // ~1030 meters East
];
// Point exactly on the line
const distOnLine = pointToPolylineDistanceMeters({ lat: 22.0, lng: 73.005 }, line);
assert(distOnLine < 1.0, `Expected < 1m, got ${distOnLine}`);

// Point 50 meters North
// 1 deg lat ~ 111,133 m, so 50m ~ 0.00045 deg lat
const distOffset = pointToPolylineDistanceMeters({ lat: 22.00045, lng: 73.005 }, line);
assert(Math.abs(distOffset - 50) < 2.0, `Expected ~50m, got ${distOffset}`);

console.log('All emergencyRouting tests PASSED! Arrival threshold:', ARRIVAL_THRESHOLD_METERS, 'Deviation threshold:', DEVIATION_THRESHOLD_METERS);
