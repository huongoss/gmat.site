import axios from 'axios';
import { encryptPassword } from '../utils/crypto';

// Determine API base URL:
// Priority for base URL:
// 1. Explicit VITE_API_BASE_URL always wins.
// 2. In production (served from same origin), use window.location.origin + '/api'.
// 3. In Vite dev (port 5173), force backend at http://localhost:8080/api to guarantee hitting server logs.
const explicit = (import.meta as any).env?.VITE_API_BASE_URL;
let API_BASE_URL: string;
if (explicit) {
    API_BASE_URL = explicit;
} else if (typeof window !== 'undefined') {
    const isDev = window.location.port === '5173';
    API_BASE_URL = isDev ? 'http://localhost:8080/api' : `${window.location.origin}/api`;
} else {
    API_BASE_URL = 'http://localhost:8080/api';
}

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

export const registerUser = async (userData: { email: string; password: string; username?: string; recaptchaToken?: string }) => {
    const passwordEnc = await encryptPassword(userData.password);
    const headers = userData.recaptchaToken ? { 'x-recaptcha-token': userData.recaptchaToken } : undefined;
    const response = await api.post('/auth/register', { email: userData.email, username: userData.username, passwordEnc }, { headers });
    return response.data;
};

export const loginUser = async (credentials: { email: string; password: string; recaptchaToken?: string }) => {
    const passwordEnc = await encryptPassword(credentials.password);
    const headers = credentials.recaptchaToken ? { 'x-recaptcha-token': credentials.recaptchaToken } : undefined;
    const response = await api.post('/auth/login', { email: credentials.email, passwordEnc }, { headers });
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

export const fetchLiveSubscription = async () => {
    const res = await api.get('/payments/subscription/live');
    return res.data;
};

export const verifyCheckoutSession = async (sessionId: string) => {
    const res = await api.get(`/payments/checkout-session/${sessionId}`);
    return res.data;
};

export const resendVerificationEmail = async (email: string) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
};

// Support contact submission
export const postSupportContact = async (payload: { name: string; email: string; message: string; recaptchaToken?: string }) => {
    const headers = payload.recaptchaToken ? { 'x-recaptcha-token': payload.recaptchaToken } : undefined;
    const res = await api.post('/support/contact', payload, { headers });
    return res.data;
};

// Password reset flows
export const requestPasswordReset = async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
    const newPasswordEnc = await encryptPassword(newPassword);
    const res = await api.post('/auth/reset-password', { token, newPasswordEnc });
    return res.data;
};

export const verifyEmail = async (token: string) => {
    const res = await api.post('/auth/verify-email', { token });
    return res.data;
};

// Admin endpoints
export const adminSendEmail = async (payload: { to?: string; subject: string; html?: string; text?: string }) => {
    const res = await api.post('/admin/email', payload);
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

// Daily retake endpoints
export const getRetakeDailyQuestions = async () => {
    const res = await api.get('/tests/daily/retake');
    return res.data;
};

export const submitRetakeDailyAnswers = async (baseResultId: string, answers: Record<string,string>) => {
    const res = await api.post('/tests/daily/retake/submit', { baseResultId, answers });
    return res.data;
};

// Voice (Realtime) – ephemeral session creation
export const createVoiceSession = async (payload?: { model?: string; voice?: string }) => {
    const res = await api.post('/voice/session', payload || {});
    return res.data as { model: string; voice: string; client_secret: { value: string; expires_at?: number }; ttl?: number };
};

// Local-only helper to fetch demo questions from public folder
export const fetchDemoQuestions = async (): Promise<Array<{ id: number; question: string; options: { id: string; text: string }[]; answer: string }>> => {
    const res = await fetch('/data/demo-questions.json');
    const json = await res.json();
    return json.questions;
};