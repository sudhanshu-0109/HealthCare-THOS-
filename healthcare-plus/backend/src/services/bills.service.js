/**
 * services/bills.service.js — Patient billing history and hospital revenue (Phase 12).
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';

const BILL_SELECT = {
  id: true,
  sourceType: true,
  sourceId: true,
  subtotal: true,
  discount: true,
  tax: true,
  total: true,
  status: true,
  createdAt: true,
  hospitalId: true,
  items: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
    },
  },
  payments: {
    select: {
      id: true,
      status: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      amount: true,
      createdAt: true,
    },
  },
  hospital: { select: { name: true } },
};

/**
 * Get a patient's bills, optionally filtered by status and/or sourceType.
 */
export const getMyBills = async (patientId, { status, sourceType, page = 1, limit = 20 } = {}) => {
  const where = {
    patientId,
    ...(status && { status }),
    ...(sourceType && { sourceType }),
  };

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      select: BILL_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bill.count({ where }),
  ]);

  return { bills, total, page, limit };
};

/**
 * Get a single bill by ID.
 * Patients can only see their own; hospital admins can see any bill in their hospital.
 */
export const getBillById = async (billId, requesterId, requesterRole, requesterHospitalId) => {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    select: BILL_SELECT,
  });

  if (!bill) throw ApiError.notFound('Bill not found.');

  if (requesterRole === 'PATIENT' && bill.patientId !== requesterId) {
    throw ApiError.forbidden('You can only view your own bills.');
  }
  if (requesterRole === 'HOSPITAL_ADMIN' && bill.hospitalId !== requesterHospitalId) {
    throw ApiError.forbidden('Bill does not belong to your hospital.');
  }

  return bill;
};

/**
 * Get full receipt for a bill (patient owner-only).
 */
export const getBillReceipt = async (billId, patientId) => {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    select: {
      ...BILL_SELECT,
      patient: { select: { fullName: true, email: true } },
    },
  });

  if (!bill) throw ApiError.notFound('Bill not found.');
  if (bill.patientId !== patientId) throw ApiError.forbidden('Not your bill.');

  return bill;
};

/**
 * Hospital revenue aggregation.
 * Returns total by sourceType, and optionally grouped by day.
 *
 * @param {string} hospitalId
 * @param {{ from?: string, to?: string, groupBy?: 'sourceType' | 'day' }} options
 */
export const getHospitalRevenue = async (hospitalId, { from, to, groupBy = 'sourceType' } = {}) => {
  const where = {
    hospitalId,
    status: 'PAID',
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  // Total revenue
  const totalAgg = await prisma.bill.aggregate({
    where,
    _sum: { total: true },
  });

  // Breakdown by sourceType
  const bySourceType = await prisma.bill.groupBy({
    by: ['sourceType'],
    where,
    _sum: { total: true },
    _count: true,
  });

  const breakdown = {
    APPOINTMENT: { total: 0, count: 0 },
    PHARMACY_ORDER: { total: 0, count: 0 },
    LAB_REQUEST: { total: 0, count: 0 },
  };

  for (const row of bySourceType) {
    breakdown[row.sourceType] = {
      total: Number(row._sum.total ?? 0),
      count: row._count,
    };
  }

  return {
    total: Number(totalAgg._sum.total ?? 0),
    breakdown,
    from: from || null,
    to: to || null,
  };
};
