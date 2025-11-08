import React, { useEffect, useState } from 'react';

const Timer: React.FC<{ duration: number; onTimeUp: () => void }> = ({ duration, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [fired, setFired] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (!fired) {
                setFired(true);
                onTimeUp();
            }
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeUp, fired]);

    // Reset timer when duration changes
    useEffect(() => {
        setTimeLeft(duration);
        setFired(false);
    }, [duration]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="timer">
            <h2>Time Remaining: {formatTime(timeLeft)}</h2>
        </div>
    );
};

export default Timer;