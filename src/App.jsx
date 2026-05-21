import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Queue from './components/Queue';
import History from './components/History';
import Settings from './components/Settings';
import './index.css';
import { AppProvider } from './context/AppContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  return (
    <AppProvider>
      <div className="app-container">
        <Sidebar page={currentPage} setPage={setCurrentPage} />
        <div className="content-container">
          {currentPage === 'home' && <Home />}
          {currentPage === 'queue' && <Queue />}
          {currentPage === 'history' && <History />}
          {currentPage === 'settings' && <Settings />}
        </div>
      </div>
    </AppProvider>
  );
}