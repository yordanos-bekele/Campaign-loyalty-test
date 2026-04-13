import { useEffect, useRef, useState } from 'react';
import { confirmReward, getReadableError, scanQr } from '../services/api';
import logoFallback from '../assets/logo-placeholder.svg';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

function ProgressDots({ currentCount }) {
  return (
    <div className="grid grid-cols-10 gap-1 sm:gap-2 mt-6" aria-label={`Current progress is ${currentCount} out of 10`}>
      {Array.from({ length: 10 }).map((_, index) => (
        <span
          key={index}
          className={`h-4 sm:h-5 transition-all duration-0 ${index < currentCount ? 'bg-primary' : 'bg-muted border border-border'}`}
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
  const isConfirmationRequired = result?.status === 'confirmation_required';
  const isSuccess = result?.status === 'success';
  const isRejected = result?.status === 'rejected';

  const statusCardColors = isRewardEarned
    ? 'bg-primary/10 border-primary shadow-none'
    : isConfirmationRequired
      ? 'bg-primary/5 border-primary shadow-none'
    : isSuccess
      ? 'bg-primary/5 border-primary shadow-none'
      : isRejected
        ? 'bg-destructive/10 border-destructive shadow-none'
    : 'bg-card border-border';

  const statusTitle = isRewardEarned
    ? 'Congratulations! You earned a free beer.'
    : isConfirmationRequired
      ? 'Confirm your reward to finish.'
    : isSuccess
      ? 'Your scan counted successfully.'
      : isRejected
        ? result?.reason === 'UNREGISTERED_DEVICE'
          ? 'This device is not registered yet.'
          : result?.reason === 'MIN_TIME_NOT_REACHED'
          ? 'This scan is too soon after your previous valid visit.'
          : result?.reason === 'DAILY_LIMIT_REACHED'
            ? 'You have already reached today’s valid scan limit for this hotel.'
            : 'This QR code is invalid or expired.'
        : 'Ready to scan your code';

  const statusHint = isRewardEarned
    ? 'Show this result to the hotel team if they need to confirm your free beer reward.'
    : isConfirmationRequired
      ? 'Tap confirm to claim your reward for completing 10 valid scans at this hotel.'
    : isSuccess
      ? `${scansRemaining} more valid ${scansRemaining === 1 ? 'scan' : 'scans'} until your next free beer.`
      : isRejected && result?.reason === 'UNREGISTERED_DEVICE'
        ? 'Register your username and phone number first, then scan the QR code again.'
      : isRejected && result?.reason === 'MIN_TIME_NOT_REACHED' && result?.nextAllowedScanAt
        ? `You can scan again after ${formatNextAllowedScan(result.nextAllowedScanAt)}.`
        : isRejected && result?.reason === 'DAILY_LIMIT_REACHED'
          ? 'Try again tomorrow after the daily count resets.'
          : isRejected
            ? 'Ask the hotel to refresh the QR code and scan again.'
            : 'Your scan result will appear here automatically after the QR code opens.';

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-background shadow-2xl border-border rounded-none overflow-hidden">
        <div className="p-6 md:p-10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-border pb-4">
            <span className="text-sm font-bold font-display uppercase tracking-[0.1em] text-muted-foreground">Marathon Spirits Loyalty</span>
            <Badge variant="secondary" className="bg-transparent text-foreground border border-border pointer-events-none px-3 py-1 text-sm font-bold rounded-none uppercase">
              Hotel #{hotelId || '--'}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left mb-8">
            <div className="w-24 h-24 bg-card p-2 border border-border shadow-inner shrink-0 rounded-none">
              <img
                className="w-full h-full object-contain rounded-none"
                src={brandLogo}
                alt="Marathon Spirits logo"
                onError={() => setBrandLogo(logoFallback)}
              />
            </div>
            <div className="mt-2 md:mt-0">
              <h1 className="text-3xl font-extrabold font-display uppercase text-foreground mb-3 leading-tight tracking-tight">{result?.message || statusTitle}</h1>
              <p className="text-muted-foreground text-lg">{statusHint}</p>
            </div>
          </div>

          <div className={`p-6 sm:p-8 transition-colors border shadow-sm rounded-none ${statusCardColors}`}>
            <div className="flex justify-between items-center mb-6 border-b border-border/20 pb-4">
              <Badge variant="outline" className="bg-background/80 pointer-events-none uppercase tracking-wide text-xs rounded-none border-border">
                {isRewardEarned ? 'Reward earned' : isConfirmationRequired ? 'Confirmation needed' : isSuccess ? 'Scan counted' : isRejected ? 'Scan rejected' : 'Waiting for scan'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-background/80 p-4 border border-border shadow-sm rounded-none">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Valid scans collected</span>
                <strong className="block text-3xl font-bold font-display text-foreground">{currentCount}<span className="text-muted-foreground text-2xl font-medium">/10</span></strong>
              </div>
              <div className="bg-background/80 p-4 border border-border shadow-sm rounded-none">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Scans remaining</span>
                <strong className="block text-3xl font-bold font-display text-foreground">{scansRemaining}</strong>
              </div>
            </div>

            <ProgressDots currentCount={currentCount} />

            {isConfirmationRequired && result?.rewardId && (
              <div className="mt-8 grid gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="w-full h-12 text-md shadow-md rounded-none"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      const response = await confirmReward(result.rewardId);
                      setResult(response);
                    } catch (requestError) {
                      setError(getReadableError(requestError, 'Could not confirm your reward right now.'));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? 'Confirming...' : 'Confirm reward'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This confirmation is required to count the reward.
                </p>
              </div>
            )}

            {result?.nextAllowedScanAt && (
              <div className="mt-8 bg-background/60 p-4 border border-border flex justify-between items-center rounded-none">
                <span className="text-sm font-medium text-muted-foreground font-display uppercase">Next valid scan</span>
                <strong className="text-foreground font-semibold">{formatNextAllowedScan(result.nextAllowedScanAt)}</strong>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-border gap-4 text-sm text-muted-foreground text-center sm:text-left">
            <span>{busy ? 'Checking your visit...' : result ? 'Result ready' : 'Waiting for QR scan result...'}</span>
            <span>{error ? 'There was a scan issue.' : 'No extra action needed from the guest.'}</span>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-6 rounded-none">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ScanPage;
