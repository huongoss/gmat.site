export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    subscriptionActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
}

export interface Result {
    id: string;
    userId: string;
    score: number;
    totalQuestions: number;
    answeredQuestions: string[];
    createdAt: Date;
}

export interface TrialTest {
    questions: Question[];
    maxQuestions: number;
}