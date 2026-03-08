const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUser, getUserById } = require('../controllers/user');

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

module.exports = router;
