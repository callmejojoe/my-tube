import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

export default function App() {
  return (
    <div>
      <div className='main'>
        <h1 className='titl'>My Tube</h1>
        <div className='urlsec'> <input type="text" className="urlbox" placeholder="paste yt url tehe" /> <span className='fetchit'><button>Fetch boi</button></span></div>

      </div>
    </div>
  );
}

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);