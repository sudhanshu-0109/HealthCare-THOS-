/**
 * controllers/analytics.controller.js — Phase 14: Hospital analytics controller.
 */
import * as analyticsService from '../services/analytics.service.js';

export const getDashboardSummary = async (req, res) => {
  const summary = await analyticsService.getDashboardSummary(req.hospitalId);
  res.json({ success: true, data: summary });
};

export const getAppointmentTrends = async (req, res) => {
  const { period, from, to } = req.query;
  const trends = await analyticsService.getAppointmentTrends(req.hospitalId, { period, from, to });
  res.json({ success: true, data: trends });
};

export const getDepartmentUsage = async (req, res) => {
  const { from, to } = req.query;
  const usage = await analyticsService.getDepartmentUsage(req.hospitalId, { from, to });
  res.json({ success: true, data: usage });
};

export const getDoctorActivity = async (req, res) => {
  const { from, to } = req.query;
  const activity = await analyticsService.getDoctorActivity(req.hospitalId, { from, to });
  res.json({ success: true, data: activity });
};

export const getQueueLoadStats = async (req, res) => {
  const { from, to } = req.query;
  const stats = await analyticsService.getQueueLoadStats(req.hospitalId, { from, to });
  res.json({ success: true, data: stats });
};

export const getEmergencyStats = async (req, res) => {
  const { from, to } = req.query;
  const stats = await analyticsService.getEmergencyStats(req.hospitalId, { from, to });
  res.json({ success: true, data: stats });
};
