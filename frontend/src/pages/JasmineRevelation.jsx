import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { API } from '../backend';
import confetti from 'canvas-confetti';
import { round3Rules } from '../assets/data';

const GRID_SIZE = 16;
const GRID_COLS = 4;
const MAX_REVEAL = 9;

// =============================================
// PRODUCTION: 6-hour lockout
// =============================================
const LOCKOUT_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const JasmineRevelation = () => {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();
    
    const [selectedCells, setSelectedCells] = useState([]);
    const [allLetters, setAllLetters] = useState([]);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [answer, setAnswer] = useState('');
    
    // =============================================
    // COUNTDOWN: Enabled for Round 3 unlock
    // =============================================
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    
    const MAX_ATTEMPTS = 3;
    
    const userProgress = user?.Round3Progress || {};
    const userRiddleProgress = user?.Round2Progress || {};
    
    const ROUND3_ENABLED = import.meta.env.VITE_ROUND3_ENABLED === 'true';
    // =============================================
    // COUNTDOWN: Round 3 unlocks at this date
    // =============================================
    const UNLOCK_DATE = import.meta.env.VITE_ROUND3_UNLOCK_DATE;
    const LETTER_POOL = import.meta.env.VITE_ROUND3_LETTERS;
    const REAL_LETTERS = import.meta.env.VITE_ROUND3_LETTERS; // 9 letters - all must be in grid
    const DUMMY_LETTERS = 'XXXXXXX'; // 7 dummy letters
    const ALL_LETTERS = REAL_LETTERS + DUMMY_LETTERS; // 16 total

    // Fisher-Yates shuffle
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Generate scrambled letters ONCE on page load
    useEffect(() => {
        const scrambled = shuffleArray(ALL_LETTERS.split(''));
        setAllLetters(scrambled);
    }, []);

    // =============================================
    // COUNTDOWN: Check and display unlock countdown
    // =============================================
    useEffect(() => {
        if (!UNLOCK_DATE) return;
        
        const checkCountdown = () => {
            const unlockTime = new Date(UNLOCK_DATE).getTime();
            const now = Date.now();
            
            if (now < unlockTime) {
                setShowCountdown(true);
                const remaining = unlockTime - now;
                setCountdownTime({
                    days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((remaining % (1000 * 60)) / 1000)
                });
            } else {
                setShowCountdown(false);
            }
        };
        
        checkCountdown();
        const interval = setInterval(checkCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!ROUND3_ENABLED) return;
        
        const progress = user?.Round3Progress || {};
        if (progress.round3LockedAt) {
            const lockoutTime = new Date(progress.round3LockedAt).getTime();
            const now = Date.now();
            const timePassed = now - lockoutTime;
            
            if (timePassed < LOCKOUT_DURATION) {
                setIsLocked(true);
                setLockoutTimeLeft(Math.ceil((LOCKOUT_DURATION - timePassed) / 1000));
            }
        }
    }, [user]);

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

    useEffect(() => {
        const progress = user?.Round3Progress || {};
        if (progress.levelComplete) {
            setShowSuccess(true);
        }
    }, [user]);

    const handleCellClick = (index) => {
        if (isSubmitting) return;
        
        if (selectedCells.includes(index)) {
            setSelectedCells(selectedCells.filter(i => i !== index));
        } else {
            if (selectedCells.length >= MAX_REVEAL) {
                setError(`You can only reveal ${MAX_REVEAL} letters at a time. Deselect one first!`);
                return;
            }
            setSelectedCells([...selectedCells, index]);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!answer.trim()) {
            setError('Please enter your answer');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch(`${API}/${user.id}/updateuser`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    round: 'Round-3',
                    action: 'jasmine-answer',
                    answer: answer.trim()
                })
            });

            const data = await res.json();

            if (!res.ok || !data.isCorrect) {
                if (data.isLocked) {
                    setIsLocked(true);
                    setLockoutTimeLeft(Math.ceil(LOCKOUT_DURATION / 1000));
                    setError(data.message || 'You are locked out for 6 hours.');
                } else {
                    const newAttempts = wrongAttempts + 1;
                    setWrongAttempts(newAttempts);
                    setError(data.message || 'Incorrect answer. Try again.');
                    
                    if (newAttempts >= MAX_ATTEMPTS) {
                        setIsLocked(true);
                        setLockoutTimeLeft(Math.ceil(LOCKOUT_DURATION / 1000));
                    }
                }
                setAnswer('');
            } else {
                confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
                setTimeout(() => confetti({ particleCount: 150, spread: 120, origin: { y: 0.8 } }), 300);
                setShowSuccess(true);
                
                if (data.user) {
                    updateUser(data.user);
                }
            }
        } catch (err) {
            console.error('Answer validation error:', err);
            setError('Something went wrong. Please try again.');
        }
        
        setIsSubmitting(false);
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m ${secs}s`;
    };

    const getAttemptsLeft = () => Math.max(0, MAX_ATTEMPTS - wrongAttempts);

    // =============================================
    // COUNTDOWN: Show countdown if Round 3 not yet unlocked
    // =============================================
    if (showCountdown) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
                color: '#fff',
                padding: '2rem',
                boxSizing: 'border-box'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center' }}
                >
                    <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>⏳</div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
                        ROUND 3 UNLOCKS IN
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        {[
                            { value: countdownTime.days, label: 'DAYS' },
                            { value: countdownTime.hours, label: 'HOURS' },
                            { value: countdownTime.minutes, label: 'MIN' },
                            { value: countdownTime.seconds, label: 'SEC' }
                        ].map((item, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem 1.5rem', minWidth: '80px' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                                    {String(item.value).padStart(2, '0')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ color: '#64748b', marginTop: '2rem' }}>Complete Round 2 to unlock when countdown ends!</p>
                </motion.div>
            </div>
        );
    }

    if (!ROUND3_ENABLED) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
                color: '#fff',
                padding: '2rem',
                boxSizing: 'border-box'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}
                >
                    <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🌸</div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fbbf24' }}>
                        Round 3: Coming Soon
                    </h1>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        Complete Round 2 to unlock the final challenge!
                    </p>
                    <button
                        onClick={() => navigate('/instructions')}
                        style={{
                            padding: '15px 40px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Return to Instructions
                    </button>
                </motion.div>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
                color: '#fff',
                padding: '2rem',
                boxSizing: 'border-box'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}
                >
                    <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🔒</div>
                    <h1 style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '1rem' }}>
                        Too Many Attempts!
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#a0aec0', marginBottom: '2rem' }}>
                        You have exhausted all your attempts.
                    </p>
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '2px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '16px',
                        padding: '25px 50px',
                        display: 'inline-block'
                    }}>
                        <p style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 'bold' }}>
                            Try again in {formatTime(lockoutTimeLeft)}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
                color: '#fff',
                padding: '2rem',
                boxSizing: 'border-box'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', maxWidth: '700px', width: '100%' }}
                >
   
                    
                    <h1 style={{ 
                        fontSize: '3rem', 
                        background: 'linear-gradient(90deg, #f5af19, #f12711)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1.5rem'
                    }}>
                        You Found The Jasmine!
                    </h1>
                    
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '2px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '20px',
                        padding: '3rem',
                        marginTop: '2rem'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏆</div>
                        <h2 style={{ color: '#22c55e', marginBottom: '1rem', fontSize: '1.5rem' }}>
                            Congratulations!
                        </h2>
                        <p style={{ color: '#a0aec0', fontSize: '1.2rem', lineHeight: '1.8' }}>
                            You have successfully completed the Easter Egg Hunt!<br/>
                            Your journey through the Jasmine Trail has come to an end.<br/>
                            <strong style={{ color: '#f5af19', fontSize: '1.3rem' }}>Thank you for playing!</strong>
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/instructions')}
                        style={{
                            marginTop: '2rem',
                            padding: '1.2rem 3rem',
                            background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            letterSpacing: '2px'
                        }}
                    >
                        Return to Hub
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ 
            width: '100vw',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
            color: '#fff',
            padding: '2rem',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <motion.header
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    style={{
                        textAlign: 'center',
                        marginBottom: '2rem',
                        padding: '2rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '16px',
                        borderBottom: '2px solid rgba(245, 175, 25, 0.3)'
                    }}
                >
                    {/* <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🌸</div> */}
                    <h1 style={{ fontSize: '2.5rem', color: '#f5af19', marginBottom: '0.5rem' }}>
                        JASMINE REVELATION
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', letterSpacing: '4px' }}>
                        THE FINAL CHAPTER - BINARY
                    </p>
                </motion.header>

                <div style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ color: '#667eea', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.3rem' }}>
                        📖 How to Play
                    </h3>
                    <ol style={{ color: '#a0aec0', fontSize: '1rem', lineHeight: '2.2',  margin: 0 }}>
                        {round3Rules.map((rule) => (
                            <li key={rule.id} style={{ marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: rule.text }} />
                        ))}
                    </ol>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '30px',
                    marginBottom: '2rem',
                    flexWrap: 'wrap'
                }}>
                    {userRiddleProgress.clue1 && (
                        <div style={{
                            background: 'rgba(102, 126, 234, 0.1)',
                            border: '1px solid rgba(102, 126, 234, 0.3)',
                            borderRadius: '12px',
                            padding: '15px 30px'
                        }}>
                            <span style={{ color: '#667eea', fontSize: '1rem' }}>Clue 1:</span>
                            <span style={{ color: '#fff', fontSize: '1.5rem', marginLeft: '15px', fontFamily: 'monospace' }}>
                                {userRiddleProgress.clue1}
                            </span>
                        </div>
                    )}
                    {userRiddleProgress.clue2 && (
                        <div style={{
                            background: 'rgba(118, 75, 162, 0.1)',
                            border: '1px solid rgba(118, 75, 162, 0.3)',
                            borderRadius: '12px',
                            padding: '15px 30px'
                        }}>
                            <span style={{ color: '#764ba2', fontSize: '1rem' }}>Clue 2:</span>
                            <span style={{ color: '#fff', fontSize: '1.5rem', marginLeft: '15px', fontFamily: 'monospace' }}>
                                {userRiddleProgress.clue2}
                            </span>
                        </div>
                    )}
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    marginBottom: '2rem'
                }}>
                    <p style={{ textAlign: 'center', color: '#667eea', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        Click cells to reveal letters ({selectedCells.length}/{MAX_REVEAL} selected)
                    </p>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                        gap: '15px',
                        maxWidth: '500px',
                        margin: '0 auto'
                    }}>
                        {Array.from({ length: GRID_SIZE }, (_, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCellClick(index)}
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: selectedCells.includes(index) 
                                        ? 'rgba(245, 175, 25, 0.3)' 
                                        : 'rgba(255,255,255,0.08)',
                                    border: selectedCells.includes(index)
                                        ? '3px solid #f5af19'
                                        : '2px solid rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: 'bold',
                                    color: selectedCells.includes(index) ? '#f5af19' : 'rgba(255,255,255,0.4)'
                                }}>
                                    {selectedCells.includes(index) ? allLetters[index] : '?'}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: '#667eea' }}>
                                    {index + 1}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {selectedCells.length > 0 && (
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ color: '#a0aec0', marginBottom: '0.5rem', fontSize: '1rem' }}>
                                Revealed Letters:
                            </p>
                            <p style={{ 
                                fontSize: '2rem', 
                                color: '#f5af19', 
                                letterSpacing: '12px',
                                fontFamily: 'monospace'
                            }}>
                                {selectedCells.map(i => allLetters[i]).join(' ')}
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ color: '#a0aec0', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        Arrange the revealed letters to form the hidden word:
                    </p>
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                            placeholder="Enter your decoded word..."
                            disabled={isSubmitting}
                            style={{
                                padding: '18px 30px',
                                fontSize: '1.3rem',
                                background: 'rgba(0,0,0,0.5)',
                                border: '2px solid rgba(245, 175, 25, 0.3)',
                                borderRadius: '12px',
                                color: '#fff',
                                outline: 'none',
                                width: '100%',
                                maxWidth: '450px',
                                textAlign: 'center',
                                letterSpacing: '5px'
                            }}
                        />
                    </div>
                    
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.1rem' }}
                        >
                            {error}
                        </motion.p>
                    )}
                    
                    <div style={{ marginBottom: '1rem', color: wrongAttempts >= 2 ? '#ef4444' : '#22c55e', fontSize: '1.1rem' }}>
                        Attempts Left: {getAttemptsLeft()}/{MAX_ATTEMPTS}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting || !answer.trim()}
                        style={{
                            padding: '18px 60px',
                            fontSize: '1.1rem',
                            background: answer.trim() ? 'linear-gradient(45deg, #f5af19, #f12711)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '12px',
                            color: answer.trim() ? '#000' : '#666',
                            fontWeight: 'bold',
                            cursor: answer.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                            letterSpacing: '2px'
                        }}
                    >
                        {isSubmitting ? 'DECODING...' : 'SUBMIT ANSWER'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => navigate('/riddle-intro')}
                        style={{
                            padding: '12px 30px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        ← Back to Round 2 Hub
                    </button>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                        © Cresence - Easter Egg Hunt 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JasmineRevelation;
