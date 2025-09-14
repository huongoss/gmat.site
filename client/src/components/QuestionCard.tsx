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
            <div className="options" role="radiogroup" aria-label="Answer choices">
                {options.map((option) => {
                    const selected = selectedOptionId === option.id;
                    return (
                        <button
                            key={option.id}
                            className={`option ${selected ? 'selected' : ''}`}
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onOptionSelect(option.id)}
                        >
                            <span className="option-letter">{option.id.toUpperCase()}</span>
                            <span className="option-text">{option.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestionCard;