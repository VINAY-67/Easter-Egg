import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { eventDetails } from '../assets/data';
import { API } from "../backend";
import axios from 'axios';
import confetti from 'canvas-confetti';

const GRID_SIZE = 4; // 4x4 for 15-puzzle
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const PUZZLE_IMAGE = "./Jasmine.png";

const Slider = () => {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();

    const [tiles, setTiles] = useState([]);
    const [solved, setSolved] = useState(false);
    const [moves, setMoves] = useState(0);
    const [timer, setTimer] = useState(0);
    const [showInstructions, setShowInstructions] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        initGame();
    }, []);

    useEffect(() => {
        if (!solved && !showInstructions) {
            const interval = setInterval(() => setTimer(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [solved, showInstructions]);

    const initGame = () => {
        let initialTiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);
        let currentTiles = [...initialTiles];
        let emptyIdx = TOTAL_TILES - 1;

        for (let i = 0; i < 200; i++) {
            const adjacent = getAdjacentIndices(emptyIdx);
            const randomMove = adjacent[Math.floor(Math.random() * adjacent.length)];
            [currentTiles[emptyIdx], currentTiles[randomMove]] = [currentTiles[randomMove], currentTiles[emptyIdx]];
            emptyIdx = randomMove;
        }

        setTiles(currentTiles);
        setSolved(false);
        setMoves(0);
        setTimer(0);
    };

    const getAdjacentIndices = (index) => {
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        const adj = [];
        if (row > 0) adj.push(index - GRID_SIZE);
        if (row < GRID_SIZE - 1) adj.push(index + GRID_SIZE);
        if (col > 0) adj.push(index - 1);
        if (col < GRID_SIZE - 1) adj.push(index + 1);
        return adj;
    };

    const handleTileClick = (index) => {
        if (solved || showInstructions) return;

        const emptyIndex = tiles.indexOf(TOTAL_TILES - 1);
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
        const emptyCol = emptyIndex % GRID_SIZE;

        const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);

        if (isAdjacent) {
            const newTiles = [...tiles];
            [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
            setTiles(newTiles);
            setMoves(m => m + 1);

            if (checkWin(newTiles)) {
                handleWin();
            }
        }
    };

    const checkWin = (currentTiles) => {
        for (let i = 0; i < TOTAL_TILES; i++) {
            if (currentTiles[i] !== i) return false;
        }
        return true;
    };

    const handleWin = async () => {
        setSolved(true);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        setIsSaving(true);
        try {
            const response = await axios.put(`${API}/${user?.id}/updateuser`, {
                round: 'Round-3',
                action: 'complete'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                updateUser(response.data.user);
            }
        } catch (error) {
            console.error("Failed to save Level 3 score:", error);
        }
        setIsSaving(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="slider-root">
            <div className="vignette" />

            <motion.header
                initial={{ y: -100 }} animate={{ y: 0 }}
                className="game-header"
            >
                <div className="brand">
                    <div className="logo-glitch">0X-DECODE</div>
                    <div className="level-indicator">SEQUENCE BREAKER // LEVEL 03</div>
                </div>

                <div className="dash-metrics">
                    <div className="metric">
                        <span className="m-label">CYCLES</span>
                        <span className="m-value">{moves}</span>
                    </div>
                    <div className="metric">
                        <span className="m-label">RUNTIME</span>
                        <span className="m-value">{formatTime(timer)}</span>
                    </div>
                </div>
            </motion.header>

            <main className="stage">
                <div className="board-frame">
                    <div className="scanline" />
                    <div
                        className={`puzzle-board ${solved ? 'is-solved' : ''}`}
                        style={{
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            aspectRatio: '1/1'
                        }}
                    >
                        {!solved && tiles.map((tile, index) => {
                            const isEmpty = tile === TOTAL_TILES - 1;
                            const correctRow = Math.floor(tile / GRID_SIZE);
                            const correctCol = tile % GRID_SIZE;

                            const bgPosX = (correctCol / (GRID_SIZE - 1)) * 100;
                            const bgPosY = (correctRow / (GRID_SIZE - 1)) * 100;

                            return (
                                <motion.div
                                    key={tile}
                                    layout
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className={`tile-node ${isEmpty ? 'node-empty' : 'node-active'}`}
                                    onClick={() => handleTileClick(index)}
                                    whileHover={!isEmpty ? { scale: 1.02, filter: 'brightness(1.2)' } : {}}
                                    whileTap={!isEmpty ? { scale: 0.98 } : {}}
                                    style={!isEmpty ? {
                                        backgroundImage: `url(${PUZZLE_IMAGE})`,
                                        backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
                                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                                    } : {}}
                                >
                                    {!isEmpty && <div className="tile-edge" />}
                                    {!isEmpty && <span className="tile-id">{tile + 1}</span>}
                                </motion.div>
                            );
                        })}
                        {solved && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="solved-image"
                                style={{ backgroundImage: `url(${PUZZLE_IMAGE})` }}
                            />
                        )}
                    </div>
                </div>
            </main>

            <footer className="h-footer">
                <div className="instruction-text">
                    <span className="cmd-prefix">root@jasmine:~$</span> rearrange_image <span className="cursor-blink">_</span>
                </div>
            </footer>

            {/* Premium Instructions Modal */}
            <AnimatePresence>
                {showInstructions && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="prime-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.9, rotateY: 20 }}
                            animate={{ scale: 1, rotateY: 0 }}
                            className="briefing-box"
                        >
                            <div className="box-glow" />
                            <h2 className="glitch-text" data-text="MISSION BRIEFING">Rules</h2>
                            <div className="status-tag">SECURE-LEVEL CLEARANCE REQUIRED</div>

                            <div className="brief-content">
                                <p>An encrypted visual data packet has been found here. The fragment sequence is corrupted.</p>
                                <div className="intel-grid">
                                    <div className="intel-item">
                                        <span className="i-title">OBJECTIVE</span>
                                        <span className="i-body">Reconstruct the visual matrix</span>
                                    </div>
                                    <div className="intel-item">
                                        <span className="i-title">MECHANICS</span>
                                        <span className="i-body">Slide adjacent segments into the void</span>
                                    </div>
                                </div>
                                <div className="warning-note">
                                    // DECODING ATTEMPT WILL BE LOGGED. PROCEED WITH CAUTION.
                                </div>
                            </div>

                            <button className="prime-btn" onClick={() => setShowInstructions(false)}>
                                BEGIN DECRYPTION
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {solved && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="win-overlay"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="victory-vault"
                        >
                            <div className="vault-header">
                                <div className="v-icon">✨</div>
                                <h2>DECRYPTION SUCCESSFUL</h2>
                            </div>

                            <div className="data-readout">
                                <div className="r-item">
                                    <span className="r-label">TIME ELAPSED</span>
                                    <span className="r-data">{formatTime(timer)}</span>
                                </div>
                                <div className="r-item">
                                    <span className="r-label">CLUE UNLOCKED</span>
                                    <span className="r-data clue-highlight">"The next egg lies where developers speak to machines."</span>
                                </div>
                            </div>

                            <button className="vault-btn" onClick={() => navigate('/instructions')}>
                                RETURN TO HUB
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=JetBrains+Mono:wght@400;700&display=swap');

                :root {
                    --accent: #55efc4;
                    --gold: #fab1a0;
                    --bg: #0c0d10;
                    --panel: rgba(20, 21, 26, 0.7);
                    --glass: rgba(255, 255, 255, 0.03);
                    --border: rgba(255, 255, 255, 0.1);
                    --primary-glow: rgba(85, 239, 196, 0.3);
                }

                .slider-root {
                    background: var(--bg);
                    color: #fff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Space Grotesk', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .vignette {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%);
                    pointer-events: none;
                    z-index: 5;
                }

                .game-header {
                    padding: 1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--panel);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--border);
                    z-index: 10;
                }

                .logo-glitch {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 800;
                    font-size: 1.5rem;
                    letter-spacing: -1px;
                    color: var(--accent);
                    text-shadow: 2px 2px 0px rgba(225, 112, 85, 0.5);
                }

                .level-indicator {
                    font-size: 0.7rem;
                    letter-spacing: 3px;
                    color: rgba(255,255,255,0.4);
                    margin-top: 2px;
                }

                .dash-metrics {
                    display: flex;
                    gap: 3rem;
                }

                .metric {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                .m-label {
                    font-size: 0.6rem;
                    letter-spacing: 2px;
                    color: rgba(255,255,255,0.3);
                    font-weight: 700;
                }

                .m-value {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--gold);
                }

                .stage {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                }

                .board-frame {
                    padding: 10px;
                    background: #1a1c23;
                    border: 1px solid var(--border);
                    position: relative;
                    border-radius: 4px;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }

                .scanline {
                    position: absolute;
                    top: 0; left: 0; right:0; bottom:0;
                    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.05) 50%);
                    background-size: 100% 4px;
                    pointer-events: none;
                    z-index: 6;
                }

                .puzzle-board {
                    display: grid;
                    gap: 6px;
                    width: 85vmin;
                    height: 85vmin;
                    max-width: 550px;
                    max-height: 550px;
                    background: #000;
                    position: relative;
                    transition: all 0.5s ease;
                }

                .puzzle-board.is-solved {
                    gap: 0;
                    box-shadow: 0 0 50px var(--primary-glow);
                }

                .tile-node {
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                    border-radius: 2px;
                }

                .node-active {
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
                }

                .tile-edge {
                    position: absolute;
                    inset: 0;
                    border: 1px solid rgba(255,255,255,0.1);
                    pointer-events: none;
                }

                .tile-id {
                    position: absolute;
                    bottom: 4px; right: 6px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.6rem;
                    color: rgba(255,255,255,0.2);
                    font-weight: 700;
                }

                .solved-image {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    z-index: 10;
                }

                .h-footer {
                    padding: 1.5rem;
                    background: #0a0b0e;
                    border-top: 1px solid var(--border);
                    text-align: center;
                }

                .instruction-text {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                }

                .cmd-prefix { color: var(--accent); }
                .cursor-blink { animation: blink 1s step-end infinite; }
                @keyframes blink { 50% { opacity: 0; } }

                .prime-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(12, 13, 16, 0.95);
                    backdrop-filter: blur(20px);
                    z-index: 100;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                }

                .briefing-box {
                    max-width: 500px;
                    width: 100%;
                    background: #14161a;
                    border: 1px solid var(--border);
                    padding: 3rem;
                    position: relative;
                    perspective: 1000px;
                }

                .box-glow {
                    position: absolute;
                    inset: -1px;
                    background: linear-gradient(45deg, var(--accent), transparent, var(--gold));
                    opacity: 0.2;
                    z-index: -1;
                }

                .glitch-text {
                    font-weight: 900;
                    font-size: 2rem;
                    letter-spacing: 2px;
                    margin-bottom: 0.5rem;
                    position: relative;
                    color: #fff;
                }

                .status-tag {
                    color: var(--gold);
                    font-size: 0.6rem;
                    letter-spacing: 3px;
                    font-weight: 700;
                    margin-bottom: 2rem;
                }

                .brief-content p {
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.7);
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .intel-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }

                .i-title {
                    display: block;
                    font-size: 0.6rem;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 4px;
                    letter-spacing: 1px;
                }

                .i-body {
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .warning-note {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.7rem;
                    color: #e17055;
                    padding: 1rem;
                    background: rgba(225, 112, 85, 0.05);
                    border-left: 2px solid #e17055;
                }

                .prime-btn {
                    width: 100%;
                    padding: 1rem;
                    margin-top: 3rem;
                    background: #fff;
                    color: #000;
                    border: none;
                    font-weight: 800;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .prime-btn:hover { background: var(--accent); }

                .win-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    background: rgba(12, 13, 16, 0.9);
                    backdrop-filter: blur(40px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .victory-vault {
                    max-width: 600px;
                    width: 90%;
                    background: #14161a;
                    border: 1px solid var(--accent);
                    padding: 4rem;
                    text-align: center;
                }

                .v-icon { font-size: 3rem; margin-bottom: 1rem; }
                .victory-vault h2 { 
                    font-weight: 900; 
                    letter-spacing: 4px; 
                    color: var(--accent);
                    margin: 0;
                }

                .data-readout {
                    margin: 3rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .clue-highlight {
                    color: #fff;
                    font-style: italic;
                    font-size: 1.3rem !important;
                    margin-top: 10px;
                    display: block;
                }

                .r-label {
                    font-size: 0.6rem;
                    color: rgba(255,255,255,0.4);
                    letter-spacing: 2px;
                }

                .r-data {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .vault-btn {
                    background: transparent;
                    border: 1px solid var(--accent);
                    color: var(--accent);
                    padding: 1rem 3rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .vault-btn:hover { background: var(--accent); color: #000; }

                @media (max-width: 768px) {
                    .game-header { padding: 1rem; }
                    .dash-metrics { gap: 1.5rem; }
                    .stage { padding: 1rem; }
                    .board-frame { padding: 5px; }
                    .briefing-box { padding: 2rem; }
                    .glitch-text { font-size: 1.5rem; }
                    .i-body { font-size: 0.75rem; }
                    .victory-vault { padding: 2rem; }
                    .r-data { font-size: 1.1rem; }
                }
            `}</style>
        </div>
    );
};

export default Slider;
