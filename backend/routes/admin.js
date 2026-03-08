const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, getUsersData } = require('../controllers/admin');
const adminAuth = require('../middlewares/adminauth');

// POST /api/admin/register
router.post('/register', registerAdmin);

// POST /api/admin/login
router.post('/login', loginAdmin);

// GET /api/admin/:adminId/dashboard  (protected)
router.get('/:adminId/dashboard', adminAuth, getUsersData);

module.exports = router;
