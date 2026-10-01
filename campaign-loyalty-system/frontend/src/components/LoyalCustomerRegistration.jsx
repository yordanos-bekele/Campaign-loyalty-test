import { useEffect, useState } from 'react';
import { getCurrentCustomer, getReadableError, registerLoyalCustomer } from '../services/api';
import marathonLogo from '../assets/Marathon logo.png';
import editorialVodka from '../assets/img_on_regisration_page.jpg';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

const emptyForm = {
  fullName: '',
  phoneNumber: '',
};

function LoyalCustomerRegistration({ deviceId = '', standalone = false }) {
  const [form, setForm] = useState(emptyForm);
  const [customer, setCustomer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCurrentCustomer();
        setCustomer(profile);
        if (profile) {
          setForm({
            fullName: profile.fullName || '',
            phoneNumber: profile.phoneNumber || '',
          });
        }
      } catch (requestError) {
        setError(getReadableError(requestError, 'Could not load your loyalty profile.'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const savedCustomer = await registerLoyalCustomer({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
      });
      setCustomer(savedCustomer);
      setForm({
        fullName: savedCustomer.fullName || '',
        phoneNumber: savedCustomer.phoneNumber || '',
      });
      setMessage(savedCustomer.registeredAt
        ? 'Congratulations! You are registered as a loyal customer.'
        : 'Profile updated successfully.');
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not save your loyalty profile right now.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`w-full ${standalone ? 'min-h-[calc(100vh-3rem)] flex items-center justify-center py-4 sm:py-8' : ''}`}>
      <div className="w-full max-w-5xl bg-white text-zinc-950 shadow-2xl border border-zinc-300 overflow-hidden flex flex-col">
        {/* Top Header Banner: Warm Mustard Gold */}
        <header className="bg-brand-mustard text-white px-6 sm:px-10 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-[0.18em] font-extrabold text-white/90 block mb-1">
                Marathon Klassics Hotel Loyalty
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wide text-white leading-none">
                Register Your Device
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:max-w-md">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/95 leading-snug">
                Join the Marathon Spirits loyalty customer giveaway and keep your reward progress tied to this mobile browser.
              </p>
              <div className="shrink-0">
                <img
                  src={marathonLogo}
                  alt="Marathon Spirits"
                  className="h-12 w-auto object-contain logo-white"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Alerts */}
        {(message || error) && (
          <div className="px-6 pt-4 sm:px-10">
            {message && (
              <Alert className="bg-emerald-50 text-emerald-900 border-emerald-300 rounded-none">
                <AlertDescription className="font-semibold">{message}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="rounded-none">
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main 2-Column Content Area */}
        <main className="grid lg:grid-cols-2 gap-8 sm:gap-12 p-6 sm:p-10 items-stretch bg-white">
          {/* Left Column: Lifestyle photo with Marathon Vodka */}
          <div className="relative overflow-hidden bg-zinc-100 min-h-[380px] lg:min-h-[460px] flex items-center justify-center">
            <img
              src={editorialVodka}
              alt="Marathon Triple Distilled Vodka customer lifestyle"
              className="w-full h-full object-cover object-center"
              decoding="async"
              fetchpriority="high"
            />
          </div>

          {/* Right Column: Registration Form */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Mustard Section Banner */}
              <div className="bg-brand-mustard text-white text-center py-2.5 px-4 mb-4">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">
                  {customer ? 'Update Registration' : 'Register Now'}
                </h2>
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-zinc-700 font-bold uppercase tracking-wide leading-relaxed mb-6 text-center lg:text-left">
                Enter your username and phone number once. We save a secure device ID in this browser so future scans stay connected to you.
              </p>

              {/* Terracotta/Coral Form Card */}
              <form onSubmit={handleSubmit} className="bg-brand-terracotta text-white p-6 sm:p-8 space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-wider text-white block mb-1.5">
                    Username
                  </Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))}
                    placeholder="Your preferred name"
                    required
                    className="h-11 bg-white text-zinc-950 placeholder:text-zinc-400 font-medium rounded-none border-0 focus-visible:ring-2 focus-visible:ring-amber-300"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="text-xs font-black uppercase tracking-wider text-white block mb-1.5">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((c) => ({ ...c, phoneNumber: e.target.value }))}
                    placeholder="09xx xxx xxx"
                    required
                    className="h-11 bg-white text-zinc-950 placeholder:text-zinc-400 font-medium rounded-none border-0 focus-visible:ring-2 focus-visible:ring-amber-300"
                  />
                </div>
              </form>

              {/* CTA Button */}
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy || loading}
                  className="w-full h-12 bg-brand-mustard hover:bg-brand-mustard-hover text-zinc-950 font-black uppercase tracking-wider text-sm sm:text-base rounded-none shadow-md transition-colors"
                >
                  {busy ? 'Saving...' : customer ? 'Update Profile' : 'Become a Loyal Customer'}
                </Button>
              </div>
            </div>

            {/* Stamp Badge */}
            <div className="flex justify-end mt-6">
              <div className="stamp-badge text-center">
                <span className="block text-[10px] font-black uppercase tracking-widest text-brand-terracotta leading-tight">
                  Find Your Flavour
                </span>
                <span className="block bg-brand-terracotta text-white font-black text-xs uppercase px-2 py-0.5 tracking-wider mt-0.5">
                  Go For It
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Status Strip: 3-column clean layout */}
        <footer className="border-t border-zinc-200 bg-white grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 p-6 sm:p-8 text-center items-center">
          {/* Status */}
          <div className="py-2 md:py-0 md:px-4 flex flex-col items-center justify-center">
            <span className="text-xs font-black uppercase tracking-widest text-brand-terracotta mb-2 block">
              Status
            </span>
            <span className={`inline-block px-5 py-2 font-black text-xs uppercase tracking-wider ${
              customer ? 'bg-emerald-600 text-white' : 'bg-black text-white'
            }`}>
              {loading ? 'Checking...' : customer ? 'Registered' : 'Ready to Register'}
            </span>
          </div>

          {/* Reward */}
          <div className="py-4 md:py-0 md:px-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-brand-mustard mb-1">
              <span>▼</span>
              <span>Reward</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-800 max-w-[220px] leading-snug">
              Free cocktail after 10 valid scans at the same hotel.
            </p>
          </div>

          {/* Browser Device ID */}
          <div className="py-2 md:py-0 md:px-4 flex flex-col items-center justify-center">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-950 mb-2 block">
              Browser Device ID
            </span>
            <div className="border border-zinc-400 px-3 py-1.5 text-xs font-mono font-bold text-zinc-800 break-all max-w-full">
              {deviceId || 'PREPARING DEVICE ID...'}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LoyalCustomerRegistration;
