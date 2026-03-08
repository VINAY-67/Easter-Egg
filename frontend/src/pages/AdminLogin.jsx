import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { API } from '../backend';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch(`${API}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Admin login failed');
            }

            // Ensure the backend returned the admin object with role='admin'
            if (data.admin) {
                login(data.admin, data.token);
                navigate('/dashboard');
            } else {
                throw new Error('Admin context missing from response');
            }

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-container glassmorphism"
            >
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 style={{ color: 'var(--accent)' }}>Admin Portal</h1>
                    <p style={{ color: '#dcdde1', opacity: 0.8 }}>Master control access only</p>
                </div>

                {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="Admin Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="styled-input"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="styled-input"
                        required
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="styled-button"
                        style={{ marginTop: '10px' }}
                    >
                        Login as Admin
                    </motion.button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', opacity: 0.7 }}>
                    <p style={{ fontSize: '0.9rem' }}>
                        Not an admin? <span style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/')}>Play the Game</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
