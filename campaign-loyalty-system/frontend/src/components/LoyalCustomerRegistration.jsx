import { useEffect, useState } from 'react';
import { getCurrentCustomer, getReadableError, registerLoyalCustomer } from '../services/api';
import logoFallback from '../assets/Marathon logo.png';
import vodkaBottle from '../assets/Vodka_bottel.png';
import ginBottle from '../assets/Gin_bottel.png';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
        ? 'Congratulations! You are one of our rare loyal customers.'
        : 'Profile saved.');
    } catch (requestError) {
      setError(getReadableError(requestError, 'Could not save your loyalty profile right now.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`w-full ${standalone ? 'min-h-[calc(100vh-3rem)] flex items-center justify-center py-8' : ''}`}>
      <Card className={`w-full bg-background shadow-2xl border-zinc-700 overflow-hidden rounded-none ${standalone ? 'max-w-5xl' : ''}`}>
        <CardContent className="p-6 md:p-10 border-b border-zinc-700 bg-zinc-950 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <img
                className="w-24 h-24 object-cover bg-white p-2 shadow-inner border border-[#d4af37] rounded-none"
                src={logoFallback}
                alt="Marathon Klassics logo"
              />
              <span className="text-[10px] uppercase tracking-[.14em] font-bold text-brand-gold">Marathon Klassics</span>
            </div>
            <div>
              <p className="brand-eyebrow mb-2">Marathon Klassics loyalty</p>
              <h1 className="text-3xl md:text-4xl font-extrabold font-display uppercase tracking-[0.02em] text-foreground mb-3 leading-tight">Register your device</h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Join the Marathon Spirits loyalty customer giveaway and keep your reward progress tied to this mobile browser.
              </p>
            </div>
          </div>
        </CardContent>

        <CardContent className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 p-6 md:p-10 bg-background">
          <div className="grid gap-6">
            <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">{customer ? 'Update your registration' : 'Register now'}</h3>
            <p className="text-muted-foreground">
              Enter your username and phone number once. We save a secure device id in this browser so future scans stay connected to you.
            </p>

            <form className="grid gap-5 bg-card border border-border p-6 shadow-sm rounded-none" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-foreground">Username</Label>
                <Input
                  id="fullName"
                  className="h-12 bg-zinc-100 text-zinc-950 placeholder:text-zinc-500 focus:bg-white transition-all rounded-none"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Your preferred name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber" className="text-foreground">Phone number</Label>
                <Input
                  id="phoneNumber"
                  className="h-12 bg-zinc-100 text-zinc-950 placeholder:text-zinc-500 focus:bg-white transition-all rounded-none"
                  value={form.phoneNumber}
                  onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="09xx xxx xxx"
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={busy || loading} className="mt-2 w-full h-12 text-md shadow-md rounded-none">
                {busy ? 'Saving your spot...' : customer ? 'Update my profile' : 'Become a loyal customer'}
              </Button>
            </form>
          </div>

          <div className="grid gap-6 auto-rows-max h-fit">
            <h3 className="text-xl font-display font-bold uppercase tracking-tight text-foreground">Your loyalty profile</h3>

            <div className="grid gap-3 bg-card p-6 border border-border rounded-none">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <strong className="text-foreground">Status</strong>
                <Badge
                  variant={customer ? "default" : "secondary"}
                  className={`rounded-none px-4 py-1.5 ${customer ? 'bg-[#A0C878] hover:bg-[#A0C878]/90 text-black' : ''}`}
                >
                  {loading ? 'Checking...' : customer ? 'Registered' : 'Ready to register'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <strong className="text-foreground">Reward</strong>
                <span className="text-sm text-right text-muted-foreground max-w-[140px]">Free Cocktail after 10 valid scans at the same hotel.</span>
              </div>
              <div className="flex flex-col gap-2 pt-3">
                <strong className="text-foreground">Browser device id</strong>
                <span className="font-mono text-xs break-all bg-muted p-2 text-muted-foreground rounded-none">
                  {deviceId || 'Preparing secure device id...'}
                </span>
              </div>
            </div>

            {customer && (
              <div className="reward-glow bg-zinc-950 p-5 rounded-none overflow-hidden relative">
                <div className="absolute right-0 bottom-0 flex opacity-75 pointer-events-none">
                  <img className="h-28 w-12 object-contain object-bottom" src={vodkaBottle} alt="" />
                  <img className="h-28 w-12 object-contain object-bottom" src={ginBottle} alt="" />
                </div>
                <span className="brand-eyebrow block mb-2">Welcome to the club</span>
                <strong className="block text-brand-gold text-lg mb-1 uppercase font-display">{customer.fullName}</strong>
                <span className="block text-foreground mb-3">{customer.phoneNumber}</span>
                <span className="block text-zinc-200 text-sm font-medium max-w-[75%]">Your device is ready. Start scanning to unlock your free Marathon Klassics Cocktail.</span>
              </div>
            )}
          </div>
        </CardContent>

        {(message || error) && (
          <CardContent className="px-6 pb-6 md:px-10 md:pb-10 pt-0 bg-background">
            {message && (
              <Alert className="bg-[#A0C878]/10 text-[#A0C878] border-[#A0C878]/30 mb-4 rounded-none">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="rounded-none">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default LoyalCustomerRegistration;
