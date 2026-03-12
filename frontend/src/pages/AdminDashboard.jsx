import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import { API } from '../backend';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If not admin, boot them
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchDashboards = async () => {
            try {
                const res = await fetch(`${API}/admin/${user._id}/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard');

                setUsers(data.players || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboards();
    }, [user, token, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', padding: '40px 20px', color: '#dcdde1' }}>

            <div className="glassmorphism" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                    <h1 style={{ background: 'linear-gradient(90deg, #fdcb6e, #e17055)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Admin Control Panel
                    </h1>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="styled-button-outline"
                        style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                        Log Out
                    </motion.button>
                </div>

                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)', marginBottom: '20px' }}>{error}</motion.div>}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading player data...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--primary)' }}>
                                    <th style={{ padding: '15px' }}>Name</th>
                                    <th style={{ padding: '15px' }}>Email</th>
                                    <th style={{ padding: '15px' }}>Status</th>
                                    <th style={{ padding: '15px' }}>Round</th>
                                    <th style={{ padding: '15px' }}>Level</th>
                                    <th style={{ padding: '15px' }}>Matches Played</th>
                                    <th style={{ padding: '15px' }}>Has Won</th>
                                    <th style={{ padding: '15px' }}>Round-2</th>
                                    <th style={{ padding: '15px' }}>Locked Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <motion.tr
                                        key={u.id || u._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                                    >
                                        <td style={{ padding: '15px' }}>{u.name}</td>
                                        <td style={{ padding: '15px', color: '#a4b0be' }}>{u.email}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ color: u.Status === 'playing' ? 'var(--safe)' : 'var(--accent)' }}>
                                                {u.Status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>{u.currentRound || 0}</td>
                                        <td style={{ padding: '15px', fontSize: '0.85rem' }}>
                                            {u.currentRound === 1 && "Minesweeper"}
                                            {u.currentRound === 2 && "Maze Escape"}
                                            {u.currentRound === 3 && "Sliding Puzzle"}
                                            {!u.currentRound || u.currentRound === 0 ? "Not Started" : ""}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            {u.numberofTries ? u.numberofTries["Round-1"] : 0}
                                        </td>
                                        <td style={{ padding: '15px' }}>{u.HasWon ? '✅' : '❌'}</td>
                                        <td style={{ padding: '15px', fontSize: '0.75rem' }}>
                                            {u.Round2Progress?.finalComplete ? (
                                                <span style={{ color: 'var(--safe)' }}>✅ Complete</span>
                                            ) : u.Round2Progress?.level2Complete ? (
                                                <span style={{ color: '#fbbf24' }}>Level 2 ✅</span>
                                            ) : u.Round2Progress?.level1Complete ? (
                                                <span style={{ color: '#667eea' }}>Level 1 ✅</span>
                                            ) : (
                                                <span style={{ opacity: 0.5 }}>Not Started</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px' }}>{u.isLocked ? <span style={{ color: 'var(--danger)' }}>Yes</span> : 'No'}</td>
                                    </motion.tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#a4b0be' }}>No players found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
