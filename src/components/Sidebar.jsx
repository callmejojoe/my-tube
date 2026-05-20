import React from 'react';

export default function Sidebar({ page, setPage }) {
  return (
    <div className="sidebar">
      <button onClick={() => setPage('home')} className={page === 'home' ? "sidebar-btn active" : "sidebar-btn"}>Home</button>
      <button onClick={() => setPage('queue')} className={page === 'queue' ? "sidebar-btn active" : "sidebar-btn"}>Queue</button>
      <button onClick={() => setPage('history')} className={page === 'history' ? "sidebar-btn active" : "sidebar-btn"}>History</button>
      <button onClick={() => setPage('settings')} className={page === 'settings' ? "sidebar-btn active" : "sidebar-btn"}>Settings</button>
    </div>
  );
}
