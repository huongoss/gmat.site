import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import ResultSummary from '../components/ResultSummary';
import EmotionFeedback from '../components/EmotionFeedback';
import { fetchDemoQuestions } from '../services/api';
import './Test.css';

interface DemoQuestion {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  answer: string; // option id e.g. 'a'
}

const Test: React.FC = () => {
  const [questions, setQuestions] = useState<DemoQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);
  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const qs = await fetchDemoQuestions();
      setQuestions(qs.slice(0, 10)); // trial: 10 questions
    })();
  }, []);

  const totalQuestions = questions.length;

  const onAnswer = (optionId: string) => {
    const qid = questions[current]?.id;
    if (qid == null) return;
    setAnswers((prev) => ({ ...prev, [qid]: optionId }));
    if (current < totalQuestions - 1) setCurrent((i) => i + 1);
    else setCompleted(true);
  };

  const onTimeUp = () => setCompleted(true);

  const score = useMemo(() => {
    return questions.reduce((acc, q) => (answers[q.id] === q.answer ? acc + 1 : acc), 0);
  }, [answers, questions]);

  const handleRetake = () => {
    setCurrent(0);
    setAnswers({});
    setCompleted(false);
  };

  const handleReview = () => navigate('/review');

  if (completed) {
    return (
      <div className="test-page">
        <div className="result-stack">
          <div className="result-modules">
            <ResultSummary
              score={score}
              totalQuestions={totalQuestions}
              onRetake={handleRetake}
              onReview={handleReview}
              disableReview={!isAuthenticated}
            />
            <EmotionFeedback correctAnswers={score} totalQuestions={totalQuestions} />
          </div>
          <div className="result-cta">
            <p><strong>Enjoyed the challenge?</strong> Create an account to unlock full-length GMAT practice, daily sets, and saved progress.</p>
            <div className="result-actions">
              <button className="btn" onClick={handleRetake}>Retake Trial</button>
              <button className="btn-accent" onClick={() => navigate('/register')}>Register for $10/month</button>
              <button className="btn-outline" onClick={() => navigate('/pricing')}>View Plans</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const q = questions[current];
  return (
    <div className="test-page">
      <div className="card test-card">
        <div className="test-header">
          <div className="test-header-row">
            <h1 className="page-title" style={{ margin: 0 }}>GMAT Practice Test <span style={{ fontWeight: 400, fontSize: '1rem' }}>(Trial)</span></h1>
            <div className="timer-wrapper"><Timer duration={30 * 60} onTimeUp={onTimeUp} /></div>
          </div>
          {!isAuthenticated && (
            <div className="alert alert-info trial-banner">
              This is a free 10-question trial. Your progress isn't saved.{' '}
              <button className="btn-inline" onClick={() => navigate('/register')}>Create an account</button> to unlock full practice & saved results.
            </div>
          )}
        </div>
        {q && (
          <QuestionCard
            question={q.question}
            options={q.options}
            selectedOptionId={answers[q.id] || null}
            onOptionSelect={onAnswer}
          />
        )}
        <div className="question-progress">
          Question {current + 1} of {totalQuestions}
          <div className="progress question-progress-bar" aria-label="Progress">
            <div
              className="progress-bar"
              style={{ width: `${totalQuestions ? ((current + 1) / totalQuestions) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;