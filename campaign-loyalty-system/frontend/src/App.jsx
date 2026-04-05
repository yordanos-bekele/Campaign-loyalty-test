import { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import LoyalCustomerRegistration from './components/LoyalCustomerRegistration';
import QrDisplay from './components/QrDisplay';
import ScanPage from './components/ScanPage';

const views = [
  { id: 'home', label: 'Home' },
  { id: 'hotel', label: 'Hotel Login' },
  { id: 'loyalty', label: 'Loyal Signup' },
  { id: 'qr', label: 'Hotel QR' },
];

function getInitialState() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const safeViews = new Set([...views.map((item) => item.id), 'scan']);
  const safeView = safeViews.has(view) ? view : 'home';

  return {
    view: safeView,
    token: params.get('token') || '',
    hotelId: params.get('hotelId') || '1',
    admin: window.location.pathname === '/admin',
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
  const [adminMode] = useState(initialState.admin);

  useEffect(() => {
    setDeviceId(ensureDeviceCookie());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (view !== 'home' && !adminMode) {
      params.set('view', view);
    }

    if (hotelId) {
      params.set('hotelId', hotelId);
    }

    if (view === 'scan' && scanToken) {
      params.set('token', scanToken);
    }

    const query = params.toString();
    const basePath = adminMode ? '/admin' : window.location.pathname;
    const nextUrl = query ? `${basePath}?${query}` : basePath;
    window.history.replaceState({}, '', nextUrl);
  }, [view, hotelId, scanToken, adminMode]);

  if (adminMode) {
    return (
      <div className="app-shell app-shell--admin">
        <main className="page-grid">
          <Dashboard mode="admin" />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero hero--mono">
        <div className="hero__content">
          <p className="eyebrow">Marathon Klassics</p>
          <h1>Loyality customer giveaway built for fast hotel redemption.</h1>
          <p className="hero__text">
            Marathon Klassics uses this platform to help hotel guests earn a free beer after 10 valid scans.
            Hotels display the QR code, guests scan with their own phone, and the result appears instantly in the browser.
          </p>
          <div className="hero__actions">
            <button className="button button--primary" onClick={() => setView('qr')}>
              Show hotel QR
            </button>
            <button className="button button--secondary" onClick={() => setView('loyalty')}>
              Loyal customer signup
            </button>
            <button className="button button--ghost" onClick={() => setView('hotel')}>
              Hotel login
            </button>
          </div>
        </div>
        <aside className="hero__panel">
          <h2>Campaign purpose</h2>
          <p>
            This application tracks valid guest scans fairly and turns repeated visits into a clear Marathon Klassics free-beer reward.
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
                <p>Hotels display a rotating Marathon Klassics QR code that opens the guest result page automatically.</p>
              </article>
              <article className="feature-card">
                <h3>2. Reward loyal guests</h3>
                <p>Guests earn one free beer after 10 valid scans under the campaign rules configured in the backend.</p>
              </article>
              <article className="feature-card">
                <h3>3. Keep the guest flow simple</h3>
                <p>No OTP, no manual approval, no extra form on the scan page. Guests only scan and see the result.</p>
              </article>
              <article className="feature-card">
                <h3>4. Separate hotel and admin controls</h3>
                <p>Hotels only access their own dashboard, while Marathon Klassics admin uses a separate admin URL for registrations and imports.</p>
              </article>
            </div>
          </section>
        )}

        {view === 'hotel' && <Dashboard mode="hotel" />}

        {view === 'qr' && (
          <QrDisplay
            hotelId={hotelId}
            onHotelChange={setHotelId}
          />
        )}

        {view === 'loyalty' && <LoyalCustomerRegistration />}

        {view === 'scan' && (
          <ScanPage
            hotelId={hotelId}
            initialToken={scanToken}
            onOpenQr={() => setView('qr')}
          />
        )}

      </main>
    </div>
  );
}

export default App;
