/**
 * routes/labTests.routes.js — Expose hospital LabTestCatalog for doctors/patients.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import { checkRole } from '../middleware/checkRole.js';
import prisma from '../prisma/client.js';

const router = Router();

router.use(authenticate);

// GET /lab-tests — list active tests for a hospital
router.get(
  '/',
  (req, res, next) => {
    if (['HOSPITAL_ADMIN', 'DOCTOR', 'LAB_STAFF'].includes(req.user?.role)) {
      return scopeToHospital(req, res, next);
    }
    next();
  },
  async (req, res) => {
    const where = { isActive: true };
    if (req.hospitalId) where.hospitalId = req.hospitalId;
    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;

    const tests = await prisma.labTestCatalog.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, price: true, sampleType: true, hospitalId: true },
    });
    res.json({ success: true, data: tests });
  }
);

// GET /lab-tests/:id
router.get('/:id', async (req, res) => {
  const test = await prisma.labTestCatalog.findUnique({ where: { id: req.params.id } });
  if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
  res.json({ success: true, data: test });
});

// POST /lab-tests — HOSPITAL_ADMIN creates test
router.post(
  '/',
  checkRole('HOSPITAL_ADMIN'),
  scopeToHospital,
  async (req, res) => {
    const { name, price, sampleType } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'name and price are required' });
    const test = await prisma.labTestCatalog.create({
      data: { hospitalId: req.hospitalId, name, price: parseFloat(price), sampleType: sampleType || null },
    });
    res.status(201).json({ success: true, data: test });
  }
);

// PATCH /lab-tests/:id/toggle — toggle isActive
router.patch(
  '/:id/toggle',
  checkRole('HOSPITAL_ADMIN'),
  scopeToHospital,
  async (req, res) => {
    const test = await prisma.labTestCatalog.findFirst({
      where: { id: req.params.id, hospitalId: req.hospitalId },
    });
    if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
    const updated = await prisma.labTestCatalog.update({
      where: { id: req.params.id },
      data: { isActive: !test.isActive },
    });
    res.json({ success: true, data: updated });
  }
);

export default router;
