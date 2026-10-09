const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { analyzeDefect } = require('../services/aiService');

// Middleware to conditionally apply multer only if multipart/form-data
const optionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  next();
};

// POST /api/ai/analyze - Analyze uploaded or base64 image with Gemini Vision
router.post('/analyze', optionalUpload, async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const image = req.body?.image;
    const file = req.file;

    const triageResult = await analyzeDefect({
      image,
      file,
      requestId,
    });

    res.status(200).json({
      success: true,
      data: triageResult,
    });
  } catch (error) {
    console.error('[AI Route] Error in /analyze:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
