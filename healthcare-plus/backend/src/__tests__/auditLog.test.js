import { describe, it, expect } from '@jest/globals';
import { recordAction, getAuditLog } from '../services/auditLog.service.js';

describe('Audit Log Service', () => {
  it('exports recordAction and getAuditLog functions', () => {
    expect(typeof recordAction).toBe('function');
    expect(typeof getAuditLog).toBe('function');
  });
});
