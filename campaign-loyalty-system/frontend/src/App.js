import { useState } from 'react';
import QrDisplay from './components/QrDisplay';
import ScanPage from './components/ScanPage';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('qr');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('qr')} style={{ marginRight: '10px', padding: '10px' }}>QR Display</button>
        <button onClick={() => setView('scan')} style={{ marginRight: '10px', padding: '10px' }}>Scan Page</button>
        <button onClick={() => setView('dashboard')} style={{ padding: '10px' }}>Dashboard</button>
      </nav>
      {view === 'qr' && <QrDisplay />}
      {view === 'scan' && <ScanPage />}
      {view === 'dashboard' && <Dashboard />}
    </div>
  );
}

export default App;