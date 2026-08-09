/**
 * controllers/auditLog.controller.js — Phase 14: Hospital audit log controller.
 */
import * as auditLogService from '../services/auditLog.service.js';

export const getAuditLog = async (req, res) => {
  const { action, actorUserId, from, to, page, limit } = req.query;
  const result = await auditLogService.getAuditLog(req.hospitalId, {
    action,
    actorUserId,
    from,
    to,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 50,
  });
  res.json({ success: true, data: result });
};
