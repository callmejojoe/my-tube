import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function DownloaderCard({ videoInfo }) {
  const [format, setFormat] = useState(videoInfo.formats[0]?.id || 'best');

  const { queueState, homeState, historyState } = useContext(AppContext);
  const { queue, setQueue } = queueState;
  const { history } = historyState;
  const { activeJobId, setActiveJobId, downloadFetchId, setDownloadFetchId, fID, setFID } = homeState;

  useEffect(() => {
    setFormat(videoInfo.formats[0]?.id || 'best');
    // We intentionally DO NOT reset activeJobId here so it persists if the user navigates away and back.
  }, [videoInfo]);

  const startDownload = async () => {
    const jId = Date.now().toString();
    setActiveJobId(jId);
    setDownloadFetchId(fID)

    // Seed the queue immediately so it shows up in the Queue page right away
    setQueue(prev => ({
      ...prev,
      [jId]: { status: 'downloading', progress: 0, filename: videoInfo.title, log: 'Starting download...' }
    }));

    try {
      await window.electronAPI.startDownload({ url: videoInfo.webpage_url, format, jobId: jId });
    } catch (err) {
      console.error(err);
    }
  };

  const jobBelongsToThisFetch = downloadFetchId === fID // checks if the job id belongs to this fetch id so that the correct download updates 

  const activeJob = jobBelongsToThisFetch ? queue[activeJobId] : null;
  const historyJob = jobBelongsToThisFetch ? history.find(h => h.jobId === activeJobId) : null;


  // Derive state from global context
  // const activeJob = queue[activeJobId];
  // const historyJob = history.find(h => h.jobId === activeJobId);

  const isDownloading = !!activeJob;
  const isDone = historyJob && historyJob.status === 'done';
  const realDone = isDone && jobBelongsToThisFetch
  const isError = historyJob && historyJob.status === 'error';

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
        <button onClick={startDownload} disabled={isDownloading || realDone} className="dl-btn">
          {isDownloading ? 'Downloading...' : realDone ? 'Downloaded' : 'Download'}
        </button>
      </div>

      {isDownloading && (
        <div className="progress-wrap">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${activeJob.progress || 0}%` }}></div>
          </div>
          <div className="progress-text">
            <span>
              <span className={`status-dot downloading`}></span>
              Downloading...
            </span>
            <span>{Math.round(activeJob.progress || 0)}%</span>
          </div>

          <div className="log-box">
            <div>{activeJob.log || 'Starting download...'}</div>
          </div>
        </div>
      )}

      {isDone && (
        <div className="progress-wrap">
          <div className="done-banner">✓ Download complete — saved to ~/Downloads/Mytube/</div>
        </div>
      )}

      {isError && (
        <div className="progress-wrap">
          <div className="error-banner">✗ {historyJob?.error || 'Download failed.'}</div>
        </div>
      )}
    </div>
  );
}
