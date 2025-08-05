const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { createCanvas } = require('canvas');

class VideoProcessor {
  constructor() {
    // Set FFmpeg path if needed (adjust for your system)
    // ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg');
  }

  async processVideo(job, progressCallback) {
    const { videoId, annotations, settings } = job;
    const inputPath = path.join(__dirname, '../../uploads', `${videoId}.mp4`);
    const outputPath = path.join(__dirname, '../../exports', `${job.id}.mp4`);
    const tempDir = path.join(__dirname, '../../temp', job.id);

    try {
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });

      // Get video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      const totalDuration = metadata.format.duration;

      progressCallback(10);

      // Sort annotations by timestamp
      const sortedAnnotations = annotations.sort((a, b) => a.timestamp - b.timestamp);

      // Create video segments
      const segments = await this.createVideoSegments(
        inputPath,
        sortedAnnotations,
        totalDuration,
        tempDir,
        progressCallback
      );

      progressCallback(80);

      // Combine all segments
      await this.combineSegments(segments, outputPath);

      progressCallback(100);

      // Cleanup temp files
      await this.cleanup(tempDir);

      return { outputPath };
    } catch (error) {
      await this.cleanup(tempDir);
      throw error;
    }
  }

  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }

  async createVideoSegments(inputPath, annotations, totalDuration, tempDir, progressCallback) {
    const segments = [];
    let currentTime = 0;

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];
      const segmentIndex = segments.length;

      // Create segment before annotation (if any)
      if (currentTime < annotation.timestamp) {
        const beforeSegment = path.join(tempDir, `segment_${segmentIndex}_before.mp4`);
        await this.extractVideoSegment(
          inputPath,
          currentTime,
          annotation.timestamp,
          beforeSegment
        );
        segments.push(beforeSegment);
      }

      // Create annotation segment
      const annotationSegment = await this.createAnnotationSegment(
        inputPath,
        annotation,
        tempDir,
        segmentIndex
      );
      segments.push(annotationSegment);

      currentTime = annotation.timestamp;
      progressCallback(10 + (i / annotations.length) * 60);
    }

    // Create final segment after last annotation
    if (currentTime < totalDuration) {
      const finalSegment = path.join(tempDir, `segment_final.mp4`);
      await this.extractVideoSegment(
        inputPath,
        currentTime,
        totalDuration,
        finalSegment
      );
      segments.push(finalSegment);
    }

    return segments;
  }

  async extractVideoSegment(inputPath, startTime, endTime, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(endTime - startTime)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async createAnnotationSegment(inputPath, annotation, tempDir, segmentIndex) {
    // Extract single frame at annotation timestamp
    const framePath = path.join(tempDir, `frame_${segmentIndex}.png`);
    await this.extractFrame(inputPath, annotation.timestamp, framePath);

    // Create annotation frames
    const annotationFrames = await this.createAnnotationFrames(
      framePath,
      annotation,
      tempDir,
      segmentIndex
    );

    // Create video from annotation frames
    const segmentPath = path.join(tempDir, `segment_${segmentIndex}_annotation.mp4`);
    await this.createVideoFromFrames(annotationFrames, segmentPath);

    return segmentPath;
  }

  async extractFrame(inputPath, timestamp, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(timestamp)
        .frames(1)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async createAnnotationFrames(baseFrmePath, annotation, tempDir, segmentIndex) {
    // This is a simplified version - you would expand this to recreate the drawing animation
    const frames = [];
    const frameCount = 30; // 1 second at 30fps
    const framesDir = path.join(tempDir, `frames_${segmentIndex}`);
    
    await fs.mkdir(framesDir, { recursive: true });

    // For now, just duplicate the frame with the final annotation
    // In a full implementation, you'd recreate the drawing animation step by step
    for (let i = 0; i < frameCount; i++) {
      const framePath = path.join(framesDir, `frame_${i.toString().padStart(3, '0')}.png`);
      
      // Copy base frame (simplified - you'd overlay drawing here)
      await fs.copyFile(baseFrmePath, framePath);
      frames.push(framePath);
    }

    return framesDir;
  }

  async createVideoFromFrames(framesDir, outputPath) {
    return new Promise((resolve, reject) => {
      const framePattern = path.join(framesDir, 'frame_%03d.png');
      
      ffmpeg()
        .input(framePattern)
        .inputOptions(['-framerate 30'])
        .outputOptions(['-c:v libx264', '-pix_fmt yuv420p'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async combineSegments(segments, outputPath) {
    return new Promise((resolve, reject) => {
      // Create concat file
      const concatContent = segments.map(segment => `file '${segment}'`).join('\n');
      const concatFile = outputPath.replace('.mp4', '_concat.txt');
      
      fs.writeFile(concatFile, concatContent)
        .then(() => {
          ffmpeg()
            .input(concatFile)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .output(outputPath)
            .on('end', () => {
              fs.unlink(concatFile).catch(console.error);
              resolve();
            })
            .on('error', reject)
            .run();
        })
        .catch(reject);
    });
  }

  async cleanup(tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = VideoProcessor;