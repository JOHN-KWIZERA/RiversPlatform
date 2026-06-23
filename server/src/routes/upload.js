const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { upload, uploadFile } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Existing image/media endpoint
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

// Document endpoint — PDF, DOC, DOCX, and ID scans (JPG, PNG, PDF)
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    cb(null, allowed.includes(ext));
  },
});

router.post('/document', authenticate, docUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const folder = req.query.folder || 'documents';
    const url = await uploadFile(req.file, folder);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
