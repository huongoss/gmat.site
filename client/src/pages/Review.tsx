import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import ResultSummary from '../components/ResultSummary';
import EmotionFeedback from '../components/EmotionFeedback';
import { fetchUserResults, getUserProgress } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Review: React.FC = () => {
    const { user, authLoading, isAuthenticated } = useAuth() as any;
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return; // wait until auth resolved
        if (!isAuthenticated) {
            setResults([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                // Prefer progress endpoint (contains latest daily history + ensures auth) then fall back
                const progress = await getUserProgress();
                const dailyHistory = progress?.dailyHistory || [];
                const retakeHistory = progress?.retakeHistory || [];
                // progress.dailyHistory returns only daily results summary; we still want retakes & other types -> fallback fetch
                const id = (user as any)?._id || (user as any)?.id;
                let fullResults: any[] = [];
                if (id) {
                    try {
                        const data = await fetchUserResults(id);
                        fullResults = Array.isArray(data) ? data : [];
                        // Ensure retake results are included if backend endpoint didn't return them yet
                        const existingIds = new Set(fullResults.map(r => String(r._id || r.id)));
                        retakeHistory.forEach((r: any) => {
                            if (!existingIds.has(String(r.id))) {
                                fullResults.push({
                                    _id: r.id,
                                    id: r.id,
                                    dateTaken: r.date,
                                    score: r.score,
                                    correctAnswers: r.correctAnswers,
                                    questionsAnswered: r.totalQuestions,
                                    type: 'daily-retake',
                                    baseResultId: r.baseResultId
                                });
                            }
                        });
                    } catch {
                        // ignore fetch error, fallback to dailyHistory minimal mapping
                        fullResults = [
                            ...dailyHistory.map((d: any) => ({
                                dateTaken: d.date,
                                score: d.score,
                                correctAnswers: d.correctAnswers,
                                questionsAnswered: d.totalQuestions,
                                type: 'daily',
                                id: d.id
                            })),
                            ...retakeHistory.map((r: any) => ({
                                dateTaken: r.date,
                                score: r.score,
                                correctAnswers: r.correctAnswers,
                                questionsAnswered: r.totalQuestions,
                                type: 'daily-retake',
                                id: r.id,
                                baseResultId: r.baseResultId
                            }))
                        ];
                    }
                }
                if (!cancelled) setResults(fullResults);
            } catch (e) {
                if (!cancelled) setResults([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [authLoading, isAuthenticated, user]);

    const dateKey = (d: Date) => d.toISOString().slice(0,10);
    const today = new Date(); today.setHours(0,0,0,0);
    const startRange = new Date(today.getTime() - 29*24*60*60*1000);
    startRange.setHours(0,0,0,0);

    // Build day list (continuous 30 days) & group results by date
    const dayKeys: string[] = [];
    for (let t = startRange.getTime(); t <= today.getTime(); t += 24*60*60*1000) {
        dayKeys.push(new Date(t).toISOString().slice(0,10));
    }

    const resultsByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        results.forEach(r => {
            if (!r.dateTaken) return;
            const d = new Date(r.dateTaken);
            d.setHours(0,0,0,0);
            const k = dateKey(d);
            if (!map[k]) map[k] = [];
            map[k].push(r);
        });
        // Sort each date's results: daily first, then retake, then others
        Object.keys(map).forEach(k => {
            map[k].sort((a,b) => {
                const order = (x: any) => x.type === 'daily' ? 0 : x.type === 'daily-retake' ? 1 : 2;
                return order(a) - order(b);
            });
        });
        return map;
    }, [results]);

    // Calendar grid: start on Monday for intuitive weekly alignment
    // Determine leading blanks from first day of week (Mon=1 ... Sun=0 -> treat as 7)
    const firstDate = new Date(startRange);
    const jsDay = firstDate.getDay(); // 0-6 (Sun-Sat)
    const weekdayIndex = jsDay === 0 ? 7 : jsDay; // 1-7 (Mon-Sun)
    const leadingBlanks = weekdayIndex - 1; // 0..6
    const cells: Array<{ key: string; date?: string }> = [];
    for (let i=0; i<leadingBlanks; i++) cells.push({ key: `blank-${i}` });
    dayKeys.forEach(k => cells.push({ key: k, date: k }));

    if (loading || authLoading) return <div className="card content-narrow"><p>Loading results…</p></div>;

    const startRetake = (_result: any) => {
        navigate('/daily?retake=1');
    };


    const selectedList = selectedDate ? resultsByDate[selectedDate] || [] : [];
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
    const isSelectedToday = selectedDateObj ? dateKey(selectedDateObj) === dateKey(today) : false;
    const hasTodayDaily = selectedList.some(r => r.type === 'daily');
    const todayDaily = selectedList.find(r => r.type === 'daily');

    return (
        <div className="review-container content-narrow">
            <h1 className="page-title" style={{ marginTop:0 }}>Practice History</h1>
            <p style={{ marginTop:-12, fontSize:'.85rem', color:'var(--color-text-subtle)' }}>Last 30 days overview. Tap a date with activity to view results and optionally retake today's set.</p>
            <div className="calendar card" style={{ marginTop:16 }}>
                <div className="cal-header">
                    <span>Last 30 days</span>
                    <div className="cal-legend">
                        <span className="cal-dot daily" aria-label="Daily result" /> <small>Daily</small>
                        <span className="cal-dot retake" aria-label="Retake result" /> <small>Retake</small>
                    </div>
                </div>
                <div className="cal-weekdays" aria-hidden="true">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="cal-grid" role="grid" aria-label="Last 30 days results calendar">
                    {cells.map(cell => {
                        if (!cell.date) return <div key={cell.key} className="cal-cell empty" aria-hidden="true" />;
                        const rlist = resultsByDate[cell.date] || [];
                        const hasDaily = rlist.some(r=>r.type==='daily');
                        const hasRetake = rlist.some(r=>r.type==='daily-retake');
                        const isTodayCell = cell.date === dateKey(today);
                        const isSelected = cell.date === selectedDate;
                        const score = hasDaily ? rlist.find(r=>r.type==='daily')?.score : undefined;
                        const pct = typeof score === 'number' ? `${score}%` : '';
                        return (
                            <button
                                key={cell.key}
                                type="button"
                                onClick={()=> setSelectedDate(cell.date ? (cell.date === selectedDate ? null : cell.date) : null)}
                                className={`cal-cell ${isSelected ? 'selected' : ''} ${isTodayCell ? 'today' : ''}`}
                                aria-pressed={isSelected}
                                aria-label={`${cell.date}${hasDaily? ' daily result' : ''}${hasRetake? ' retake' : ''}`}
                            >
                                <span className="cal-day-num">{parseInt(cell.date.slice(8,10),10)}</span>
                                <span className="cal-markers">
                                    {hasDaily && <span className="cal-dot daily" title={pct} />}
                                    {hasRetake && <span className="cal-dot retake" />}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginTop:24 }}>
                {!selectedDate && (
                    <div className="card" style={{ fontSize:'.9rem' }}>
                        <p>Select a date cell to see details.</p>
                        {results.length === 0 && <p>No results yet. Complete your first daily practice to populate the calendar.</p>}
                    </div>
                )}
                {selectedDate && (
                    <div className="card" aria-live="polite">
                        <h2 style={{ marginTop:0 }}>{selectedDateObj?.toLocaleDateString(undefined,{ dateStyle:'full'})}</h2>
                        {selectedList.length === 0 && <p>No activity this day.</p>}
                        {selectedList.length > 0 && selectedList.map((r,i) => {
                            const totalQuestions = r.questionsAnswered ?? 0;
                            const correctAnswers = r.correctAnswers ?? 0;
                            const isDaily = r.type === 'daily';
                            const isRetake = r.type === 'daily-retake';
                            const title = isRetake ? 'Retake' : isDaily ? 'Daily' : 'Practice';
                            return (
                                <div key={i} style={{ marginBottom:16 }}>
                                    <ResultSummary
                                        score={correctAnswers}
                                        totalQuestions={totalQuestions}
                                        onRetake={() => startRetake(r)}
                                        onReview={() => {}}
                                        title={`${title} Result`}
                                        subtitle={new Date(r.dateTaken).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                                        badges={[title, ...(isDaily && selectedDate===dateKey(today)? ['Today'] : []), ...(isRetake? ['Retake'] : [])]}
                                        disableRetake={!(isDaily && isSelectedToday)}
                                        disableReview={true}
                                    />
                                </div>
                            );
                        })}
                        {isSelectedToday && hasTodayDaily && (
                            <div style={{ marginTop:8 }}>
                                <p style={{ fontSize:'.8rem', color:'var(--color-text-subtle)' }}>You can retake today's set once finished viewing.</p>
                            </div>
                        )}
                        <div className="form-actions" style={{ marginTop:8 }}>
                            <button className="btn-outline" onClick={()=> setSelectedDate(null)}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Review;