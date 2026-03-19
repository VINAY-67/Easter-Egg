import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '../backend';
import { round2Levels } from '../assets/data';
import confetti from 'canvas-confetti';
import RiddleInput from '../components/RiddleInput';

const FinalCipher = () => {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();
    
    const [showSuccess, setShowSuccess] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
    const [lastAttemptTime, setLastAttemptTime] = useState(0);

    const levelData = round2Levels.final;
    const MAX_ATTEMPTS = 3;

    useEffect(() => {
        const progress = user?.Round2Progress || {};
        if (progress.finalComplete) {
            setShowSuccess(true);
        }
        
        // Check if user is locked from previous attempts
        if (progress.round2LockedAt) {
            const lockoutTime = new Date(progress.round2LockedAt).getTime();
            const now = Date.now();
            const sixHours = 6 * 60 * 60 * 1000;
            const timePassed = now - lockoutTime;
            
            if (timePassed < sixHours) {
                setIsLocked(true);
                setLockoutTimeLeft(Math.ceil((sixHours - timePassed) / 1000));
            }
        }
    }, [user]);

    useEffect(() => {
        if (redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(prev => {
                    if (prev <= 1) {
                        navigate('/instructions');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [redirectCountdown, navigate]);

    useEffect(() => {
        if (isLocked && lockoutTimeLeft > 0) {
            const timer = setTimeout(() => {
                setLockoutTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLocked, lockoutTimeLeft]);

    const handleSubmit = async (answer) => {
        const now = Date.now();
        if (now - lastAttemptTime < 1000) {
            throw new Error('Please wait before submitting again...');
        }
        setLastAttemptTime(now);

        const normalizedAnswer = answer.trim();
        
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
                    level: 3,
                    answer: normalizedAnswer
                })
            });

            const data = await res.json();

            if (!res.ok || !data.isCorrect) {
                if (data.isLocked) {
                    setIsLocked(true);
                    const lockoutTime = data.lockoutUntil ? new Date(data.lockoutUntil).getTime() : Date.now();
                    const remainingMs = lockoutTime + (6 * 60 * 60 * 1000) - Date.now();
                    setLockoutTimeLeft(Math.ceil(remainingMs / 1000));
                    throw new Error(data.message || 'You are locked out for 6 hours.');
                }
                
                const newAttempts = wrongAttempts + 1;
                setWrongAttempts(newAttempts);
                
                if (newAttempts >= MAX_ATTEMPTS) {
                    setIsLocked(true);
                    setLockoutTimeLeft(6 * 60 * 60);
                }
                
                throw new Error(data.message || 'Incorrect. Combine your clues to find the answer.');
            }

            const completeRes = await fetch(`${API}/${user.id}/updateuser`, {
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

            const completeData = await completeRes.json();

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => confetti({ particleCount: 100, spread: 90, origin: { y: 0.7 } }), 200);
            setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.8 } }), 400);

            setShowSuccess(true);
            setRedirectCountdown(5);

            if (completeData.user) {
                updateUser(completeData.user);
            }
        } catch (err) {
            console.error('Answer validation error:', err);
            throw err;
        }
    };

    const getAttemptsLeft = () => Math.max(0, MAX_ATTEMPTS - wrongAttempts);

    const userProgress = user?.Round2Progress || {};

    return (
        <div style={{ 
            position: 'relative', 
            width: '100vw', 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: '2rem', textAlign: 'center' }}
            >
                <h1 style={{ 
                    color: '#fbbf24', 
                    fontSize: '2.5rem', 
                    margin: 0,
                    textShadow: '0 0 30px rgba(251, 191, 36, 0.5)',
                    letterSpacing: '3px'
                }}>
                    Final Cipher
                </h1>
                <p style={{ color: '#64748b', marginTop: '10px', fontSize: '1rem' }}>
                    The ultimate challenge awaits...
                </p>
            </motion.div>

            <AnimatePresence>
                {(!showSuccess && !isLocked) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: '16px',
                            padding: '2rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            maxWidth: '600px'
                        }}
                    >
                        <p style={{ color: '#fbbf24', fontSize: '1.1rem', marginBottom: '1rem' }}>
                            "Numbers reveal the truth hidden in chaos."
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '2rem', letterSpacing: '8px', fontFamily: 'monospace' }}>
                            {levelData.puzzleString}
                        </p>
                        {userProgress.clue1 && userProgress.clue2 && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ 
                                    background: 'rgba(102, 126, 234, 0.1)', 
                                    border: '1px solid rgba(102, 126, 234, 0.3)',
                                    borderRadius: '8px',
                                    padding: '10px 20px'
                                }}>
                                    <span style={{ color: '#667eea', fontSize: '0.8rem' }}>Clue 1:</span>
                                    <span style={{ color: '#fff', fontSize: '1.2rem', marginLeft: '10px', fontFamily: 'monospace' }}>
                                        {userProgress.clue1}
                                    </span>
                                </div>
                                <div style={{ 
                                    background: 'rgba(118, 75, 162, 0.1)', 
                                    border: '1px solid rgba(118, 75, 162, 0.3)',
                                    borderRadius: '8px',
                                    padding: '10px 20px'
                                }}>
                                    <span style={{ color: '#764ba2', fontSize: '0.8rem' }}>Clue 2:</span>
                                    <span style={{ color: '#fff', fontSize: '1.2rem', marginLeft: '10px', fontFamily: 'monospace' }}>
                                        {userProgress.clue2}
                                    </span>
                                </div>
                            </div>
                        )}
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1.5rem', fontStyle: 'italic' }}>
                            {levelData.hint}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <RiddleInput
                riddleText={showSuccess ? "Congratulations! You've solved the Final Cipher!" : "Enter the decoded word:"}
                onSubmit={handleSubmit}
                attemptsLeft={getAttemptsLeft()}
                isLocked={isLocked}
                lockoutTimeLeft={lockoutTimeLeft}
                placeholder="Enter the decoded word..."
                showSuccess={showSuccess}
                clue={showSuccess ? "Congratulations! You've solved the Final Cipher!" : ""}
                clueLabel={showSuccess ? "STATUS" : ""}
                redirectCountdown={redirectCountdown}
                levelName="FINAL CHALLENGE"
            />

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => navigate('/riddle-intro')}
                style={{
                    position: 'absolute',
                    bottom: '30px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#64748b',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.4)' }}
            >
                ← Back to Cipher Path
            </motion.button>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                
                * {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
};

export default FinalCipher;
