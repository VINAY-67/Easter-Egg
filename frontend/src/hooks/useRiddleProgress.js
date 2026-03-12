import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../backend';

const RIDDLE_PROGRESS_KEY = 'riddleProgress';

const INITIAL_STATE = {
    level1Complete: false,
    level2Complete: false,
    finalComplete: false,
    clue1: '',
    clue2: '',
    wrongAttempts: {
        level1: 0,
        level2: 0,
        final: 0
    }
};

export const useRiddleProgress = () => {
    const { user, token, updateUser } = useAuth();
    const [progress, setProgress] = useState(INITIAL_STATE);
    const [lockedOut, setLockedOut] = useState({
        level1: false,
        level2: false,
        final: false
    });
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState({
        level1: 0,
        level2: 0,
        final: 0
    });

    useEffect(() => {
        const stored = localStorage.getItem(RIDDLE_PROGRESS_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setProgress(prev => ({
                    ...prev,
                    ...parsed
                }));
            } catch (e) {
                console.error('Failed to parse riddle progress:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(RIDDLE_PROGRESS_KEY, JSON.stringify(progress));
    }, [progress]);

    const saveToBackend = useCallback(async (updates) => {
        if (!user || !token) return;
        
        try {
            const res = await fetch(`${API}/${user.id}/updateuser`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    round: 'Round-2',
                    action: 'riddle-progress',
                    ...updates
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    updateUser(data.user);
                }
            }
        } catch (err) {
            console.error('Failed to save riddle progress:', err);
        }
    }, [user, token, updateUser]);

    const validateAnswer = useCallback(async (level, answer) => {
        if (!user || !token) {
            throw new Error('Authentication required');
        }

        const normalizedAnswer = answer.trim().toLowerCase();

        try {
            const res = await fetch(`${API}/${user.id}/updateuser`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    round: 'Round-2',
                    action: 'riddle-answer',
                    level: level,
                    answer: normalizedAnswer
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const newAttempts = {
                    ...progress.wrongAttempts,
                    [level]: progress.wrongAttempts[level] + 1
                };
                
                setProgress(prev => ({
                    ...prev,
                    wrongAttempts: newAttempts
                }));
                
                await saveToBackend({ wrongAttempts: newAttempts });

                if (newAttempts[level] >= 3) {
                    setLockedOut(prev => ({ ...prev, [level]: true }));
                    setLockoutTimeLeft(prev => ({ ...prev, [level]: 30 }));
                    
                    const countdown = setInterval(() => {
                        setLockoutTimeLeft(prev => {
                            const newTime = { ...prev };
                            if (newTime[level] <= 1) {
                                clearInterval(countdown);
                                setLockedOut(prev => ({ ...prev, [level]: false }));
                                newTime[level] = 0;
                            } else {
                                newTime[level] -= 1;
                            }
                            return newTime;
                        });
                    }, 1000);
                }

                throw new Error(data.message || 'Incorrect answer');
            }

            const isCorrect = data.success || data.isCorrect;
            
            if (isCorrect) {
                const levelCompleteKey = level === 1 ? 'level1Complete' : level === 2 ? 'level2Complete' : 'finalComplete';
                const clueKey = level === 1 ? 'clue1' : level === 2 ? 'clue2' : null;
                
                const updates = {
                    [levelCompleteKey]: true,
                    wrongAttempts: {
                        ...progress.wrongAttempts,
                        [level]: 0
                    }
                };

                if (clueKey && data.clue) {
                    updates[clueKey] = data.clue;
                }

                setProgress(prev => ({ ...prev, ...updates }));
                await saveToBackend(updates);

                return { correct: true, clue: data.clue };
            }

            return { correct: false };
        } catch (err) {
            console.error('Answer validation error:', err);
            throw err;
        }
    }, [user, token, progress.wrongAttempts, saveToBackend]);

    const completeRound = useCallback(async () => {
        if (!user || !token) return;

        try {
            const res = await fetch(`${API}/${user.id}/updateuser`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    round: 'Round-2',
                    action: 'complete'
                })
            });

            const data = await res.json();
            if (data.user) {
                updateUser(data.user);
            }

            setProgress(prev => ({
                ...prev,
                finalComplete: true
            }));

            await saveToBackend({ finalComplete: true });
        } catch (err) {
            console.error('Failed to complete round:', err);
        }
    }, [user, token, updateUser, saveToBackend]);

    const resetProgress = useCallback(() => {
        setProgress(INITIAL_STATE);
        setLockedOut({ level1: false, level2: false, final: false });
        setLockoutTimeLeft({ level1: 0, level2: 0, final: 0 });
        localStorage.removeItem(RIDDLE_PROGRESS_KEY);
    }, []);

    const getAttemptsLeft = useCallback((level) => {
        const levelKey = level === 1 ? 'level1' : level === 2 ? 'level2' : 'final';
        return Math.max(0, 3 - progress.wrongAttempts[levelKey]);
    }, [progress.wrongAttempts]);

    return {
        progress,
        lockedOut,
        lockoutTimeLeft,
        validateAnswer,
        completeRound,
        resetProgress,
        getAttemptsLeft,
        isLevelComplete: useCallback((level) => {
            if (level === 1) return progress.level1Complete;
            if (level === 2) return progress.level2Complete;
            if (level === 3) return progress.finalComplete;
            return false;
        }, [progress]),
        hasAccessToLevel: useCallback((level) => {
            if (level === 1) return true;
            if (level === 2) return progress.level1Complete;
            if (level === 3) return progress.level1Complete && progress.level2Complete;
            return false;
        }, [progress])
    };
};

export default useRiddleProgress;
