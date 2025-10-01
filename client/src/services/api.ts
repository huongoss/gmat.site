import axios from 'axios';

// Determine API base URL:
// 1. Use explicit VITE_API_BASE_URL if provided.
// 2. Else if running in browser and same-origin deployment, use window.location.origin + '/api'.
// 3. Fallback to localhost:8080 for local dev.
const explicit = (import.meta as any).env?.VITE_API_BASE_URL;
const sameOrigin = typeof window !== 'undefined' ? `${window.location.origin}/api` : undefined;
const API_BASE_URL = explicit || sameOrigin || 'http://localhost:8080/api';

// Create axios instance so we can set auth header globally
const api = axios.create({
    baseURL: API_BASE_URL,
});

export const getApiBaseUrl = () => API_BASE_URL;

export const setAuthToken = (token?: string) => {
    if (!token) {
        delete api.defaults.headers.common['Authorization'];
        return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const getProfile = async () => {
    const res = await api.get('/auth/me');
    return res.data;
};

export const registerUser = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const loginUser = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const fetchQuestions = async () => {
    const response = await api.get('/tests/questions');
    return response.data;
};

export const submitResults = async (resultData: any) => {
    const response = await api.post('/results', resultData);
    return response.data;
};

export const fetchUserResults = async (userId: string) => {
    const response = await api.get(`/results/${userId}`);
    return response.data;
};

// Payments / subscription helpers (backend endpoints must exist or return 501)
export const createCheckoutSession = async (payload: { userId: string }) => {
    const res = await api.post('/payments/checkout-session', payload);
    return res.data;
};

export const createBillingPortalSession = async (payload: { returnUrl: string }) => {
    const res = await api.post('/payments/billing-portal', payload);
    return res.data;
};

export const cancelSubscription = async () => {
    const res = await api.post('/payments/cancel');
    return res.data;
};

export const getPricing = async () => {
    const res = await api.get('/payments/pricing');
    return res.data;
};

export const resendVerificationEmail = async (email: string) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
};

// Support contact submission
export const postSupportContact = async (payload: { name: string; email: string; message: string }) => {
    const res = await api.post('/support/contact', payload);
    return res.data;
};

// Password reset flows
export const requestPasswordReset = async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
};

export const resetPassword = async (token: string, password: string) => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
};

export const verifyEmail = async (token: string) => {
    const res = await api.post('/auth/verify-email', { token });
    return res.data;
};

// Daily practice endpoints
export const getDailyQuestions = async () => {
    const res = await api.get('/tests/daily');
    return res.data;
};

export const submitDailyAnswers = async (answers: Record<string, string>) => {
    const res = await api.post('/tests/daily/submit', { answers });
    return res.data;
};

export const getUserProgress = async () => {
    const res = await api.get('/tests/daily/progress');
    return res.data;
};

// Local-only helper to fetch demo questions from public folder
export const fetchDemoQuestions = async (): Promise<Array<{ id: number; question: string; options: { id: string; text: string }[]; answer: string }>> => {
    const res = await fetch('/data/demo-questions.json');
    const json = await res.json();
    return json.questions;
};