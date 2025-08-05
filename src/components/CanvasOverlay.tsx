import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import type {
  DrawingAction,
  // DrawingData,
  FreehandData,
  ArrowData,
  CircleData,
  RectangleData,
} from "../types/video";

interface CanvasOverlayProps {
  videoElement: HTMLVideoElement | null;
  isVideoPaused: boolean;
  onDrawingComplete?: (drawing: DrawingAction) => void;
  currentDrawings?: DrawingAction[];
}

const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  videoElement,
  isVideoPaused,
  onDrawingComplete,
  currentDrawings = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 450,
  });
  const [currentTool, setCurrentTool] = useState<
    "freehand" | "arrow" | "circle" | "rectangle"
  >("freehand");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        selection: false,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;

      // Set initial dimensions
      canvas.setDimensions(canvasDimensions);

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [canvasDimensions]);

  // Update canvas dimensions when video dimensions change
  useEffect(() => {
    if (videoElement && fabricCanvasRef.current) {
      const updateDimensions = () => {
        const videoRect = videoElement.getBoundingClientRect();
        const newDimensions = {
          width: videoElement.videoWidth || videoRect.width,
          height: videoElement.videoHeight || videoRect.height,
        };

        if (newDimensions.width > 0 && newDimensions.height > 0) {
          setCanvasDimensions(newDimensions);
          fabricCanvasRef.current?.setDimensions(newDimensions);
        }
      };

      // Update dimensions when video metadata loads
      videoElement.addEventListener("loadedmetadata", updateDimensions);
      videoElement.addEventListener("resize", updateDimensions);

      // Initial update
      updateDimensions();

      return () => {
        videoElement.removeEventListener("loadedmetadata", updateDimensions);
        videoElement.removeEventListener("resize", updateDimensions);
      };
    }
  }, [videoElement]);

  // Enable/disable canvas interaction based on video state
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      if (isVideoPaused) {
        // Enable drawing when video is paused
        canvas.isDrawingMode = currentTool === "freehand";
        canvas.selection = false;
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });

        // Set up drawing parameters
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = drawingColor;
          canvas.freeDrawingBrush.width = strokeWidth;
        }
      } else {
        // Disable interaction when video is playing
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
      }
    }
  }, [isVideoPaused, currentTool, drawingColor, strokeWidth]);

  // Handle drawing events
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handlePathCreated = (event: any) => {
      if (currentTool === "freehand" && event.path) {
        const path = event.path;

        // Get path data
        // const pathString = path.path?.join(" ") || "";

        // Convert to points (simplified - just get some key points)
        const points: { x: number; y: number }[] = [];

        // Extract coordinates from path (simplified approach)
        try {
          const pathArray = path.path || [];
          for (let i = 0; i < pathArray.length; i++) {
            const segment = pathArray[i];
            if (Array.isArray(segment) && segment.length >= 3) {
              if (segment[0] === "M" || segment[0] === "L") {
                points.push({ x: segment[1], y: segment[2] });
              }
            }
          }
        } catch (error) {
          console.warn("Path parsing error:", error);
          // Fallback: use path bounds
          const bounds = path.getBoundingRect();
          points.push(
            { x: bounds.left, y: bounds.top },
            { x: bounds.left + bounds.width, y: bounds.top + bounds.height }
          );
        }

        if (points.length > 0) {
          const drawingAction: DrawingAction = {
            id: `drawing_${Date.now()}_${Math.random()}`,
            type: "freehand",
            data: { points } as FreehandData,
            timestamp: videoElement?.currentTime || 0,
            color: drawingColor,
            strokeWidth: strokeWidth,
          };

          onDrawingComplete?.(drawingAction);
        }
      }
    };

    const handleMouseDown = (event: any) => {
      if (!isVideoPaused || currentTool === "freehand") return;

      setIsDrawing(true);
      const pointer = canvas.getPointer(event.e);
      setStartPoint(pointer);
    };

    const handleMouseUp = (event: any) => {
      if (
        !isDrawing ||
        !isVideoPaused ||
        currentTool === "freehand" ||
        !startPoint
      )
        return;

      setIsDrawing(false);
      const pointer = canvas.getPointer(event.e);

      let drawingAction: DrawingAction | null = null;

      switch (currentTool) {
        case "arrow":
          drawingAction = {
            id: `drawing_${Date.now()}_${Math.random()}`,
            type: "arrow",
            data: {
              start: startPoint,
              end: pointer,
            } as ArrowData,
            timestamp: videoElement?.currentTime || 0,
            color: drawingColor,
            strokeWidth: strokeWidth,
          };
          break;

        case "circle": {
          const radius = Math.sqrt(
            Math.pow(pointer.x - startPoint.x, 2) +
              Math.pow(pointer.y - startPoint.y, 2)
          );
          drawingAction = {
            id: `drawing_${Date.now()}_${Math.random()}`,
            type: "circle",
            data: {
              center: startPoint,
              radius: radius,
            } as CircleData,
            timestamp: videoElement?.currentTime || 0,
            color: drawingColor,
            strokeWidth: strokeWidth,
          };
          break;
        }

        case "rectangle":
          drawingAction = {
            id: `drawing_${Date.now()}_${Math.random()}`,
            type: "rectangle",
            data: {
              topLeft: {
                x: Math.min(startPoint.x, pointer.x),
                y: Math.min(startPoint.y, pointer.y),
              },
              width: Math.abs(pointer.x - startPoint.x),
              height: Math.abs(pointer.y - startPoint.y),
            } as RectangleData,
            timestamp: videoElement?.currentTime || 0,
            color: drawingColor,
            strokeWidth: strokeWidth,
          };
          break;
      }

      if (drawingAction) {
        onDrawingComplete?.(drawingAction);
      }

      setStartPoint(null);
    };

    // Add event listeners
    canvas.on("path:created", handlePathCreated);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("path:created", handlePathCreated);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [
    currentTool,
    isVideoPaused,
    drawingColor,
    strokeWidth,
    videoElement,
    onDrawingComplete,
    isDrawing,
    startPoint,
  ]);

  // Render current drawings on canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Clear existing drawings
    canvas.clear();

    // Render all current drawings
    currentDrawings.forEach((drawing) => {
      let fabricObject: fabric.Object | null = null;

      switch (drawing.type) {
        case "freehand": {
          const freehandData = drawing.data as FreehandData;
          if (freehandData.points.length > 1) {
            const pathString = freehandData.points.reduce(
              (path, point, index) => {
                return (
                  path +
                  (index === 0
                    ? `M ${point.x} ${point.y}`
                    : ` L ${point.x} ${point.y}`)
                );
              },
              ""
            );

            fabricObject = new fabric.Path(pathString, {
              stroke: drawing.color || drawingColor,
              strokeWidth: drawing.strokeWidth || strokeWidth,
              fill: "",
              selectable: false,
              evented: false,
            });
          }
          break;
        }

        case "arrow": {
          const arrowData = drawing.data as ArrowData;

          // Create line
          const line = new fabric.Line(
            [
              arrowData.start.x,
              arrowData.start.y,
              arrowData.end.x,
              arrowData.end.y,
            ],
            {
              stroke: drawing.color || drawingColor,
              strokeWidth: drawing.strokeWidth || strokeWidth,
              selectable: false,
              evented: false,
            }
          );

          // Calculate arrowhead
          const angle = Math.atan2(
            arrowData.end.y - arrowData.start.y,
            arrowData.end.x - arrowData.start.x
          );
          const arrowLength = 15;
          const arrowAngle = Math.PI / 6;

          const arrowHead = new fabric.Polygon(
            [
              { x: arrowData.end.x, y: arrowData.end.y },
              {
                x: arrowData.end.x - arrowLength * Math.cos(angle - arrowAngle),
                y: arrowData.end.y - arrowLength * Math.sin(angle - arrowAngle),
              },
              {
                x: arrowData.end.x - arrowLength * Math.cos(angle + arrowAngle),
                y: arrowData.end.y - arrowLength * Math.sin(angle + arrowAngle),
              },
            ],
            {
              fill: drawing.color || drawingColor,
              selectable: false,
              evented: false,
            }
          );

          canvas.add(line);
          canvas.add(arrowHead);
          break;
        }

        case "circle": {
          const circleData = drawing.data as CircleData;
          fabricObject = new fabric.Circle({
            left: circleData.center.x - circleData.radius,
            top: circleData.center.y - circleData.radius,
            radius: circleData.radius,
            stroke: drawing.color || drawingColor,
            strokeWidth: drawing.strokeWidth || strokeWidth,
            fill: "",
            selectable: false,
            evented: false,
          });
          break;
        }
        case "rectangle": {
          const rectData = drawing.data as RectangleData;
          fabricObject = new fabric.Rect({
            left: rectData.topLeft.x,
            top: rectData.topLeft.y,
            width: rectData.width,
            height: rectData.height,
            stroke: drawing.color || drawingColor,
            strokeWidth: drawing.strokeWidth || strokeWidth,
            fill: "",
            selectable: false,
            evented: false,
          });
          break;
        }
      }

      if (fabricObject) {
        canvas.add(fabricObject);
      }
    });

    canvas.renderAll();
  }, [currentDrawings, drawingColor, strokeWidth]);

  // Clear all drawings
  const clearCanvas = () => {
    fabricCanvasRef.current?.clear();
  };

  return (
    <div className="canvas-overlay-container">
      {/* Canvas positioned over video */}
      <canvas
        ref={canvasRef}
        className="canvas-overlay"
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: isVideoPaused ? 10 : 1,
          cursor: isVideoPaused ? "crosshair" : "default",
          pointerEvents: isVideoPaused ? "auto" : "none",
        }}
      />

      {/* Drawing Tools - Only show when video is paused */}
      {isVideoPaused && (
        <div className="drawing-tools">
          <div className="tool-group">
            <label>Tool:</label>
            <select
              value={currentTool}
              onChange={(e) =>
                setCurrentTool(
                  e.target.value as
                    | "freehand"
                    | "arrow"
                    | "circle"
                    | "rectangle"
                )
              }
              className="tool-select"
            >
              <option value="freehand">✏️ Freehand</option>
              <option value="arrow">➡️ Arrow</option>
              <option value="circle">⭕ Circle</option>
              <option value="rectangle">⬜ Rectangle</option>
            </select>
          </div>

          <div className="tool-group">
            <label>Color:</label>
            <input
              type="color"
              value={drawingColor}
              onChange={(e) => setDrawingColor(e.target.value)}
              className="color-picker"
            />
          </div>

          <div className="tool-group">
            <label>Width:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="width-slider"
            />
            <span>{strokeWidth}px</span>
          </div>

          <button onClick={clearCanvas} className="btn clear-btn">
            🗑️ Clear
          </button>
        </div>
      )}

      {/* Status indicator */}
      <div className="canvas-status">
        Status: {isVideoPaused ? `Drawing (${currentTool})` : "Video Playing"}
        {currentDrawings.length > 0 && ` | ${currentDrawings.length} drawings`}
      </div>
    </div>
  );
};

export default CanvasOverlay;
