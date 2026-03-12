import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { round2Rules, round2Levels } from '../assets/data';

const RiddleIntro = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const round2Progress = user?.Round2Progress || {};
    const level1Complete = round2Progress?.level1Complete || false;
    const level2Complete = round2Progress?.level2Complete || false;
    const finalComplete = round2Progress?.finalComplete || false;

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="riddle-intro-container"
                style={{ maxWidth: '800px', width: '100%' }}
            >
                <motion.h1
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    style={{
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textAlign: 'center',
                        marginBottom: '10px'
                    }}
                >
                    The Cipher Path
                </motion.h1>

                <p style={{ color: '#a0aec0', textAlign: 'center', marginBottom: '30px', fontSize: '1.1rem' }}>
                    A mysterious challenge awaits those who have proven themselves...
                </p>

                <div style={{ textAlign: 'left', width: '100%', lineHeight: '1.8', color: '#e2e8f0' }}>
                    <h2 style={{ color: '#f5f6fa', borderBottom: '2px solid rgba(102, 126, 234, 0.3)', paddingBottom: '10px' }}>
                        Rules of the Cipher Path
                    </h2>
                    
                    <ul style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 40px', borderRadius: '12px' }}>
                        {round2Rules.map((rule) => (
                            <li key={rule.id} style={{ marginBottom: '10px', color: '#cbd5e0' }}>
                                {rule.text}
                            </li>
                        ))}
                    </ul>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{ 
                            padding: '20px', 
                            background: 'rgba(102, 126, 234, 0.1)', 
                            border: '1px solid rgba(102, 126, 234, 0.3)', 
                            borderRadius: '12px', 
                            marginTop: '30px' 
                        }}
                    >
                        <h3 style={{ color: '#667eea', marginTop: 0 }}>Your Progress</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{round2Levels.level1.name}:</strong>
                                <span style={{ 
                                    color: level1Complete ? '#22c55e' : '#718096', 
                                    fontWeight: 'bold' 
                                }}>
                                    {level1Complete ? '✅ Completed' : '❌ Not Started'}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{round2Levels.level2.name}:</strong>
                                <span style={{ 
                                    color: level2Complete ? '#22c55e' : level1Complete ? '#fbbf24' : '#718096', 
                                    fontWeight: 'bold' 
                                }}>
                                    {level2Complete ? '✅ Completed' : level1Complete ? '🔓 Unlocked' : '🔒 Locked'}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{round2Levels.final.name}:</strong>
                                <span style={{ 
                                    color: finalComplete ? '#22c55e' : (level1Complete && level2Complete) ? '#fbbf24' : '#718096', 
                                    fontWeight: 'bold' 
                                }}>
                                    {finalComplete ? '✅ Completed' : (level1Complete && level2Complete) ? '🔓 Unlocked' : '🔒 Locked'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {round2Progress?.clue1 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ 
                                marginTop: '20px', 
                                padding: '15px', 
                                background: 'rgba(251, 191, 36, 0.1)', 
                                border: '1px solid rgba(251, 191, 36, 0.3)', 
                                borderRadius: '12px' 
                            }}
                        >
                            <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                                Clue 1 Collected:
                            </p>
                            <p style={{ color: '#fbbf24', fontSize: '1.5rem', margin: 0, fontFamily: 'monospace', letterSpacing: '3px' }}>
                                {round2Progress.clue1}
                            </p>
                        </motion.div>
                    )}

                    {round2Progress?.clue2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ 
                                marginTop: '15px', 
                                padding: '15px', 
                                background: 'rgba(251, 191, 36, 0.1)', 
                                border: '1px solid rgba(251, 191, 36, 0.3)', 
                                borderRadius: '12px' 
                            }}
                        >
                            <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                                Clue 2 Collected:
                            </p>
                            <p style={{ color: '#fbbf24', fontSize: '1.5rem', margin: 0, fontFamily: 'monospace', letterSpacing: '3px' }}>
                                {round2Progress.clue2}
                            </p>
                        </motion.div>
                    )}
                </div>

                <div style={{ marginTop: '40px', width: '100%', textAlign: 'center' }}>
                    <p style={{ color: '#718096', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        The path reveals itself to those who seek...
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(102, 126, 234, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="styled-button"
                        style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}
                    >
                        Return
                    </motion.button>
                </div>
            </motion.div>

            <style>{`
                .riddle-intro-container {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

export default RiddleIntro;
