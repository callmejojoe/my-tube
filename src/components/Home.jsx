import React, { useState, useEffect } from 'react';
import DownloaderCard from './DownloaderCard';

export default function Home() {
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
  );
}
