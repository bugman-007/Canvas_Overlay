import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';

const DrawingCanvas = ({ videoRef, isDrawingMode, tool, onAnnotationSaved }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 450,
      backgroundColor: 'transparent'
    });

    fabricCanvasRef.current = canvas;

    // Set drawing mode based on tool
    if (tool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 3;
      canvas.freeDrawingBrush.color = '#ff0000';
    } else {
      canvas.isDrawingMode = false;
    }

    // Handle object creation for shapes
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.dispose();
    };
  }, [tool]);

  const handleMouseDown = (options) => {
    if (!isDrawingMode) return;
    
    setIsDrawing(true);
    const pointer = fabricCanvasRef.current.getPointer(options.e);
    
    if (tool === 'arrow') {
      createArrow(pointer);
    } else if (tool === 'circle') {
      createCircle(pointer);
    }
  };

  const handleMouseMove = (options) => {
    if (!isDrawing || tool === 'pen') return;
    
    const pointer = fabricCanvasRef.current.getPointer(options.e);
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();
    
    if (activeObject) {
      if (tool === 'arrow') {
        updateArrow(activeObject, pointer);
      } else if (tool === 'circle') {
        updateCircle(activeObject, pointer);
      }
      canvas.renderAll();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const createArrow = (pointer) => {
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: '#ff0000',
      strokeWidth: 3,
      selectable: true
    });
    
    fabricCanvasRef.current.add(line);
    fabricCanvasRef.current.setActiveObject(line);
  };

  const updateArrow = (line, pointer) => {
    line.set({
      x2: pointer.x,
      y2: pointer.y
    });
  };

  const createCircle = (pointer) => {
    const circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 1,
      fill: 'transparent',
      stroke: '#ff0000',
      strokeWidth: 3,
      selectable: true
    });
    
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
  };

  const updateCircle = (circle, pointer) => {
    const radius = Math.abs(pointer.x - circle.left);
    circle.set({ radius: radius });
  };

  const saveAnnotation = () => {
    const canvas = fabricCanvasRef.current;
    const canvasData = canvas.toJSON();
    const imageData = canvas.toDataURL();
    
    const annotation = {
      id: Date.now().toString(),
      timestamp: videoRef.current?.currentTime || 0,
      canvasData,
      imageData,
      tool,
      createdAt: new Date().toISOString()
    };
    
    onAnnotationSaved(annotation);
    canvas.clear();
  };

  const clearCanvas = () => {
    fabricCanvasRef.current.clear();
  };

  return (
    <div className="drawing-canvas" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          border: isDrawingMode ? '2px solid #007bff' : 'none',
          cursor: isDrawingMode ? 'crosshair' : 'default',
          pointerEvents: isDrawingMode ? 'auto' : 'none'
        }}
      />
      
      {isDrawingMode && (
        <div className="canvas-controls" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000
        }}>
          <button onClick={saveAnnotation} style={{ marginRight: '5px' }}>
            Save Drawing
          </button>
          <button onClick={clearCanvas}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;