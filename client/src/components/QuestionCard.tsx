import React from 'react';
import MathRenderer from './MathRenderer';

interface QuestionCardProps {
    question: string;
    options: Array<{ id: string; text: string }>;
    selectedOptionId: string | null;
    onOptionSelect: (optionId: string) => void;
    type?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

// Try to detect GMAT Data Sufficiency style formatting like
// "What is x? (1) x = 5. (2) x > 0." and split into a stem and numbered statements.
// Returns null if the structure doesn't convincingly match the DS pattern.
function parseDataSufficiency(q: string): { stem: string; statements: Array<{ label: string; text: string }> } | null {
    const matches = Array.from(q.matchAll(/\((\d+)\)/g));
    if (matches.length < 2) return null;

    // Ensure the labels are sequential starting at 1 (e.g., (1), (2), ...)
    for (let i = 0; i < matches.length; i += 1) {
        const expected = String(i + 1);
        if (matches[i][1] !== expected) return null;
    }

    const first = matches[0];
    if (!first || first.index === undefined) return null;

    const stem = q.slice(0, first.index).trim();
    if (!stem) return null;

    const statements: Array<{ label: string; text: string }> = [];
    for (let i = 0; i < matches.length; i += 1) {
        const current = matches[i];
        const next = matches[i + 1];
        const startIdx = (current.index ?? 0) + current[0].length;
        const endIdx = next?.index ?? q.length;
        const text = q.slice(startIdx, endIdx).trim();
        if (text.length < 2) return null; // avoid false positives with empty statements
        statements.push({ label: current[0], text });
    }

    // Require that the first statement appears in the latter half to avoid false positives like lists
    const questionLength = q.length;
    const minStemPortion = 0.25; // allow the stem to occupy at least 25% of the text
    if ((first.index ?? 0) < questionLength * minStemPortion) return null;

    return { stem, statements };
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, options, selectedOptionId, onOptionSelect, type, category, difficulty }) => {
    // Try to parse Data Sufficiency format for better presentation
    // MathRenderer handles all content (with or without $) so it's safe to parse
    const ds = parseDataSufficiency(question);
    
    // Helper to format type/category for display
    const formatLabel = (text?: string) => text ? text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
    
    // Difficulty badge colors
    const difficultyColor = difficulty === 'easy' ? '#22c55e' : difficulty === 'hard' ? '#ef4444' : '#f59e0b';
        
    return (
        <div className="question-card">
            {/* Metadata badges */}
            {(type || category || difficulty) && (
                <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginBottom: '16px', 
                    flexWrap: 'wrap',
                    fontSize: '0.85rem'
                }}>
                    {type && (
                        <span style={{ 
                            padding: '4px 12px', 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            borderRadius: '12px',
                            fontWeight: 500
                        }}>
                            {formatLabel(type)}
                        </span>
                    )}
                    {category && (
                        <span style={{ 
                            padding: '4px 12px', 
                            backgroundColor: '#8b5cf6', 
                            color: 'white', 
                            borderRadius: '12px',
                            fontWeight: 500
                        }}>
                            {formatLabel(category)}
                        </span>
                    )}
                    {difficulty && (
                        <span style={{ 
                            padding: '4px 12px', 
                            backgroundColor: difficultyColor, 
                            color: 'white', 
                            borderRadius: '12px',
                            fontWeight: 500
                        }}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </span>
                    )}
                </div>
            )}
            {!ds ? (
                <h2 className="question"><MathRenderer text={question} /></h2>
            ) : (
                <section className="question-ds" aria-label="Data sufficiency question">
                    <h2 className="question question-ds__stem"><MathRenderer text={ds.stem} /></h2>
                    <ol className="question-ds__statements">
                        {ds.statements.map(({ label, text }) => (
                            <li key={label} className="question-ds__statement">
                                <span className="question-ds__label" aria-hidden="true">{label}</span>
                                <span className="question-ds__text"><MathRenderer text={text} /></span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
            <div className="options">
                {options.map((option) => {
                    const active = selectedOptionId === option.id;
                    return (
                        <button
                            key={option.id}
                            className={`option ${active ? 'selected' : ''}`}
                            onClick={() => onOptionSelect(option.id)}
                            type="button"
                        >
                            <span className="option-letter" aria-hidden="true">{option.id.toUpperCase()}</span>
                            <span className="option-text"><MathRenderer text={option.text} /></span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestionCard;