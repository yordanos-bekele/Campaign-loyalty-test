import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { createHotel, generateQrToken, getHotel, getReadableError } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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

    QRCode.toDataURL(scanLink, {
      margin: 1,
      width: 280,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(setQrImage)
      .catch(() => setQrImage(''));
  }, [scanLink]);

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

  const handleDownloadQr = () => {
    if (!qrImage) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `hotel-${lookupHotel?.id || hotelId || 'guest'}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQr = () => {
    if (!qrImage) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
              img { max-width: 400px; width: 100%; height: auto; border: 2px solid #000; padding: 10px; border-radius: 8px; }
              h1 { margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-size: 24px; }
              p { font-size: 14px; color: #555; margin-bottom: 30px; max-width: 300px; }
            </style>
          </head>
          <body>
            <h1>${lookupHotel?.name || `Hotel #${hotelId}`}</h1>
            <p>Scan this QR code with your smartphone camera to access the loyalty portal.</p>
            <img src="${qrImage}" alt="Loyalty QR Code" />
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
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
    <Card className="shadow-sm border-zinc-300 bg-white rounded-none overflow-hidden">
      <CardHeader className="bg-[#f2f2f2] border-b border-zinc-300 p-5 rounded-none">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-condensed">Hotel QR Display</p>
        <CardTitle className="uppercase font-condensed font-black tracking-tight text-xl text-black">Show a Fresh QR Code</CardTitle>
        <CardDescription className="leading-relaxed mt-1 text-xs font-bold uppercase tracking-wider text-zinc-600 font-condensed">
          Use this screen on a front desk tablet, a reception monitor, or a hotel phone. The code refreshes automatically every 2 minutes.
        </CardDescription>
        <p className="text-[11px] font-mono text-zinc-600 mt-2 bg-white px-2 py-1 inline-block border border-zinc-300">
          Public: {import.meta.env.VITE_PUBLIC_APP_URL || 'Using current browser URL'}
        </p>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-6 p-6">
        <div className="grid gap-6">
          <Card className="border border-zinc-300 bg-white shadow-none rounded-none">
            <CardContent className="p-5">
              <Label className="block mb-2 text-xs font-bold uppercase tracking-wider text-zinc-700 font-condensed">Hotel ID</Label>
              <div className="flex gap-2">
                <Input
                  className="bg-white flex-1 rounded-none border border-zinc-400 text-zinc-950 font-condensed font-medium text-sm h-10 focus-visible:ring-1 focus-visible:ring-zinc-900"
                  value={hotelId}
                  onChange={(event) => onHotelChange(event.target.value)}
                  placeholder="Example: 1"
                  inputMode="numeric"
                />
                <Button variant="secondary" onClick={() => handleGenerateToken()} disabled={busy} className="bg-zinc-900 hover:bg-black text-white rounded-none font-condensed font-bold uppercase text-xs tracking-wider px-5 h-10">
                  {busy ? 'Generating...' : 'Generate QR'}
                </Button>
              </div>

              <div className="mt-4">
                {loadingHotel && <p className="text-xs font-condensed uppercase tracking-wide text-zinc-500 italic">Checking hotel details...</p>}
                {lookupHotel && (
                  <div className="bg-[#fafafa] p-3 border border-zinc-300 flex justify-between items-center rounded-none">
                    <div>
                      <strong className="block text-black font-condensed font-black uppercase text-sm">{lookupHotel.name}</strong>
                      <span className="text-xs text-zinc-500 font-condensed font-bold uppercase">{lookupHotel.location || 'Location not provided'}</span>
                    </div>
                  </div>
                )}
                {hotelError && <p className="text-xs font-condensed font-bold text-red-700 bg-red-50 p-2 mt-2 border border-red-200">{hotelError}</p>}
                {tokenError && <p className="text-xs font-condensed font-bold text-red-700 bg-red-50 p-2 mt-2 border border-red-200">{tokenError}</p>}
              </div>
            </CardContent>
          </Card>

          {allowHotelCreation && (
            <Card className="border border-zinc-300 bg-white shadow-none rounded-none">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black uppercase font-condensed text-black">Create a Hotel</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-condensed">If this is your first setup, create the hotel here and start using QR codes right away.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <form className="grid gap-3" onSubmit={handleCreateHotel}>
                  <div className="grid gap-1">
                    <Label htmlFor="createHotelName" className="text-xs font-bold uppercase font-condensed text-zinc-700">Hotel Name</Label>
                    <Input
                      id="createHotelName"
                      value={hotelForm.name}
                      onChange={(event) => setHotelForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ocean View Hotel"
                      required
                      className="rounded-none bg-white border border-zinc-400 text-zinc-950 font-condensed font-medium text-sm h-10"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="createHotelLocation" className="text-xs font-bold uppercase font-condensed text-zinc-700">Location</Label>
                    <Input
                      id="createHotelLocation"
                      value={hotelForm.location}
                      onChange={(event) => setHotelForm((current) => ({ ...current, location: event.target.value }))}
                      placeholder="Mogadishu"
                      className="rounded-none bg-white border border-zinc-400 text-zinc-950 font-condensed font-medium text-sm h-10"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="createHotelPassword" className="text-xs font-bold uppercase font-condensed text-zinc-700">Hotel Password</Label>
                    <Input
                      id="createHotelPassword"
                      type="password"
                      value={hotelForm.password}
                      onChange={(event) => setHotelForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Create a hotel password"
                      required
                      className="rounded-none bg-white border border-zinc-400 text-zinc-950 font-condensed font-medium text-sm h-10"
                    />
                  </div>
                  <Button type="submit" disabled={creatingHotel} className="mt-2 w-full rounded-none bg-zinc-900 hover:bg-black text-white font-condensed font-bold uppercase text-xs tracking-wider h-10">
                    {creatingHotel ? 'Creating hotel...' : 'Create Hotel'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="flex flex-col items-center text-center p-6 bg-[#fafafa] border-dashed border-2 border-zinc-300 hover:border-[#deb355] rounded-none relative overflow-hidden transition-colors">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#deb355]" style={{ transformOrigin: 'left', transform: `scaleX(${Math.min(secondsRemaining / 120, 1)})`, transition: 'transform 1s linear' }} />
          <Badge className="mb-3 bg-black text-white border-0 rounded-none uppercase font-condensed font-bold text-[10px] tracking-widest px-2.5 py-0.5">Guest-facing</Badge>
          <h3 className="text-xl font-black text-black mb-1 uppercase font-condensed tracking-tight">Active QR Code</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3 max-w-[280px] font-condensed">Guests scan this code on their phone and the loyalty scan is submitted automatically in their mobile browser.</p>
          {qrImage && <p className="font-mono font-bold text-[#b5811d] text-sm mb-4">Refreshes in {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}</p>}

          {qrImage ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-white p-4 shadow-sm border border-zinc-300 mb-5 rounded-none">
                <img className="w-full max-w-[240px] mx-auto rounded-none" src={qrImage} alt="Hotel loyalty QR code" />
              </div>
              <div className="grid grid-cols-2 gap-3 w-full text-left mb-5">
                <div className="bg-white p-3 border border-zinc-300 rounded-none">
                  <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-condensed font-bold">Expires At</span>
                  <strong className="block text-black font-condensed font-bold text-xs">{formatExpiry(tokenPayload?.expiresAt)}</strong>
                </div>
                <div className="bg-white p-3 border border-zinc-300 overflow-hidden rounded-none">
                  <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-condensed font-bold">Token</span>
                  <strong className="block font-mono text-black text-xs truncate" title={tokenPayload?.token}>{tokenPayload?.token}</strong>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                <Button
                  variant="default"
                  className="w-full h-11 rounded-none bg-[#deb355] hover:bg-[#c98827] text-white font-condensed font-bold uppercase tracking-wider text-xs shadow-none transition-colors"
                  onClick={() => window.navigator.clipboard?.writeText(scanLink)}
                >
                  Copy Scan Link
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-none bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs shadow-none transition-colors"
                    onClick={handleDownloadQr}
                  >
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-none bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-condensed font-bold uppercase tracking-wider text-xs shadow-none transition-colors"
                    onClick={handlePrintQr}
                  >
                    Print QR
                  </Button>
                </div>
              </div>
              <div className="flex justify-center gap-5 mt-4 opacity-80" aria-hidden="true">
                <img className="h-16 w-8 object-contain object-bottom" src={vodkaBottle} alt="" />
                <img className="h-16 w-8 object-contain object-bottom" src={ginBottle} alt="" />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[260px] flex items-center justify-center bg-white w-full border border-dashed border-zinc-300 rounded-none p-6">
              <p className="text-zinc-500 max-w-[200px] uppercase tracking-wider text-xs font-bold font-condensed">Generate a token to display the guest QR code here.</p>
            </div>
          )}
        </Card>
      </CardContent>
    </Card>
  );
}

export default QrDisplay;
