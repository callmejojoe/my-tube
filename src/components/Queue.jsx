import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Queue() {
  const { queueState } = useContext(AppContext);
  const { queue } = queueState;
  
  const jobs = Object.entries(queue);

  return (
    <div className='main' style={{ width: '100%', maxWidth: '680px', alignSelf: 'center' }}>
      <h1 className='titl'>Queue</h1>
      {jobs.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No active downloads. Start one from the Home page.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', marginTop: '1rem' }}>
          {jobs.map(([jobId, job]) => (
            <div key={jobId} style={{
              background: 'var(--secondarycolor)',
              color: 'var(--primarycolor)',
              padding: '1.25rem',
              border: '2px solid var(--secondarycolor)',
              boxShadow: 'var(--secondarycolor) 4px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textAlign: 'left',
            }}>
              {/* Filename / Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`status-dot ${job.status || 'downloading'}`}></span>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.filename || 'Downloading...'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${job.progress || 0}%` }}></div>
              </div>

              {/* Progress % + status */}
              <div className="progress-text">
                <span style={{ opacity: 0.75, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {job.log || 'Starting...'}
                </span>
                <span style={{ fontWeight: 'bold' }}>{Math.round(job.progress || 0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
