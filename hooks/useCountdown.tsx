import { useState, useEffect } from 'react';

export const useCountdown = (targetDate: number) => {
    const [timeLeft, setTimeLeft] = useState(targetDate - new Date().getTime());

    useEffect(() => {
        if (targetDate - new Date().getTime() <= 0) {
             setTimeLeft(0);
             return;
        }

        const interval = setInterval(() => {
            const newTimeLeft = targetDate - new Date().getTime();
            if (newTimeLeft > 0) {
                setTimeLeft(newTimeLeft);
            } else {
                setTimeLeft(0);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const isFinished = timeLeft <= 0;
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
    const seconds = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0');
    
    return { days, hours, minutes, seconds, isFinished };
};
