import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import type {
  DrawingAction,
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
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [tempShape, setTempShape] = useState<fabric.Object | null>(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        selection: false,
        preserveObjectStacking: true,
      });

      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas); // ✅ required for freehand

      fabricCanvasRef.current = canvas;

      // Set initial dimensions
      canvas.setDimensions(canvasDimensions);

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Update canvas dimensions and position to match video
  useEffect(() => {
    if (videoElement && fabricCanvasRef.current && containerRef.current) {
      const updateCanvasPosition = () => {
        const videoRect = videoElement.getBoundingClientRect();
        const canvas = fabricCanvasRef.current;

        if (!canvas || videoRect.width === 0 || videoRect.height === 0) return;

        // Update dimensions
        setCanvasDimensions({
          width: videoRect.width,
          height: videoRect.height,
        });

        canvas.setDimensions({
          width: videoRect.width,
          height: videoRect.height,
        });

        // Sync canvas wrapper styles
        const wrapperEl = canvas.wrapperEl;
        const offsetTop =
          videoRect.top -
          videoElement.parentElement!.getBoundingClientRect().top;

        if (wrapperEl) {
          wrapperEl.style.position = "absolute";
          wrapperEl.style.left = `${videoRect.left}px`;
          wrapperEl.style.top = `${offsetTop}px`;
          wrapperEl.style.width = `${videoRect.width}px`;
          wrapperEl.style.height = `${videoRect.height}px`;
          wrapperEl.style.pointerEvents = "none"; // optional: disables all fabric mouse events
        }

        // Ensure upper/lower canvas layers match
        if (canvas.upperCanvasEl) {
          const upper = canvas.upperCanvasEl;
          upper.style.position = "absolute";
          upper.style.left = "0px";
          upper.style.top = "0px";
          upper.style.width = `${videoRect.width}px`;
          upper.style.height = `${videoRect.height}px`;
          upper.style.pointerEvents = isVideoPaused ? "auto" : "none";
        }

        if (canvas.lowerCanvasEl) {
          const lower = canvas.lowerCanvasEl;
          lower.style.position = "absolute";
          lower.style.left = "0px";
          lower.style.top = "0px";
          lower.style.width = `${videoRect.width}px`;
          lower.style.height = `${videoRect.height}px`;
        }
      };

      updateCanvasPosition();
      videoElement.addEventListener("loadedmetadata", updateCanvasPosition);
      window.addEventListener("resize", updateCanvasPosition);

      const resizeObserver = new ResizeObserver(updateCanvasPosition);
      resizeObserver.observe(videoElement);

      return () => {
        videoElement.removeEventListener(
          "loadedmetadata",
          updateCanvasPosition
        );
        window.removeEventListener("resize", updateCanvasPosition);
        resizeObserver.disconnect();
      };
    }
  }, [videoElement, isVideoPaused]);

  // Enable/disable canvas interaction based on video state
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      if (isVideoPaused) {
        // Enable drawing when video is paused
        canvas.isDrawingMode = currentTool === "freehand";
        canvas.selection = false;

        // Set up drawing brush
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = drawingColor;
          canvas.freeDrawingBrush.width = strokeWidth;
        }
      } else {
        // Disable interaction when video is playing
        canvas.isDrawingMode = false;
        canvas.selection = false;
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
        const points: { x: number; y: number }[] = [];

        // Extract coordinates from path
        try {
          const pathArray = path.path || [];
          for (let i = 0; i < pathArray.length; i++) {
            const segment = pathArray[i];
            if (Array.isArray(segment) && segment.length >= 3) {
              if (segment[0] === "M" || segment[0] === "L") {
                points.push({ x: segment[1], y: segment[2] });
              } else if (segment[0] === "Q" && segment.length >= 5) {
                // Quadratic curve - add end point
                points.push({ x: segment[3], y: segment[4] });
              }
            }
          }
        } catch (error) {
          console.warn("Path parsing error:", error);
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

      // Remove any temporary shape
      if (tempShape) {
        canvas.remove(tempShape);
        setTempShape(null);
      }
    };

    const handleMouseMove = (event: any) => {
      if (!isDrawing || !startPoint || currentTool === "freehand") return;

      const pointer = canvas.getPointer(event.e);

      // Remove previous temp shape
      if (tempShape) {
        canvas.remove(tempShape);
      }

      let newShape: fabric.Object | null = null;

      switch (currentTool) {
        case "arrow": {
          const line = new fabric.Line(
            [startPoint.x, startPoint.y, pointer.x, pointer.y],
            {
              stroke: drawingColor,
              strokeWidth: strokeWidth,
              selectable: false,
              evented: false,
            }
          );
          newShape = line;
          break;
        }
        case "circle": {
          const radius = Math.sqrt(
            Math.pow(pointer.x - startPoint.x, 2) +
              Math.pow(pointer.y - startPoint.y, 2)
          );
          const circle = new fabric.Circle({
            left: startPoint.x - radius,
            top: startPoint.y - radius,
            radius: radius,
            stroke: drawingColor,
            strokeWidth: strokeWidth,
            fill: "",
            selectable: false,
            evented: false,
          });
          newShape = circle;
          break;
        }
        case "rectangle": {
          const rect = new fabric.Rect({
            left: Math.min(startPoint.x, pointer.x),
            top: Math.min(startPoint.y, pointer.y),
            width: Math.abs(pointer.x - startPoint.x),
            height: Math.abs(pointer.y - startPoint.y),
            stroke: drawingColor,
            strokeWidth: strokeWidth,
            fill: "",
            selectable: false,
            evented: false,
          });
          newShape = rect;
          break;
        }
      }

      if (newShape) {
        canvas.add(newShape);
        setTempShape(newShape);
        canvas.renderAll();
      }
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

      // Remove temp shape
      if (tempShape) {
        canvas.remove(tempShape);
        setTempShape(null);
      }

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
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("path:created", handlePathCreated);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
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
    tempShape,
  ]);

  // Render current drawings on canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Clear existing drawings (except temp shape)
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj !== tempShape) {
        canvas.remove(obj);
      }
    });

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
  }, [currentDrawings, drawingColor, strokeWidth, tempShape]);

  // Clear canvas function
  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.clear();
      if (tempShape) {
        setTempShape(null);
      }
    }
  };

  return (
    <div className="canvas-overlay-container" ref={containerRef}>
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
          zIndex: 20 /* Lower than drawing tools (60) */,
          cursor: isVideoPaused ? "crosshair" : "default",
          pointerEvents: isVideoPaused ? "auto" : "none",
        }}
      />

      {/* Drawing Tools - Show when video is paused */}
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
            🗑️ Clear Canvas
          </button>
        </div>
      )}

      {/* Canvas Status */}
      <div className="canvas-status">
        <div>Status: {isVideoPaused ? `✏️ Drawing Mode` : "▶️ Playing"}</div>
        {isVideoPaused && <div>Tool: {currentTool}</div>}
        {currentDrawings.length > 0 && (
          <div>Drawings: {currentDrawings.length}</div>
        )}
      </div>
    </div>
  );
};

export default CanvasOverlay;
