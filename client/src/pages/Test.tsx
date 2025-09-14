import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import ResultSummary from '../components/ResultSummary';
import EmotionFeedback from '../components/EmotionFeedback';
import { fetchDemoQuestions } from '../services/api';

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

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const qs = await fetchDemoQuestions();
      setQuestions(qs.slice(0, 10)); // trial: 10 questions
    })();
  }, []);

  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? Math.round(((current + 1) / totalQuestions) * 100) : 0;

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
      <div>
        <ResultSummary score={score} totalQuestions={totalQuestions} onRetake={handleRetake} onReview={handleReview} />
        <div className="mt-3">
          <EmotionFeedback correctAnswers={score} totalQuestions={totalQuestions} />
        </div>
        {/* Trial gate CTA - encourage registration */}
        <div className="card mt-4">
          <p>Enjoyed the challenge? Create an account to unlock full-length GMAT practice and save your progress.</p>
          <button className="btn mt-2" onClick={() => navigate('/account')}>Register for $10/month</button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="card">
      <div className="progress mb-4" aria-label="Progress">
        <div className="progress-bar" style={{ width: `${progressPct}%` }} aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mb-4">
        <h1 style={{ margin: 0 }}>GMAT Practice Test</h1>
        <Timer duration={30 * 60} onTimeUp={onTimeUp} />
      </div>

      {q && (
        <QuestionCard
          question={q.question}
          options={q.options}
          selectedOptionId={answers[q.id] || null}
          onOptionSelect={onAnswer}
        />
      )}

      <div className="mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Question {current + 1} of {totalQuestions}</span>
      </div>
    </div>
  );
};

export default Test;