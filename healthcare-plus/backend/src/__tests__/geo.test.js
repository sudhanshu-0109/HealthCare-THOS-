import { calculateDistance } from '../utils/geo.js';

describe('Geo Utility', () => {
  it('calculates distance between two coordinates correctly', () => {
    // New York (40.7128, -74.0060) to London (51.5074, -0.1278) -> ~5570 km
    const distance = calculateDistance(40.7128, -74.0060, 51.5074, -0.1278);
    expect(distance).toBeGreaterThan(5000);
    expect(distance).toBeLessThan(6000);
  });
});
