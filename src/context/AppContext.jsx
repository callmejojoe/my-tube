import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Home page state
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // To track the current job started from the home page
  const [activeJobId, setActiveJobId] = useState(null);
  const [downloadFetchId, setDownloadFetchId] = useState(null);
  const [fID, setFID] = useState(0);

  // Queue state (active downloads)
  const [queue, setQueue] = useState({});

  // History state (completed downloads)
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('mytube_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mytube_history', JSON.stringify(history));
  }, [history]);

  // Global IPC listener for download progress
  useEffect(() => {
    const removeListener = window.electronAPI.onDownloadProgress((data) => {
      setQueue((prevQueue) => {
        const { jobId, status, progress, filename, log, error } = data;
        const currentJob = prevQueue[jobId] || {};

        // If the job is done or errored, we want to move it to history
        if (status === 'done' || status === 'error') {
          setHistory((prevHistory) => [
            {
              jobId,
              status,
              filename: filename || currentJob.filename || 'Unknown File',
              error: error || currentJob.error,
              timestamp: Date.now()
            },
            ...prevHistory
          ]);

          // Remove from queue
          const newQueue = { ...prevQueue };
          delete newQueue[jobId];
          return newQueue;
        }

        // Otherwise update the queue
        return {
          ...prevQueue,
          [jobId]: {
            ...currentJob,
            status: status || currentJob.status,
            progress: progress !== undefined && progress !== null ? progress : currentJob.progress,
            filename: filename || currentJob.filename,
            log: log || currentJob.log,
            error: error || currentJob.error
          }
        };
      });
    });

    return () => removeListener();
  }, []);

  return (
    <AppContext.Provider value={{
      homeState: {
        url,
        setUrl,
        videoInfo,
        setVideoInfo,
        loadingInfo,
        setLoadingInfo,
        globalError,
        setGlobalError,
        activeJobId,
        setActiveJobId,
        downloadFetchId,
        setDownloadFetchId,
        fID,
        setFID,
      },
      queueState: { queue, setQueue },
      historyState: { history, setHistory }
    }}>
      {children}
    </AppContext.Provider>
  );
};
