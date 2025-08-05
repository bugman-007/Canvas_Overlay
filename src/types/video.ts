export interface FreehandData {
    points: { x: number; y: number }[];
  }
  
  export interface ArrowData {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }
  
  export interface CircleData {
    center: { x: number; y: number };
    radius: number;
  }
  
  export interface RectangleData {
    topLeft: { x: number; y: number };
    width: number;
    height: number;
  }
  
  export type DrawingData = FreehandData | ArrowData | CircleData | RectangleData;
  
  export interface DrawingAction {
    id: string;
    type: "freehand" | "arrow" | "circle" | "rectangle";
    data: DrawingData;
    timestamp: number;
    duration?: number;
    color?: string;
    strokeWidth?: number;
  }
  
  export interface VideoSegment {
    type: 'video' | 'pause';
    startTime: number;
    duration: number;
    drawings?: DrawingAction[];
  }
  
  export interface ExportData {
    videoFile: File;
    segments: VideoSegment[];
    totalDuration: number;
  }