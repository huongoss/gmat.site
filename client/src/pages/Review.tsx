import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import ResultSummary from '../components/ResultSummary';
import EmotionFeedback from '../components/EmotionFeedback';
import { fetchUserResults } from '../services/api';

const Review: React.FC = () => {
    const { user } = useAuth();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                if (user?._id || (user as any)?.id) {
                    const id = (user as any)._id || (user as any).id;
                    const data = await fetchUserResults(id);
                    setResults(Array.isArray(data) ? data : []);
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