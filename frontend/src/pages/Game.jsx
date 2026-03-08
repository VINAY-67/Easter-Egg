import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../hooks/useGame';
import Cell from '../components/Cell';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Particles from '../components/Particles';

const Game = () => {
    const { user, token, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { board, revealCell, toggleFlag, initBoard, lossPending, winPending, setWinPending, setLossPending, ROWS, COLS } = useGame();

    const [lives, setLives] = useState(3 - (user?.numberofTries?.['Round-1'] || 0));
    const [showLossOverlay, setShowLossOverlay] = useState(false);
    const [showWinOverlay, setShowWinOverlay] = useState(false);
    const startApiCalled = useRef(false);

    // Initialize / Start Round mocked
    useEffect(() => {
        if (!startApiCalled.current && user) {
            startApiCalled.current = true;
            console.log("Mock: Game Started");
        }
    }, [user]);

    // Handle Loss
    useEffect(() => {
        if (lossPending) {
            setLossPending(false);

            const newLives = lives - 1;
            setLives(newLives);

            if (newLives <= 0) {
                updateUser({ ...user, isLocked: true });
                navigate('/locked');
            } else {
                updateUser({
                    ...user,
                    numberofTries: {
                        ...user.numberofTries,
                        'Round-1': 3 - newLives
                    }
                });
                setShowLossOverlay(true);
            }
        }
    }, [lossPending, user, updateUser, navigate, setLossPending, lives]);

    // Handle Win
    useEffect(() => {
        if (winPending) {
            setWinPending(false);
            updateUser({ ...user, HasWon: true });
            setShowWinOverlay(true);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }, [winPending, user, updateUser, setWinPending]);

    const handleRestart = () => {
        setShowLossOverlay(false);
        initBoard();
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', padding: '20px' }}>
            <Particles />
            <div className="game-container">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="top-bar glassmorphism"
                >
                    <div className="lives-container">{'❤️'.repeat(lives)}</div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="styled-button-outline"
                        style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '8px 16px' }}
                    >
                        Logout
                    </motion.button>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="board"
                    style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
                >
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <Cell
                                key={`${r}-${c}`}
                                cellData={cell}
                                onClick={() => revealCell(r, c)}
                                onContextMenu={(e) => toggleFlag(r, c, e)}
                            />
                        ))
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{ color: '#a4b0be', fontSize: '1rem', background: 'rgba(0,0,0,0.3)', padding: '10px 20px', borderRadius: '20px' }}
                >
                    Right click to flag (<span style={{ filter: 'drop-shadow(0 0 5px pink)' }}>🌸</span>) suspected jasmine cells
                </motion.div>

                <AnimatePresence>
                    {showLossOverlay && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="overlay"
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
                                className="overlay-content"
                            >
                                <h2 style={{ color: 'var(--danger)', textShadow: '0 0 20px rgba(255, 118, 117, 0.5)' }}>Ouch!</h2>
                                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>You hit a Jasmine! You lost a life.</p>
                                <div style={{ fontSize: '2rem', margin: '20px 0', letterSpacing: '5px' }}>
                                    {'❤️'.repeat(lives)}
                                    <span style={{ opacity: 0.3 }}>{'💔'.repeat(3 - lives)}</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleRestart}
                                    className="styled-button"
                                    style={{ background: 'linear-gradient(45deg, #e17055, #ff7675)' }}
                                >
                                    Regroup & Try Again
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}

                    {showWinOverlay && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="overlay"
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
                                className="overlay-content"
                            >
                                <h2 style={{ color: 'var(--safe)', textShadow: '0 0 20px rgba(85, 239, 196, 0.5)' }}>You Won!</h2>
                                <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>You successfully found the Easter Egg by avoiding all Jasmine traps!</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/level2')}
                                    className="styled-button"
                                    style={{ background: 'linear-gradient(45deg, #00b894, #55efc4)' }}
                                >
                                    Proceed to Level 2
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Game;
