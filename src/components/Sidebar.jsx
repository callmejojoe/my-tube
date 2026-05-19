import React from 'react';

export default function Sidebar(page) {
  return (
    <div className="sidebar">
      <button className={page == 'home' ? "active" : "sidebar-btn"}>Home</button>
      <button className={page == 'queue' ? "active" : "sidebar-btn"}>Queue</button>
      <button className={page == 'history' ? "active" : "sidebar-btn"}>History</button>
      <button className={page == 'settings' ? "active" : "sidebar-btn"}>Settings</button>
    </div>
  );
}
