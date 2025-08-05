const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Upload endpoint
router.post('/', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }

  const videoPath = req.file.path;
  const videoId = req.file.filename.split('.')[0];

  // Get video metadata using ffmpeg
  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid video file' });
    }

    const duration = metadata.format.duration;
    const videoInfo = {
      videoId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      duration,
      size: req.file.size,
      uploadPath: `/uploads/${req.file.filename}`
    };

    res.json(videoInfo);
  });
});

module.exports = router;