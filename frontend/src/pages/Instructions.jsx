import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import { gameRules, roundData, eventDetails } from '../assets/data';

const Instructions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="instructions-container glassmorphism"
                style={{ maxWidth: '800px', width: '100%' }}
            >
                <motion.h1
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    style={{ background: 'linear-gradient(90deg, #fdcb6e, #e17055)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}
                >
                    Welcome, {user?.name}!
                </motion.h1>

                <div style={{ textAlign: 'left', width: '100%', lineHeight: '1.8', color: '#dcdde1', fontSize: '1.1rem' }}>
                    <h2 style={{ color: '#f5f6fa', borderBottom: '2px solid rgba(253, 203, 110, 0.3)', paddingBottom: '10px' }}>Event: Find the Jasmine</h2>
                    <p>This is an Easter Egg hunt based game comprising 3 rounds.</p>

                    <h3 style={{ color: 'var(--secondary)', marginTop: '20px' }}>Round 1 (Level 1) - Minesweeper Style</h3>
                    <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px' }}>
                        <li>The grid contains hidden <strong style={{ color: 'var(--danger)' }}>Jasmine</strong> images (these are fake, do not click them!).</li>
                        <li>Your goal is to reveal all safe tiles.</li>
                        <li>Numbers will guide you to how many Jasmine images are adjacent.</li>
                        <li>You have a maximum of <strong style={{ color: 'var(--accent)' }}>3 lives</strong>. Clicking a Jasmine loses a life.</li>
                        <li>Right-click to place a flag 🌸 on suspected Jasmine tiles.</li>
                        <li>If you lose 3 lives, you are eliminated!</li>
                    </ul>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{ padding: '20px', background: 'rgba(253, 203, 110, 0.1)', border: '1px solid rgba(253, 203, 110, 0.3)', borderRadius: '12px', marginTop: '30px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Round 1:</strong>
                            {user?.Scores?.['Round-1'] > 0 || user?.HasWon ? (
                                <span style={{ color: 'var(--safe)', fontWeight: 'bold' }}>✅ Completed</span>
                            ) : (
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Ready to play</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', opacity: (user?.Scores?.['Round-1'] > 0 || user?.HasWon) ? 1 : 0.5 }}>
                            <strong>Round 2:</strong>
                            {(user?.Scores?.['Round-1'] > 0 || user?.HasWon) ? (
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Unlocked</span>
                            ) : (
                                <span>Complete Round 1 first...</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                            <strong>Round 3:</strong> <span>Coming Soon...</span>
                        </div>
                    </motion.div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '40px', width: '100%', justifyContent: 'center' }}>
                    {(user?.Scores?.['Round-1'] > 0 || user?.HasWon) ? (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(85, 239, 196, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/level2')}
                            className="styled-button"
                            style={{ background: 'linear-gradient(45deg, #00b894, #55efc4)' }}
                        >
                            Proceed to Level 2
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(253, 203, 110, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/game')}
                            className="styled-button"
                            style={{ background: 'linear-gradient(45deg, #e17055, #fdcb6e)' }}
                        >
                            Start Round 1
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Instructions;
