// frontend/src/components/VideoEditor/VideoEditor.jsx (Updated with Timeline)
import React, { useState, useRef } from "react";
import VideoPlayer from "./VideoPlayer";
import FileUpload from "./FileUpload";
import DrawingCanvas from "./DrawingCanvas";
import DrawingTools from "./DrawingTools";
import Timeline from "./Timeline";
import AnnotationList from "./AnnotationList";
import ExportPanel from "./ExportPanel";

const VideoEditor = () => {
  const videoRef = useRef(null);
  const [videoData, setVideoData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentTool, setCurrentTool] = useState("pen");

  const handleVideoUploaded = (data) => {
    setVideoData(data);
    setDuration(data.duration);
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleLoadedMetadata = (videoDuration) => {
    setDuration(videoDuration);
  };

  const handleVideoPause = () => {
    console.log("Video paused at:", currentTime);
  };

  const handleVideoPlay = () => {
    console.log("Video playing from:", currentTime);
    // Auto-disable drawing mode when video plays
    if (isDrawingMode) {
      setIsDrawingMode(false);
    }
  };

  const handleAnnotationSaved = (annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
    console.log("Annotation saved:", annotation);
    // Auto-disable drawing mode after saving
    setIsDrawingMode(false);
  };

  const handleToggleDrawing = () => {
    setIsDrawingMode(!isDrawingMode);

    // Pause video when entering drawing mode
    if (!isDrawingMode && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleToolChange = (tool) => {
    setCurrentTool(tool);
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleAnnotationClick = (annotation) => {
    handleSeek(annotation.timestamp);
  };

  const handleAnnotationDelete = (annotationId) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== annotationId));
  };

  return (
    <div
      className="video-editor"
      style={{ padding: "20px", maxWidth: "1200px" }}
    >
      <h2>Video Editor</h2>

      {!videoData ? (
        <div>
          <h3>Upload a video to start editing</h3>
          <FileUpload onVideoUploaded={handleVideoUploaded} />
        </div>
      ) : (
        <div>
          <h3>Editing: {videoData.originalName}</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
            }}
          >
            {/* Left Panel - Video and Controls */}
            <div>
              <DrawingTools
                currentTool={currentTool}
                onToolChange={handleToolChange}
                isDrawingMode={isDrawingMode}
                onToggleDrawing={handleToggleDrawing}
              />

              <div style={{ position: "relative", display: "inline-block" }}>
                <VideoPlayer
                  ref={videoRef}
                  videoSrc={videoData.uploadPath}
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handleVideoPause}
                  onPlay={handleVideoPlay}
                  onLoadedMetadata={handleLoadedMetadata}
                />

                <DrawingCanvas
                  videoRef={videoRef}
                  isDrawingMode={isDrawingMode}
                  tool={currentTool}
                  onAnnotationSaved={handleAnnotationSaved}
                />
              </div>

              <Timeline
                duration={duration}
                currentTime={currentTime}
                annotations={annotations}
                onSeek={handleSeek}
                onAnnotationClick={handleAnnotationClick}
                onAnnotationDelete={handleAnnotationDelete}
              />
            </div>

            {/* Right Panel - Annotations */}
            <div>
              <AnnotationList
                annotations={annotations}
                onAnnotationSelect={handleAnnotationClick}
                onAnnotationDelete={handleAnnotationDelete}
                currentTime={currentTime}
              />

              <ExportPanel
                videoData={videoData}
                annotations={annotations}
                onExportComplete={(url) => {
                  console.log("Export completed:", url);
                }}
              />

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: "#e9ecef",
                  borderRadius: "5px",
                }}
              >
                <h5>Status</h5>
                <p>
                  <strong>Current Time:</strong> {currentTime.toFixed(2)}s
                </p>
                <p>
                  <strong>Duration:</strong> {duration.toFixed(2)}s
                </p>
                <p>
                  <strong>Drawing Mode:</strong> {isDrawingMode ? "ON" : "OFF"}
                </p>
                <p>
                  <strong>Current Tool:</strong> {currentTool}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;
