import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import ResultSummary from '../components/ResultSummary';
import EmotionFeedback from '../components/EmotionFeedback';
import { useCustomPrompt } from '../context/CustomPromptContext';
import { fetchDemoQuestions, getDailyQuestions, submitDailyAnswers, getRetakeDailyQuestions, submitRetakeDailyAnswers } from '../services/api';
import { trackPageview } from '../utils/analytics';
import './Test.css';

interface PracticeQuestion {
  id: string; // unify id as string for both trial and daily
  question: string;
  options: { id: string; text: string }[];
  answer?: string; // trial has correct answer locally; daily does not until server evaluates
}

const Test: React.FC = () => {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [dailyResult, setDailyResult] = useState<any>(null);
  const [dailyInfo, setDailyInfo] = useState<{ message?: string; canPractice?: boolean; plan?: 'free' | 'pro'; progress?: { current: number; total: number; percentage: number } } | null>(null);
  const [dailySubmitting, setDailySubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [qStartAt, setQStartAt] = useState<number | null>(null);
  const [perTimes, setPerTimes] = useState<Record<string, number>>({}); // seconds per question id
  const [testStartAt, setTestStartAt] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0); // force refetch on daily retake
  const [isRetakeFlow, setIsRetakeFlow] = useState(false);
  const [retakeBaseResultId, setRetakeBaseResultId] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { submit: submitCustomPrompt } = useCustomPrompt();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const forcedRetake = searchParams.get('retake') === '1' || searchParams.get('retake') === 'true';

  // Determine mode (daily vs trial) based on path
  const isDailyMode = typeof window !== 'undefined' && window.location.pathname.startsWith('/daily');

  // Track pageview for /daily route (authenticated users only)
  useEffect(() => {
    if (isDailyMode && isAuthenticated) {
      trackPageview('/daily', 'Daily Practice - GMAT.site');
    }
  }, [isDailyMode, isAuthenticated]);

  useEffect(() => {
    (async () => {
      const now = Date.now();
      setTestStartAt(now);
      setQStartAt(now);
      try {
        if (isDailyMode) {
          const data = await getDailyQuestions();
          const mapped: PracticeQuestion[] = (data.questions || []).map((q: any) => ({
            id: String(q.id),
            question: q.question,
            options: q.options,
          }));
          setQuestions(mapped);
          // Cache latest daily set for potential forced retake reuse
          if (mapped.length > 0) {
            try { localStorage.setItem('dailyQuestionsCache', JSON.stringify(mapped)); } catch {}
          }
          setDailyInfo({
            message: data.message,
            canPractice: data.canPractice,
            plan: data.plan,
            progress: data.progress != null && data.totalQuestions != null
              ? { current: data.progress, total: data.totalQuestions, percentage: Math.round((data.progress / data.totalQuestions) * 100) }
              : undefined
          });
          // If API says cannot practice but forcedRetake is present, fetch retake questions from server to persist
          if (forcedRetake && (data.canPractice === false)) {
            try {
              const retake = await getRetakeDailyQuestions();
              const mappedRetake: PracticeQuestion[] = (retake.questions || []).map((q: any) => ({
                id: String(q.id),
                question: q.question,
                options: q.options,
              }));
              if (mappedRetake.length > 0) {
                setQuestions(mappedRetake);
                setIsRetakeFlow(true);
                setRetakeBaseResultId(String(retake.baseResultId));
              } else {
                // fallback to cache if any
                const cached = localStorage.getItem('dailyQuestionsCache');
                if (cached) {
                  const parsed: PracticeQuestion[] = JSON.parse(cached);
                  if (parsed.length > 0) {
                    setQuestions(parsed);
                    setIsRetakeFlow(true);
                    setRetakeBaseResultId(null);
                  }
                }
              }
            } catch {
              // fallback to cache on error
              try {
                const cached = localStorage.getItem('dailyQuestionsCache');
                if (cached) {
                  const parsed: PracticeQuestion[] = JSON.parse(cached);
                  if (parsed.length > 0) {
                    setQuestions(parsed);
                    setIsRetakeFlow(true);
                    setRetakeBaseResultId(null);
                  }
                }
              } catch {}
            }
          } else {
            setIsRetakeFlow(false);
            setRetakeBaseResultId(null);
          }
        } else {
          const qs = await fetchDemoQuestions();
          const mapped: PracticeQuestion[] = qs.slice(0, 2).map(q => ({
            id: String(q.id),
            question: q.question,
            options: q.options,
            answer: q.answer
          }));
          setQuestions(mapped);
        }
      } catch (e) {
        console.warn('Failed to load questions', e);
      }
    })();
  }, [isDailyMode, reloadToken, forcedRetake]);

  const totalQuestions = questions.length;
  // GMAT timing guideline: ~2 minutes per question for Quant/Verbal
  const durationSeconds = useMemo(() => {
    const count = isDailyMode ? questions.length : (questions.length || 2);
    return (count > 0 ? count : 0) * 120; // 120 seconds per question; 0 if no daily questions
  }, [questions.length, isDailyMode]);

  const onAnswer = (optionId: string) => {
    if (dailySubmitting) return;
    const qid = questions[current]?.id;
    if (!qid) return;
    const started = qStartAt || Date.now();
    const elapsedSec = Math.max(1, Math.round((Date.now() - started) / 1000));
    if (!answers[qid]) setPerTimes(prev => ({ ...prev, [qid]: elapsedSec }));
    setAnswers(prev => ({ ...prev, [qid]: optionId }));
    // No longer auto-advance - user must click Next button
  };

  const onNext = () => {
    if (current < totalQuestions - 1) {
      setCurrent(i => i + 1);
      setQStartAt(Date.now());
    } else if (!isDailyMode) {
      // Trial auto-completes on last question's Next
      window.scrollTo(0, 0); // Scroll to top when showing trial results
      setCompleted(true);
    }
  };

  const onTimeUp = () => {
    setTimeUp(true);
    const qid = questions[current]?.id;
  if (qid && (perTimes as any)[qid] == null) {
      const started = qStartAt || (testStartAt || Date.now());
      const elapsedSec = Math.max(1, Math.round((Date.now() - started) / 1000));
      setPerTimes(prev => ({ ...prev, [qid]: elapsedSec }));
    }
    if (!isDailyMode) {
      window.scrollTo(0, 0); // Scroll to top when time expires
      setCompleted(true); // trial ends immediately
    }
  };

  const allAnswered = useMemo(() => questions.every(q => answers[q.id]), [questions, answers]);

  // Determine effective permission (forced retake overrides canPractice false if we have questions)
  const canPracticeEffective = useMemo(() => {
    if (!isDailyMode) return true;
    if (forcedRetake) return true;
    return !(dailyInfo && dailyInfo.canPractice === false);
  }, [isDailyMode, dailyInfo, forcedRetake]);

  const submitDaily = async () => {
    if (!isDailyMode || dailySubmitting || dailyResult) return;
    if (!allAnswered && !timeUp) return; // require completion unless timeUp
    window.scrollTo(0, 0); // Scroll to top when showing results
    try {
      setDailySubmitting(true);
      // Fill blanks if timeUp
      const final: Record<string,string> = { ...answers };
      if (timeUp) {
        for (const q of questions) if (!final[q.id]) final[q.id] = '';
      }
      let res: any;
      if (isRetakeFlow) {
        if (retakeBaseResultId) {
          res = await submitRetakeDailyAnswers(retakeBaseResultId, final);
          res.saved = true;
          res.type = 'daily-retake';
        } else {
          setDailyResult({ saved: false, redo: true });
          setCompleted(true);
          return;
        }
      } else {
        res = await submitDailyAnswers(final);
      }
      setDailyResult(res);
      setCompleted(true);
    } catch (e:any) {
      console.error('Daily submit failed', e);
      // Provide minimal failure state
      setDailyResult({ error: e?.response?.data?.message || e.message || 'Submit failed' });
      setCompleted(true);
    } finally {
      setDailySubmitting(false);
    }
  };

  const score = useMemo(() => {
    if (isDailyMode) {
      if (dailyResult && dailyResult.correctAnswers != null) return dailyResult.correctAnswers;
      return questions.reduce((acc, q) => (answers[q.id] ? acc + 1 : acc), 0);
    }
    return questions.reduce((acc, q) => (answers[q.id] === q.answer ? acc + 1 : acc), 0);
  }, [answers, questions, isDailyMode, dailyResult]);

  const handleRetake = () => {
    // Allow trial always; allow daily only if canPractice not explicitly false
    // If daily exhausted and no cache, abort
    if (isDailyMode && dailyInfo && dailyInfo.canPractice === false && !forcedRetake && questions.length === 0) return;
    window.scrollTo(0, 0); // Scroll to top when retaking
    const now = Date.now();
    setCurrent(0);
    setAnswers({});
    setPerTimes({});
    setDailyResult(null);
    setTimeUp(false);
    setTestStartAt(now);
    setQStartAt(now);
    setCompleted(false);
    // Refetch only if daily is allowed; forced retake keeps cache (when canPractice is false)
    if (isDailyMode && (!dailyInfo || dailyInfo.canPractice !== false)) {
      // Re-fetch daily questions to ensure fresh set (or confirm none available)
      setReloadToken(t => t + 1);
    }
  };

  const handleReview = () => {
    window.scrollTo(0, 0); // Scroll to top before navigation
    navigate('/review');
  };

  if (completed) {
    const totalTime = Object.values(perTimes).reduce((a, b) => a + (b || 0), 0);
    const avgTime = totalQuestions ? Math.round(totalTime / totalQuestions) : 0;
    const paceLabel = (s: number) => {
      if (s <= 60) return 'very fast';
      if (s <= 135) return 'on pace';
      if (s <= 180) return 'a bit slow';
      return 'too slow';
    };
    return (
      <div className="test-page">
        <div className="result-stack">
          <div className="result-modules">
            <ResultSummary
              score={score}
              totalQuestions={totalQuestions}
              onRetake={handleRetake}
              onReview={handleReview}
              showPercentileHint={!isDailyMode}
              disableReview={!isAuthenticated || isDailyMode}
              disableRetake={Boolean(isDailyMode && !canPracticeEffective && totalQuestions === 0)}
              retakeLabel={isDailyMode ? (isRetakeFlow ? 'Retake Again' : 'Redo Daily') : 'Retake Trial'}
              subtitle={isDailyMode ? (
                dailyResult?.score != null
                  ? `${isRetakeFlow ? 'Retake' : 'Daily'} score: ${dailyResult.correctAnswers}/${dailyResult.totalQuestions} (${dailyResult.score}%)`
                  : `Answered ${score}/${totalQuestions}`
              ) : undefined}
            />
            <EmotionFeedback correctAnswers={score} totalQuestions={totalQuestions} />
          </div>
          {/* Pacing insights */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Your pacing</h3>
            <p className="muted" style={{ marginTop: 0 }}>Target is about 120 seconds per question.</p>
            <ul style={{ paddingLeft: 18, marginTop: 8 }}>
              {questions.map((q, idx) => (
                <li key={q.id}>
                  Q{idx + 1}: {(perTimes as any)[q.id] ?? 0}s ({paceLabel(((perTimes as any)[q.id] ?? 0) as number)})
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 8 }}>
              Total time: <strong>{totalTime}s</strong> • Average pace: <strong>{avgTime}s</strong>/question
            </p>
          </div>
          {/* Ask GMAT for all questions (correct and wrong) */}
          {questions.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Ask GMAT about these questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q, idx) => {
                  const isCorrect = !isDailyMode
                    ? answers[q.id] === q.answer
                    : !!(dailyResult && dailyResult.feedback && dailyResult.feedback.find((f:any) => String(f.questionId) === q.id && f.correct));
                  return (
                    <div key={q.id} className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'}`} style={{ margin: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>
                          <strong>Q{idx + 1}:</strong> {isDailyMode
                            ? (dailyResult?.feedback
                                ? (isCorrect ? 'Correct!' : `Wrong. Correct answer: ${dailyResult.feedback.find((f:any)=>String(f.questionId)===q.id)?.correctAnswer?.toUpperCase() || '?'}`)
                                : 'Answered')
                            : (isCorrect ? 'Correct!' : `Wrong. Correct answer: ${q.answer?.toUpperCase()}`)}
                        </span>
                        <button
                          className="btn"
                          onClick={() => {
                            const opts = q.options.map(o => `${o.id.toUpperCase()}. ${o.text}`).join(' ');
                            const correctLetter = isDailyMode
                              ? (dailyResult?.feedback?.find((f:any)=>String(f.questionId)===q.id)?.correctAnswer?.toUpperCase() || 'UNKNOWN')
                              : (q.answer?.toUpperCase() || '');
                            const prompt = [
                              'Explain the reasoning for the correct answer to this GMAT question.',
                              `Question: ${q.question}`,
                              `Options: ${opts}`,
                              `Correct answer choice: ${correctLetter}`
                            ].join('\n');
                            submitCustomPrompt(prompt);
                          }}
                          style={{ marginLeft: 'auto' }}
                        >
                          Ask GMAT
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="result-cta">
            {isDailyMode ? (
              dailyResult?.error ? (
                <p className="alert alert-danger" style={{ margin:0 }}>Daily submit failed: {dailyResult.error}</p>
              ) : (
                <p><strong>Daily complete.</strong> {user?.emailVerified ? 'Review past sets for progress.' : 'Verify email to save and review this result.'}</p>
              )
            ) : (
              <p><strong>Enjoyed the challenge?</strong> Create an account to unlock full-length GMAT practice, daily sets, and saved progress.</p>
            )}
            <div className="result-actions">
              {!isDailyMode ? (
                <>
                  <button className="btn" onClick={handleRetake}>Retake Trial</button>
                  <button className="btn-accent" onClick={() => { window.scrollTo(0, 0); navigate('/register'); }}>Register for free</button>
                  <button className="btn-outline" onClick={() => { window.scrollTo(0, 0); navigate('/pricing'); }}>View Plans</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => { window.scrollTo(0, 0); navigate('/review'); }} disabled={!isAuthenticated}>Review Past Sets</button>
                  <button className="btn-outline" onClick={() => { window.scrollTo(0, 0); navigate('/account'); }}>Account</button>
                  <button className="btn" disabled style={{ opacity:.6, cursor:'not-allowed' }}>Come Back Tomorrow</button>
                </>
              )}
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
            <h1 className="page-title" style={{ margin: 0 }}>{isDailyMode ? 'Daily Practice' : <>GMAT Practice Test <span style={{ fontWeight: 400, fontSize: '1rem' }}>(Trial)</span></>}</h1>
            <div className="timer-wrapper"><Timer duration={durationSeconds} onTimeUp={onTimeUp} /></div>
          </div>
          {!isDailyMode && !isAuthenticated && (
            <div className="alert alert-info trial-banner">
              This is a free 2-question trial. Your progress isn't saved.{" "}
              <button className="btn-inline" onClick={() => { window.scrollTo(0, 0); navigate('/register'); }}>Create an account</button> to unlock full practice & saved results.
            </div>
          )}
        </div>
        {isDailyMode && !canPracticeEffective && totalQuestions === 0 && dailyInfo && (
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            {dailyInfo?.message || 'No daily questions available. Come back tomorrow.'}
            {dailyInfo?.plan && dailyInfo?.progress && (
              <div style={{ marginTop: 8, fontSize: '.8rem' }}>
                Progress: {dailyInfo?.progress?.current}/{dailyInfo?.progress?.total} ({dailyInfo?.progress?.percentage}%) – Plan: {dailyInfo?.plan === 'pro' ? 'Monthly' : 'Free'}
              </div>
            )}
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => { window.scrollTo(0, 0); navigate('/review'); }}>Review Past Sets</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => { window.scrollTo(0, 0); navigate('/pricing'); }}>Compare Plans</button>
            </div>
          </div>
        )}
        {!q && (!isDailyMode || canPracticeEffective) && (
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            No questions loaded right now. Please try again shortly.
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn" onClick={handleRetake}>Reload</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => { window.scrollTo(0, 0); navigate(isDailyMode ? '/pricing' : '/test'); }}>{isDailyMode ? 'View Plans' : 'Try Trial'}</button>
            </div>
          </div>
        )}
        {q && canPracticeEffective && (
          <QuestionCard
            question={q.question}
            options={q.options}
            selectedOptionId={answers[q.id] || null}
            onOptionSelect={onAnswer}
          />
        )}
        {totalQuestions > 0 && (
          <div className="question-progress">
            Question {current + 1} of {totalQuestions}
            <div className="progress question-progress-bar" aria-label="Progress">
              <div
                className="progress-bar"
                style={{ width: `${totalQuestions ? ((current + 1) / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
        {/* Next button for trial mode or individual question navigation in daily */}
        {!completed && q && canPracticeEffective && !isDailyMode && (
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button
              className="btn"
              disabled={!answers[q.id]}
              onClick={onNext}
            >
              {current < totalQuestions - 1 ? 'Next Question' : 'Submit'}
            </button>
          </div>
        )}
        {/* Next/Submit for daily mode */}
        {isDailyMode && !completed && canPracticeEffective && (
          <div className="form-actions" style={{ marginTop: 16 }}>
            {current < totalQuestions - 1 ? (
              <button
                className="btn"
                disabled={!answers[q?.id || '']}
                onClick={onNext}
              >
                Next Question
              </button>
            ) : (
              <button
                className="btn"
                disabled={(!allAnswered && !timeUp) || dailySubmitting}
                onClick={submitDaily}
              >
                {dailySubmitting
                  ? 'Submitting…'
                  : (allAnswered || timeUp
                      ? 'Submit'
                      : `Progress(${Object.keys(answers).length}/${totalQuestions})`)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;