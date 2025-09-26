import React from 'react';

interface QuestionCardProps {
    question: string;
    options: Array<{ id: string; text: string }>;
    selectedOptionId: string | null;
    onOptionSelect: (optionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, selectedOptionId, onOptionSelect }) => {
    return (
        <div className="question-card">
            <h2 className="question">{question}</h2>
            <div className="options">
                {options.map((option) => (
                    <button
                        key={option.id}
                        className={`option ${selectedOptionId === option.id ? 'selected' : ''}`}
                        onClick={() => onOptionSelect(option.id)}
                    >
                        {option.id.toUpperCase()}. {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuestionCard;