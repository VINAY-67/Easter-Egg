import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import { gameRules, roundData, eventDetails } from '../assets/data';

const Instructions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const hasRound1 = user?.Scores?.['Round-1'] >= 1;
    const hasMazeCompleted = user?.HasPlayed?.['Round-1-maze'] === true;
    const hasSliderCompleted = user?.Scores?.['Round-1'] === 2;
    const hasRiddlesCompleted = user?.Scores?.['Round-2'] === 1 || user?.Round2Progress?.finalComplete === true;

    const getCurrentPhase = () => {
        if (!hasRound1) return 'minesweeper';
        if (!hasMazeCompleted) return 'maze';
        if (!hasSliderCompleted) return 'slider';
        if (!hasRiddlesCompleted) return 'riddles';
        return 'jasmine';
    };

    const currentPhase = getCurrentPhase();

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

                    {/* Phase 1: Minesweeper */}
                    {currentPhase === 'minesweeper' && (
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
                    )}

                    {/* Phase 2: Maze */}
                    {currentPhase === 'maze' && (
                        <>
                            <h3 style={{ color: '#00ff41', marginTop: '20px' }}>Round 1 - Level 2: Maze Escape</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px', border: '1px solid rgba(0,255,65,0.2)' }}>
                                <li>You are trapped in a dark maze. Find the <strong style={{ color: '#d63031' }}>Red Pulsing Core</strong> (exit).</li>
                                <li>Only a small area around you is visible. Explore carefully!</li>
                                <li><strong>Controls:</strong> Use <strong style={{ color: '#00ff41' }}>W A S D</strong> or <strong style={{ color: '#00ff41' }}>Arrow Keys</strong> to move.</li>
                                <li>Once you find the exit, you will proceed to the Slider puzzle.</li>
                            </ul>
                        </>
                    )}

                    {/* Phase 3: Slider */}
                    {currentPhase === 'slider' && (
                        <>
                            <h3 style={{ color: '#f1c40f', marginTop: '20px' }}>Round 1 - Level 3: Sequence Breaker</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px', border: '1px solid rgba(241, 196, 15, 0.2)' }}>
                                <li>Rearrange the tiles to solve the sliding puzzle.</li>
                                <li>Tiles must be in order 1-8 from top-left, with the empty space at bottom-right.</li>
                                <li>Click a tile adjacent to the empty space to move it.</li>
                                <li>Solving this will unlock Round 2: Riddle Mania!</li>
                            </ul>
                        </>
                    )}

                    {/* Phase 3: Riddles */}
                    {currentPhase === 'riddles' && (
                        <>
                            <h3 style={{ color: '#9b59b6', marginTop: '20px' }}>Round 2: Riddle Mania</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px', border: '1px solid rgba(155, 89, 182, 0.3)' }}>
                                <li>Solve three riddles to unlock the final round.</li>
                                <li>Each riddle will reveal a clue for the next.</li>
                                <li>Think carefully before answering - you have limited attempts!</li>
                                <li>Completing all riddles will unlock Round 3: The Jasmine Revelation.</li>
                            </ul>
                        </>
                    )}

                    {/* Phase 4: Jasmine */}
                    {currentPhase === 'jasmine' && (
                        <>
                            <h3 style={{ color: '#f5af19', marginTop: '20px' }}>Round 3: The Jasmine Revelation</h3>
                            <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px', border: '1px solid rgba(245, 175, 25, 0.3)' }}>
                                <li>Find the hidden word from the scrambled letters.</li>
                                <li>Select the correct letters in order.</li>
                                <li>The answer holds the key to the Jasmine!</li>
                                <li>Complete this final challenge to win the game!</li>
                            </ul>
                        </>
                    )}

                    {/* Progress Tracker */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{ padding: '20px', background: 'rgba(253, 203, 110, 0.1)', border: '1px solid rgba(253, 203, 110, 0.3)', borderRadius: '12px', marginTop: '30px' }}
                    >
                        <h4 style={{ marginBottom: '15px', color: '#f5f6fa' }}>Progress</h4>

                        {/* Round 1 - Minesweeper */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Round 1 - Level 1 (Minesweeper):</strong>
                            {hasRound1 ? <span style={{ color: '#55efc4', fontWeight: 'bold' }}>✅ Completed</span> : <span style={{ color: '#e17055', fontWeight: 'bold' }}>Not Started</span>}
                        </div>

                        {/* Round 1 - Maze */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Round 1 - Level 2 (Maze):</strong>
                            {hasMazeCompleted ? <span style={{ color: '#55efc4', fontWeight: 'bold' }}>✅ Completed</span> : hasRound1 ? <span style={{ color: '#f39c12', fontWeight: 'bold' }}>▶ Unlocked</span> : <span style={{ opacity: 0.5 }}>Locked</span>}
                        </div>

                        {/* Round 1 - Slider */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Round 1 - Level 3 (Slider):</strong>
                            {hasSliderCompleted ? <span style={{ color: '#55efc4', fontWeight: 'bold' }}>✅ Completed</span> : hasRound1 ? <span style={{ color: '#f39c12', fontWeight: 'bold' }}>🔒 LOCKED - It is there but hidden</span> : <span style={{ opacity: 0.5 }}>Locked</span>}
                        </div>

                        {/* Round 2 - Riddles */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong>Round 2 (Riddles):</strong>
                            {hasRiddlesCompleted ? <span style={{ color: '#55efc4', fontWeight: 'bold' }}>✅ Completed</span> : hasSliderCompleted ? <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>🔓 Unlocked</span> : <span style={{ opacity: 0.5 }}>Locked</span>}
                        </div>

                        {/* Round 3 - Jasmine */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>Round 3 (Jasmine):</strong>
                            {hasRiddlesCompleted ? <span style={{ color: '#f5af19', fontWeight: 'bold' }}>🔓 Unlocked</span> : <span style={{ opacity: 0.5 }}>Locked</span>}
                        </div>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '40px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>

                    {/* Start/Continue Round 1 */}
                    {!hasRound1 && (
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

                    {/* Play Maze (minesweeper done, maze not done) */}
                    {hasRound1 && !hasMazeCompleted && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(85, 239, 196, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/level2')}
                            className="styled-button"
                            style={{ background: 'linear-gradient(45deg, #00b894, #55efc4)' }}
                        >
                            Play Maze
                        </motion.button>
                    )}

                    {/* Play Slider (maze done, slider not done) */}
                    {hasMazeCompleted && !hasSliderCompleted && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(241, 196, 15, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/slider')}
                            className="styled-button"
                            style={{ background: 'linear-gradient(45deg, #f1c40f, #e67e22)' }}
                        >
                            Play Slider Puzzle
                        </motion.button>
                    )}

                    {hasSliderCompleted && !hasRiddlesCompleted && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(155, 89, 182, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/riddle-intro')}
                            className="styled-button"
                            style={{ background: 'linear-gradient(45deg, #8e44ad, #9b59b6)' }}
                        >
                            Go to Round 2
                        </motion.button>
                    )}

                    {hasRiddlesCompleted && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(245, 175, 25, 0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/jasmine-intro')}
                            className="styled-button"
                            style={{ background: 'linear-gradient(45deg, #f5af19, #f12711)' }}
                        >
                            Start Round 3 (Jasmine)
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Instructions;
