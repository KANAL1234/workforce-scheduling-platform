/**
 * API Service - Centralized API calls for the frontend
 * All backend communication goes through this file
 */

import axios from 'axios';

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTHENTICATION
// ============================================

export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/me', data),
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return Promise.resolve();
    },
};

// ============================================
// STUDENTS
// ============================================

export const studentsAPI = {
    list: (params) => api.get('/students/', { params }),
    get: (studentId) => api.get(`/students/${studentId}`),
    update: (studentId, data) => api.put(`/students/${studentId}`, data),
    delete: (studentId) => api.delete(`/students/${studentId}`),
    getStats: (studentId, semester) => api.get(`/students/${studentId}/stats`, { params: { semester } }),
};

// ============================================
// SHIFTS
// ============================================

export const shiftsAPI = {
    list: (params) => api.get('/shifts/', { params }),
    get: (shiftId) => api.get(`/shifts/${shiftId}`),
    create: (data) => api.post('/shifts/', data),
    update: (shiftId, data) => api.put(`/shifts/${shiftId}`, data),
    delete: (shiftId) => api.delete(`/shifts/${shiftId}`),
    getWeeklyGrid: () => api.get('/shifts/weekly-grid'),
    toggleActive: (shiftId) => api.patch(`/shifts/${shiftId}/toggle-active`),
};

// ============================================
// AVAILABILITY
// ============================================

export const availabilityAPI = {
    // Student Preferences
    createPreferences: (data) => api.post('/availability/preferences', data),
    getPreferences: (semester) => api.get(`/availability/preferences/${semester}`),

    // Availability
    create: (data) => api.post('/availability/', data),
    bulkCreate: (data) => api.post('/availability/bulk', data),

    // Enhanced submission (new!)
    submitEnhanced: (data) => api.post('/availability/submit-enhanced', data),

    getMyAvailability: (semester) => api.get(`/availability/my-availability/${semester}`),
    getStudentAvailability: (studentId, semester) => api.get(`/availability/student/${studentId}/${semester}`),
    delete: (availabilityId) => api.delete(`/availability/${availabilityId}`),

    // Admin
    getSummary: (semester) => api.get(`/availability/summary/${semester}`),
};

// ============================================
// SCHEDULES (for future use)
// ============================================

export const schedulesAPI = {
    list: (params) => api.get('/schedules/', { params }),
    get: (scheduleId) => api.get(`/schedules/${scheduleId}`),
    create: (data) => api.post('/schedules/', data),
    update: (scheduleId, data) => api.put(`/schedules/${scheduleId}`, data),
    delete: (scheduleId) => api.delete(`/schedules/${scheduleId}`),
    generate: (semester) => api.post('/schedules/generate', { semester }),
    publish: (scheduleId) => api.post(`/schedules/${scheduleId}/publish`),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const saveToken = (token) => {
    localStorage.setItem('access_token', token);
};

export const getToken = () => {
    return localStorage.getItem('access_token');
};

export const saveUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
    return !!getToken();
};

export const getUserRole = () => {
    const user = getUser();
    return user?.role || null;
};

export default api;
