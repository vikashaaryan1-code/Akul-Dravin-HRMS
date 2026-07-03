import axios from 'axios';

import { Platform } from 'react-native';

// Map this to your local network IP (e.g., http://192.168.1.100:3000) when testing on a physical device
// Using Next.js dev server or directly hitting NestJS API gateway
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4001/api/v1' : 'http://localhost:4001/api/v1'; 
const API_URL = API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const attendanceService = {
  punchIn: async (lat?: number, lng?: number, location?: string) => {
    return apiClient.post('/attendance/punch-in', {
      lat,
      lng,
      geoLocation: location,
      source: 'MOBILE_APP'
    });
  },
  punchOut: async () => {
    return apiClient.post('/attendance/punch-out', {});
  },
};

export const authService = {
  login: async (email: string, password: string) => {
    return apiClient.post('/auth/login', { email, password });
  }
};

export const timesheetService = {
  submitLog: async (project: string, hours: number, notes: string, date: string) => {
    return apiClient.post('/timesheets/mobile/submit', { project, hours, notes, date });
  }
};

export const documentService = {
  getMyDocuments: async () => {
    return apiClient.get('/documents');
  }
};
