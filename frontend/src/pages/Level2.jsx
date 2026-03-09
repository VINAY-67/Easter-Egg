import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { eventDetails, } from '../assets/data';
import {API} from "../backend"
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import confetti from 'canvas-confetti';

const CLUE = "The next egg lies where developers speak to machines.";

const Level2 = () => {
    const navigate = useNavigate();
    const { maze, playerPos, exitPos, movePlayer, generateMaze, gameWon, ROWS, COLS } = useMaze(25, 25);

    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(true);
    const timerRef = useRef(null);

    // Vision radius
    const VISION_RADIUS = 3.5;

    useEffect(() => {
        if (isRunning && !gameWon) {
            timerRef.current = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, gameWon]);

    const { user, token, updateUser } = useAuth();
    const [scoreSaved, setScoreSaved] = useState(false);

    useEffect(() => {
        if (gameWon && !scoreSaved) {
            setIsRunning(false);
            setScoreSaved(true);

            // Update backend
            const updateScore = async () => {
                try {
                    const response = await axios.post(`${API}/${user?._id}/updateuser`, {
                        scores: { ...user?.Scores, 'Round-2': 100 }
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data.success) {
                        updateUser({ Scores: { ...user?.Scores, 'Round-2': 100 } });
                    }
                } catch (error) {
                    console.error("Failed to save Level 2 score:", error);
                }
            };
            updateScore();

            // Trigger celebration
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#00ff41', '#f1c40f', '#d63031']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#00ff41', '#f1c40f', '#d63031']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // Navigate back to instructions after celebration
            setTimeout(() => {
                navigate('/instructions');
            }, 5000);
        }
    }, [gameWon, navigate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isRunning || gameWon) return;
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': movePlayer(-1, 0); break;
                case 'ArrowDown': case 's': case 'S': movePlayer(1, 0); break;
                case 'ArrowLeft': case 'a': case 'A': movePlayer(0, -1); break;
                case 'ArrowRight': case 'd': case 'D': movePlayer(0, 1); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, gameWon, movePlayer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isVisible = (r, c) => {
        const dist = Math.sqrt(Math.pow(r - playerPos.r, 2) + Math.pow(c - playerPos.c, 2));
        return dist <= VISION_RADIUS;
    };

    return (
        <div className="maze-level-wrapper">
            <div className="game-header-bar glassmorphism">
                <div className="title-area">
                    <h1>{eventDetails.level2Subtitle}</h1>
                    <div className="badge">Level 2 – Exploration</div>
                </div>
                <div className="stats-area">
                    <div className="stat-box">
                        <span className="label">EST. TIME</span>
                        <span className="value">{formatTime(timer)}</span>
                    </div>
                </div>
            </div>

            <main className="maze-viewport">
                <div
                    className="maze-grid"
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                    }}
                >
                    {maze.map((row, r) => (
                        row.map((cell, c) => {
                            const visible = isVisible(r, c);
                            const isPlayer = playerPos.r === r && playerPos.c === c;
                            const isExit = exitPos.r === r && exitPos.c === c;

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={`maze-cell ${cell === 1 ? 'wall' : 'path'} ${visible ? 'visible' : 'hidden'}`}
                                >
                                    {visible && isPlayer && (
                                        <motion.div
                                            layoutId="player"
                                            className="player-token"
                                        />
                                    )}
                                    {visible && isExit && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="exit-token"
                                        />
                                    )}
                                </div>
                            );
                        })
                    ))}
                </div>
            </main>

            <footer className="game-footer">
                <p>Find the <span className="highlight-danger">Red Pulsing Core</span> in the darkness</p>
                <div className="control-keys">
                    <span className="key">W</span>
                    <span className="key">A</span>
                    <span className="key">S</span>
                    <span className="key">D</span>
                    <span className="hint">to move</span>
                </div>
            </footer>

            <AnimatePresence>
                {gameWon && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="win-banner-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }}
                            className="win-card glassmorphism"
                        >
                            <div className="egg-icon">🥚</div>
                            <h1>EGG DISCOVERED!</h1>
                            <p className="congrats">Mission Accomplished in {formatTime(timer)}</p>

                            <div className="clue-box">
                                <p className="clue-label">S-LEVEL CLEARANCE CLUE:</p>
                                <p className="clue-text">"{CLUE}"</p>
                            </div>

                            <p className="redirect-notice">Returning to command center in 5s...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .maze-level-wrapper {
                    background-color: #050505;
                    color: #00ff41;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Outfit', sans-serif;
                    overflow: hidden;
                }

                .game-header-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    border-bottom: 2px solid rgba(0, 255, 65, 0.2);
                    z-index: 10;
                }

                .title-area h1 {
                    margin: 0;
                    font-size: 1.5rem;
                    letter-spacing: 2px;
                    text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
                }

                .badge {
                    background: rgba(0, 255, 65, 0.1);
                    color: #00ff41;
                    padding: 2px 10px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    display: inline-block;
                    margin-top: 4px;
                    border: 1px solid rgba(0, 255, 65, 0.3);
                }

                .stat-box {
                    text-align: right;
                }

                .stat-box .label {
                    display: block;
                    font-size: 0.6rem;
                    color: rgba(0, 255, 65, 0.6);
                }

                .stat-box .value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    font-variant-numeric: tabular-nums;
                }

                .maze-viewport {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 1rem;
                    background: radial-gradient(circle at center, #111 0%, #000 100%);
                }

                .maze-grid {
                    display: grid;
                    width: 90vmin;
                    height: 90vmin;
                    background: #000;
                    border: 4px solid #111;
                    box-shadow: 0 0 50px rgba(0, 255, 65, 0.1);
                }

                .maze-cell {
                    width: 100%;
                    height: 100%;
                    transition: background-color 0.4s;
                }

                .maze-cell.hidden {
                    background-color: #000;
                }

                .maze-cell.visible.wall {
                    background-color: #1a1a1a;
                    border: 0.5px solid rgba(0, 255, 65, 0.05);
                }

                .maze-cell.visible.path {
                    background-color: transparent;
                }

                .player-token {
                    width: 80%;
                    height: 80%;
                    margin: 10%;
                    background: #00ff41;
                    box-shadow: 0 0 15px #00ff41, 0 0 30px #00ff41;
                    border-radius: 4px;
                }

                .exit-token {
                    width: 80%;
                    height: 80%;
                    margin: 10%;
                    background: #d63031;
                    box-shadow: 0 0 15px #d63031, 0 0 30px #d63031;
                    border-radius: 50%;
                }

                .game-footer {
                    padding: 1.5rem;
                    text-align: center;
                    border-top: 1px solid rgba(0, 255, 65, 0.1);
                }

                .highlight-danger {
                    color: #d63031;
                    font-weight: bold;
                    text-shadow: 0 0 10px rgba(214, 48, 49, 0.4);
                }

                .control-keys {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .key {
                    background: rgba(0, 255, 65, 0.1);
                    border: 1px solid rgba(0, 255, 65, 0.4);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 0.8rem;
                }

                .hint {
                    color: rgba(0, 255, 65, 0.5);
                    font-size: 0.8rem;
                    margin-left: 0.5rem;
                }

                .win-banner-overlay {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(12px);
                }

                .win-card {
                    padding: 3rem;
                    text-align: center;
                    max-width: 500px;
                    border-color: #f1c40f;
                    border-width: 2px;
                    box-shadow: 0 0 50px rgba(241, 196, 15, 0.3);
                }

                .egg-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    filter: drop-shadow(0 0 20px #f1c40f);
                }

                .win-card h1 {
                    color: #f1c40f;
                    margin: 0;
                    letter-spacing: 5px;
                }

                .congrats {
                    color: rgba(241, 196, 15, 0.8);
                    margin-bottom: 2rem;
                }

                .clue-box {
                    background: rgba(241, 196, 15, 0.05);
                    border: 1px dashed #f1c40f;
                    padding: 1.5rem;
                    margin: 1rem 0;
                }

                .clue-label {
                    font-size: 0.7rem;
                    letter-spacing: 2px;
                    margin-bottom: 0.5rem;
                }

                .clue-text {
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0;
                }

                .redirect-notice {
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.4);
                    margin-top: 2rem;
                }

                .glassmorphism {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                }

                @media (max-width: 768px) {
                    .maze-grid {
                        width: 95vw;
                        height: 95vw;
                    }
                }
            `}</style>
        </div>
    );
};

export default Level2;

