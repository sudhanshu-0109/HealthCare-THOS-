import api from './api';

// Hospitals
export const getHospitals = () => api.get('/hospitals');
export const createHospital = (data) => api.post('/hospitals', data);
export const updateHospital = (id, data) => api.put(`/hospitals/${id}`, data);

// Departments
export const getDepartments = (hospitalId) => api.get('/departments', { params: { hospitalId } });
export const createDepartment = (data) => api.post('/departments', data);

// Doctors
export const getDoctors = (hospitalId, departmentId) => api.get('/doctors', { params: { hospitalId, departmentId } });
export const inviteDoctor = (data) => api.post('/doctors/invite', data);

// Staff
export const getStaff = () => api.get('/staff');
export const inviteStaff = (data) => api.post('/staff/invite', data);

// Users
export const getUsers = () => api.get('/users');
