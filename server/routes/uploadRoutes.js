const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// POST /api/upload - Single image upload (Multer)
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    const relativeUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: fullUrl,
      relativeUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
