import React, { useContext, useEffect } from 'react';
import DownloaderCard from './DownloaderCard';
import PlaylistCard from './PlaylistCard';
import { AppContext } from '../context/AppContext';

export default function Home() {
  const { homeState } = useContext(AppContext);
  const { url, setUrl, videoInfo, setVideoInfo, loadingInfo, setLoadingInfo, globalError, setGlobalError } = homeState;

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

      {videoInfo && (
        videoInfo.isPlaylist ? (
          <PlaylistCard videoInfo={videoInfo} />
        ) : (
          <DownloaderCard videoInfo={videoInfo} />
        )
      )}
      
    </div>
  );
}
