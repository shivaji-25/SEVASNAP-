const express = require('express');
const router = express.Router();
const { getAuthorityStats } = require('../controllers/statsController');

// GET /api/authority/stats (SRS Module 10)
router.get('/stats', getAuthorityStats);

module.exports = router;
