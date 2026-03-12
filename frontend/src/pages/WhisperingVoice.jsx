import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { API } from '../backend';
import { round2Levels } from '../assets/data';
import RiddleInput from '../components/RiddleInput';

const WhisperingVoice = () => {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();
    
    const [showSuccess, setShowSuccess] = useState(false);
    const [clue, setClue] = useState('');
    const [redirectCountdown, setRedirectCountdown] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
    const [lastAttemptTime, setLastAttemptTime] = useState(0);

    const levelData = round2Levels.level1;
    const MAX_ATTEMPTS = 3;

    useEffect(() => {
        const progress = user?.Round2Progress || {};
        if (progress.level1Complete) {
            setShowSuccess(true);
            setClue(progress.clue1 || levelData.clueOnCorrect);
        }
    }, [user, levelData]);

    useEffect(() => {
        if (redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(prev => {
                    if (prev <= 1) {
                        navigate('/riddle-intro');
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
                    level: 1,
                    answer: normalizedAnswer
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const newAttempts = wrongAttempts + 1;
                setWrongAttempts(newAttempts);
                
                if (newAttempts >= MAX_ATTEMPTS) {
                    setIsLocked(true);
                    setLockoutTimeLeft(30);
                }
                
                throw new Error(data.message || 'Incorrect answer. Try again.');
            }

            if (data.isCorrect) {
                const clueValue = data.clue || levelData.clueOnCorrect;
                setClue(clueValue);
                setShowSuccess(true);
                setRedirectCountdown(5);

                if (data.user) {
                    updateUser(data.user);
                }
            } else {
                const newAttempts = wrongAttempts + 1;
                setWrongAttempts(newAttempts);
                
                if (newAttempts >= MAX_ATTEMPTS) {
                    setIsLocked(true);
                    setLockoutTimeLeft(30);
                }
                
                throw new Error(data.message || 'Incorrect answer. Try again.');
            }
        } catch (err) {
            console.error('Answer validation error:', err);
            throw err;
        }
    };

    const getAttemptsLeft = () => Math.max(0, MAX_ATTEMPTS - wrongAttempts);

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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: '2rem', textAlign: 'center' }}
            >
                <h1 style={{ 
                    color: '#667eea', 
                    fontSize: '2.5rem', 
                    margin: 0,
                    textShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
                    letterSpacing: '3px'
                }}>
                    The Whispering Voice
                </h1>
                <p style={{ color: '#64748b', marginTop: '10px', fontSize: '1rem' }}>
                    Listen carefully to the echo...
                </p>
            </motion.div>

            <RiddleInput
                riddleText={levelData.riddle}
                hintText="Think about sound that bounces back..."
                onSubmit={handleSubmit}
                attemptsLeft={getAttemptsLeft()}
                isLocked={isLocked}
                lockoutTimeLeft={lockoutTimeLeft}
                placeholder="Enter your answer..."
                showSuccess={showSuccess}
                clue={clue}
                clueLabel="Your Clue"
                redirectCountdown={redirectCountdown}
                levelName="LEVEL 1"
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

export default WhisperingVoice;
