import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Button } from './components/ui/button';
import BrandFooter from './components/BrandFooter';
import marathonLogo from './assets/Marathon logo.png';
import editorialHotelTote from './assets/img_on_hotel_login_page.jpg';
import ginBottle from './assets/Gin_bottel.png';

const Dashboard = lazy(() => import('./components/Dashboard'));
const LoyalCustomerRegistration = lazy(() => import('./components/LoyalCustomerRegistration'));
const ScanPage = lazy(() => import('./components/ScanPage'));

function PageLoader() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center py-20 px-4">
      <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#deb355] rounded-full animate-spin mb-3" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-condensed">
        Loading...
      </span>
    </div>
  );
}

const DEVICE_ID_STORAGE_KEY = 'marathon_spirits_device_id';

const views = [
  { id: 'home', label: 'Home' },
  { id: 'hotel', label: 'Hotel Login' },
];

function getInitialState() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const isHotel = window.location.pathname === '/hotel' || view === 'hotel';
  const safeViews = new Set([...views.map((item) => item.id), 'scan']);
  const safeView = isHotel ? 'hotel' : (safeViews.has(view) ? view : 'home');

  return {
    view: safeView,
    token: params.get('token') || '',
    hotelId: params.get('hotelId') || '1',
    admin: window.location.pathname === '/admin' || view === 'admin',
    register: window.location.pathname === '/register' || view === 'register',
    hotel: isHotel,
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
  const [hotelMode] = useState(initialState.hotel);

  useEffect(() => {
    setDeviceId(ensureDeviceCookie());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (view !== 'home' && !adminMode && !registerMode && !hotelMode) {
      params.set('view', view);
    }

    if (hotelId) {
      params.set('hotelId', hotelId);
    }

    if (view === 'scan' && scanToken) {
      params.set('token', scanToken);
    }

    const query = params.toString();
    const basePath = adminMode ? '/admin' : registerMode ? '/register' : (hotelMode || view === 'hotel') ? '/hotel' : window.location.pathname;
    const nextUrl = query ? `${basePath}?${query}` : basePath;
    window.history.replaceState({}, '', nextUrl);
  }, [view, hotelId, scanToken, adminMode, registerMode, hotelMode]);

  if (adminMode) {
    return (
      <div className="w-full min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Dashboard mode="admin" />
        </Suspense>
      </div>
    );
  }

  if (registerMode) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-between bg-zinc-100">
        <div className="py-6 px-4">
          <Suspense fallback={<PageLoader />}>
            <LoyalCustomerRegistration deviceId={deviceId} standalone />
          </Suspense>
        </div>
        <BrandFooter />
      </div>
    );
  }

  if (view === 'scan') {
    return (
      <div className="w-full min-h-screen flex flex-col justify-between">
        <Suspense fallback={<PageLoader />}>
          <ScanPage
            hotelId={hotelId}
            initialToken={scanToken}
          />
        </Suspense>
        <BrandFooter />
      </div>
    );
  }

  if (view === 'hotel' || hotelMode) {
    return (
      <div className="w-full min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Dashboard mode="hotel" />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col justify-between">
      <div className="w-full max-w-5xl mx-auto py-6 px-4 flex flex-col gap-10">

        {/* Hero Section Matching hotel_login_page.jpg */}
        <header className="bg-black text-white p-6 sm:p-10 border border-zinc-800">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <img src={marathonLogo} alt="Marathon Spirits" className="h-12 w-auto object-contain logo-white" decoding="async" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Marathon Klassics Hotel Loyalty
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white/60 text-white hover:bg-white hover:text-black rounded-none uppercase font-bold text-xs tracking-wider px-5"
                onClick={() => window.location.assign('/register')}
              >
                Register Device
              </Button>
              <Button
                variant="outline"
                className="border-white/60 text-white hover:bg-white hover:text-black rounded-none uppercase font-bold text-xs tracking-wider px-5"
                onClick={() => setView('hotel')}
              >
                Hotel Staff Login
              </Button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Lifestyle Tote Bag Image */}
            <div className="relative overflow-hidden bg-zinc-900 min-h-[380px] flex flex-col justify-end">
              <img
                src={editorialHotelTote}
                alt="Marathon Spirits Tote and Gin"
                className="w-full h-full object-cover object-center absolute inset-0"
                decoding="async"
                fetchpriority="high"
              />
              <div className="relative z-10 p-6 bg-gradient-to-t from-black via-black/75 to-transparent">
                <p className="text-xs uppercase font-extrabold tracking-wider text-white leading-relaxed max-w-xs">
                  Ten qualifying hotel visits unlock a complimentary Marathon Klassics Cocktail. Your reward progress stays connected to this device.
                </p>
              </div>
            </div>

            {/* Massive Display Title */}
            <div className="flex flex-col justify-center py-6">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.9] space-y-1">
                <span className="block">Scan.</span>
                <span className="block">Collect.</span>
                <span className="block text-[#deb355]">Celebrate.</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Feature Cards Row */}
        <section className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Mustard Partner Portal Card */}
          <div className="bg-brand-mustard text-white p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <span className="inline-block bg-brand-terracotta text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-6">
                Hotel Partner Portal
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight mb-4">
                Hotel Loyalty Dashboard
              </h2>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/90 leading-relaxed max-w-sm">
                Hotel teams only see their own campaign information, including scans, rewards, and suspicious activity.
              </p>
            </div>
          </div>

          {/* Card 2: Split Card with London Dry Gin */}
          <div className="relative overflow-hidden min-h-[280px] bg-gradient-to-b from-brand-mustard via-[#de9b35] to-brand-bottle-green flex items-center justify-center p-6">
            <img
              src={ginBottle}
              alt="Marathon London Dry Gin"
              className="h-64 sm:h-72 w-auto object-contain drop-shadow-2xl relative z-10"
              decoding="async"
              loading="lazy"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/80 text-3xl font-black">
              ›
            </div>
          </div>
        </section>

        {/* How It Works Steps */}
        <section className="bg-white border border-zinc-200 p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-brand-mustard block mb-1 font-condensed">
              How It Works
            </span>
            <h2 className="text-2xl font-black uppercase text-zinc-950 font-condensed">
              A Simple Loyalty Journey for Hotels and Guests
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-zinc-200 p-5 bg-zinc-50">
              <h3 className="text-sm font-black uppercase text-zinc-950 mb-1.5 flex items-center gap-2 font-condensed">
                <span className="text-brand-mustard font-black text-base">01</span> Display Hotel QR
              </h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Marathon Spirits admin controls the rotating QR code used for guest scans at hotel venues.
              </p>
            </div>

            <div className="border border-zinc-200 p-5 bg-zinc-50">
              <h3 className="text-sm font-black uppercase text-zinc-950 mb-1.5 flex items-center gap-2 font-condensed">
                <span className="text-brand-mustard font-black text-base">02</span> Collect 10 Scans
              </h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Guests earn 1 complimentary Marathon Klassics Cocktail after 10 valid scans at the same hotel.
              </p>
            </div>

            <div className="border border-zinc-200 p-5 bg-zinc-50">
              <h3 className="text-sm font-black uppercase text-zinc-950 mb-1.5 flex items-center gap-2 font-condensed">
                <span className="text-brand-mustard font-black text-base">03</span> Instant Claim
              </h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                No OTPs or manual paperwork. Guests simply show their validated device screen to claim their reward.
              </p>
            </div>

            <div className="border border-zinc-200 p-5 bg-zinc-50">
              <h3 className="text-sm font-black uppercase text-zinc-950 mb-1.5 flex items-center gap-2 font-condensed">
                <span className="text-brand-mustard font-black text-base">04</span> Built for Hotel Teams
              </h3>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                Hotel staff sign in to their dedicated portal to monitor live scans, rewards, and suspicious attempts.
              </p>
            </div>
          </div>
        </section>
      </div>

      <BrandFooter />
    </div>
  );
}

export default App;
