// frontend/src/components/VideoEditor/Timeline.jsx
import React from 'react';

const Timeline = ({ 
  duration, 
  currentTime, 
  annotations, 
  onSeek, 
  onAnnotationClick,
  onAnnotationDelete 
}) => {
  const timelineWidth = 800;
  const timelineHeight = 60;

  const getPositionFromTime = (time) => {
    return (time / duration) * timelineWidth;
  };

  const getTimeFromPosition = (position) => {
    return (position / timelineWidth) * duration;
  };

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = getTimeFromPosition(clickX);
    onSeek(newTime);
  };

  return (
    <div className="timeline-container" style={{ margin: '20px 0' }}>
      <h4>Timeline</h4>
      
      <div 
        className="timeline"
        style={{
          width: timelineWidth,
          height: timelineHeight,
          backgroundColor: '#e9ecef',
          position: 'relative',
          cursor: 'pointer',
          border: '1px solid #ddd',
          borderRadius: '3px'
        }}
        onClick={handleTimelineClick}
      >
        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${(currentTime / duration) * 100}%`,
            height: '100%',
            backgroundColor: '#007bff',
            opacity: 0.3
          }}
        />
        
        {/* Current time indicator */}
        <div
          style={{
            position: 'absolute',
            left: getPositionFromTime(currentTime),
            top: 0,
            width: '2px',
            height: '100%',
            backgroundColor: '#007bff',
            zIndex: 2
          }}
        />
        
        {/* Annotation markers */}
        {annotations.map((annotation, index) => (
          <div
            key={annotation.id}
            style={{
              position: 'absolute',
              left: getPositionFromTime(annotation.timestamp),
              top: '5px',
              width: '10px',
              height: '10px',
              backgroundColor: '#dc3545',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 3,
              border: '2px solid white'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onAnnotationClick(annotation);
            }}
            title={`Annotation at ${annotation.timestamp.toFixed(2)}s`}
          />
        ))}
        
        {/* Time markers */}
        {Array.from({ length: Math.floor(duration) + 1 }, (_, i) => i).map(second => (
          <div
            key={second}
            style={{
              position: 'absolute',
              left: getPositionFromTime(second),
              bottom: 0,
              width: '1px',
              height: '10px',
              backgroundColor: '#6c757d',
              zIndex: 1
            }}
          />
        ))}
      </div>
      
      {/* Time labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: timelineWidth, fontSize: '12px', marginTop: '5px' }}>
        <span>0:00</span>
        <span>{Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
};

export default Timeline;