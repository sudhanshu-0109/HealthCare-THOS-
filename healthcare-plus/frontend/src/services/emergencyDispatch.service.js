/**
 * frontend/src/services/emergencyDispatch.service.js — Ambulance driver dispatch API calls.
 */
import api from './api';

export const goOnline = (latitude, longitude) => api.post('/driver/go-online', { latitude, longitude });
export const goOffline = () => api.post('/driver/go-offline');
export const updateLocation = (latitude, longitude) => api.post('/driver/location', { latitude, longitude });

export const acceptRequest = (requestId) => api.post(`/driver/requests/${requestId}/accept`);
export const rejectRequest = (requestId) => api.post(`/driver/requests/${requestId}/reject`);

export const markEnRoute = (requestId) => api.post(`/driver/requests/${requestId}/en-route`);
export const markPickedUp = (requestId, destinationHospitalId) => api.post(`/driver/requests/${requestId}/picked-up`, { destinationHospitalId });
export const markArrived = (requestId) => api.post(`/driver/requests/${requestId}/arrived`);

export const getEmergencyStatus = (requestId) => api.get(`/emergency/${requestId}/status`);
