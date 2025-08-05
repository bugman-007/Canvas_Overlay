// frontend/src/components/VideoEditor/AnnotationList.jsx
import React from 'react';

const AnnotationList = ({ annotations, onAnnotationSelect, onAnnotationDelete, currentTime }) => {
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getToolIcon = (tool) => {
    const icons = {
      pen: '✏️',
      arrow: '➡️',
      circle: '⭕'
    };
    return icons[tool] || '📝';
  };

  return (
    <div className="annotation-list" style={{
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '5px',
      maxHeight: '300px',
      overflowY: 'auto'
    }}>
      <h4>Annotations ({annotations.length})</h4>
      
      {annotations.length === 0 ? (
        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
          No annotations yet. Pause the video and start drawing!
        </p>
      ) : (
        <div className="annotation-items">
          {annotations.map((annotation, index) => (
            <div
              key={annotation.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                margin: '5px 0',
                backgroundColor: 'white',
                borderRadius: '3px',
                border: Math.abs(currentTime - annotation.timestamp) < 0.5 ? '2px solid #007bff' : '1px solid #ddd',
                cursor: 'pointer'
              }}
              onClick={() => onAnnotationSelect(annotation)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', fontSize: '18px' }}>
                  {getToolIcon(annotation.tool)}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {formatTime(annotation.timestamp)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {annotation.tool} drawing
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotationSelect(annotation);
                  }}
                  style={{
                    padding: '5px 10px',
                    marginRight: '5px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Go to
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotationDelete(annotation.id);
                  }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnotationList;