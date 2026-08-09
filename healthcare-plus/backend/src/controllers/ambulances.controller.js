/**
 * controllers/ambulances.controller.js — Phase 13: Ambulance fleet management.
 */
import * as ambulancesService from '../services/ambulances.service.js';

export const registerAmbulance = async (req, res) => {
  const { driverId, vehicleNumber } = req.body;
  const ambulance = await ambulancesService.registerAmbulance(req.hospitalId, { driverId, vehicleNumber });
  res.status(201).json({ success: true, data: ambulance });
};

export const getHospitalAmbulances = async (req, res) => {
  const ambulances = await ambulancesService.getHospitalAmbulances(req.hospitalId);
  res.json({ success: true, data: ambulances });
};

export const setStatus = async (req, res) => {
  const { isActive } = req.body;
  const ambulance = await ambulancesService.setAmbulanceStatus(req.params.id, isActive, req.hospitalId);
  res.json({ success: true, data: ambulance });
};
