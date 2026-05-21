import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function History() {
  const { historyState } = useContext(AppContext);
  const { history, setHistory } = historyState;

  const clearHistory = () => {
    setHistory([]);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className='main' style={{ width: '100%', maxWidth: '680px', alignSelf: 'center' }}>
      <h1 className='titl'>History</h1>
      {history.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No downloads yet. Completed downloads will appear here.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '1rem' }}>
            <button onClick={clearHistory} style={{
              background: 'transparent',
              color: 'var(--accentcolor)',
              border: '2px solid var(--accentcolor)',
              padding: '0.4rem 1rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              transition: 'all 0.15s',
            }}>
              Clear History
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {history.map((item, idx) => (
              <div key={idx} style={{
                background: 'var(--secondarycolor)',
                color: 'var(--primarycolor)',
                padding: '1rem 1.25rem',
                border: '2px solid var(--secondarycolor)',
                boxShadow: 'var(--secondarycolor) 4px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textAlign: 'left',
              }}>
                {/* Status icon */}
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                  {item.status === 'done' ? '✓' : '✗'}
                </span>

                {/* File info */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.filename || 'Unknown File'}
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '0.2rem' }}>
                    {formatDate(item.timestamp)}
                  </div>
                  {item.status === 'error' && item.error && (
                    <div style={{ fontSize: '0.8rem', color: '#ff3d00', marginTop: '0.25rem' }}>
                      {item.error}
                    </div>
                  )}
                </div>

                {/* Status pill */}
                <span style={{
                  padding: '0.25rem 0.75rem',
                  border: `1px solid ${item.status === 'done' ? '#39ff14' : '#ff3d00'}`,
                  color: item.status === 'done' ? '#39ff14' : '#ff3d00',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}>
                  {item.status === 'done' ? 'DONE' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
