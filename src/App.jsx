import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import DownloaderCard from './components/DownloaderCard';
import './index.css';

export default function App() {
  const [url, setUrl] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    const removeListener = window.electronAPI.onYtDlpError((msg) => {
      setGlobalError(msg);
    });
    return () => removeListener();
  }, []);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoadingInfo(true);
    setGlobalError('');
    setVideoInfo(null);
    try {
      const info = await window.electronAPI.fetchInfo(url.trim());
      if (info.error) {
        setGlobalError(info.error);
      } else {
        setVideoInfo(info);
      }
    } catch (e) {
      setGlobalError('Failed to fetch info: ' + e.message);
    }
    setLoadingInfo(false);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <div className='main'>
          <h1 className='titl'>My Tube</h1>
          
          <div className='urlsec'> 
            <input 
              type="text" 
              className="urlbox" 
              placeholder="paste yt url tehe" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            /> 
            <span className='fetchit'>
              <button onClick={handleFetch} disabled={loadingInfo}>
                {loadingInfo ? 'Fetching...' : 'Fetch boi'}
              </button>
            </span>
          </div>

          {globalError && <div className="global-error">{globalError}</div>}

          {videoInfo && <DownloaderCard videoInfo={videoInfo} />}
          
        </div>
      </div>
    </div>
  );
}

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);