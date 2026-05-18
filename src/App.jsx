import React from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import './index.css';

export default function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <div className='main'>
          <h1 className='titl'>My Tube</h1>
          <div className='urlsec'> <input type="text" className="urlbox" placeholder="paste yt url tehe" /> <span className='fetchit'><button>Fetch boi</button></span></div>
        </div>
      </div>
    </div>
  );
}

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);