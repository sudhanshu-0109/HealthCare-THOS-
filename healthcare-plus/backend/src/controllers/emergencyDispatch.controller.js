/**
 * controllers/emergencyDispatch.controller.js — Phase 13: Driver dispatch actions.
 */
import * as dispatchService from '../services/emergencyDispatch.service.js';
import * as ambulancesService from '../services/ambulances.service.js';

export const goOnline = async (req, res) => {
  const { latitude, longitude } = req.body;
  const ambulance = await ambulancesService.goOnline(req.user.id, { latitude, longitude });
  res.json({ success: true, data: ambulance });
};

export const getDriverState = async (req, res) => {
  const state = await dispatchService.getDriverState(req.user.id);
  res.json({ success: true, data: state });
};

export const goOffline = async (req, res) => {
  const ambulance = await ambulancesService.goOffline(req.user.id);
  res.json({ success: true, data: ambulance });
};

export const updateLocation = async (req, res) => {
  const { latitude, longitude, heading, speed } = req.body;
  const ambulance = await dispatchService.updateDriverLocation(req.user.id, { latitude, longitude, heading, speed });
  res.json({ success: true, data: ambulance });
};

export const acceptRequest = async (req, res) => {
  const result = await dispatchService.acceptRequest(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};

export const rejectRequest = async (req, res) => {
  const result = await dispatchService.rejectRequest(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};

export const markEnRoute = async (req, res) => {
  const result = await dispatchService.markEnRoute(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};

export const markReachedPatient = async (req, res) => {
  const result = await dispatchService.markReachedPatient(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};

export const markPickedUp = async (req, res) => {
  const { destinationHospitalId } = req.body;
  const result = await dispatchService.markPickedUp(req.params.id, req.user.id, { destinationHospitalId });
  res.json({ success: true, data: result });
};

export const markArrived = async (req, res) => {
  const result = await dispatchService.markArrived(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};

export const getRequestStatus = async (req, res) => {
  const result = await dispatchService.getEmergencyRequestStatus(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};
