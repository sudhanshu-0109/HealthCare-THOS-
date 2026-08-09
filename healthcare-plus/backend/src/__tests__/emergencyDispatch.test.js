import { describe, it, expect } from '@jest/globals';
import { dispatchRequest, acceptRequest, rejectRequest, checkAndApplyFallback } from '../services/emergencyDispatch.service.js';

describe('Emergency Dispatch Service', () => {
  it('exports emergency dispatch handlers', () => {
    expect(typeof dispatchRequest).toBe('function');
    expect(typeof acceptRequest).toBe('function');
    expect(typeof rejectRequest).toBe('function');
    expect(typeof checkAndApplyFallback).toBe('function');
  });
});
