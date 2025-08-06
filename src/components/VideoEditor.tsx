import React, { useState } from 'react';
// import React, { useState, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import CanvasOverlay from './CanvasOverlay';
import type { DrawingAction } from '../types/video';

const VideoEditor: React.FC = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [currentDrawings, setCurrentDrawings] = useState<DrawingAction[]>([]);
  const [allDrawings, setAllDrawings] = useState<DrawingAction[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // const videoContainerRef = useRef<HTMLDivElement>(null);

  const handleVideoLoad = (video: HTMLVideoElement) => {
    console.log('Video loaded:', {
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });
    setVideoElement(video);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (isVideoPaused) {
      // Show drawings that were made at or before current time
      const visibleDrawings = allDrawings.filter(
        drawing => drawing.timestamp <= currentTime
      );
      console.log(duration);
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
      {/* Video Player with file input and main video area */}
      <VideoPlayer
        onVideoLoad={handleVideoLoad}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* Canvas Overlay - Only show when video is loaded */}
      {videoElement && (
        <CanvasOverlay
          videoElement={videoElement}
          isVideoPaused={isVideoPaused}
          onDrawingComplete={handleDrawingComplete}
          currentDrawings={currentDrawings}
        />
      )}

      {/* Drawing Management - Top right panel */}
      {videoElement && (
        <div className="drawing-management">
          <div className="drawing-stats">
            <p>Drawings: {allDrawings.length}</p>
            <p>Visible: {currentDrawings.length}</p>
            <p>Time: {videoElement.currentTime.toFixed(1)}s</p>
          </div>
          
          {allDrawings.length > 0 && (
            <button onClick={clearAllDrawings} className="clear-all-btn">
              Clear All
            </button>
          )}
          
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="btn"
            style={{ marginTop: '10px', fontSize: '11px', padding: '4px 8px' }}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      )}

      {/* Debug Info - Only show when enabled */}
      {videoElement && showDebug && (
        <div className="debug-info show">
          <h4>Debug Info</h4>
          <p>Status: {isVideoPaused ? 'Paused' : 'Playing'}</p>
          <p>Time: {videoElement.currentTime.toFixed(2)}s / {videoElement.duration.toFixed(2)}s</p>
          <p>Video: {videoElement.videoWidth}×{videoElement.videoHeight}</p>
          <p>Display: {Math.round(videoElement.getBoundingClientRect().width)}×{Math.round(videoElement.getBoundingClientRect().height)}</p>
          <p>Total Drawings: {allDrawings.length}</p>
          <p>Visible: {currentDrawings.length}</p>
          <p>Interactive: {isVideoPaused ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;