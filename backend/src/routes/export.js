// backend/src/routes/export.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const VideoProcessor = require('../services/videoProcessor');
const router = express.Router();

// In-memory storage for export jobs (use Redis in production)
const exportJobs = new Map();

// Start export process
router.post('/', async (req, res) => {
  try {
    const { videoId, annotations, settings = {} } = req.body;
    
    if (!videoId || !annotations) {
      return res.status(400).json({ error: 'videoId and annotations are required' });
    }

    const exportId = uuidv4();
    const exportJob = {
      id: exportId,
      videoId,
      annotations,
      settings,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      downloadUrl: null,
      error: null
    };

    exportJobs.set(exportId, exportJob);

    // Start processing in background
    processExport(exportId).catch(error => {
      console.error('Export processing error:', error);
      const job = exportJobs.get(exportId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
    });

    res.json({
      exportId,
      status: 'pending',
      message: 'Export started successfully'
    });
  } catch (error) {
    console.error('Export start error:', error);
    res.status(500).json({ error: 'Failed to start export' });
  }
});

// Get export status
router.get('/:exportId/status', (req, res) => {
  const { exportId } = req.params;
  const job = exportJobs.get(exportId);

  if (!job) {
    return res.status(404).json({ error: 'Export job not found' });
  }

  res.json({
    status: job.status,
    progress: job.progress,
    downloadUrl: job.downloadUrl,
    error: job.error
  });
});

// Download exported video
router.get('/:exportId/download', async (req, res) => {
  const { exportId } = req.params;
  const job = exportJobs.get(exportId);

  if (!job || job.status !== 'completed') {
    return res.status(404).json({ error: 'Export not found or not completed' });
  }

  const filePath = path.join(__dirname, '../../exports', `${exportId}.mp4`);
  
  try {
    await fs.access(filePath);
    res.download(filePath, `exported_video_${exportId}.mp4`);
  } catch (error) {
    res.status(404).json({ error: 'Export file not found' });
  }
});

// Background export processing
async function processExport(exportId) {
  const job = exportJobs.get(exportId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.progress = 0;

    const processor = new VideoProcessor();
    const result = await processor.processVideo(job, (progress) => {
      job.progress = progress;
    });

    job.status = 'completed';
    job.progress = 100;
    job.downloadUrl = `/api/export/${exportId}/download`;
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    throw error;
  }
}

module.exports = router;