import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getDailyQuestions, submitDailyAnswers, getUserProgress, getRetakeDailyQuestions, submitRetakeDailyAnswers, fetchDemoQuestions } from '../services/api';
import { useLocation } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import { useAskGmatDialog } from '../context/AskGmatContext';
import { useCustomPrompt } from '../context/CustomPromptContext';

const DailyPractice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // new submitting state
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; options: { id: string; text: string }[]; sequenceNumber: number }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [canPractice, setCanPractice] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null); // error specifically for submit
  const [autoProgressLoaded, setAutoProgressLoaded] = useState(false);
  const { submit: submitCustomPrompt } = useCustomPrompt();

  const buildAskPrompt = (qText: string, options: { id: string; text: string }[] | undefined, correct: string) => {
    const lines: string[] = [
      'Explain the reasoning for the correct answer to this GMAT question.',
      `Question: ${qText}`,
    ];
    if (options && options.length > 0) {
      const opts = options.map(o => `${o.id.toUpperCase()}. ${o.text}`).join(' ');
      lines.push(`Options: ${opts}`);
    }
    lines.push(`Correct answer choice: ${String(correct).toUpperCase()}`);
    return lines.join('\n');
  };

  const params = new URLSearchParams(location.search);
  const isRetakeMode = params.get('retake') === '1';
  const isIntroMode = params.get('intro') === '1';
  const INTRO_LIMIT = 5; // number of questions to show in intro micro-set
  const [isRetake, setIsRetake] = useState(isRetakeMode);
  const [baseResultId, setBaseResultId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        if (isIntroMode) {
          // Intro micro-set: lightweight demo/adaptive sample. Use demo public questions for now.
          const demo = await fetchDemoQuestions();
          const slice = demo.slice(0, INTRO_LIMIT).map((q, idx) => ({
            id: String(q.id),
            question: q.question,
            options: q.options,
            sequenceNumber: idx + 1,
          }));
          setQuestions(slice as any);
          setPlan('free');
          setProgress(null);
          setCanPractice(true);
          setIsRetake(false);
        } else if (isRetakeMode) {
          const data = await getRetakeDailyQuestions();
          setIsRetake(true);
          setBaseResultId(data.baseResultId);
          setQuestions(data.questions.map((q: any, idx: number) => ({ ...q, sequenceNumber: idx + 1 })));
          // Derive plan directly from user to avoid showing Free for subscribed users
          const derivedPlan = user?.subscriptionActive ? 'pro' : 'free';
          setPlan(derivedPlan as any);
          setProgress(null);
          setCanPractice(true);
        } else {
          const data = await getDailyQuestions();
          setPlan(data.plan);
          setQuestions(data.questions);
          setProgress({ current: data.progress, total: data.totalQuestions, percentage: Math.round((data.progress / data.totalQuestions) * 100) });
          setCanPractice(data.canPractice);
          if (!data.canPractice && data.message) {
            setError(data.message);
          }
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load daily questions');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, navigate, location.search, isRetakeMode, user?.subscriptionActive]);

  // Optionally refresh progress in background (non-blocking) once
  useEffect(() => {
    if (!autoProgressLoaded && isAuthenticated && !submitted) {
      (async () => {
        try {
          const p = await getUserProgress();
          if (p?.progress) {
            setProgress(p.progress);
          }
        } catch { /* ignore */ }
        setAutoProgressLoaded(true);
      })();
    }
  }, [autoProgressLoaded, isAuthenticated, submitted]);

  const total = questions.length;
  const numAnswered = useMemo(() => Object.keys(answers).length, [answers]);

  const onSelect = (qid: string, optionId: string) => {
    if (submitting) return; // prevent changing answers mid-submit
    setAnswers((prev) => ({ ...prev, [qid]: optionId }));
  };

  const onSubmit = async () => {
    const uid = (user && (user._id || user.id)) as string | undefined;
    if (!uid) {
      setSubmitError('User not loaded. Please re-login.');
      return;
    }
    if (total === 0) {
      setSubmitError('No questions to submit.');
      return;
    }
    if (numAnswered < total) {
      setSubmitError(`Please answer all questions (${numAnswered}/${total}).`);
      return;
    }
    try {
      setSubmitError(null);
      setSubmitting(true);
      if (isIntroMode) {
        // Client-side scoring only for intro; answers are deterministic (demo file includes answer key)
        // Re-fetch demo for answer key (could cache earlier but small cost)
        const demo = await fetchDemoQuestions();
        const slice = demo.slice(0, INTRO_LIMIT);
        let correct = 0;
        const feedback = slice.map((q, idx) => {
          const userAnswer = answers[String(q.id)];
          const isCorrect = String(userAnswer).toLowerCase() === String(q.answer).toLowerCase();
          if (isCorrect) correct++;
          return {
            questionId: String(q.id),
            correct: isCorrect,
            correctAnswer: q.answer,
          };
        });
        // Build lightweight result object
        const scorePct = slice.length ? Math.round((correct / slice.length) * 100) : 0;
        setResult({
          totalQuestions: slice.length,
          correctAnswers: correct,
          score: scorePct,
          feedback,
          intro: true,
        });
      } else if (isRetake && baseResultId) {
        const submitResult = await submitRetakeDailyAnswers(baseResultId, answers);
        setResult({ ...submitResult, retake: true });
      } else {
        const submitResult = await submitDailyAnswers(answers);
        setResult(submitResult);
      }
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message || e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !submitted) return <div className="card content-narrow"><p>Loading daily practice…</p></div>;
  if (error && !canPractice) return <div className="card content-narrow">
    <h1 className="page-title">Daily practice</h1>
    <p className="mt-2">Plan: {plan === 'pro' ? 'Monthly' : 'Free'}</p>
    {progress && (
      <p className="muted">Progress: {progress.current}/{progress.total} ({progress.percentage}%)</p>
    )}
    <p className="alert alert-info">{error}</p>
    <div className="form-actions mt-3">
      <button className="btn" onClick={() => navigate('/review')}>Review</button>
      <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => navigate('/pricing')}>Compare plans</button>
    </div>
  </div>;
  
  if (error && canPractice) return <div className="card content-narrow"><p className="alert alert-danger">{error}</p></div>;

  if (submitted && result) {
    return (
      <div className="card content-narrow">
        <h1 className="page-title">{isIntroMode ? 'Intro Practice – Results' : (isRetake ? 'Retake – Daily Set' : 'Daily practice')}</h1>
        {!isIntroMode && <p className="mt-2">Plan: {plan === 'pro' ? 'Monthly' : 'Free'}</p>}
        <p className="alert alert-success">{isIntroMode ? 'Intro set complete!' : (isRetake ? 'Retake completed' : 'Completed!')} Score: {result.correctAnswers}/{result.totalQuestions} ({result.score}%) {result.originalScore !== undefined && !isRetake && !isIntroMode && `(Original: ${result.originalScore}%)`}</p>
        {!isRetake && !isIntroMode && result.progress !== undefined && (<p className="muted">Progress: {result.progress}/{result.totalInBank}</p>)}
        {result.feedback && (
          <div className="mt-3">
            <h3>Results:</h3>
            {result.feedback.map((fb: any, idx: number) => {
              const q = questions.find((x) => String(x.id) === String(fb.questionId));
              return (
                <div key={fb.questionId} className={`alert ${fb.correct ? 'alert-success' : 'alert-danger'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>
                      <strong>Q{idx + 1}:</strong> {fb.correct ? 'Correct!' : `Wrong. Correct answer: ${fb.correctAnswer}`}
                    </span>
                    {!fb.correct && q && (
                      <button
                        className="btn"
                        onClick={() => submitCustomPrompt(buildAskPrompt(q.question, q.options, fb.correctAnswer))}
                        style={{ marginLeft: 'auto' }}
                      >
                        Ask GMAT
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="form-actions mt-3">
          {isIntroMode ? (
            <>
              <button className="btn" onClick={() => navigate('/daily')}>Do Full Daily Set</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => navigate('/pricing')}>Unlock 10 Daily Questions</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => navigate('/review')}>Review</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => navigate('/pricing')}>Compare plans</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
  <div className="card content-narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 className="page-title">{isIntroMode ? 'Intro Practice' : (isRetake ? 'Retake – Daily Set' : 'Daily practice')}</h1>
        {!isIntroMode && <span className="badge">{plan === 'pro' ? 'Monthly' : 'Free'}</span>}
      </div>
      <p className="muted">{isIntroMode ? `Quick sample: ${total} question(s). Get a feel for the platform.` : (isRetake ? 'Repeat the same questions to improve your score.' : `You have ${total} question(s) today.`)}</p>
      {progress && (
        <p className="muted">Progress: {progress.current}/{progress.total} ({progress.percentage}%)</p>
      )}

      {questions.map((q, idx) => (
        <div key={q.id} style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Q{q.sequenceNumber || idx + 1}</h3>
          </div>
          <QuestionCard
            question={q.question}
            options={q.options}
            selectedOptionId={answers[q.id] || null}
            onOptionSelect={(optionId) => onSelect(q.id, optionId)}
          />
        </div>
      ))}

      {submitError && <p className="alert alert-danger" style={{ marginTop: 16 }}>{submitError}</p>}

      <div className="form-actions" style={{ marginTop: 24 }}>
        <button className="btn" disabled={numAnswered < total || submitting} onClick={onSubmit}>
          {submitting ? 'Submitting…' : numAnswered < total ? `Answer all (${numAnswered}/${total})` : (isIntroMode ? 'See Intro Results' : 'Submit')}
        </button>
        {/* Hide upgrade button during retake & intro; only show on original daily mode */}
        {!isRetake && !isIntroMode && plan !== 'pro' && (
          <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => navigate('/pricing')} disabled={submitting}>
            Upgrade for 10/day questions
          </button>
        )}
      </div>
    </div>
  );
};

export default DailyPractice;
