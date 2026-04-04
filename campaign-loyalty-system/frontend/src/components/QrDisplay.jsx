import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { createHotel, generateQrToken, getHotel, getReadableError } from '../services/api';

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

function QrDisplay({ hotelId, onHotelChange, onOpenScan }) {
  const [lookupHotel, setLookupHotel] = useState(null);
  const [hotelError, setHotelError] = useState('');
  const [loadingHotel, setLoadingHotel] = useState(false);
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [tokenError, setTokenError] = useState('');

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
        dark: '#1f3427',
        light: '#fff9ef',
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
    <section className="panel panel--wide">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Hotel QR display</p>
          <h2>Show a fresh QR code for guests</h2>
          <p className="section-copy">
            Use this screen on a front desk tablet, a reception monitor, or a hotel phone. The code refreshes automatically every 2 minutes.
          </p>
          <p className="hint">
            Public scan URL: {import.meta.env.VITE_PUBLIC_APP_URL || 'Using current browser URL'}
          </p>
        </div>
      </div>

      <div className="two-column">
        <div className="card-stack">
          <article className="card">
            <label className="field">
              <span>Hotel ID</span>
              <div className="field__row">
                <input
                  value={hotelId}
                  onChange={(event) => onHotelChange(event.target.value)}
                  placeholder="Example: 1"
                  inputMode="numeric"
                />
                <button className="button button--secondary" onClick={() => handleGenerateToken()}>
                  {busy ? 'Generating...' : 'Generate QR'}
                </button>
              </div>
            </label>

            {loadingHotel && <p className="hint">Checking hotel details...</p>}
            {lookupHotel && (
              <div className="info-box">
                <strong>{lookupHotel.name}</strong>
                <span>{lookupHotel.location || 'Location not provided'}</span>
              </div>
            )}
            {hotelError && <p className="message message--warning">{hotelError}</p>}
            {tokenError && <p className="message message--error">{tokenError}</p>}
          </article>

          <article className="card">
            <h3>Create a hotel</h3>
            <p className="hint">If this is your first setup, create the hotel here and start using QR codes right away.</p>

            <form className="form-stack" onSubmit={handleCreateHotel}>
              <label className="field">
                <span>Hotel name</span>
                <input
                  value={hotelForm.name}
                  onChange={(event) => setHotelForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ocean View Hotel"
                  required
                />
              </label>

              <label className="field">
                <span>Location</span>
                <input
                  value={hotelForm.location}
                  onChange={(event) => setHotelForm((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Mogadishu"
                />
              </label>

              <label className="field">
                <span>Hotel password</span>
                <input
                  type="password"
                  value={hotelForm.password}
                  onChange={(event) => setHotelForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Create a hotel password"
                  required
                />
              </label>

              <button className="button button--primary" type="submit">
                {creatingHotel ? 'Creating hotel...' : 'Create hotel'}
              </button>
            </form>
          </article>
        </div>

        <article className="card qr-card">
          <div className="qr-card__badge">Guest-facing</div>
          <h3>Active QR code</h3>
          <p className="hint">Guests can scan this code to open the customer scan page automatically.</p>

          {qrImage ? (
            <>
              <img className="qr-image" src={qrImage} alt="Hotel loyalty QR code" />
              <div className="info-list">
                <div>
                  <span>Expires at</span>
                  <strong>{formatExpiry(tokenPayload?.expiresAt)}</strong>
                </div>
                <div>
                  <span>Token</span>
                  <strong className="token-preview">{tokenPayload?.token}</strong>
                </div>
              </div>
              <div className="button-group">
                <button className="button button--primary" onClick={() => onOpenScan(tokenPayload.token, tokenPayload.hotelId)}>
                  Preview customer page
                </button>
                <button
                  className="button button--secondary"
                  onClick={() => window.navigator.clipboard?.writeText(scanLink)}
                >
                  Copy scan link
                </button>
              </div>
            </>
          ) : (
            <div className="qr-placeholder">
              <p>Generate a token to display the guest QR code here.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default QrDisplay;
