import React, { useRef, useState, useEffect } from "react";

interface VideoPlayerProps {
  onVideoLoad?: (video: HTMLVideoElement) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  onVideoLoad,
  onTimeUpdate,
  onPlay,
  onPause,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      // Clean up previous URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      alert("Please select a valid video file");
    }
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      onVideoLoad?.(video);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  // Control functions
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newTime = parseFloat(event.target.value);
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const newVolume = parseFloat(event.target.value);
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
    }
  };

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="video-player-container">
      {/* File Input */}
      <div className="file-input-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="file-input"
          id="video-file-input"
        />
        <label htmlFor="video-file-input" className="file-input-label btn">
          Choose Video File
        </label>
        {videoFile && <span className="file-name">{videoFile.name}</span>}
      </div>

      {/* Video Element */}
      {videoUrl && (
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            className="video-player"
            preload="metadata"
          />
        </div>
      )}

      {/* Video Controls */}
      {videoUrl && (
        <div className="video-controls">
          <div className="control-row">
            <button
              onClick={togglePlayPause}
              className="btn play-pause-btn"
              disabled={!videoUrl}
            >
              {isPlaying ? "⏸️ Pause" : "▶️ Play"}
            </button>

            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="control-row">
            <label>Seek:</label>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="seek-slider"
              disabled={!videoUrl}
            />
          </div>

          <div className="control-row">
            <label>Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="debug-info">
        <p>
          Status: {videoFile ? `Loaded: ${videoFile.name}` : "No video loaded"}
        </p>
        <p>Playing: {isPlaying ? "Yes" : "No"}</p>
        <p>Current Time: {formatTime(currentTime)}</p>
        <p>Duration: {formatTime(duration)}</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
