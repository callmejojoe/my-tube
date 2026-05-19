import React, { useState, useEffect, useRef } from 'react';

export default function DownloaderCard({ videoInfo }) {
  const [format, setFormat] = useState(videoInfo.formats[0]?.id || 'best');
  const [downloadState, setDownloadState] = useState('idle'); // idle, downloading, done, error
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const currentJobId = useRef(null);

  useEffect(() => {
    setFormat(videoInfo.formats[0]?.id || 'best');
    setDownloadState('idle');
    setProgress(0);
    setLogs([]);
  }, [videoInfo]);

  useEffect(() => {
    const removeListener = window.electronAPI.onDownloadProgress((data) => {
      if (data.jobId === currentJobId.current) {
        if (data.progress !== null && data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.log) {
          setLogs(prev => [...prev.slice(-19), data.log]);
        }
        if (data.status) {
          setDownloadState(data.status);
        }
        if (data.error) {
          setErrorMsg(data.error);
        }
      }
    });
    return () => removeListener();
  }, []);

  const startDownload = async () => {
    const jId = Date.now().toString();
    currentJobId.current = jId;
    setDownloadState('downloading');
    setProgress(0);
    setLogs([]);
    setErrorMsg('');
    
    try {
      await window.electronAPI.startDownload({ url: videoInfo.webpage_url, format, jobId: jId });
    } catch (err) {
      setDownloadState('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="downloader-card">
      <div className="info-row">
        {videoInfo.thumbnail ? (
          <img src={videoInfo.thumbnail} alt="Thumbnail" className="thumb" />
        ) : (
          <div className="thumb-placeholder">🎬</div>
        )}
        <div className="meta">
          <h2>{videoInfo.title}</h2>
          <p>↑ {videoInfo.uploader}</p>
          <p>⏱ {videoInfo.duration}</p>
        </div>
      </div>
      
      <div className="format-sec">
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="format-select">
          {videoInfo.formats.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <button onClick={startDownload} disabled={downloadState === 'downloading'} className="dl-btn">
          {downloadState === 'downloading' ? 'Downloading...' : 'Download'}
        </button>
      </div>

      {downloadState !== 'idle' && (
        <div className="progress-wrap">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            <span>
              <span className={`status-dot ${downloadState}`}></span>
              {downloadState === 'downloading' ? 'Downloading...' : downloadState === 'done' ? 'Complete!' : 'Error'}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="log-box">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>

          {downloadState === 'done' && (
            <div className="done-banner">✓ Download complete — saved to ~/Downloads/Mytube/</div>
          )}
          {downloadState === 'error' && (
            <div className="error-banner">✗ {errorMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}
