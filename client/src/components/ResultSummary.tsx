import React from 'react';

interface ResultSummaryProps {
    score: number;
    totalQuestions: number;
    onRetake: () => void;
    onReview: () => void;
}

const ResultSummary: React.FC<ResultSummaryProps> = ({ score, totalQuestions, onRetake, onReview }) => {
    const percentage = (score / totalQuestions) * 100;

    const getFeedbackMessage = () => {
        if (percentage >= 80) return "Excellent work! You're well on your way to acing the GMAT!";
        if (percentage >= 50) return 'Good job! Keep practicing to improve your score!';
        return "Don't be discouraged! Every practice helps you get better!";
    };

    return (
        <div className="result-summary card">
            <h2 className="mb-2">Test Results</h2>
            <p className="mb-2">You answered {score} out of {totalQuestions} questions correctly.</p>
            <p className="mb-4"><strong>Your score:</strong> {percentage.toFixed(2)}%</p>
            <div className="feedback mb-4">
                <p>{getFeedbackMessage()}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" onClick={onRetake}>Retake Test</button>
                <button className="btn-outline" onClick={onReview}>Review Answers</button>
            </div>
        </div>
    );
};

export default ResultSummary;