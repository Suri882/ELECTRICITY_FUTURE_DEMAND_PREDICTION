import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// High-level API Service Modules
export const energyApi = {
  // Weather
  getWeather: (manualTemp = null) =>
    api.get('/weather/current', { params: manualTemp !== null ? { manual_temp: manualTemp } : {} }),
  getWeatherAnalysis: () => api.get('/weather/analysis'),

  // Demand Prediction
  getPredictions: () => api.get('/predictions'),
  getLatestPrediction: () => api.get('/predictions/latest'),
  generatePrediction: (payload) => api.post('/predictions', payload),

  // Peak Demand
  getPeakDemand: () => api.get('/peak-demand'),
  updateThresholds: (payload) => api.put('/peak-demand/thresholds', payload),

  // Billing Estimator
  getBillingEstimates: () => api.get('/billing/estimate'),
  calculateCustomBill: (payload) => api.post('/billing/calculate', payload),
  updateTariffs: (payload) => api.put('/billing/tariffs', payload),

  // What-If Simulator (Signature Feature)
  runSimulation: (payload) => api.post('/simulator/simulate', payload),
  saveScenario: (payload) => api.post('/simulator/save', payload),
  getSavedScenarios: () => api.get('/simulator/history'),
  deleteScenario: (id) => api.delete(`/simulator/${id}`),

  // Carbon Intelligence
  getCarbonSummary: () => api.get('/carbon/summary'),
  updateEmissionFactor: (payload) => api.put('/carbon/emission-factor', payload),

  // Demo Data
  getDemoStatus: () => api.get('/demo/status'),
  loadDemoData: () => api.post('/demo/load'),
  clearDemoData: () => api.post('/demo/clear'),

  // Recommendations
  getRecommendations: () => api.get('/recommendations'),
  refreshRecommendations: () => api.post('/recommendations/refresh'),

  // Profile & Settings
  getUserProfile: () => api.get('/users/profile'),
  updateUserProfile: (payload) => api.put('/users/profile', payload),

  // ElectroWise Energy Planning Studio
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (payload) => api.post('/projects', payload),
  updateProject: (id, payload) => api.put(`/projects/${id}`, payload),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  duplicateProject: (id) => api.post(`/projects/${id}/duplicate`),
  getFacilityCatalog: () => api.get('/projects/catalog'),
  getBenchmarkEquipment: (category) => api.get(`/projects/catalog/benchmark-equipment/${category}`),
  getDiscoms: () => api.get('/projects/tariffs/discoms'),
  getDiscomRates: (discom, cat) => api.get(`/projects/tariffs/discoms/${discom}/${cat}`),
  addScenario: (projectId, payload) => api.post(`/projects/${projectId}/scenarios`, payload),
  duplicateScenario: (scenarioId) => api.post(`/projects/scenarios/${scenarioId}/duplicate`),
  deleteScenario: (scenarioId) => api.delete(`/projects/scenarios/${scenarioId}`),
  addEquipment: (scenarioId, payload) => api.post(`/projects/scenarios/${scenarioId}/equipment`, payload),
  updateEquipment: (itemId, payload) => api.put(`/projects/equipment/${itemId}`, payload),
  deleteEquipment: (itemId) => api.delete(`/projects/equipment/${itemId}`),
  duplicateEquipment: (itemId) => api.post(`/projects/equipment/${itemId}/duplicate`),
  addConstructionItem: (projectId, payload) => api.post(`/projects/${projectId}/construction`, payload),
  deleteConstructionItem: (itemId) => api.delete(`/projects/construction/${itemId}`),
  calculateProject: (projectId, payload = {}) => api.post(`/projects/${projectId}/calculate`, payload),
  predictConstructionDemand: (payload) => api.post('/projects/predict-demand', payload),
  downloadPdfReport: (projectId) => api.post(`/projects/${projectId}/report/pdf`, {}, { responseType: 'blob' }),
  exportEquipmentCsv: (projectId) => api.get(`/projects/${projectId}/export/csv`, { responseType: 'blob' }),
  seedDemoProjects: () => api.post('/projects/demo/seed'),
  clearDemoProjects: () => api.post('/projects/demo/clear'),
};

export default api;
