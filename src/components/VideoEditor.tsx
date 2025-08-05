import React, { useState, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import CanvasOverlay from './CanvasOverlay';
import type { DrawingAction } from '../types/video';

const VideoEditor: React.FC = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [currentDrawings, setCurrentDrawings] = useState<DrawingAction[]>([]);
  const [allDrawings, setAllDrawings] = useState<DrawingAction[]>([]);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const handleVideoLoad = (video: HTMLVideoElement) => {
    console.log('Video loaded:', {
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });
    setVideoElement(video);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Filter drawings that should be visible at current time
    // For now, show all drawings when paused, none when playing
    console.log(duration);
    if (isVideoPaused) {
      // Show drawings that were made at or before current time
      const visibleDrawings = allDrawings.filter(
        drawing => drawing.timestamp <= currentTime
      );
      setCurrentDrawings(visibleDrawings);
    } else {
      setCurrentDrawings([]);
    }
  };

  const handlePlay = () => {
    console.log('Video started playing');
    setIsVideoPaused(false);
    setCurrentDrawings([]); // Hide drawings when playing
  };

  const handlePause = () => {
    console.log('Video paused');
    setIsVideoPaused(true);
    
    // Show drawings relevant to current time when paused
    if (videoElement) {
      const visibleDrawings = allDrawings.filter(
        drawing => drawing.timestamp <= videoElement.currentTime
      );
      setCurrentDrawings(visibleDrawings);
    }
  };

  const handleDrawingComplete = (drawing: DrawingAction) => {
    console.log('Drawing completed:', drawing);
    
    // Add to all drawings
    setAllDrawings(prev => [...prev, drawing]);
    
    // Add to current visible drawings
    setCurrentDrawings(prev => [...prev, drawing]);
  };

  const clearAllDrawings = () => {
    setAllDrawings([]);
    setCurrentDrawings([]);
    console.log('All drawings cleared');
  };

  return (
    <div className="video-editor">
      <h2>Video Editor</h2>
      <p>Step 3: Load a video, pause it, and try drawing on it!</p>
      
      {/* Video Player */}
      <VideoPlayer
        onVideoLoad={handleVideoLoad}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* Video Container with Canvas Overlay */}
      {videoElement && (
        <div ref={videoContainerRef} className="video-canvas-container">
          <CanvasOverlay
            videoElement={videoElement}
            isVideoPaused={isVideoPaused}
            onDrawingComplete={handleDrawingComplete}
            currentDrawings={currentDrawings}
          />
        </div>
      )}

      {/* Drawing Management */}
      <div className="drawing-management">
        <div className="drawing-stats">
          <p>Total Drawings: {allDrawings.length}</p>
          <p>Visible Drawings: {currentDrawings.length}</p>
        </div>
        
        {allDrawings.length > 0 && (
          <button onClick={clearAllDrawings} className="btn clear-all-btn">
            Clear All Drawings
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>How to use:</h3>
        <ol>
          <li>Load a video file</li>
          <li>Play the video and pause at any point</li>
          <li>When paused, drawing tools will appear</li>
          <li>Select a tool and draw on the video</li>
          <li>Resume playing - drawings will disappear</li>
          <li>Pause again - drawings will reappear</li>
        </ol>
      </div>

      {/* Debug Info */}
      {videoElement && (
        <div className="debug-info">
          <h4>Debug Information:</h4>
          <p>Video Status: {isVideoPaused ? 'Paused' : 'Playing'}</p>
          <p>Current Time: {videoElement.currentTime.toFixed(2)}s</p>
          <p>Total Drawings: {allDrawings.length}</p>
          <p>Visible Drawings: {currentDrawings.length}</p>
          <p>Canvas Interactive: {isVideoPaused ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;