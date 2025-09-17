import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getDailyQuestions, submitAnswers } from '../services/api';

const DailyPractice: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [nextInHours, setNextInHours] = useState<number>(0);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; options: { id: string; text: string }[] }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await getDailyQuestions();
        setPlan(data.plan);
        setNextInHours(Math.ceil(data.next_allocation_in_hours));
        setQuestions(data.questions);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load daily questions');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, navigate]);

  const total = questions.length;
  const numAnswered = useMemo(() => Object.keys(answers).length, [answers]);

  const onSelect = (qid: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionId }));
  };

  const onSubmit = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const result = await submitAnswers({ userId: user._id, answers });
      setScore(result.score);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submitted) return <div className="card"><p>Loading daily practice…</p></div>;
  if (error) return <div className="card"><p className="alert alert-danger">{error}</p></div>;

  if (submitted) {
    return (
      <div className="card">
        <h1 className="page-title">Daily practice</h1>
        <p className="mt-2">Plan: {plan === 'pro' ? 'Monthly' : 'Free'}</p>
        <p className="alert alert-success">Completed. Score: {score} / {total}</p>
        <p className="muted">New questions available in about {nextInHours} hour(s).</p>
        <div className="form-actions mt-3">
          <button className="btn" onClick={() => navigate('/review')}>Review</button>
          <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => navigate('/pricing')}>Compare plans</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 className="page-title">Daily practice</h1>
        <span className="badge">{plan === 'pro' ? 'Monthly' : 'Free'}</span>
      </div>
      <p className="muted">You have {total} question(s) today. New set in about {nextInHours} hour(s).</p>

      {questions.map((q, idx) => (
        <div key={q.id} className="question-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 className="question" style={{ margin: 0 }}>Q{idx + 1}</h2>
          </div>
          <p>{q.question}</p>
          <div className="options" role="radiogroup" aria-label={`Question ${idx + 1}`}>
            {q.options.map((o) => {
              const selected = answers[q.id] === o.id;
              return (
                <button
                  key={o.id}
                  className={`option ${selected ? 'selected' : ''}`}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(q.id, o.id)}
                >
                  <span className="option-letter">{o.id.toUpperCase()}</span>
                  <span className="option-text">{o.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="form-actions" style={{ marginTop: 24 }}>
        <button className="btn" disabled={numAnswered < total} onClick={onSubmit}>
          {numAnswered < total ? `Answer all (${numAnswered}/${total})` : 'Submit'}
        </button>
        {plan !== 'pro' && (
          <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => navigate('/pricing')}>
            Upgrade for 10/day questions
          </button>
        )}
      </div>
    </div>
  );
};

export default DailyPractice;
