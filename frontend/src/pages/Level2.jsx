import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles from '../components/Particles';

const Level2 = () => {
    const navigate = useNavigate();

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Particles />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="level2-container glassmorphism"
            >
                <h1 style={{ fontSize: '4rem', background: 'linear-gradient(90deg, #fdcb6e, #e17055)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Level 2</h1>
                <motion.h2
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ letterSpacing: '8px', textTransform: 'uppercase', color: '#a4b0be' }}
                >
                    Coming Soon...
                </motion.h2>
                <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#dfe6e9', textAlign: 'center', maxWidth: '400px' }}>
                    The hunt continues! But our engineers are still hiding the eggs in this level.
                    Check back later!
                </p>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/instructions')}
                    className="styled-button-outline"
                    style={{ marginTop: '30px' }}
                >
                    Back to Instructions
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Level2;
