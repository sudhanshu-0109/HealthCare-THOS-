import { describe, it, expect } from '@jest/globals';
import { calculateCrowdStatus } from '../services/hospitalSearch.service.js';

describe('Crowd Status Service', () => {
  it('exports calculateCrowdStatus function', () => {
    expect(typeof calculateCrowdStatus).toBe('function');
  });
});
