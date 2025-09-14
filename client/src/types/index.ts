export interface User {
    id: string;
    username: string;
    email: string;
    subscriptionActive: boolean;
    practiceResults: Result[];
}

export interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
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