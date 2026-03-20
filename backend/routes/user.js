const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUser, getUserById } = require('../controllers/user');
const User = require('../models/user');

// router.param: attach user to req for any route with :userId
router.param('userId', async (req, res, next, id) => {
    const User = require('../models/user');
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        req.foundUser = user;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid user ID' });
    }
});

// POST /api/register
router.post('/register', registerUser);

// POST /api/login
router.post('/login', loginUser);

// PUT /api/:userId/updateuser
router.put('/:userId/updateuser', updateUser);

// GET /api/user/:userId
router.get('/user/:userId', getUserById);

// POST /api/migrate - Migration endpoint to fill missing fields for existing users
// This does NOT affect existing data, only adds missing fields
router.post('/migrate', async (req, res) => {
    try {
        const result = await User.updateMany(
            {}, // Match all users
            {
                $set: {
                    // Only set if not exists - adds Round2Progress for users without it
                    'Round2Progress': {
                        level1Complete: false,
                        level2Complete: false,
                        finalComplete: false,
                        wrongAttempts: { level1: 0, level2: 0, final: 0 },
                        clue1: '',
                        clue2: '',
                        completedAt: null,
                        round2LockedAt: null,
                        enteredFinalAt: null
                    },
                    // Only set if not exists - adds Round3Progress for users without it
                    'Round3Progress': {
                        levelComplete: false,
                        wrongAttempts: 0,
                        completedAt: null,
                        round3LockedAt: null
                    }
                }
            },
            { upsert: false } // Don't create new documents
        );
        
        res.status(200).json({
            success: true,
            message: 'Migration completed successfully',
            matched: result.matchedCount,
            modified: result.modifiedCount,
            note: 'Only users without Round2Progress/Round3Progress were updated'
        });
    } catch (err) {
        console.error('Migration error:', err.message);
        res.status(500).json({ message: 'Migration failed', error: err.message });
    }
});

// POST /api/migrate-single/:userId - Migrate a single user
router.post('/migrate-single/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Check what was added
        const hadRound2Progress = !!user.Round2Progress;
        const hadRound3Progress = !!user.Round3Progress;
        
        // Only set if not exists
        if (!user.Round2Progress) {
            user.Round2Progress = {
                level1Complete: false,
                level2Complete: false,
                finalComplete: false,
                wrongAttempts: { level1: 0, level2: 0, final: 0 },
                clue1: '',
                clue2: '',
                completedAt: null,
                round2LockedAt: null,
                enteredFinalAt: null
            };
        }
        
        if (!user.Round3Progress) {
            user.Round3Progress = {
                levelComplete: false,
                wrongAttempts: 0,
                completedAt: null,
                round3LockedAt: null
            };
        }
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'User migration completed',
            hadRound2Progress,
            hadRound3Progress,
            note: 'Existing data was preserved, only missing fields were added'
        });
    } catch (err) {
        console.error('Migration error:', err.message);
        res.status(500).json({ message: 'Migration failed', error: err.message });
    }
});

module.exports = router;
