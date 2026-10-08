const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// POST /api/upload - Single image upload
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Format URL path for client consumption
    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
