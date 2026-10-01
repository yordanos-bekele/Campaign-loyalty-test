import { useState } from 'react';
import marathonLogo from '../assets/Marathon logo.png';
import ginBottle from '../assets/Gin_bottel.png';
import editorialTote from '../assets/img_on_hotel_login_page.jpg';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { hotelLogin, getReadableError } from '../services/api';

const defaultHotelForm = {
  hotelName: '',
  password: '',
};

function HotelLoginPage({
  hotelLoginForm: externalForm,
  setHotelLoginForm: externalSetForm,
  handleHotelLogin: externalHandleLogin,
  busy: externalBusy,
  error: externalError,
  onLoginSuccess,
}) {
  const [localForm, setLocalForm] = useState(defaultHotelForm);
  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const form = externalForm ?? localForm;
  const setForm = externalSetForm ?? setLocalForm;
  const busy = externalBusy ?? localBusy;
  const error = externalError ?? localError;

  const defaultSubmit = async (e) => {
    e.preventDefault();
    setLocalBusy(true);
    setLocalError('');
    try {
      const session = await hotelLogin(form);
      if (onLoginSuccess) {
        onLoginSuccess(session);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setLocalError(getReadableError(err, 'Hotel login failed. Please check credentials.'));
    } finally {
      setLocalBusy(false);
    }
  };

  const onSubmit = externalHandleLogin || defaultSubmit;

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-6 sm:py-10 px-2 sm:px-4 bg-zinc-100">
      <div className="w-full max-w-5xl bg-white text-zinc-950 shadow-2xl border border-zinc-200 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8">
        {/* Top Hero Section: Black canvas matching hotel_login_page.jpg */}
        <section className="bg-black text-white relative overflow-hidden shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[480px] lg:min-h-[540px]">
            {/* Left Column: Image with Tote Bag and Marathon Overlays */}
            <div className="relative overflow-hidden bg-black min-h-[400px] lg:min-h-[540px] flex flex-col justify-between">
              <img
                src={editorialTote}
                alt="Marathon London Dry Gin with canvas tote"
                className="w-full h-full object-cover object-[center_20%] absolute inset-0 select-none"
                decoding="async"
                fetchpriority="high"
              />

              {/* Top-Left: Marathon Script Logo */}
              <div className="relative z-20 p-5 sm:p-6 flex items-start">
                <img
                  src={marathonLogo}
                  alt="Marathon Spirits"
                  className="h-10 sm:h-12 w-auto object-contain logo-white drop-shadow-lg"
                  decoding="async"
                />
              </div>

              {/* Top-Right (near hand): MARATHON KLASSICS HOTEL LOYALTY */}
              <div className="absolute top-6 right-5 sm:right-6 z-20 text-right select-none">
                <div className="text-[11px] sm:text-xs font-black font-condensed uppercase tracking-widest text-white leading-tight drop-shadow-lg">
                  MARATHON<br />KLASSICS<br />HOTEL<br />LOYALTY
                </div>
              </div>

              {/* Bottom-Left Over Tote Bag: Qualification Notice */}
              <div className="relative z-20 p-5 sm:p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                <p className="text-[10px] sm:text-[11px] font-bold font-condensed uppercase tracking-wider text-white leading-tight max-w-[280px] drop-shadow-md">
                  TEN QUALIFYING HOTEL VISITS UNLOCK A COMPLIMENTARY MARATHON KLASSICS COCKTAIL. YOUR REWARD PROGRESS STAYS CONNECTED TO THIS DEVICE.
                </p>
              </div>
            </div>

            {/* Right Column: Massive Headline & Two Action Buttons */}
            <div className="bg-black text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-start">
              <h1 className="text-6xl sm:text-7xl lg:text-[84px] font-black font-condensed uppercase tracking-tight leading-[0.88] mb-8 sm:mb-10 select-none">
                <span className="block text-white">SCAN.</span>
                <span className="block text-white">COLLECT.</span>
                <span className="block text-[#deb355]">CELEBRATE.</span>
              </h1>

              {/* Action Buttons directly below CELEBRATE. */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => window.location.assign('/register')}
                  className="border-2 border-white bg-transparent hover:bg-white hover:text-black text-white font-condensed font-bold uppercase text-xs tracking-wider px-5 py-2.5 rounded-none transition-colors cursor-pointer"
                >
                  REGISTER DEVICE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('hotel-login-card');
                    el?.scrollIntoView({ behavior: 'smooth' });
                    const input = document.getElementById('hotelName');
                    if (input) input.focus();
                  }}
                  className="border-2 border-white bg-transparent hover:bg-white hover:text-black text-white font-condensed font-bold uppercase text-xs tracking-wider px-5 py-2.5 rounded-none transition-colors cursor-pointer"
                >
                  HOTEL STAFF LOGIN
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Row: Two Equal-Height Visual Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left: Hotel Partner Portal & Loyalty Dashboard */}
          <div className="flex flex-col overflow-hidden shadow-sm">
            {/* Red top ribbon */}
            <div className="bg-[#c73f43] px-6 py-2.5 text-white">
              <span className="text-[11px] sm:text-xs font-black font-condensed uppercase tracking-widest block">
                HOTEL PARTNER PORTAL
              </span>
            </div>

            {/* Mustard body */}
            <div className="bg-[#deb355] text-white p-6 sm:p-10 flex-1 flex flex-col justify-center">
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black font-condensed uppercase tracking-tight text-white leading-tight mb-3 sm:mb-4">
                HOTEL LOYALTY DASHBOARD
              </h2>
              <p className="text-xs sm:text-sm font-bold font-condensed uppercase tracking-wider text-white/95 leading-relaxed max-w-md">
                HOTEL TEAMS ONLY SEE THEIR OWN CAMPAIGN INFORMATION, INCLUDING SCANS, REWARDS, AND SUSPICIOUS ACTIVITY.
              </p>
            </div>
          </div>

          {/* Right: Split Mustard & Bottle Green Card with Gin bottle */}
          <div className="relative overflow-hidden min-h-[300px] sm:min-h-[340px] shadow-sm flex items-center justify-center">
            {/* Split background: 60% top mustard, 40% bottom forest green */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              <div className="h-[60%] bg-[#deb355]" />
              <div className="h-[40%] bg-[#064e3b]" />
            </div>

            {/* Marathon London Dry Gin bottle from asset folder */}
            <img
              src={ginBottle}
              alt="Marathon London Dry Gin"
              className="relative z-10 h-64 sm:h-72 lg:h-80 w-auto object-contain drop-shadow-2xl"
              decoding="async"
              fetchpriority="high"
            />

            {/* Right Chevron arrow indicator */}
            <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 text-[#deb355] text-3xl sm:text-4xl font-black select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
              ›
            </div>
          </div>
        </section>

        {/* Bottom Section: Hotel Login Card matching hotel_login_page.jpg */}
        <section id="hotel-login-card" className="bg-[#c73f43] text-white p-6 sm:p-10 lg:p-12 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side: Golden HOTEL LOGIN Title & Subtext */}
            <div>
              <h3 className="text-5xl sm:text-6xl lg:text-7xl font-black font-condensed uppercase tracking-tight text-[#ecb461] mb-3 sm:mb-4 leading-none">
                HOTEL LOGIN
              </h3>
              <p className="text-xs sm:text-sm font-bold font-condensed uppercase tracking-wider text-white/95 leading-relaxed max-w-sm">
                SIGN IN USING YOUR HOTEL NAME AND PASSWORD TO SEE ONLY YOUR HOTEL CAMPAIGN DASHBOARD.
              </p>
            </div>

            {/* Right side: Login Form */}
            <div>
              {error && (
                <Alert variant="destructive" className="rounded-none mb-4 bg-white text-destructive border-0">
                  <AlertDescription className="font-semibold text-xs sm:text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="hotelName" className="text-xs font-bold font-condensed uppercase tracking-wider text-white block mb-1.5">
                    HOTEL NAME
                  </Label>
                  <Input
                    id="hotelName"
                    value={form.hotelName}
                    onChange={(e) => setForm((c) => ({ ...c, hotelName: e.target.value }))}
                    placeholder="OCEAN VIEW HOTEL"
                    required
                    className="h-11 sm:h-12 bg-white text-zinc-950 font-condensed font-bold placeholder:text-zinc-400 placeholder:font-normal rounded-none border-0 text-sm tracking-wider px-4 focus-visible:ring-2 focus-visible:ring-[#deb355]"
                  />
                </div>

                <div>
                  <Label htmlFor="hotelPassword" className="text-xs font-bold font-condensed uppercase tracking-wider text-white block mb-1.5">
                    PASSWORD
                  </Label>
                  <Input
                    id="hotelPassword"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                    placeholder="ENTER HOTEL PASSWORD"
                    required
                    className="h-11 sm:h-12 bg-white text-zinc-950 font-condensed font-bold placeholder:text-zinc-400 placeholder:font-normal rounded-none border-0 text-sm tracking-wider px-4 focus-visible:ring-2 focus-visible:ring-[#deb355]"
                  />
                </div>

                <div className="flex justify-center pt-3 sm:pt-4">
                  <Button
                    type="submit"
                    disabled={busy}
                    className="bg-[#deb355] hover:bg-[#c98827] text-white font-condensed font-bold uppercase tracking-wider text-xs sm:text-sm px-8 py-2.5 h-auto rounded-sm shadow-md transition-colors"
                  >
                    {busy ? 'SIGNING IN...' : 'OPEN HOTEL DASHBOARD'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HotelLoginPage;
