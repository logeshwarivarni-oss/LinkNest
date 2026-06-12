const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../utils/validators');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);

module.exports = router;
