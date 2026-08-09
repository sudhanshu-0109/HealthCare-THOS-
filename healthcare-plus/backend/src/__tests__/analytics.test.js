import { describe, it, expect } from '@jest/globals';
import { getDashboardSummary, getAppointmentTrends, getDepartmentUsage, getDoctorActivity, getQueueLoadStats, getEmergencyStats } from '../services/analytics.service.js';

describe('Analytics Service', () => {
  it('exports analytical aggregation queries', () => {
    expect(typeof getDashboardSummary).toBe('function');
    expect(typeof getAppointmentTrends).toBe('function');
    expect(typeof getDepartmentUsage).toBe('function');
    expect(typeof getDoctorActivity).toBe('function');
    expect(typeof getQueueLoadStats).toBe('function');
    expect(typeof getEmergencyStats).toBe('function');
  });
});
