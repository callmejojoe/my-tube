import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function PlaylistCard({ videoInfo }) {
  const [format, setFormat] = useState(videoInfo.formats[0]?.id || 'bestvideo[height<=1080]+bestaudio/best');
  
  const { homeState, queueState, historyState } = useContext(AppContext);
  const { activeJobId, setActiveJobId, downloadFetchId, setDownloadFetchId, fID, setFID } = homeState;
  const { queue, setQueue } = queueState;
  const { history } = historyState;

  useEffect(() => {
    setFormat(videoInfo.formats[0]?.id || 'bestvideo[height<=1080]+bestaudio/best');
  }, [videoInfo]);

  const startDownload = async () => {
    const jId = `playlist_${Date.now()}`;
    setActiveJobId(jId);
    setDownloadFetchId(fID);
    
    // Add placeholder to queue immediately so it shows up as active
    setQueue(prev => ({
      ...prev,
      [jId]: { status: 'downloading', progress: 0, filename: `Playlist: ${videoInfo.title}`, log: 'Starting concurrent downloads...' }
    }));
    
    try {
      const res = await window.electronAPI.startDownload({ 
        url: videoInfo.webpage_url, 
        format, 
        jobId: jId, 
        isPlaylist: true 
      });
      if (res.error) {
         console.error(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Derive state from global context
  // Note: For playlists, the sub-jobs are spawned as `jobId_0`, `jobId_1`, etc.
  // The main `jobId` itself might also receive events (like 'done' when the whole playlist finishes)
  // Let's check if the main jobId is in the queue, or if any sub-job is in the queue.
  const jobBelongsToThisFetch = downloadFetchId === fID;
  const isDownloading = jobBelongsToThisFetch && Object.keys(queue).some(k => k.startsWith(activeJobId));
  const isDone = jobBelongsToThisFetch && history.some(h => h.jobId === activeJobId && h.status === 'done');
  const isError = jobBelongsToThisFetch && history.some(h => h.jobId === activeJobId && h.status === 'error');

  return (
    <div className="downloader-card">
      <div className="info-row">
        <div className="thumb-placeholder" style={{ background: 'var(--accent-primary)', display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontSize: '2rem' }}>🗂️</span>
           <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Playlist</span>
        </div>
        <div className="meta">
          <h2>{videoInfo.title}</h2>
          <p>↑ {videoInfo.uploader}</p>
          <p>📺 {videoInfo.entriesCount} Items</p>
        </div>
      </div>
      
      <div className="format-sec">
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="format-select">
          {videoInfo.formats.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <button onClick={startDownload} disabled={isDownloading || isDone} className="dl-btn">
          {isDownloading ? 'Downloading...' : isDone ? 'Downloaded' : 'Download All'}
        </button>
      </div>

      {isDownloading && (
        <div className="progress-wrap">
          <div className="progress-text" style={{ justifyContent: 'center' }}>
            <span>
              <span className={`status-dot downloading`}></span>
              Downloading playlist concurrently. Check the Queue tab for detailed progress.
            </span>
          </div>
        </div>
      )}
      
      {isDone && (
        <div className="progress-wrap">
          <div className="done-banner">✓ Playlist download complete</div>
        </div>
      )}

      {isError && (
        <div className="progress-wrap">
           <div className="error-banner">✗ Failed to download playlist</div>
        </div>
      )}
    </div>
  );
}
