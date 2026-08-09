/**
 * frontend/src/services/labFulfillment.service.js — Lab Technician fulfillment API calls.
 */
import api from './api';

export const getHospitalLabRequests = (params) =>
  api.get('/lab-fulfillment/hospital', { params });

export const confirmLabRequest = (id, finalItems) =>
  api.post(`/lab-fulfillment/${id}/confirm`, { finalItems });

export const uploadLabReport = (id, data) =>
  api.post(`/lab-fulfillment/${id}/upload-report`, data);

export const getMyLabResults = () =>
  api.get('/lab-fulfillment/patient/results');
