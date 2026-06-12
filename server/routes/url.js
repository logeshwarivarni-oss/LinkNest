const express = require('express');
const router = express.Router();
const { shortenUrl, getUserUrls, deleteUrl, getUrlAnalytics, getPublicStats, bulkShortenUrls } = require('../controllers/urlController');
const { shortenValidation } = require('../utils/validators');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints
router.get('/public/stats/:shortCode', getPublicStats);

// Protected endpoints (require authentication)
router.post('/shorten', authMiddleware, shortenValidation, shortenUrl);
router.post('/bulk', authMiddleware, bulkShortenUrls);
router.get('/', authMiddleware, getUserUrls);
router.delete('/:id', authMiddleware, deleteUrl);
router.get('/:id/analytics', authMiddleware, getUrlAnalytics);

module.exports = router;
