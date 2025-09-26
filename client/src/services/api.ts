import axios from 'axios';

// Prefer env override; fall back to local dev server on 8080
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Single axios instance so auth header applies everywhere
const api = axios.create({ baseURL: API_BASE_URL });

// Set or clear the Authorization header
export const setAuthToken = (token?: string) => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
};

// Auth
export const registerUser = async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const loginUser = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const getProfile = async () => {
    const { data } = await api.get('/auth/me');
    return data;
};

// Tests / Results
export const fetchQuestions = async () => {
    const { data } = await api.get('/tests/questions');
    return data;
};

export const submitResults = async (resultData: any) => {
    const { data } = await api.post('/results', resultData);
    return data;
};

export const fetchUserResults = async (userId: string) => {
    const { data } = await api.get(`/results/${userId}`);
    return data;
};

// Local-only helper to fetch demo questions from public folder
export const fetchDemoQuestions = async (): Promise<Array<{ id: number; question: string; options: { id: string; text: string }[]; answer: string }>> => {
    const res = await fetch('/data/demo-questions.json');
    const json = await res.json();
    return json.questions;
};

// Payments
export const createCheckoutSession = async (body: { userId?: string; successUrl?: string; cancelUrl?: string }) => {
    const { data } = await api.post('/payments/checkout-session', body);
    return data as { url: string };
};

export const createBillingPortalSession = async (body?: { returnUrl?: string }) => {
    const { data } = await api.post('/payments/portal', body || {});
    return data as { url: string };
};

export const cancelSubscription = async () => {
    const { data } = await api.post('/payments/cancel');
    return data as { message?: string; status?: string; current_period_end?: string };
};

export const getPricing = async () => {
    const { data } = await api.get('/payments/pricing');
    return data as { amount: number; currency: string; interval: string; priceId: string };
};

// Email verification
export const resendVerificationEmail = async (email: string) => {
  const { data } = await api.post('/auth/resend-verification', { email });
  return data as { message: string };
};

export const verifyEmail = async (token: string) => {
  const { data } = await api.post('/auth/verify-email', { token });
  return data as { message: string };
};// Daily practice APIs
export const getDailyQuestions = async () => {
    const { data } = await api.get('/tests/daily');
    return data as {
        plan: 'free' | 'pro';
        next_allocation_in_hours: number;
        questions: Array<{ id: string; question: string; options: { id: string; text: string }[] }>;
    };
};

export const submitAnswers = async (body: { userId: string; answers: Record<string, string> }) => {
    const { data } = await api.post('/tests/daily/submit', body);
    return data as { score: number };
};