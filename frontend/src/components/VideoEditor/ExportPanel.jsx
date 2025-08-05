import React, { useState } from 'react';
import axios from 'axios';

const ExportPanel = ({ videoData, annotations, onExportComplete }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportId, setExportId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const startExport = async () => {
    if (!videoData || annotations.length === 0) {
      alert('Please add some annotations before exporting');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      // Start export
      const response = await axios.post('/api/export', {
        videoId: videoData.videoId,
        annotations: annotations,
        settings: {
          quality: 'high',
          format: 'mp4'
        }
      });

      setExportId(response.data.exportId);
      
      // Poll for progress
      pollExportStatus(response.data.exportId);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to start export');
      setIsExporting(false);
    }
  };

  const pollExportStatus = async (exportId) => {
    const maxAttempts = 120; // 2 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/export/${exportId}/status`);
        const { status, progress, downloadUrl: url, error: exportError } = response.data;

        setExportProgress(progress);

        if (status === 'completed') {
          setDownloadUrl(url);
          setIsExporting(false);
          onExportComplete && onExportComplete(url);
        } else if (status === 'failed') {
          setError(exportError || 'Export failed');
          setIsExporting(false);
        } else if (status === 'processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000); // Poll every second
        } else {
          setError('Export timeout');
          setIsExporting(false);
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setError('Failed to check export status');
        setIsExporting(false);
      }
    };

    poll();
  };

  const downloadVideo = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="export-panel" style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '5px',
      marginTop: '20px'
    }}>
      <h4>Export Video</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Video:</strong> {videoData?.originalName}</p>
        <p><strong>Annotations:</strong> {annotations.length}</p>
        <p><strong>Estimated Duration:</strong> {
          annotations.reduce((total, ann) => total + 1, videoData?.duration || 0).toFixed(1)
        }s</p>
      </div>

      {!isExporting && !downloadUrl && (
        <button
          onClick={startExport}
          disabled={!videoData || annotations.length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: annotations.length > 0 ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          Export Video
        </button>
      )}

      {isExporting && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Exporting... {exportProgress}%</strong>
          </div>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#e9ecef',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${exportProgress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
            This may take a few minutes depending on video length and annotations...
          </div>
        </div>
      )}

      {downloadUrl && (
        <div>
          <div style={{ color: '#28a745', marginBottom: '10px' }}>
            ✅ Export completed successfully!
          </div>
          <button
            onClick={downloadVideo}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Download Video
          </button>
        </div>
      )}

      {error && (
        <div style={{
          color: '#dc3545',
          padding: '10px',
          backgroundColor: '#f8d7da',
          borderRadius: '3px',
          marginTop: '10px'
        }}>
          ❌ Error: {error}
        </div>
      )}
    </div>
  );
};

export default ExportPanel;