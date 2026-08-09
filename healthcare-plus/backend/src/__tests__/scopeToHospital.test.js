import { jest } from '@jest/globals';
import { scopeToHospital } from '../middleware/scopeToHospital.js';

describe('scopeToHospital middleware', () => {
  it('allows access if user has hospitalId', () => {
    const req = { user: { role: 'HOSPITAL_ADMIN', hospitalId: 'hosp-123' } };
    const res = {};
    const next = jest.fn();

    scopeToHospital(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.hospitalId).toBe('hosp-123');
  });

  it('denies access if staff has no hospitalId', () => {
    const req = { user: { role: 'HOSPITAL_ADMIN' } };
    const res = {};
    const next = jest.fn();

    scopeToHospital(req, res, next);
    expect(next).toHaveBeenCalled();
    const errArg = next.mock.calls[0][0];
    expect(errArg.statusCode).toBe(403);
    expect(errArg.message).toBe('Your account is not linked to any specific hospital.');
  });

  it('allows SUPER_ADMIN to bypass and does not attach hospitalId', () => {
    const req = { user: { role: 'SUPER_ADMIN' } };
    const res = {};
    const next = jest.fn();

    scopeToHospital(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.hospitalId).toBeNull();
  });
});
