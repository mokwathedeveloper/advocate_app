// API service layer for LegalPro v1.0.1
import axios from 'axios';
import { Case, Appointment, Payment, ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth header interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Cases
  async getCases(params?: any) {
    const response = await api.get('/cases', { params });
    return response.data;
  },

  async getCase(id: string) {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  async createCase(caseData: Partial<Case>) {
    const response = await api.post('/cases', caseData);
    return response.data;
  },

  async updateCase(id: string, caseData: Partial<Case>) {
    const response = await api.put(`/cases/${id}`, caseData);
    return response.data;
  },

  async deleteCase(id: string) {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },

  // Appointments
  async getAppointments(params?: any) {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  async getAppointment(id: string) {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  async createAppointment(appointmentData: Partial<Appointment>) {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  async updateAppointment(id: string, appointmentData: Partial<Appointment>) {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  async cancelAppointment(id: string) {
    const response = await api.patch(`/appointments/${id}/cancel`);
    return response.data;
  },

  // Payments
  async getPayments(params?: any) {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async createPayment(paymentData: Partial<Payment>) {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  async initiateMpesaPayment(appointmentId: string, phoneNumber: string) {
    const response = await api.post('/payments/mpesa/initiate', {
      appointmentId,
      phoneNumber
    });
    return response.data;
  },

  // File uploads
  async uploadFile(file: File, caseId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (caseId) formData.append('caseId', caseId);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Chat
  async getChatMessages(recipientId: string) {
    const response = await api.get(`/chat/messages/${recipientId}`);
    return response.data;
  },

  async sendMessage(messageData: Partial<ChatMessage>) {
    const response = await api.post('/chat/messages', messageData);
    return response.data;
  },

  // Dashboard stats
  async getDashboardStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};