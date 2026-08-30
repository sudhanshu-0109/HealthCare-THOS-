/**
 * frontend/src/services/ambulances.service.js — Fleet management API calls.
 */
import api from './api';

export const registerAmbulance = (data) => api.post('/ambulances', data);
export const getHospitalAmbulances = () => api.get('/ambulances');
export const setAmbulanceStatus = (id, isActive) => api.patch(`/ambulances/${id}/status`, { isActive });
