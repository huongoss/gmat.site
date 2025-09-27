import axios from 'axios';

// Prefer env override; fall back to relative '/api' for production
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

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
        questions: Array<{ id: string; question: string; options: { id: string; text: string }[]; sequenceNumber: number }>;
        plan: 'free' | 'pro';
        progress: number;
        totalQuestions: number;
        canPractice: boolean;
        message?: string;
    };
};

export const submitDailyAnswers = async (answers: Record<string, string>) => {
    const { data } = await api.post('/tests/daily/submit', { answers });
    return data as {
        message: string;
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        feedback: Array<{ questionId: string; correct: boolean; correctAnswer: string; userAnswer: string }>;
        progress: number;
        totalInBank: number;
    };
};

export const getUserProgress = async () => {
    const { data } = await api.get('/tests/progress');
    return data as {
        progress: { current: number; total: number; percentage: number };
        canPracticeToday: boolean;
        lastPracticeDate?: string;
        dailyHistory: Array<{ date: string; score: number; correctAnswers: number; totalQuestions: number }>;
        plan: 'free' | 'pro';
    };
};

// Legacy function for compatibility
export const submitAnswers = async (body: { userId: string; answers: Record<string, string> }) => {
    const { data } = await api.post('/tests/daily/submit', body);
    return data as { score: number };
};

// Support / Contact
export const postSupportContact = async (payload: { name?: string; email: string; message: string }) => {
    const { data } = await api.post('/support/contact', payload);
    return data as { ok: boolean };
};