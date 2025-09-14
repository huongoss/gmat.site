import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const registerUser = async (userData: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
};

export const loginUser = async (credentials: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
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

// Local-only helper to fetch demo questions from public folder
export const fetchDemoQuestions = async (): Promise<Array<{ id: number; question: string; options: { id: string; text: string }[]; answer: string }>> => {
    const res = await fetch('/data/demo-questions.json');
    const json = await res.json();
    return json.questions;
};