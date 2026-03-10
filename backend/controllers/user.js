const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields are required' });

        const existing = await User.findOne({
            $or: [
                { email },
                { name }
            ]
        });
        if (existing)
            return res.status(409).json({ message: 'Email / username already registered' });

        const user = new User({ name, email, HashedPassword: '' });
        await user.hashPassword(password);
        await user.save();

        res.status(201).json({
            message: 'Registered successfully',
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error('registerUser error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/login
const loginUser = async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password)
            return res.status(400).json({ message: 'Name and password are required' });

        const user = await User.findOne({ name });
        if (!user)
            return res.status(404).json({ message: 'User not found' });

        if (user.isLocked)
            return res.status(403).json({ message: 'You are eliminated! You cannot login using these credentials.' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });

        res.status(200).json({
            message: 'Login successful',
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                Status: user.Status,
                HasPlayed: user.HasPlayed,
                Scores: user.Scores,
                HasWon: user.HasWon,
                HasStarted: user.HasStarted,
                numberofTries: user.numberofTries,
                isLocked: user.isLocked,
            },
        });
    } catch (err) {
        console.error('loginUser error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/:userId/updateuser
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { round, action, amount = 1 } = req.body;
        // action: 'lose-life' | 'complete' | 'start'

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isLocked)
            return res.status(403).json({ message: 'You are eliminated! No more trials remain.' });

        if (action === 'start') {
            user.HasStarted = true;
            user.HasPlayed[round] = true;
        }

        if (action === 'lose-life') {
            const currentTries = (user.numberofTries[round] || 0) + Number(amount);

            if (currentTries >= 3) {
                user.numberofTries[round] = 3;
                user.isLocked = true;
                user.Status = 'eliminated';
                await user.save();
                return res.status(200).json({
                    success: true,
                    message: 'You are eliminated! You have exhausted all 3 lives for this round.',
                    isLocked: true,
                    livesLeft: 0,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        Status: user.Status,
                        isLocked: user.isLocked,
                        numberofTries: user.numberofTries,
                        HasPlayed: user.HasPlayed,
                        Scores: user.Scores,
                        HasWon: user.HasWon,
                        livesLeft: 0
                    }
                });
            }

            user.numberofTries[round] = currentTries;
            user.Status = 'lose';
        }

        if (action === 'complete') {
            user.HasPlayed[round] = true;
            user.HasWon = true;
            user.Status = 'won';
            user.Scores[round] = (user.Scores[round] || 0) + 1;
        }

        // Need to mark nested objects as modified for Mongoose
        user.markModified('numberofTries');
        user.markModified('HasPlayed');
        user.markModified('Scores');

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                Status: user.Status,
                HasPlayed: user.HasPlayed,
                Scores: user.Scores,
                HasWon: user.HasWon,
                isLocked: user.isLocked,
                numberofTries: user.numberofTries,
                livesLeft: 3 - (user.numberofTries[round] || 0),
            },
        });
    } catch (err) {
        console.error('updateUser error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/user/:userId  (used by router.param)
const getUserById = async (req, res) => {
    try {
        const user = req.foundUser; // attached by router.param
        res.status(200).json({ user });
    } catch (err) {
        console.error('getUserById error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { registerUser, loginUser, updateUser, getUserById };
