import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

API.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ── Health ──────────────────────────────────────────────────────────────────
export const checkHealth = () => API.get('/health');

// ── Assessments ─────────────────────────────────────────────────────────────
export const getAssessments    = (orgId)  => API.get(`/assessments/organization/${orgId}`);
export const getAssessment     = (id)     => API.get(`/assessments/${id}`);
export const createAssessment  = (data)   => API.post('/assessments', data);
export const updateAssessment  = (id, d)  => API.put(`/assessments/${id}`, d);

// ── Projects ─────────────────────────────────────────────────────────────────
export const getProjects    = (orgId) => API.get(`/projects/organization/${orgId}`);
export const getProject     = (id)    => API.get(`/projects/${id}`);
export const createProject  = (data)  => API.post('/projects', data);
export const updateProject  = (id, d) => API.put(`/projects/${id}`, d);
export const createWave     = (id, d) => API.post(`/projects/${id}/waves`, d);
export const addApplication = (id, d) => API.post(`/projects/${id}/applications`, d);

// ── Recommendations ──────────────────────────────────────────────────────────
export const getRecommendations   = (assessId) => API.get(`/recommendations/assessment/${assessId}`);
export const createRecommendation = (data)     => API.post('/recommendations', data);

export default API;
