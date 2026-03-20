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
// TESTING: 30 seconds | PRODUCTION: 2 hours
// =============================================
const LOCKOUT_DURATION = 2*60*60 * 1000; // 30 seconds (testing) | 2 * 60 * 60 * 1000 (production - 2 hours)

const JasmineRevelation = () => {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();

    const [selectedCells, setSelectedCells] = useState([]);
    const [allLetters, setAllLetters] = useState([]);
    const [wrongAttempts, setWrongAttempts] = useState(() => user?.Round3Progress?.wrongAttempts || 0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [answer, setAnswer] = useState('');

    // =============================================
    // COUNTDOWN: Round 3 unlocks at UNLOCK_DATE
    // =============================================
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const MAX_ATTEMPTS = 3;

    const userProgress = user?.Round3Progress || {};
    const userRiddleProgress = user?.Round2Progress || {};

    const ROUND3_ENABLED = import.meta.env.VITE_ROUND3_ENABLED === 'true';
    // =============================================
    // PRODUCTION: '2026-03-21T12:30:00.000Z'  → 18:00 IST 21 Mar 2026
    // =============================================
    const UNLOCK_DATE = import.meta.env.VITE_ROUND3_UNLOCK_DATE || '2026-03-21T12:30:00.000Z';
    const LETTER_POOL = import.meta.env.VITE_ROUND3_LETTERS;
    const REAL_LETTERS = import.meta.env.VITE_ROUND3_LETTERS; // 9 letters - all must be in grid
    const DUMMY_LETTERS = 'XXXXXXX'; // 7 dummy letters
    const ALL_LETTERS = REAL_LETTERS + DUMMY_LETTERS; // 16 total

    // Helper functions
    const getAttemptsLeft = () => {
        return Math.max(0, MAX_ATTEMPTS - wrongAttempts);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

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
                // Lockout still active — restore timer
                setIsLocked(true);
                setLockoutTimeLeft(Math.ceil((LOCKOUT_DURATION - timePassed) / 1000));
            } else {
                // Lockout has expired — make sure we're unlocked
                setIsLocked(false);
                setLockoutTimeLeft(0);
            }
        } else {
            // No lockout record at all
            setIsLocked(false);
        }

        // Sync wrongAttempts display from user context (covers page reload + updateUser calls)
        if (progress.wrongAttempts !== undefined) {
            setWrongAttempts(progress.wrongAttempts);
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

            // Always sync user from backend if provided — keeps auth context / localStorage fresh
            // This is what makes wrongAttempts count and lockout persist across page reloads
            if (data.user) {
                updateUser(data.user);
            }

            // Sync wrongAttempts display from backend (source of truth)
            if (data.wrongAttempts !== undefined) {
                setWrongAttempts(data.wrongAttempts);
            }

            // Handle countdown response
            if (data.countdownActive) {
                setShowCountdown(true);
                setError(data.message || 'Round 3 is not available yet.');
                setAnswer('');
                setIsSubmitting(false);
                return;
            }

            if (!res.ok || !data.isCorrect) {
                if (data.isLocked) {
                    setIsLocked(true);
                    // Compute remaining time from the actual lockoutUntil timestamp
                    // (not a flat LOCKOUT_DURATION) so timer is accurate on reload / 4th attempt
                    if (data.lockoutUntil) {
                        const remainingMs = LOCKOUT_DURATION - (Date.now() - new Date(data.lockoutUntil).getTime());
                        setLockoutTimeLeft(Math.max(1, Math.ceil(remainingMs / 1000)));
                    } else {
                        setLockoutTimeLeft(Math.ceil(LOCKOUT_DURATION / 1000));
                    }
                    setError(data.message || 'You are locked out.');
                } else {
                    setError(data.message || 'Incorrect answer. Try again.');
                }
                setAnswer('');
            } else {
                confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
                setTimeout(() => confetti({ particleCount: 150, spread: 120, origin: { y: 0.8 } }), 300);
                setShowSuccess(true);
            }
        } catch (err) {
            console.error('Answer validation error:', err);
            setError('Something went wrong. Please try again.');
        }

        setIsSubmitting(false);
    };

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
        const creditsData = [
            { type: 'title', text: 'You Found The Easter Egg!' },
            { type: 'separator' },
            { type: 'header', text: 'THE END' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'header', text: 'JNTU-GV PRESENTS' },
            { type: 'title-small', text: 'An Easter Egg Hunt Event' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'header', text: 'THE CRESCENCE STORY' },
            { type: 'text', text: 'This Event is designed Exclusively for telling the importance of Cresence Technical Fest.' },
            { type: 'text', text: 'For some of us it was just a timeout period to deal with our works and responsibilities.' },
            { type: 'text', text: 'Yet we are losing the soul and the purpose of the Cresence Technical Fest.' },
            { type: 'separator' },
            { type: 'text', text: 'It started as a learning program, yet we have taken it from the entire beginning to an absolute learning platform filled with enjoyment and learning.' },
            { type: 'separator' },
            { type: 'quote', text: 'Yet the Legacy of Cresence will last long until the end of JNTU-GV.' },
            { type: 'text', text: 'Do not hold back for making this technical fest a grand success.' },
            { type: 'text', text: 'If we are here or not.' },
            { type: 'separator' },
            { type: 'emphasis', text: 'One Legacy, One Thought, One Purpose, One Responsibility.' },
            { type: 'text', text: 'Make this happen!!' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'header', text: 'THE WORD' },
            { type: 'text', text: "The word you entered was the actual word!!" },
            { type: 'text', text: "It's not Cresence." },
            { type: 'text', text: 'The word starts as Cre-(creative)-sense(sensation) = Cresense.' },
            { type: 'text', text: 'Yet during these years it was changing from Create Sence to Moon Meaning!!' },
            { type: 'text', text: "Then don't think it was Cresence." },
            { type: 'separator' },
            { type: 'header', text: 'THE MEANING' },
            { type: 'emphasis-large', text: 'CRESCENCE' },
            { type: 'text', text: 'Taken from a Latin word Crescere meaning' },
            { type: 'emphasis', text: 'GROWTH AND DEVELOPMENT' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'thanks', text: 'Thank you for playing!' },
            { type: 'text', text: 'Hope you have enjoyed this Event 😁🙂🥲' },
            { type: 'separator' },
            { type: 'text', text: "See Ya'll Next time" },
            { type: 'text', text: 'Happy Journey For the Crescence' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'header', text: 'DEVELOPED WITH LOVE' },
            { type: 'title-small', text: 'For Crescence 2K26' },
            { type: 'text', text: 'Thank you all, let this legacy continue 😘💖💞' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'header', text: 'SIGNING OFF' },
            { type: 'developer', text: 'Vinay 🫡🫡' },
            { type: 'text', text: '3rd B.Tech CSE' },
            { type: 'text', text: 'On occasion of Crescence 2K26' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'text', text: 'Special thanks to Charan Sir' },
            { type: 'text', text: 'For making me Educating this event!!' },
            { type: 'separator' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'final', text: '🎋' },
            { type: 'final', text: 'THE LEGACY CONTINUES' },
            { type: 'spacer' },
            { type: 'spacer' },
        ];

        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #0c0c0c 100%)',
                color: '#fff',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
                    pointerEvents: 'none',
                    zIndex: 1
                }} />

                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '30vh',
                    background: 'linear-gradient(to bottom, #0c0c0c 0%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 2
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '30vh',
                    background: 'linear-gradient(to top, #0c0c0c 0%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 2
                }} />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        zIndex: 3
                    }}
                >
                </motion.div>

                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingTop: '60vh',
                    zIndex: 0
                }}>
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: '-700vh' }}
                        transition={{
                            duration: 120, // Adjust this value to change speed (lower = faster)
                            ease: 'linear',
                            delay: 1
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem',
                            paddingBottom: '80vh'
                        }}
                    >
                        {creditsData.map((item, index) => {
                            if (item.type === 'separator') {
                                return (
                                    <div key={index} style={{
                                        width: '60px',
                                        height: '2px',
                                        background: 'linear-gradient(90deg, transparent, #f5af19, transparent)',
                                        margin: '1rem 0'
                                    }} />
                                );
                            }
                            if (item.type === 'spacer') {
                                return <div key={index} style={{ height: '4rem' }} />;
                            }
                            if (item.type === 'title') {
                                return (
                                    <h1 key={index} style={{
                                        fontSize: '4rem',
                                        background: 'linear-gradient(90deg, #f5af19, #f12711)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        margin: '2rem 0',
                                        textAlign: 'center'
                                    }}>
                                        {item.text}
                                    </h1>
                                );
                            }
                            if (item.type === 'header') {
                                return (
                                    <h2 key={index} style={{
                                        fontSize: '2rem',
                                        color: '#f5af19',
                                        letterSpacing: '8px',
                                        textTransform: 'uppercase',
                                        textAlign: 'center'
                                    }}>
                                        {item.text}
                                    </h2>
                                );
                            }
                            if (item.type === 'title-small') {
                                return (
                                    <h3 key={index} style={{
                                        fontSize: '1.5rem',
                                        color: '#a0aec0',
                                        textAlign: 'center'
                                    }}>
                                        {item.text}
                                    </h3>
                                );
                            }
                            if (item.type === 'quote') {
                                return (
                                    <p key={index} style={{
                                        fontSize: '1.4rem',
                                        color: '#fbbf24',
                                        fontStyle: 'italic',
                                        textAlign: 'center',
                                        maxWidth: '600px',
                                        lineHeight: '1.8'
                                    }}>
                                        "{item.text}"
                                    </p>
                                );
                            }
                            if (item.type === 'emphasis') {
                                return (
                                    <p key={index} style={{
                                        fontSize: '1.6rem',
                                        color: '#22c55e',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        letterSpacing: '2px'
                                    }}>
                                        {item.text}
                                    </p>
                                );
                            }
                            if (item.type === 'emphasis-large') {
                                return (
                                    <h2 key={index} style={{
                                        fontSize: '4rem',
                                        background: 'linear-gradient(90deg, #f5af19, #f12711)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: 'bold',
                                        letterSpacing: '8px',
                                        margin: '1rem 0'
                                    }}>
                                        {item.text}
                                    </h2>
                                );
                            }
                            if (item.type === 'thanks') {
                                return (
                                    <h2 key={index} style={{
                                        fontSize: '2.5rem',
                                        color: '#22c55e',
                                        textAlign: 'center',
                                        marginTop: '2rem'
                                    }}>
                                        {item.text}
                                    </h2>
                                );
                            }
                            if (item.type === 'developer') {
                                return (
                                    <h3 key={index} style={{
                                        fontSize: '2rem',
                                        color: '#fbbf24',
                                        textAlign: 'center'
                                    }}>
                                        {item.text}
                                    </h3>
                                );
                            }
                            if (item.type === 'final') {
                                return (
                                    <h1 key={index} style={{
                                        fontSize: index === creditsData.length - 1 ? '3rem' : '4rem',
                                        color: index === creditsData.length - 1 ? '#22c55e' : '#f5af19',
                                        letterSpacing: '4px',
                                        textAlign: 'center',
                                        margin: '1rem 0'
                                    }}>
                                        {item.text}
                                    </h1>
                                );
                            }
                            return (
                                <p key={index} style={{
                                    fontSize: '1.1rem',
                                    color: '#94a3b8',
                                    textAlign: 'center',
                                    maxWidth: '700px',
                                    lineHeight: '1.8'
                                }}>
                                    {item.text}
                                </p>
                            );
                        })}
                    </motion.div>
                </div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 124 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/instructions')}
                    style={{
                        position: 'absolute',
                        bottom: '5vh',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '1.2rem 3rem',
                        background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        letterSpacing: '2px',
                        zIndex: 10,
                        boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)'
                    }}
                >
                    Return to Hub
                </motion.button>

                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
                        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    }
                `}</style>
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
                    <ol style={{ color: '#a0aec0', fontSize: '1rem', lineHeight: '2.2', margin: 0 }}>
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
