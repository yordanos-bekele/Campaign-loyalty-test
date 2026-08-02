import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { createHotel, generateQrToken, getHotel, getReadableError } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useTheme } from './theme-provider';
import vodkaBottle from '../assets/Vodka_bottel.png';
import ginBottle from '../assets/Gin_bottel.png';

function formatExpiry(value) {
  if (!value) {
    return 'Waiting for token';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

const emptyHotelForm = {
  name: '',
  location: '',
  password: '',
};

function QrDisplay({ hotelId, onHotelChange, allowHotelCreation = true }) {
  const [lookupHotel, setLookupHotel] = useState(null);
  const [hotelError, setHotelError] = useState('');
  const [loadingHotel, setLoadingHotel] = useState(false);
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const { theme } = useTheme();

  const scanLink = useMemo(() => {
    if (!tokenPayload?.token) {
      return '';
    }

    const publicBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const url = new URL(publicBaseUrl);
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('view', 'scan');
    url.searchParams.set('hotelId', String(tokenPayload.hotelId));
    url.searchParams.set('token', tokenPayload.token);
    return url.toString();
  }, [tokenPayload]);

  useEffect(() => {
    if (!scanLink) {
      setQrImage('');
      return;
    }

    const isLightMode = document.documentElement.classList.contains("light");

    QRCode.toDataURL(scanLink, {
      margin: 1,
      width: 280,
      color: {
        dark: isLightMode ? '#000000' : '#F8FF00',
        light: isLightMode ? '#ffffff' : '#000000',
      },
    })
      .then(setQrImage)
      .catch(() => setQrImage(''));
  }, [scanLink, theme]);

  useEffect(() => {
    if (!hotelId) {
      setLookupHotel(null);
      return;
    }

    let cancelled = false;

    const loadHotel = async () => {
      setLoadingHotel(true);
      setHotelError('');

      try {
        const hotel = await getHotel(hotelId);
        if (!cancelled) {
          setLookupHotel(hotel);
        }
      } catch (error) {
        if (!cancelled) {
          setLookupHotel(null);
          setHotelError(getReadableError(error, 'Hotel not found yet. You can create it below.'));
        }
      } finally {
        if (!cancelled) {
          setLoadingHotel(false);
        }
      }
    };

    loadHotel();
    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  useEffect(() => {
    if (!tokenPayload?.hotelId) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      handleGenerateToken(tokenPayload.hotelId);
    }, 120000);

    return () => window.clearInterval(interval);
  }, [tokenPayload?.hotelId]);

  useEffect(() => {
    if (!tokenPayload?.expiresAt) return undefined;
    const updateCountdown = () => setSecondsRemaining(Math.max(0, Math.ceil((new Date(tokenPayload.expiresAt).getTime() - Date.now()) / 1000)));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [tokenPayload?.expiresAt]);

  const handleGenerateToken = async (requestedHotelId = hotelId) => {
    if (!requestedHotelId) {
      setTokenError('Enter a hotel ID first.');
      return;
    }

    setBusy(true);
    setTokenError('');

    try {
      const token = await generateQrToken(requestedHotelId);
      setTokenPayload(token);
    } catch (error) {
      setTokenPayload(null);
      setTokenError(getReadableError(error, 'Could not create a QR token right now.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateHotel = async (event) => {
    event.preventDefault();
    setCreatingHotel(true);
    setHotelError('');

    try {
      const createdHotel = await createHotel(hotelForm);
      onHotelChange(String(createdHotel.id));
      setLookupHotel(createdHotel);
      setHotelForm(emptyHotelForm);
    } catch (error) {
      setHotelError(getReadableError(error, 'Could not create the hotel.'));
    } finally {
      setCreatingHotel(false);
    }
  };

  return (
    <Card className="col-span-full xl:col-span-1 shadow-sm border-border bg-background rounded-none">
      <CardHeader className="bg-card border-b border-border mb-4 rounded-none">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Hotel QR display</p>
        <CardTitle className="uppercase font-display">Show a fresh QR code</CardTitle>
        <CardDescription className="leading-relaxed mt-2 text-muted-foreground">
          Use this screen on a front desk tablet, a reception monitor, or a hotel phone. The code refreshes automatically every 2 minutes.
        </CardDescription>
        <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 inline-block border border-border">
          Public: {import.meta.env.VITE_PUBLIC_APP_URL || 'Using current browser URL'}
        </p>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="grid gap-6">
          <Card className="border border-border bg-card shadow-none rounded-none">
            <CardContent className="p-5">
              <Label className="block mb-2 text-foreground">Hotel ID</Label>
              <div className="flex gap-2">
                <Input
                  className="bg-background flex-1 rounded-none border-border"
                  value={hotelId}
                  onChange={(event) => onHotelChange(event.target.value)}
                  placeholder="Example: 1"
                  inputMode="numeric"
                />
                <Button variant="secondary" onClick={() => handleGenerateToken()} disabled={busy} className="rounded-none">
                  {busy ? 'Generating...' : 'Generate QR'}
                </Button>
              </div>

              <div className="mt-4">
                {loadingHotel && <p className="text-sm tracking-wide text-muted-foreground italic">Checking hotel details...</p>}
                {lookupHotel && (
                  <div className="bg-background p-4 border border-border flex justify-between items-center rounded-none">
                    <div>
                      <strong className="block text-foreground font-display uppercase">{lookupHotel.name}</strong>
                      <span className="text-sm text-muted-foreground">{lookupHotel.location || 'Location not provided'}</span>
                    </div>
                  </div>
                )}
                {hotelError && <p className="text-sm text-foreground bg-destructive/10 p-2 mt-2 border border-destructive/20">{hotelError}</p>}
                {tokenError && <p className="text-sm text-foreground bg-destructive/10 p-2 mt-2 border border-destructive/20">{tokenError}</p>}
              </div>
            </CardContent>
          </Card>

          {allowHotelCreation && (
            <Card className="border border-border bg-card shadow-none rounded-none">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-lg uppercase">Create a hotel</CardTitle>
                <CardDescription>If this is your first setup, create the hotel here and start using QR codes right away.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <form className="grid gap-4" onSubmit={handleCreateHotel}>
                  <div className="grid gap-2">
                    <Label htmlFor="createHotelName">Hotel name</Label>
                    <Input
                      id="createHotelName"
                      value={hotelForm.name}
                      onChange={(event) => setHotelForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ocean View Hotel"
                      required
                      className="rounded-none bg-background"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="createHotelLocation">Location</Label>
                    <Input
                      id="createHotelLocation"
                      value={hotelForm.location}
                      onChange={(event) => setHotelForm((current) => ({ ...current, location: event.target.value }))}
                      placeholder="Mogadishu"
                      className="rounded-none bg-background"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="createHotelPassword">Hotel password</Label>
                    <Input
                      id="createHotelPassword"
                      type="password"
                      value={hotelForm.password}
                      onChange={(event) => setHotelForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Create a hotel password"
                      required
                      className="rounded-none bg-background"
                    />
                  </div>
                  <Button type="submit" disabled={creatingHotel} className="mt-2 w-full rounded-none">
                    {creatingHotel ? 'Creating hotel...' : 'Create hotel'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="flex flex-col items-center text-center p-6 bg-zinc-950 border-dashed border-2 border-[#d4af37]/60 rounded-none relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#d4af37]" style={{ transformOrigin: 'left', transform: `scaleX(${Math.min(secondsRemaining / 120, 1)})`, transition: 'transform 1s linear' }} />
          <Badge className="mb-4 bg-primary/20 text-foreground border-primary rounded-none uppercase">Guest-facing</Badge>
          <h3 className="text-xl font-bold text-foreground mb-2 uppercase font-display">Active QR code</h3>
          <p className="text-sm text-muted-foreground mb-3 max-w-[280px]">Guests scan this code on their phone and the loyalty scan is submitted automatically in their mobile browser.</p>
          {qrImage && <p className="font-mono font-bold text-brand-gold text-sm mb-5">Refreshes in {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}</p>}

          {qrImage ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-background p-4 shadow-sm border border-border mb-6 rounded-none">
                <img className="w-full max-w-[240px] mx-auto rounded-none" src={qrImage} alt="Hotel loyalty QR code" />
              </div>
              <div className="grid grid-cols-2 gap-4 w-full text-left mb-6">
                <div className="bg-card p-3 border border-border rounded-none">
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Expires at</span>
                  <strong className="block text-foreground">{formatExpiry(tokenPayload?.expiresAt)}</strong>
                </div>
                <div className="bg-card p-3 border border-border overflow-hidden rounded-none">
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Token</span>
                  <strong className="block font-mono text-foreground truncate" title={tokenPayload?.token}>{tokenPayload?.token}</strong>
                </div>
              </div>
              <Button
                variant="default"
                className="w-full max-w-[280px] h-12 shadow rounded-none"
                onClick={() => window.navigator.clipboard?.writeText(scanLink)}
              >
                Copy scan link
              </Button>
              <div className="flex justify-center gap-5 mt-4 opacity-80" aria-hidden="true">
                <img className="h-20 w-10 object-contain object-bottom" src={vodkaBottle} alt="" />
                <img className="h-20 w-10 object-contain object-bottom" src={ginBottle} alt="" />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] flex items-center justify-center bg-background w-full border border-border rounded-none">
              <p className="text-muted-foreground max-w-[200px] uppercase tracking-wider text-sm font-bold">Generate a token to display the guest QR code here.</p>
            </div>
          )}
        </Card>
      </CardContent>
    </Card>
  );
}

export default QrDisplay;
