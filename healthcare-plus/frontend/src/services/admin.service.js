import api from './api';

// Hospitals
export const getHospitals = () => api.get('/hospitals');
export const createHospital = (data) => api.post('/hospitals', data);
export const updateHospital = (id, data) => api.put(`/hospitals/${id}`, data);
export const getHospitalProfile = () => api.get('/hospitals/me');
export const updateHospitalProfile = (data) => api.put('/hospitals/me', data);

// Departments
export const getDepartments = (hospitalId) => api.get('/departments', { params: hospitalId ? { hospitalId } : {} });
export const createDepartment = (data) => api.post('/departments', data);

// Doctors
export const getDoctors = (hospitalId, departmentId) => api.get('/doctors', { params: { hospitalId, departmentId } });
export const inviteDoctor = (data) => api.post('/doctors/invite', data);

// Lab Staff
export const getLabStaff = () => api.get('/staff?role=LAB_STAFF');
export const inviteLabStaff = (data) => api.post('/staff/invite', { ...data, role: 'LAB_STAFF' });

// Pharmacy Staff
export const getPharmacyStaff = () => api.get('/staff?role=PHARMACIST');
export const invitePharmacyStaff = (data) => api.post('/staff/invite', { ...data, role: 'PHARMACIST' });

// Ambulance Drivers
export const getDrivers = () => api.get('/staff?role=AMBULANCE_DRIVER');
export const inviteDriver = (data) => api.post('/staff/invite', { ...data, role: 'AMBULANCE_DRIVER' });

// Generic Staff
export const getStaff = (role) => api.get('/staff', { params: role ? { role } : {} });
export const inviteStaff = (data) => api.post('/staff/invite', data);

// Users
export const getUsers = () => api.get('/users');

