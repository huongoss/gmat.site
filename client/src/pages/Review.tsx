import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import ResultSummary from '../components/ResultSummary';
import EmotionFeedback from '../components/EmotionFeedback';

const Review: React.FC = () => {
    const { user } = useAuth();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                if (user) {
                    const response = await fetch(`/api/results/${user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setResults(Array.isArray(data) ? data : []);
                    } else {
                        setResults([]);
                    }
                }
            } catch (e) {
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="review-container content-narrow">
            <h1>Your Practice Results</h1>
            {results.length > 0 ? (
                results.map((result, index) => {
                    const totalQuestions = result.questionsAnswered ?? result.answeredQuestions?.length ?? 0;
                    const correctAnswers = result.correctAnswers ?? result.score ?? 0;
                    return (
                        <div key={index} style={{ marginBottom: 16 }}>
                            <ResultSummary
                                score={correctAnswers}
                                totalQuestions={totalQuestions}
                                onRetake={() => {}}
                                onReview={() => {}}
                            />
                            <EmotionFeedback correctAnswers={correctAnswers} totalQuestions={totalQuestions} />
                        </div>
                    );
                })
            ) : (
                <p>No results found. Start practicing to see your results!</p>
            )}
        </div>
    );
};

export default Review;