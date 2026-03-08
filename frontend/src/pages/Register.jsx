import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { API } from '../backend';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
 
            const data = await res.json();

            if (!res.ok) {
                throw new  Error(data.message || 'Registration failed');
            }

            // Registration success, navigate to login
            navigate('/', { state: { message: 'Registration successful! Please login.' } });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="login-form glassmorphism"
            >
                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ background: 'linear-gradient(90deg, #55efc4, #00b894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}
                >
                    Register Player
                </motion.h1>
                <p style={{ color: '#a4b0be', marginBottom: '20px' }}>Sign up to join the Easter Egg Hunt</p>

                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{error}</motion.div>}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <input
                            className="styled-input"
                            type="text"
                            placeholder="Player Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <input
                            className="styled-input"
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <input
                            className="styled-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(85, 239, 196, 0.6)" }}
                        whileTap={{ scale: 0.95 }}
                        className="styled-button"
                        style={{ background: 'linear-gradient(45deg, #00b894, #55efc4)' }}
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : 'Complete Sign Up'}
                    </motion.button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#a4b0be' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login here</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
