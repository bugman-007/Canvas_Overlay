// frontend/src/components/VideoEditor/DrawingTools.jsx
import React from 'react';

const DrawingTools = ({ currentTool, onToolChange, isDrawingMode, onToggleDrawing }) => {
  const tools = [
    { id: 'pen', name: 'Pen', icon: '✏️' },
    { id: 'arrow', name: 'Arrow', icon: '➡️' },
    { id: 'circle', name: 'Circle', icon: '⭕' }
  ];

  return (
    <div className="drawing-tools" style={{
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '5px',
      marginBottom: '10px'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={onToggleDrawing}
          style={{
            padding: '10px 20px',
            backgroundColor: isDrawingMode ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
        </button>
      </div>
      
      {isDrawingMode && (
        <div className="tool-selector">
          <span style={{ marginRight: '10px' }}>Tools:</span>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              style={{
                padding: '8px 12px',
                margin: '0 5px',
                backgroundColor: currentTool === tool.id ? '#007bff' : '#fff',
                color: currentTool === tool.id ? '#fff' : '#000',
                border: '1px solid #007bff',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {tool.icon} {tool.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DrawingTools;