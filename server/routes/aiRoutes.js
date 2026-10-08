const express = require('express');
const router = express.Router();
const { analyzeDefect } = require('../services/aiService');

// POST /api/ai/analyze (SRS Module 8)
router.post('/analyze', async (req, res) => {
  try {
    const { image, location, description, presetKey } = req.body;
    const triageResult = await analyzeDefect({ image, location, description, presetKey });

    res.status(200).json({
      success: true,
      data: triageResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
