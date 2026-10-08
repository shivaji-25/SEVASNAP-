const express = require('express');
const router = express.Router();
const { getAuthorityStats } = require('../controllers/statsController');

router.get('/stats', getAuthorityStats);

module.exports = router;
