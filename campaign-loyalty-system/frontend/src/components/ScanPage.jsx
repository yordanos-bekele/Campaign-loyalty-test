import { useEffect, useRef, useState } from 'react';
import { getReadableError, scanQr } from '../services/api';
import logoFallback from '../assets/logo-placeholder.svg';

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

function formatNextAllowedScan(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function ScanPage({ hotelId, initialToken }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [brandLogo, setBrandLogo] = useState('/src/assets/logo.png');
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    setResult(null);
    setError('');
    hasAutoSubmitted.current = false;
  }, [initialToken]);

  const submitScan = async (providedToken = initialToken) => {
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
  const scansRemaining = result?.remainingToReward ?? 10;
  const isRewardEarned = result?.status === 'reward_earned';
  const isSuccess = result?.status === 'success';
  const isRejected = result?.status === 'rejected';
  const statusClass = isRewardEarned
    ? 'status-card status-card--reward'
    : isSuccess
      ? 'status-card status-card--success'
      : isRejected
        ? 'status-card status-card--warning'
    : 'status-card';

  const statusTitle = isRewardEarned
    ? 'Congratulations! You earned a free beer.'
    : isSuccess
      ? 'Your scan counted successfully.'
      : isRejected
        ? result?.reason === 'MIN_TIME_NOT_REACHED'
          ? 'This scan is too soon after your previous valid visit.'
          : result?.reason === 'DAILY_LIMIT_REACHED'
            ? 'You have already reached today’s valid scan limit for this hotel.'
            : 'This QR code is invalid or expired.'
        : 'Ready to scan your code';

  const statusHint = isRewardEarned
    ? 'Show this result to the hotel team if they need to confirm your free beer reward.'
    : isSuccess
      ? `${scansRemaining} more valid ${scansRemaining === 1 ? 'scan' : 'scans'} until your next free beer.`
      : isRejected && result?.reason === 'MIN_TIME_NOT_REACHED' && result?.nextAllowedScanAt
        ? `You can scan again after ${formatNextAllowedScan(result.nextAllowedScanAt)}.`
        : isRejected && result?.reason === 'DAILY_LIMIT_REACHED'
          ? 'Try again tomorrow after the daily count resets.'
          : isRejected
            ? 'Ask the hotel to refresh the QR code and scan again.'
            : 'Your scan result will appear here automatically after the QR code opens.';

  return (
    <section className="scan-experience">
      <article className="scan-hero-card">
        <div className="scan-hero-card__topline">
          <span className="eyebrow">Beverage Loyalty</span>
          <span className="scan-hero-card__hotel">Hotel #{hotelId || '--'}</span>
        </div>

        <div className="scan-brand">
          <img
            className="scan-brand__logo"
            src={brandLogo}
            alt="Beverage company logo"
            onError={() => setBrandLogo(logoFallback)}
          />
          <div>
            <h1>{result?.message || statusTitle}</h1>
            <p>{statusHint}</p>
          </div>
        </div>

        <article className={statusClass}>
          <div className="status-card__badge">
            {isRewardEarned ? 'Reward earned' : isSuccess ? 'Scan counted' : isRejected ? 'Scan rejected' : 'Waiting for scan'}
          </div>

          <ProgressDots currentCount={currentCount} />

          <div className="scan-metrics">
            <article className="scan-metrics__card">
              <span>Valid scans collected</span>
              <strong>{currentCount}/10</strong>
            </article>
            <article className="scan-metrics__card">
              <span>Scans remaining</span>
              <strong>{scansRemaining}</strong>
            </article>
          </div>

          {result?.nextAllowedScanAt && (
            <div className="scan-next-window">
              <span>Next valid scan</span>
              <strong>{formatNextAllowedScan(result.nextAllowedScanAt)}</strong>
            </div>
          )}
        </article>

        <div className="scan-hero-card__footer">
          <span>{busy ? 'Checking your visit...' : result ? 'Result ready' : 'Waiting for QR scan result...'}</span>
          <span>{error ? 'There was a scan issue.' : 'No extra action needed from the guest.'}</span>
        </div>

        {error && <p className="message message--error">{error}</p>}
      </article>
    </section>
  );
}

export default ScanPage;
