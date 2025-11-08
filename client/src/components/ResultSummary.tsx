import React from 'react';

interface ResultSummaryProps {
    score: number;
    totalQuestions: number;
    onRetake: () => void;
    onReview: () => void;
    title?: string;
    subtitle?: string;
    badges?: string[];
    disableRetake?: boolean; // when true, hide the retake button entirely
    disableReview?: boolean;
    showPercentileHint?: boolean; // when true, show an approximate percentile hint for trial micro-set
    retakeLabel?: string; // optional override for retake button text
}

const ResultSummary: React.FC<ResultSummaryProps> = ({ score, totalQuestions, onRetake, onReview, title = 'Test Results', subtitle, badges = [], disableRetake, disableReview, showPercentileHint, retakeLabel }) => {
    const percentage = (score / totalQuestions) * 100;

    const getFeedbackMessage = () => {
        if (percentage >= 80) return "Excellent work! You're well on your way to acing the GMAT!";
        if (percentage >= 50) return 'Good job! Keep practicing to improve your score!';
        return "Don't be discouraged! Every practice helps you get better!";
    };

    // Very rough percentile approximation for 2-question trial:
    // Assume binomial distribution with p≈0.6 baseline accuracy among cold starters.
    // Correct 0 -> bottom ~25%, 1 -> mid ~60%, 2 -> top ~10% (illustrative only).
    let percentileNote: string | null = null;
    if (showPercentileHint && totalQuestions === 2) {
        if (score === 2) percentileNote = 'Top ~10% (excellent start)';
        else if (score === 1) percentileNote = 'Around the middle (~60th percentile)';
        else percentileNote = 'Below average (~25th percentile). Keep practicing!';
    }

    return (
        <div className="result-summary card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div>
                    <h2 className="mb-2" style={{ marginTop: 0 }}>{title}</h2>
                    {subtitle && <p className="mb-2" style={{ fontSize:'.85rem', color:'var(--color-text-subtle)' }}>{subtitle}</p>}
                </div>
                {badges.length > 0 && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {badges.map((b,i)=>(<span key={i} style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)', borderRadius:16, padding:'2px 10px', fontSize:'.7rem', fontWeight:600, letterSpacing:.5 }}>{b}</span>))}
                    </div>
                )}
            </div>
            <p className="mb-2">You answered {score} out of {totalQuestions} questions correctly.</p>
            <div className="progress mb-3" aria-label="Score percentage"><div className="progress-bar" style={{ width: `${percentage}%` }} /></div>
            <p className="mb-2"><strong>Score:</strong> {percentage.toFixed(1)}%</p>
            {percentileNote && (
                <p className="mb-4" style={{ fontSize:'.8rem', color:'var(--color-text-subtle)' }}>
                    {percentileNote} <span style={{ display:'block', marginTop:4 }}>Illustrative percentile based on early-user trial performance.</span>
                </p>
            )}
            <div className="feedback mb-4">
                <p>{getFeedbackMessage()}</p>
            </div>
            {!disableRetake && (
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn" onClick={onRetake}>{retakeLabel || 'Retake Test'}</button>
                </div>
            )}
        </div>
    );
};

export default ResultSummary;