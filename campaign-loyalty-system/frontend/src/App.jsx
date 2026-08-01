import { useEffect, useMemo, useState } from 'react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent } from './components/ui/card';
import Dashboard from './components/Dashboard';
import LoyalCustomerRegistration from './components/LoyalCustomerRegistration';
import ScanPage from './components/ScanPage';
import { ThemeToggle } from './components/theme-toggle';

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
    const cookieDeviceId = existingCookie.split('=')[1];
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
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <header className="grid gap-6 lg:grid-cols-[2.2fr_1fr] items-stretch mb-8">
        <Card className="shadow-lg">
          <CardContent className="p-8 md:p-10 relative">
            <div className="absolute top-8 right-8"><ThemeToggle /></div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">Marathon Spirits</p>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase leading-tight mb-4 max-w-lg">
              Loyalty customer giveaway built for fast hotel redemption.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Marathon Spirits uses this platform to help hotel guests earn a free beer after 10 valid scans.
              Hotels display the QR code, guests scan with their own phone, and the result appears instantly in the browser.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="px-8 py-6 shadow-none" onClick={() => window.location.assign('/register')}>
                Loyal customer signup
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6" onClick={() => setView('hotel')}>
                Hotel login
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full">
            <h2 className="text-xl font-bold mb-3 uppercase">Campaign purpose</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              This application tracks valid guest scans fairly and turns repeated visits into a clear Marathon Spirits free-beer reward.
            </p>
            <div className="mt-auto">
              <Badge variant="secondary" className="px-3 py-1 font-mono text-xs w-fit">
                {deviceId || 'Preparing device...'}
              </Badge>
            </div>
          </CardContent>
        </Card>
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
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">How it works</p>
                <h2 className="text-2xl font-bold uppercase">A simple loyalty journey for hotels and guests</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase">1. Display hotel QR</h3>
                  <p className="text-muted-foreground leading-relaxed">Marathon Spirits admin controls the hotel QR experience and provides the rotating code used for guest scans.</p>
                </div>
                <div className="border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase">2. Reward loyal guests</h3>
                  <p className="text-muted-foreground leading-relaxed">Guests earn one free beer after 10 valid scans under the campaign rules configured in the backend.</p>
                </div>
                <div className="border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase">3. Keep the guest flow simple</h3>
                  <p className="text-muted-foreground leading-relaxed">No OTP, no manual approval, no extra form on the scan page. Guests only scan and see the result.</p>
                </div>
                <div className="border p-6 bg-card transition-all hover:border-primary/50">
                  <h3 className="text-lg font-bold mb-2 uppercase">4. Separate hotel and admin controls</h3>
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
