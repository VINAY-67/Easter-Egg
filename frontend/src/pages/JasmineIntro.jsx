import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const JasmineIntro = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const round3Progress = user?.Round3Progress || {};
    const levelComplete = round3Progress?.levelComplete || false;

    const handleStartRound = () => {
        navigate('/jasmine-revelation');
    };

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="jasmine-intro-container"
                style={{ maxWidth: '800px', width: '100%' }}
            >
                <motion.h1
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    style={{
                        background: 'linear-gradient(90deg, #f5af19, #f12711)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textAlign: 'center',
                        marginBottom: '10px'
                    }}
                >
                    The Jasmine Revelation
                </motion.h1>

                <p style={{ color: '#a0aec0', textAlign: 'center', marginBottom: '30px', fontSize: '1.1rem' }}>
                    The final chapter awaits. All your collected clues converge here...
                </p>

                <div style={{ textAlign: 'left', width: '100%', lineHeight: '1.8', color: '#e2e8f0' }}>
                    <h2 style={{ color: '#f5f6fa', borderBottom: '2px solid rgba(245, 175, 25, 0.3)', paddingBottom: '10px' }}>
                        Final Round Rules
                    </h2>
                    
                    <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px' }}>
                        <li style={{ marginBottom: '10px', color: '#cbd5e0' }}>
                            Use <strong style={{ color: '#f5af19' }}>all clues</strong> collected from Round 1 & Round 2
                        </li>
                        <li style={{ marginBottom: '10px', color: '#cbd5e0' }}>
                            Decode the hidden message to reveal the <strong style={{ color: '#f12711' }}>Jasmine</strong>
                        </li>
                        <li style={{ marginBottom: '10px', color: '#cbd5e0' }}>
                            You have <strong style={{ color: '#ef4444' }}>3 attempts</strong> only
                        </li>
                        <li style={{ marginBottom: '10px', color: '#cbd5e0' }}>
                            Wrong answers trigger <strong style={{ color: '#ef4444' }}>6-hour lockout</strong>
                        </li>
                        <li style={{ marginBottom: '10px', color: '#cbd5e0' }}>
                            Success reveals the <strong style={{ color: '#22c55e' }}>final reward</strong>
                        </li>
                    </ul>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{ 
                            padding: '20px', 
                            background: 'rgba(245, 175, 25, 0.1)', 
                            border: '1px solid rgba(245, 175, 25, 0.3)', 
                            borderRadius: '12px', 
                            marginTop: '30px' 
                        }}
                    >
                        <h3 style={{ color: '#f5af19', marginTop: 0 }}>Your Progress</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>The Jasmine:</strong>
                                <span style={{ 
                                    color: levelComplete ? '#22c55e' : '#f12711', 
                                    fontWeight: 'bold' 
                                }}>
                                    {levelComplete ? '✅ REVEALED' : '🔒 Hidden'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {levelComplete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ 
                                marginTop: '20px', 
                                padding: '20px', 
                                background: 'rgba(34, 197, 94, 0.1)', 
                                border: '1px solid rgba(34, 197, 94, 0.3)', 
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}
                        >
                            <p style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>
                                🏆 You have conquered the Easter Egg Hunt!
                            </p>
                        </motion.div>
                    )}
                </div>

                <div style={{ marginTop: '40px', width: '100%', textAlign: 'center' }}>
                    {!levelComplete && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(245, 175, 25, 0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStartRound}
                            className="styled-button"
                            style={{ 
                                background: 'linear-gradient(45deg, #f5af19, #f12711)',
                                padding: '1rem 3rem',
                                fontSize: '1.1rem'
                            }}
                        >
                            Begin The Revelation
                        </motion.button>
                    )}
                    
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/instructions')}
                        className="styled-button"
                        style={{ 
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            marginTop: levelComplete ? '20px' : '0',
                            marginLeft: levelComplete ? '20px' : '0'
                        }}
                    >
                        Return to Hub
                    </motion.button>
                </div>
            </motion.div>

            <style>{`
                .jasmine-intro-container {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    border: 1px solid rgba(245, 175, 25, 0.2);
                }

                .styled-button {
                    border: none;
                    border-radius: 8px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: #000;
                }

                @media (max-width: 768px) {
                    .jasmine-intro-container {
                        padding: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default JasmineIntro;
