import { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import QrDisplay from './components/QrDisplay';
import ScanPage from './components/ScanPage';

const views = [
  { id: 'home', label: 'Home' },
  { id: 'qr', label: 'Hotel QR' },
  { id: 'scan', label: 'Scan Drink Code' },
  { id: 'dashboard', label: 'Dashboard' },
];

function getInitialState() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const safeView = views.some((item) => item.id === view) ? view : 'home';

  return {
    view: safeView,
    token: params.get('token') || '',
    hotelId: params.get('hotelId') || '1',
  };
}

function createDeviceId() {
  if (window.crypto?.randomUUID) {
    return `device-${window.crypto.randomUUID()}`;
  }

  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureDeviceCookie() {
  const existingCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('device_id='));

  if (existingCookie) {
    return existingCookie.split('=')[1];
  }

  const deviceId = createDeviceId();
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `device_id=${deviceId}; path=/; max-age=${maxAge}; SameSite=Lax`;
  return deviceId;
}

function App() {
  const initialState = useMemo(getInitialState, []);
  const [view, setView] = useState(initialState.view);
  const [hotelId, setHotelId] = useState(initialState.hotelId);
  const [scanToken, setScanToken] = useState(initialState.token);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    setDeviceId(ensureDeviceCookie());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (view !== 'home') {
      params.set('view', view);
    }

    if (hotelId) {
      params.set('hotelId', hotelId);
    }

    if (view === 'scan' && scanToken) {
      params.set('token', scanToken);
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }, [view, hotelId, scanToken]);

  const openScanView = (token, nextHotelId) => {
    setScanToken(token);
    setHotelId(String(nextHotelId));
    setView('scan');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Campaign Loyalty System</p>
          <h1>Help guests earn their free drink with a scan flow that feels easy.</h1>
          <p className="hero__text">
            This app is designed for everyday customers, not technical users. Guests can scan,
            see a clear result, and track progress without dealing with codes, forms, or staff approval.
          </p>
          <div className="hero__actions">
            <button className="button button--primary" onClick={() => setView('scan')}>
              Open customer scan page
            </button>
            <button className="button button--secondary" onClick={() => setView('qr')}>
              Show hotel QR code
            </button>
          </div>
        </div>
        <aside className="hero__panel">
          <h2>Device ready</h2>
          <p>
            This browser already has a private customer device ID, so repeat scans can be tracked
            fairly.
          </p>
          <code className="device-pill">{deviceId || 'Preparing device...'}</code>
        </aside>
      </header>

      <nav className="tab-bar" aria-label="Main navigation">
        {views.map((item) => (
          <button
            key={item.id}
            className={item.id === view ? 'tab-bar__button tab-bar__button--active' : 'tab-bar__button'}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="page-grid">
        {view === 'home' && (
          <section className="panel panel--wide">
            <div className="panel__header">
              <div>
                <p className="eyebrow">How it works</p>
                <h2>A simple loyalty journey for hotels and guests</h2>
              </div>
            </div>
            <div className="feature-grid">
              <article className="feature-card">
                <h3>1. Display hotel QR</h3>
                <p>Generate a hotel-specific QR code that refreshes on time and opens the scan page automatically.</p>
              </article>
              <article className="feature-card">
                <h3>2. Guest scans once</h3>
                <p>The customer only scans and confirms. The app handles device tracking, timing rules, and validation behind the scenes.</p>
              </article>
              <article className="feature-card">
                <h3>3. Show clear feedback</h3>
                <p>Every result is displayed in plain language so customers immediately know whether the scan counted.</p>
              </article>
              <article className="feature-card">
                <h3>4. Review hotel stats</h3>
                <p>Hotel teams can quickly see today&apos;s scans, rewards, and suspicious activity from one screen.</p>
              </article>
            </div>
          </section>
        )}

        {view === 'qr' && (
          <QrDisplay
            hotelId={hotelId}
            onHotelChange={setHotelId}
            onOpenScan={openScanView}
          />
        )}

        {view === 'scan' && (
          <ScanPage
            hotelId={hotelId}
            initialToken={scanToken}
            onOpenQr={() => setView('qr')}
          />
        )}

        {view === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
