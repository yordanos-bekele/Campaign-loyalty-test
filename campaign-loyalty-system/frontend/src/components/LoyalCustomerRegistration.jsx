import { useEffect, useState } from 'react';
import { getCurrentCustomer, getReadableError, registerLoyalCustomer } from '../services/api';
import logoFallback from '../assets/logo-placeholder.svg';
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
  const [brandLogo, setBrandLogo] = useState('/src/assets/logo.png');

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
      <Card className={`w-full bg-background shadow-2xl border-border overflow-hidden rounded-none ${standalone ? 'max-w-5xl' : ''}`}>
        <CardContent className="p-6 md:p-10 border-b border-border bg-card">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <img
              className="w-24 h-24 object-cover bg-card p-2 shadow-inner border border-border shrink-0 rounded-none"
              src={brandLogo}
              alt="Marathon Spirits logo"
              onError={() => setBrandLogo(logoFallback)}
            />
            <div>
              <p className="text-sm font-display font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">Marathon Spirits</p>
              <h1 className="text-3xl md:text-4xl font-extrabold font-display uppercase tracking-[0.02em] text-foreground mb-3 leading-tight">Rare loyal customer registration</h1>
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
                  className="h-12 bg-background focus:bg-background transition-all rounded-none focus:-translate-y-1"
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
                  className="h-12 bg-background focus:bg-background transition-all rounded-none focus:-translate-y-1"
                  value={form.phoneNumber}
                  onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="+251 9xx xxx xxx"
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
                <span className="text-sm text-right text-muted-foreground max-w-[140px]">Free beer after 10 valid scans at the same hotel.</span>
              </div>
              <div className="flex flex-col gap-2 pt-3">
                <strong className="text-foreground">Browser device id</strong>
                <span className="font-mono text-xs break-all bg-muted p-2 text-muted-foreground rounded-none">
                  {deviceId || 'Preparing secure device id...'}
                </span>
              </div>
            </div>

            {customer && (
              <div className="bg-[#A0C878]/10 border border-[#A0C878]/30 p-5 rounded-none">
                <strong className="block text-[#A0C878] text-lg mb-1 uppercase font-display">{customer.fullName}</strong>
                <span className="block text-foreground mb-3">{customer.phoneNumber}</span>
                <span className="block text-[#A0C878] text-sm font-medium">Congratulations! You are one of our rare loyal customers.</span>
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
