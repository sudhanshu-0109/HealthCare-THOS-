/**
 * routes/medicines.routes.js — Expose hospital Medicine catalog for admin/pharmacist.
 *
 * Mirrors labTests.routes.js: self-contained, hospital-scoped, prisma-direct.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import { checkRole } from '../middleware/checkRole.js';
import prisma from '../prisma/client.js';

const router = Router();

router.use(authenticate);

// GET /medicines — list active medicines for a hospital
router.get(
  '/',
  (req, res, next) => {
    if (['HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST'].includes(req.user?.role)) {
      return scopeToHospital(req, res, next);
    }
    next();
  },
  async (req, res) => {
    const where = { isActive: true };
    if (req.hospitalId) where.hospitalId = req.hospitalId;
    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        genericName: true,
        manufacturer: true,
        unit: true,
        price: true,
        stockQuantity: true,
        isActive: true,
        hospitalId: true,
      },
    });
    res.json({ success: true, data: medicines });
  }
);

// GET /medicines/:id
router.get('/:id', async (req, res) => {
  const medicine = await prisma.medicine.findUnique({ where: { id: req.params.id } });
  if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
  res.json({ success: true, data: medicine });
});

// POST /medicines — HOSPITAL_ADMIN creates a medicine
router.post(
  '/',
  checkRole('HOSPITAL_ADMIN'),
  scopeToHospital,
  async (req, res) => {
    const { name, price, unit, genericName, manufacturer, stockQuantity } = req.body;
    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, message: 'name and price are required' });
    }
    const medicine = await prisma.medicine.create({
      data: {
        hospitalId: req.hospitalId,
        name,
        price: parseFloat(price),
        unit: unit || 'unit',
        genericName: genericName || null,
        manufacturer: manufacturer || null,
        stockQuantity: stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ''
          ? parseInt(stockQuantity, 10)
          : 0,
      },
    });
    res.status(201).json({ success: true, data: medicine });
  }
);

// PATCH /medicines/:id/toggle — toggle isActive
router.patch(
  '/:id/toggle',
  checkRole('HOSPITAL_ADMIN'),
  scopeToHospital,
  async (req, res) => {
    const medicine = await prisma.medicine.findFirst({
      where: { id: req.params.id, hospitalId: req.hospitalId },
    });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    const updated = await prisma.medicine.update({
      where: { id: req.params.id },
      data: { isActive: !medicine.isActive },
    });
    res.json({ success: true, data: updated });
  }
);

export default router;
