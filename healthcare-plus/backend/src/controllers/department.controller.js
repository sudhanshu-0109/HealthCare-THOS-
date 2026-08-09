import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as departmentService from '../services/department.service.js';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

export const getDepartments = asyncHandler(async (req, res) => {
  // Can be requested publicly via query param or implicitly via scoped token
  const hospitalId = req.query.hospitalId || req.hospitalId; 
  if (!hospitalId) {
    return res.status(400).json({ success: false, message: 'hospitalId is required' });
  }
  const departments = await departmentService.getDepartments(hospitalId);
  res.status(200).json({ success: true, data: departments });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.hospitalId, req.body);
  res.status(201).json({ success: true, data: department });
});
