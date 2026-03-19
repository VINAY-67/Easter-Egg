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
                Round2Progress: user.Round2Progress,
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
        const { round, action, amount = 1, level, answer, clue } = req.body;
        // action: 'lose-life' | 'complete' | 'start' | 'riddle-progress' | 'riddle-answer'

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isLocked && action !== 'riddle-answer')
            return res.status(403).json({ message: 'You are eliminated! No more trials remain.' });

        // Handle Riddle Round-2 Actions
        if (round === 'Round-2') {
            // Initialize Round2Progress if not exists
            if (!user.Round2Progress) {
                user.Round2Progress = {
                    level1Complete: false,
                    level2Complete: false,
                    finalComplete: false,
                    clue1: '',
                    clue2: '',
                    wrongAttempts: { level1: 0, level2: 0, final: 0 },
                    completedAt: null,
                    round2LockedAt: null,
                    enteredFinalAt: null
                };
            }

            // Check for existing 6-hour lockout
            const LOCKOUT_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
            if (user.Round2Progress.round2LockedAt) {
                const lockoutTime = new Date(user.Round2Progress.round2LockedAt).getTime();
                const now = Date.now();
                const timePassed = now - lockoutTime;
                
                if (timePassed < LOCKOUT_DURATION) {
                    const remainingMs = LOCKOUT_DURATION - timePassed;
                    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
                    return res.status(403).json({ 
                        message: `You are locked out. Try again in ${remainingHours} hours.`,
                        isLocked: true,
                        lockoutUntil: user.Round2Progress.round2LockedAt
                    });
                } else {
                    // Lockout expired, reset
                    user.Round2Progress.round2LockedAt = null;
                    user.Round2Progress.wrongAttempts = { level1: 0, level2: 0, final: 0 };
                }
            }

            // Handle riddle answer validation
            if (action === 'riddle-answer') {
                const correctAnswers = {
                    1: process.env.CLUE1,
                    2: process.env.CLUE2,
                    3: process.env.CLUE3    
                };

                const normalizedAnswer = (answer || '').trim().toLowerCase();
                const expectedAnswer = correctAnswers[level].toLowerCase();

                if (normalizedAnswer === expectedAnswer) {
                    // Correct answer
                    const clueValue = level === 1 ? process.env.RIDDLE_CLUE1 : level === 2 ? process.env.RIDDLE_CLUE2 : null;
                    
                    // Track when user enters Final Cipher (level 3)
                    if (level === 3 && !user.Round2Progress.enteredFinalAt) {
                        user.Round2Progress.enteredFinalAt = new Date();
                    }
                    
                    if (level === 1) {
                        user.Round2Progress.level1Complete = true;
                        user.Round2Progress.clue1 = clueValue;
                    } else if (level === 2) {
                        user.Round2Progress.level2Complete = true;
                        user.Round2Progress.clue2 = clueValue;
                    }
                    
                    user.Round2Progress.wrongAttempts[`level${level}`] = 0;
                    
                    user.markModified('Round2Progress');
                    await user.save();

                    return res.status(200).json({
                        success: true,
                        isCorrect: true,
                        clue: clueValue,
                        message: 'Correct answer!'
                    });
                } else {
                    // Wrong answer
                    user.Round2Progress.wrongAttempts[`level${level}`] = 
                        (user.Round2Progress.wrongAttempts[`level${level}`] || 0) + 1;
                    
                    const currentAttempts = user.Round2Progress.wrongAttempts[`level${level}`];
                    
                    // Check if user has reached 3 failed attempts - apply 6 hour lockout
                    if (currentAttempts >= 3) {
                        user.Round2Progress.round2LockedAt = new Date();
                        user.markModified('Round2Progress');
                        await user.save();
                        
                        return res.status(403).json({
                            success: false,
                            isCorrect: false,
                            isLocked: true,
                            message: 'Too many failed attempts! You are locked out for 6 hours.',
                            lockoutUntil: user.Round2Progress.round2LockedAt
                        });
                    }
                    
                    user.markModified('Round2Progress');
                    await user.save();

                    return res.status(200).json({
                        success: false,
                        isCorrect: false,
                        message: 'Incorrect answer',
                        attemptsLeft: 3 - currentAttempts
                    });
                }
            }

            // Handle riddle progress update
            if (action === 'riddle-progress') {
                if (level === 1) {
                    user.Round2Progress.level1Complete = true;
                    if (clue) user.Round2Progress.clue1 = clue;
                } else if (level === 2) {
                    user.Round2Progress.level2Complete = true;
                    if (clue) user.Round2Progress.clue2 = clue;
                }

                user.markModified('Round2Progress');
                await user.save();

                return res.status(200).json({
                    success: true,
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
                        Round2Progress: user.Round2Progress
                    }
                });
            }

            // Handle Round-2 completion
            if (action === 'complete') {
                user.Round2Progress.finalComplete = true;
                user.Round2Progress.completedAt = new Date();
                user.Scores['Round-2'] = (user.Scores['Round-2'] || 0) + 1;
                user.Status = 'won';
                user.HasWon = true;

                user.markModified('Round2Progress');
                user.markModified('Scores');
                await user.save();

                return res.status(200).json({
                    success: true,
                    message: 'Round-2 completed!',
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
                        Round2Progress: user.Round2Progress
                    }
                });
            }
        }

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
