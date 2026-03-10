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
                    <p>{eventDetails.description}</p>

                    {!(user?.Scores?.['Round-1'] > 0 || user?.HasWon) ? (
                        <>
                            <h3 style={{ color: 'var(--secondary)', marginTop: '20px' }}>{eventDetails.subtitle}</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px' }}>
                                <li>The grid contains hidden <strong style={{ color: 'var(--danger)' }}>Jasmine</strong> images (fake, do not click!).</li>
                                <li>Your goal is to reveal all safe tiles.</li>
                                <li>Numbers guide you to how many Jasmine images are adjacent.</li>
                                <li>You have a maximum of <strong style={{ color: 'var(--accent)' }}>3 lives</strong>.</li>
                                <li>Right-click to place a flag 🌸 on suspected Jasmine tiles.</li>
                            </ul>
                        </>
                    ) : !(user?.Scores?.['Round-2'] > 0) ? (
                        <>
                            <h3 style={{ color: '#00ff41', marginTop: '20px' }}>Level 2 - Maze Escape</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px', border: '1px solid rgba(0,255,65,0.2)' }}>
                                <li>You are trapped in a dark maze. Find the <strong style={{ color: '#d63031' }}>Red Pulsing Core</strong> (exit).</li>
                                <li>Only a small area around you is visible. Explore carefully!</li>
                                <li><strong>Controls:</strong> Use <strong style={{ color: '#00ff41' }}>W A S D</strong> or <strong style={{ color: '#00ff41' }}>Arrow Keys</strong> to move.</li>
                                <li>Once you find the exit, a hidden clue will be revealed.</li>
                            </ul>
                        </>
                    ) : (
                        <>
                            <h3 style={{ color: '#f1c40f', marginTop: '20px' }}>Level 3 - S-Level Decoder</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px', border: '1px solid rgba(241, 196, 15, 0.2)' }}>
                                <li>Rearrange the tiles to solve the sliding puzzle.</li>
                                <li>Tiles must be in order 1-8 from top-left, with the empty space at bottom-right.</li>
                                <li>Click a tile adjacent to the empty space to move it.</li>
                                <li>Solving this will grant you final S-Level clearance.</li>
                            </ul>
                            {user?.Scores?.['Round-3'] > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ marginTop: '20px', padding: '20px', background: 'rgba(85, 239, 196, 0.1)', border: '1px solid rgba(85, 239, 196, 0.3)', borderRadius: '12px', textAlign: 'center' }}
                                >
                                    <p style={{ color: '#55efc4', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>
                                        First round completed. Wait for the second egg to appear
                                    </p>
                                </motion.div>
                            )}
                        </>
                    )}

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{ padding: '20px', background: 'rgba(253, 203, 110, 0.1)', border: '1px solid rgba(253, 203, 110, 0.3)', borderRadius: '12px', marginTop: '30px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Round 1:</strong>
                            {user?.Scores?.['Round-1'] > 0 || user?.HasWon ? <span style={{ color: 'var(--safe)', fontWeight: 'bold' }}>✅ Completed</span> : <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Ready</span>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Level 2:</strong>
                            {user?.Scores?.['Round-2'] > 0 ? <span style={{ color: 'var(--safe)', fontWeight: 'bold' }}>✅ Completed</span> : (user?.Scores?.['Round-1'] > 0 || user?.HasWon) ? <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Unlocked</span> : <span style={{ opacity: 0.5 }}>Locked</span>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>Level 3:</strong>
                            {user?.Scores?.['Round-3'] > 0 ? <span style={{ color: 'var(--safe)', fontWeight: 'bold' }}>✅ Completed</span> : <span style={{ opacity: 0.5 }}>Locked</span>}
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
