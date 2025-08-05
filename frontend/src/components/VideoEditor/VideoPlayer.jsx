import React, { useRef, useEffect, useState } from 'react';

const VideoPlayer = ({ videoSrc, onTimeUpdate, onPause, onPlay, onLoadedMetadata }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate && onTimeUpdate(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onLoadedMetadata && onLoadedMetadata(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay && onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause && onPause();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onPause, onPlay, onLoadedMetadata]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const rect = e.target.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  return (
    <div className="video-player">
      <div className="video-container" style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          src={videoSrc}
          style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
          controls={false}
        />
      </div>
      
      <div className="video-controls">
        <button onClick={togglePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <div className="timeline" onClick={handleSeek} style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#ddd',
          cursor: 'pointer',
          margin: '0 10px'
        }}>
          <div 
            className="progress"
            style={{
              width: `${(currentTime / duration) * 100}%`,
              height: '100%',
              backgroundColor: '#007bff'
            }}
          />
        </div>
        
        <span>{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
      </div>
    </div>
  );
};

export default VideoPlayer;