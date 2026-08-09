/**
 * controllers/dashboard.controller.js — Patient dashboard summary (Phase 7).
 */

import { getPatientDashboardSummary } from '../services/dashboard.service.js';

export const getSummary = async (req, res) => {
  const data = await getPatientDashboardSummary(req.user.id);
  res.json({ success: true, data });
};
