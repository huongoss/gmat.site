import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const setAuthToken = (token?: string) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const registerUser = async (userData: any) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
  return response.data;
};

export const loginUser = async (credentials: any) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  return response.data as { token: string };
};

export const getProfile = async () => {
  const response = await axios.get(`${API_BASE_URL}/auth/me`);
  return response.data;
};

// Email verification endpoints
export const verifyEmail = async (token: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
  return response.data;
};

export const resendVerificationEmail = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, newPassword });
  return response.data;
};

export const fetchQuestions = async () => {
  const response = await axios.get(`${API_BASE_URL}/tests/questions`);
  return response.data;
};

export const submitResults = async (resultData: any) => {
  const response = await axios.post(`${API_BASE_URL}/results`, resultData);
  return response.data;
};

export const fetchUserResults = async (userId: string) => {
  const response = await axios.get(`${API_BASE_URL}/results/${userId}`);
  return response.data;
};

// Stripe subscription helpers
export const createCheckoutSession = async (payload: { userId: string; successUrl?: string; cancelUrl?: string }) => {
  const response = await axios.post(`${API_BASE_URL}/payments/checkout-session`, payload);
  return response.data as { url: string };
};

export const createBillingPortalSession = async (payload: { customerId: string; returnUrl?: string }) => {
  const response = await axios.post(`${API_BASE_URL}/payments/portal`, payload);
  return response.data as { url: string };
};

// Local-only helper to fetch demo questions from public folder
export const fetchDemoQuestions = async (): Promise<Array<{ id: number; question: string; options: { id: string; text: string }[]; answer: string }>> => {
  const res = await fetch('/data/demo-questions.json');
  const json = await res.json();
  return json.questions;
};