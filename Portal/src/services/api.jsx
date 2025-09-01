import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const initiateVoting = (studentId) => {
  return api.post('/auth/initiate', { studentId });
};

export const verifyToken = (token) => {
  return api.get(`/auth/verify-token/${token}`);
};

export const getCandidates = () => {
  return api.get('/candidates');
};

export const submitVote = (voteData) => {
  return api.post('/votes', voteData);
};

export const getResults = () => {
  return api.get('/results');
};

export default api;