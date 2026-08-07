import { useEffect, useMemo, useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import Dashboard from './components/Dashboard';
import LoyalCustomerRegistration from './components/LoyalCustomerRegistration';
import ScanPage from './components/ScanPage';
import { ThemeToggle } from './components/theme-toggle';
import vodkaBottle from './assets/Vodka_bottel.png';
import ginBottle from './assets/Gin_bottel.png';
import vodkaCutout from './assets/Marathon Vodka Cutout.png';
import ginTonicBottle from './assets/mixed 1.4008.png';
import premiumGinBottle from './assets/Marathon_GB_01_060924.png';

const DEVICE_ID_STORAGE_KEY = 'marathon_spirits_device_id';

const views = [
  { id: 'home', label: 'Home' },
  { id: 'hotel', label: 'Hotel Login' },
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
    register: window.location.pathname === '/register',
  };
}

function createDeviceId() {
  if (window.crypto?.randomUUID) {
    return `device-${window.crypto.randomUUID()}`;
  }

  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureDeviceCookie() {
  const storedDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  const existingCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('device_id='));

  if (existingCookie) {
    const cookieDeviceId = existingCookie.split('=').slice(1).join('=');
    if (storedDeviceId !== cookieDeviceId) {
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, cookieDeviceId);
    }
    return cookieDeviceId;
  }

  const deviceId = storedDeviceId || createDeviceId();
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `device_id=${deviceId}; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

function App() {
  const initialState = useMemo(getInitialState, []);
  const [view, setView] = useState(initialState.view);
  const [hotelId, setHotelId] = useState(initialState.hotelId);
  const [scanToken, setScanToken] = useState(initialState.token);
  const [deviceId, setDeviceId] = useState('');
  const [adminMode] = useState(initialState.admin);
  const [registerMode] = useState(initialState.register);

  useEffect(() => {
    setDeviceId(ensureDeviceCookie());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (view !== 'home' && !adminMode && !registerMode) {
      params.set('view', view);
    }

    if (hotelId) {
      params.set('hotelId', hotelId);
    }

    if (view === 'scan' && scanToken) {
      params.set('token', scanToken);
    }

    const query = params.toString();
    const basePath = adminMode ? '/admin' : registerMode ? '/register' : window.location.pathname;
    const nextUrl = query ? `${basePath}?${query}` : basePath;
    window.history.replaceState({}, '', nextUrl);
  }, [view, hotelId, scanToken, adminMode, registerMode]);

  if (adminMode) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <main className="grid gap-6">
          <div className="flex justify-end mb-4"><ThemeToggle /></div>
          <Dashboard mode="admin" />
        </main>
      </div>
    );
  }

  if (registerMode) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <main className="grid gap-6">
          <div className="flex justify-end mb-4"><ThemeToggle /></div>
          <LoyalCustomerRegistration deviceId={deviceId} standalone />
        </main>
      </div>
    );
  }

  if (view === 'scan') {
    return (
      <ScanPage
        hotelId={hotelId}
        initialToken={scanToken}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <header className="brand-hero mb-8 overflow-hidden border border-white/15 relative">
        <div className="absolute top-5 right-5 z-10"><ThemeToggle /></div>
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6 items-center p-7 sm:p-10 lg:p-14">
          <div className="relative z-1">
            <p className="brand-eyebrow mb-3">Marathon Klassics · Hotel loyalty</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[.86] tracking-[-.055em] mb-6 max-w-2xl">
              Scan. Collect. <span className="text-brand-gold">Celebrate.</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-300 mb-8 max-w-xl leading-relaxed">
              <strong className="text-xl font-bold">Ten</strong> qualifying hotel visits unlock a complimentary Marathon Klassics drink. Your reward progress stays connected to this device.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="brand-cta-light min-h-12 px-7" onClick={() => window.location.assign('/register')}>
                Register device
              </Button>
              <Button size="lg" variant="outline" className="min-h-12 px-7 border-zinc-500 text-white hover:bg-white hover:text-black" onClick={() => setView('hotel')}>
                Hotel staff login
              </Button>
            </div>
          </div>
          <div className="bottle-showcase" aria-label="Marathon Klassics vodka and gin collection">
            <div className="bottle-panel bottle-panel-vodka">
              <span>Vodka</span>
              <img src={vodkaCutout} alt="Marathon Klassics vodka bottle" />
            </div>
            <div className="bottle-panel bottle-panel-gin">
              <span>Gin</span>
              <img src={ginBottle} alt="Marathon Klassics gin bottle" />
            </div>
            <img className="promo-bottle promo-bottle-left" src={vodkaBottle} alt="" aria-hidden="true" />
            <img className="promo-bottle promo-bottle-right" src={premiumGinBottle} alt="" aria-hidden="true" />
            <img className="promo-bottle promo-bottle-center" src={ginTonicBottle} alt="" aria-hidden="true" />
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-3 mb-8" aria-label="Main navigation">
        {views.map((item) => (
          <Button
            key={item.id}
            variant={item.id === view ? 'default' : 'outline'}
            className="py-[14px] px-[30px] text-lg rounded-none"
            onClick={() => setView(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      <main className="grid gap-8">
        {view === 'home' && (
          <Card className="shadow-sm overflow-hidden bg-zinc-950 border-zinc-800">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8">
                <p className="brand-eyebrow mb-1">How it works</p>
                <h2 className="text-2xl font-bold uppercase">A simple loyalty journey for hotels and guests</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="campaign-step border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase"><span>01</span> Display hotel QR</h3>
                  <p className="text-muted-foreground leading-relaxed">Marathon Spirits admin controls the hotel QR experience and provides the rotating code used for guest scans.</p>
                </div>
                <div className="campaign-step border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase"><span>02</span> Collect 10 scans</h3>
                  <p className="text-muted-foreground leading-relaxed">Guests earn one free Marathon Klassics Cocktail after 10 valid scans under the campaign rules configured in the backend.</p>
                </div>
                <div className="campaign-step border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase"><span>03</span> Claim your drink</h3>
                  <p className="text-muted-foreground leading-relaxed">No OTP, no manual approval, no extra form on the scan page. Guests only scan and see the result.</p>
                </div>
                <div className="campaign-step border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-3lg font-bold mb-2 uppercase"><span>04</span> Built for hotel teams</h3>
                  <p className="text-muted-foreground leading-relaxed">Hotels only access their own dashboard, while Marathon Spirits admin uses a separate admin URL for registrations, imports, and QR management.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'hotel' && <Dashboard mode="hotel" />}
      </main>
    </div>
  );
}

export default App;
