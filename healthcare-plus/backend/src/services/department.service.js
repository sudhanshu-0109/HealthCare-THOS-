import prisma from '../prisma/client.js';

export const getDepartments = async (hospitalId) => {
  return prisma.department.findMany({
    where: { hospitalId, isActive: true },
    include: {
      _count: { select: { doctors: { where: { isActive: true } } } },
    },
    orderBy: { name: 'asc' },
  });
};


export const createDepartment = async (hospitalId, data, creatorUserId) => {
  const dept = await prisma.department.create({
    data: { ...data, hospitalId },
  });

  // Phase 14: Audit log
  try {
    const { recordAction } = await import('./auditLog.service.js');
    await recordAction(hospitalId, creatorUserId, 'DEPARTMENT_CHANGED', 'Department', dept.id, { action: 'CREATE', name: dept.name });
  } catch (auditErr) {
    console.warn('[Department] Failed to write audit log:', auditErr.message);
  }

  return dept;
};

export const updateDepartment = async (hospitalId, departmentId, data, actorUserId) => {
  const dept = await prisma.department.update({
    where: { id: departmentId },
    data,
  });

  // Phase 14: Audit log
  try {
    const { recordAction } = await import('./auditLog.service.js');
    await recordAction(hospitalId, actorUserId, 'DEPARTMENT_CHANGED', 'Department', departmentId, { action: 'UPDATE', changes: data });
  } catch (auditErr) {
    console.warn('[Department] Failed to write audit log:', auditErr.message);
  }

  return dept;
};
