export interface User {
    id: string;
    username: string;
    email: string;
    subscriptionActive: boolean;
    subscriptionCurrentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    practiceResults: Result[];
}

export interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    type?: string; // e.g., "quantitative", "critical_reasoning", "data_sufficiency", etc.
    category?: string; // e.g., "algebra", "supporting_idea", "evaluation", etc.
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string; // explanation of the correct answer
    verified?: boolean; // whether the question has been AI-verified
}

export interface Result {
    userId: string;
    testId: string;
    score: number;
    answeredQuestions: AnsweredQuestion[];
}

export interface AnsweredQuestion {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (username: string, email: string, password: string) => Promise<void>;
}