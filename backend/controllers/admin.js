const Admin = require('../models/admin');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { calculateRank } = require('../utils/calculateDashboard');

const generateToken = (id) =>
    jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });

// POST /api/admin/register
const registerAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: 'Username and password are required' });

        const existing = await Admin.findOne({ username });
        if (existing)
            return res.status(409).json({ message: 'Admin username already exists' });

        // Password hash happens in the pre-save hook of the Admin model
        const admin = new Admin({ username, password });
        await admin.save();

        res.status(201).json({
            message: 'Admin registered successfully',
            token: generateToken(admin._id)
        });
    } catch (err) {
        console.error('registerAdmin error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/admin/login
const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: 'Username and password are required' });

        const admin = await Admin.findOne({ username });
        if (!admin)
            return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await admin.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });

        res.status(200).json({
            message: 'Admin login successful',
            token: generateToken(admin._id),
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role || 'admin',
            }
        });
    } catch (err) {
        console.error('loginAdmin error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/admin/:adminId/dashboard
const getUsersData = async (req, res) => {
    try {
        const users = await User.find({}).lean();

        const ranked = users
            .map((user) => {
                const { roundReached, totalTries, score } = calculateRank(user);
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    Status: user.Status,
                    HasWon: user.HasWon,
                    isLocked: user.isLocked,
                    currentRound: roundReached,
                    numberofTries: user.numberofTries,
                    totalTries,
                    Scores: user.Scores,
                    _score: score,
                };
            })
            .sort((a, b) => b._score - a._score); // descending by rank score

        res.status(200).json({ total: ranked.length, players: ranked });
    } catch (err) {
        console.error('getUsersData error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { registerAdmin, loginAdmin, getUsersData };
