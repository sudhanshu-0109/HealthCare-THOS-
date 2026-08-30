import api from './api.js';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Override the default application/json header so axios/browser handles it as multipart
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data; // { success: true, data: { url, filename, mimetype, size } }
};
