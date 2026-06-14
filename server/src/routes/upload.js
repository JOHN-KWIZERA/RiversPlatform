const express = require('express');
const router = express.Router();
const { upload, uploadFile } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

router.post('/image', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const folder = req.query.folder || 'general';
    const url = await uploadFile(req.file, folder);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
