import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import CanvasOverlay from './CanvasOverlay';
import type { DrawingAction } from '../types/video';

const VideoEditor: React.FC = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [currentDrawings, setCurrentDrawings] = useState<DrawingAction[]>([]);
  const [allDrawings, setAllDrawings] = useState<DrawingAction[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const handleVideoLoad = (video: HTMLVideoElement) => {
    console.log('Video loaded:', {
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });
    setVideoElement(video);
    setIsVideoPaused(true); // Start paused for drawing
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (isVideoPaused) {
      // Show drawings that were made at or before current time
      const visibleDrawings = allDrawings.filter(
        drawing => drawing.timestamp <= currentTime
      );
      setCurrentDrawings(visibleDrawings);
    } else {
      // Clear drawings while playing
      setCurrentDrawings([]);
    }
    
    // Keep duration for reference if needed
    if (duration) {
      // Can use duration for timeline features later
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

  const exportVideo = () => {
    // Placeholder for export functionality
    console.log('Export video with drawings:', {
      videoElement,
      drawings: allDrawings
    });
    alert('Export feature will be implemented in the next version');
  };

  return (
    <div className="video-editor">
      {/* Video Player with controls */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <VideoPlayer
          onVideoLoad={handleVideoLoad}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
        />

        {/* Canvas Overlay - Positioned absolutely within the relative container */}
        {videoElement && (
          <CanvasOverlay
            videoElement={videoElement}
            isVideoPaused={isVideoPaused}
            onDrawingComplete={handleDrawingComplete}
            currentDrawings={currentDrawings}
          />
        )}
      </div>

      {/* Drawing Management Panel */}
      {videoElement && (
        <div className="drawing-management">
          <div className="drawing-stats">
            <p>Total: {allDrawings.length} drawings</p>
            <p>Visible: {currentDrawings.length}</p>
            <p>Time: {videoElement.currentTime.toFixed(1)}s</p>
            <p>Mode: {isVideoPaused ? 'Draw' : 'Play'}</p>
          </div>
          
          {allDrawings.length > 0 && (
            <>
              <button onClick={clearAllDrawings} className="clear-all-btn">
                🗑️ Clear All
              </button>
              <button onClick={exportVideo} className="btn" style={{ width: '100%', marginTop: '5px' }}>
                💾 Export Video
              </button>
            </>
          )}
          
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="btn"
            style={{ 
              marginTop: '10px', 
              fontSize: '11px', 
              padding: '4px 8px',
              width: '100%',
              backgroundColor: showDebug ? '#28a745' : '#6c757d'
            }}
          >
            {showDebug ? '🔍 Hide Debug' : '🔍 Show Debug'}
          </button>
        </div>
      )}

      {/* Debug Info Panel */}
      {videoElement && (
        <div className={`debug-info ${showDebug ? 'show' : ''}`}>
          <h4>Debug Info</h4>
          <p>Status: {isVideoPaused ? '⏸️ Paused' : '▶️ Playing'}</p>
          <p>Time: {videoElement.currentTime.toFixed(2)}s / {videoElement.duration.toFixed(2)}s</p>
          <p>Video: {videoElement.videoWidth}×{videoElement.videoHeight}px</p>
          <p>Display: {Math.round(videoElement.getBoundingClientRect().width)}×{Math.round(videoElement.getBoundingClientRect().height)}px</p>
          <p>Drawings Total: {allDrawings.length}</p>
          <p>Drawings Visible: {currentDrawings.length}</p>
          <p>Canvas Active: {isVideoPaused ? 'Yes' : 'No'}</p>
          <p>Ready to Draw: {isVideoPaused ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;