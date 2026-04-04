import { useEffect, useRef, useState } from 'react';
import { getReadableError, scanQr } from '../services/api';

function ProgressDots({ currentCount }) {
  return (
    <div className="progress-dots" aria-label={`Current progress is ${currentCount} out of 10`}>
      {Array.from({ length: 10 }).map((_, index) => (
        <span
          key={index}
          className={index < currentCount ? 'progress-dots__item progress-dots__item--filled' : 'progress-dots__item'}
        />
      ))}
    </div>
  );
}

function ScanPage({ hotelId, initialToken, onOpenQr }) {
  const [token, setToken] = useState(initialToken || '');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    setToken(initialToken || '');
    setResult(null);
    setError('');
    hasAutoSubmitted.current = false;
  }, [initialToken]);

  const submitScan = async (providedToken = token) => {
    if (!providedToken) {
      setError('We could not find a valid QR token. Please scan again or ask the hotel to refresh the code.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await scanQr({ token: providedToken });
      setResult(response);
    } catch (requestError) {
      setResult(null);
      setError(getReadableError(requestError, 'We could not complete the scan. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!initialToken || hasAutoSubmitted.current) {
      return;
    }

    hasAutoSubmitted.current = true;
    submitScan(initialToken);
  }, [initialToken]);

  const currentCount = result?.currentCount ?? 0;
  const scansRemaining = result?.scansRemaining ?? 10;
  const isSuccess = Boolean(result?.success);
  const statusClass = result?.rewardEarned
    ? 'status-card status-card--reward'
    : isSuccess
      ? 'status-card status-card--success'
      : 'status-card';

  return (
    <section className="panel panel--wide">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Customer scan</p>
          <h2>One quick step for your next drink reward</h2>
          <p className="section-copy">
            Customers only need to scan once and wait for the result. The app checks the campaign rules automatically.
          </p>
        </div>
      </div>

      <div className="two-column">
        <article className="card card--soft">
          <h3>Scan now</h3>
          <p className="hint">
            If you arrived here from the hotel QR code, your scan will run automatically. You can also paste a token manually if needed.
          </p>

          <div className="form-stack">
            <label className="field">
              <span>Hotel</span>
              <input value={hotelId || ''} disabled />
            </label>

            <label className="field">
              <span>QR token</span>
              <textarea
                rows="4"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste the QR token here if it was not filled automatically"
              />
            </label>

            <div className="button-group">
              <button className="button button--primary" onClick={() => submitScan()}>
                {busy ? 'Checking scan...' : 'Confirm scan'}
              </button>
              <button className="button button--secondary" onClick={onOpenQr}>
                Back to QR display
              </button>
            </div>
          </div>

          {error && <p className="message message--error">{error}</p>}
        </article>

        <article className={statusClass}>
          <div className="status-card__badge">
            {result?.rewardEarned ? 'Reward earned' : isSuccess ? 'Scan counted' : 'Waiting for scan'}
          </div>
          <h3>{result?.message || 'Ready to scan your code'}</h3>
          <p className="hint">
            {result?.rewardEarned
              ? 'The customer has reached the reward threshold for this hotel.'
              : isSuccess
                ? `${scansRemaining} more valid ${scansRemaining === 1 ? 'scan' : 'scans'} until the next free drink.`
                : 'Once the scan is accepted, progress will appear here in a simple visual tracker.'}
          </p>

          <ProgressDots currentCount={currentCount} />

          <div className="info-list info-list--compact">
            <div>
              <span>Valid scans collected</span>
              <strong>{currentCount}/10</strong>
            </div>
            <div>
              <span>Scans remaining</span>
              <strong>{scansRemaining}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ScanPage;
