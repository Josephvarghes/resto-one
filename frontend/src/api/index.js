import axios from 'axios';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthStore } from '../store/useAuthStore';

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const sessionToken = useSessionStore.getState().sessionToken;
  if (sessionToken) {
    config.headers['X-Session-Token'] = sessionToken;
  }

  const staffToken = useAuthStore.getState().token;
  if (staffToken) {
    config.headers['Authorization'] = `Bearer ${staffToken}`;
  }

  return config;
});

// Auth API
export const authApi = {
  login: (name, password) => api.post('/auth/login', { name, password }),
  getMe: () => api.get('/auth/me'),
};

// Guest API
export const guestApi = {
  createSession: (tableNo) => api.post('/session', { table_no: tableNo }),
  getDishes: (category = null) => api.get('/dishes', { params: category ? { category } : {} }),
  placeOrder: (items, tableNo = null) => api.post('/orders', { items, table_no: tableNo }),
  getOrderHistory: () => api.get('/orders/history'),
  callWaiter: (tableNo) => api.post('/waiter-call', { table_no: tableNo }),
};

// Chat API (AI Concierge)
export const chatApi = {
  sendMessage: (message) => api.post('/chat/message', { message }),
  getHistory: () => api.get('/chat/history'),
};

// Waiter API
export const waiterApi = {
  getCalls: () => api.get('/waiter/calls'),
  ackCall: (id) => api.post(`/waiter/calls/${id}/ack`),
  placeOrder: (items, tableNo) => api.post('/waiter/orders', { items, table_no: tableNo }),
  getOrders: () => api.get('/waiter/orders'),
};

// Kitchen API
export const kitchenApi = {
  getQueue: () => api.get('/kitchen/queue'),
  acceptOrder: (id) => api.post(`/kitchen/orders/${id}/accept`),
  doneOrder: (id) => api.post(`/kitchen/orders/${id}/done`),
  delayOrder: (id, minutes, reason) => api.post(`/kitchen/orders/${id}/delay`, { minutes, reason }),
};

// Billing API
export const billingApi = {
  getOrders: (paid = false) => api.get('/billing/orders', { params: { paid } }),
  updateStatus: (id, status) => api.post(`/billing/orders/${id}/status`, { status }),
};

// Admin API
export const adminApi = {
  getAnalytics: (range = 'daily') => api.get('/admin/analytics', { params: { range } }),
  getInsights: (force = false) => api.get('/admin/insights', { params: { force } }),
};
