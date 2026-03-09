import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import { API } from '../backend';

const Login = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { login, intendedPath, setIntendedPath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear state so it doesn't persist on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            login(data.user, data.token);

            if (data.user.isLocked) {
                navigate('/locked');
            } else if (intendedPath) {
                const path = intendedPath;
                setIntendedPath(null);
                navigate(path);
            } else {
                navigate('/instructions');
            }

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
                    style={{ background: 'linear-gradient(90deg, #fdcb6e, #e17055)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}
                >
                    Find the Jasmine
                </motion.h1>
                <p style={{ color: '#a4b0be', marginBottom: '20px' }}>Enter your credentials to start the Easter Egg Hunt</p>

                {successMessage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--safe)', fontWeight: 'bold' }}>{successMessage}</motion.div>}
                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{error}</motion.div>}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '300px', position: 'relative' }}>
                        <input
                            className="styled-input"
                            type="text"
                            placeholder="Player Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ width: '100%', maxWidth: '300px', position: 'relative' }}>
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
                        whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(253, 203, 110, 0.6)" }}
                        whileTap={{ scale: 0.95 }}
                        className="styled-button"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Decrypting...' : 'Join Hunt'}
                    </motion.button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#a4b0be' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register here</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
