import React from 'react';

interface EmotionFeedbackProps {
    correctAnswers: number;
    totalQuestions: number;
}

const EmotionFeedback: React.FC<EmotionFeedbackProps> = ({ correctAnswers, totalQuestions }) => {
    const percentage = (correctAnswers / totalQuestions) * 100;

    const getFeedbackMessage = () => {
        if (percentage === 100) {
            return "Outstanding! You're a GMAT superstar!";
        } else if (percentage >= 75) {
            return "Great job! You're well on your way to success!";
        } else if (percentage >= 50) {
            return "Good effort! Keep practicing and you'll improve!";
        } else {
            return "Don't be discouraged! Every practice brings you closer to your goal!";
        }
    };

    return (
        <div className="emotion-feedback">
            <h2>Your Performance Feedback</h2>
            <p>{getFeedbackMessage()}</p>
            <p>You answered {correctAnswers} out of {totalQuestions} questions correctly.</p>
        </div>
    );
};

export default EmotionFeedback;