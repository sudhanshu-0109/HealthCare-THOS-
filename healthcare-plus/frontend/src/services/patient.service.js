import api from './api';

export const triageSymptoms = (symptoms) => api.post('/ai/triage', { symptoms });

export const createEmergencyRequest = (data) => api.post('/emergency', data);

export const searchHospitals = (lat, lng, radius) => 
  api.get('/hospitals/search', { params: { lat, lng, radius } });
