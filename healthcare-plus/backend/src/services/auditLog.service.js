/**
 * services/auditLog.service.js — Audit log for hospital admin actions (Phase 14).
 * All mutations performed by hospital staff are recorded here.
 * This module is imported lazily by other services to avoid circular dependencies.
 */

import prisma from '../prisma/client.js';

/**
 * Record an audit log entry.
 * @param {string} hospitalId
 * @param {string} actorUserId
 * @param {string} action — e.g. 'DOCTOR_ADDED', 'QUEUE_OVERRIDDEN', 'DEPARTMENT_CHANGED'
 * @param {string} targetType — e.g. 'Doctor', 'QueueToken', 'Department'
 * @param {string|null} targetId
 * @param {object|null} metadata — arbitrary before/after payload
 */
export const recordAction = async (hospitalId, actorUserId, action, targetType, targetId = null, metadata = null) => {
  try {
    return await prisma.auditLog.create({
      data: {
        hospitalId,
        actorUserId,
        action,
        targetType,
        targetId: targetId || null,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    // Never crash the calling flow due to audit failure
    console.warn(`[AuditLog] Failed to record action ${action}:`, err.message);
    return null;
  }
};

/**
 * Get paginated audit log for a hospital.
 * @param {string} hospitalId
 * @param {{ action?, actorUserId?, from?, to?, page?, limit? }} options
 */
export const getAuditLog = async (hospitalId, { action, actorUserId, from, to, page = 1, limit = 50 } = {}) => {
  const where = {
    hospitalId,
    ...(action && { action }),
    ...(actorUserId && { actorUserId }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit };
};
