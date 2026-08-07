import { useEffect, useRef, useState } from 'react';
import { confirmReward, linkDeviceByPhone, scanQr } from '../services/api';
import vodkaBottle from '../assets/Vodka_bottel.png';
import ginBottle from '../assets/Gin_bottel.png';

/* ─── helpers ─────────────────────────────────────────────────── */

function friendlyTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

/* ─── SVG progress ring ───────────────────────────────────────── */

function ProgressRing({ count, total = 10, color = 'var(--color-primary, #f59e0b)' }) {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = Math.min(count / total, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg
        height={radius * 2}
        width={radius * 2}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* track */}
        <circle
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* fill */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold font-display leading-none text-foreground">
          {count}
        </span>
        <span className="text-sm font-medium text-muted-foreground leading-none mt-1">
          of {total}
        </span>
      </div>
    </div>
  );
}

/* ─── spinning loader ─────────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="animate-spin"
      style={{ width: 48, height: 48, color: 'hsl(var(--primary))' }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── phone bottom-sheet modal ───────────────────────────────── */

function PhoneSheet({ open, busy, error, onSubmit, onNewUser }) {
  const [phone, setPhone] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />

      {/* sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
        style={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '28px 24px 40px',
          animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* drag handle */}
        <div
          className="mx-auto bg-border"
          style={{ width: 40, height: 4, borderRadius: 99, marginBottom: 24 }}
          aria-hidden="true"
        />

        <p className="text-2xl mb-2" aria-hidden="true">📱</p>
        <h2
          id="sheet-title"
          className="text-xl font-extrabold font-display uppercase tracking-tight text-foreground mb-2"
        >
          Enter your phone number
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          We need this to find your account and count this visit towards your free Marathon Klassics Cocktail.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(phone);
          }}
          className="grid gap-4"
        >
          <input
            ref={inputRef}
            id="sheet-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+251 9xx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={busy}
            style={{
              height: 56,
              fontSize: 18,
              padding: '0 16px',
              border: '1.5px solid hsl(var(--border))',
              borderRadius: 0,
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              width: '100%',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p
              role="alert"
              className="text-sm text-center"
              style={{ color: 'hsl(var(--destructive))' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !phone.trim()}
            style={{
              height: 56,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: busy || !phone.trim()
                ? 'hsl(var(--muted))'
                : 'hsl(var(--primary))',
              color: busy || !phone.trim()
                ? 'hsl(var(--muted-foreground))'
                : 'hsl(var(--primary-foreground))',
              border: 'none',
              borderRadius: 0,
              cursor: busy || !phone.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </form>

        <button
          type="button"
          onClick={onNewUser}
          style={{
            marginTop: 20,
            display: 'block',
            width: '100%',
            textAlign: 'center',
            fontSize: 14,
            color: 'hsl(var(--muted-foreground))',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          First time here? Sign up →
        </button>
      </div>
    </>
  );
}

/* ─── main component ─────────────────────────────────────────── */

function ScanPage({ hotelId, initialToken }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fatalError, setFatalError] = useState('');
  const hasAutoSubmitted = useRef(false);

  // Phone-sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState('');

  /* ── reset whenever token changes ── */
  useEffect(() => {
    setResult(null);
    setFatalError('');
    setSheetOpen(false);
    hasAutoSubmitted.current = false;
  }, [initialToken]);

  /* ── scan ── */
  const submitScan = async (token = initialToken) => {
    if (!token) {
      setFatalError('noToken');
      return;
    }
    setBusy(true);
    setFatalError('');
    try {
      const response = await scanQr({ token });
      setResult(response);
      // auto-open sheet on unregistered device
      if (response?.status === 'rejected' && response?.reason === 'UNREGISTERED_DEVICE') {
        setSheetOpen(true);
      }
    } catch {
      setFatalError('network');
    } finally {
      setBusy(false);
    }
  };

  /* ── auto-submit on mount ── */
  useEffect(() => {
    if (!initialToken || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    submitScan(initialToken);
  }, [initialToken]);

  /* ── phone-link handler ── */
  const handleLinkPhone = async (phone) => {
    setLinkBusy(true);
    setLinkError('');
    try {
      await linkDeviceByPhone(phone);
      setSheetOpen(false);
      setResult(null);
      await submitScan(initialToken);
    } catch (err) {
      const msg = err?.response?.data;
      if (typeof msg === 'string' && msg.includes('No registered customer')) {
        setLinkError('We could not find an account with that number. Please double-check and try again.');
      } else {
        setLinkError('Something went wrong. Please try again.');
      }
    } finally {
      setLinkBusy(false);
    }
  };

  /* ── reward confirm ── */
  const handleConfirm = async () => {
    if (!result?.rewardId) return;
    setBusy(true);
    try {
      const response = await confirmReward(result.rewardId);
      setResult(response);
    } catch {
      // silently show a retry-friendly state — don't show technical errors
    } finally {
      setBusy(false);
    }
  };

  /* ─── derived state ─────────────────────────────────────────── */
  const currentCount = result?.currentCount ?? 0;
  const scansRemaining = result?.remainingToReward ?? 10;
  const isSuccess = result?.status === 'success';
  const isConfirm = result?.status === 'confirmation_required';
  const isReward = result?.status === 'reward_earned';
  const isRejected = result?.status === 'rejected';
  const rejReason = result?.reason;

  const isUnregistered = isRejected && rejReason === 'UNREGISTERED_DEVICE';
  const isTooSoon = isRejected && rejReason === 'MIN_TIME_NOT_REACHED';
  const isDailyLimit = isRejected && rejReason === 'DAILY_LIMIT_REACHED';
  const isExpiredToken = isRejected && !isUnregistered && !isTooSoon && !isDailyLimit;
  const productName = String(result?.productLine || result?.product || '').toLowerCase().includes('gin') ? 'Gin' : 'Vodka';

  /* ─── page states ───────────────────────────────────────────── */

  // Loading / processing
  if (busy && !result) {
    return (
      <MobilePage>
        <div className="flex flex-col items-center gap-6 text-center">
          <Spinner />
          <p className="text-lg font-semibold text-muted-foreground">Checking your visit…</p>
        </div>
      </MobilePage>
    );
  }

  // Fatal: no token
  if (fatalError === 'noToken') {
    return (
      <MobilePage>
        <StatusScreen
          emoji="📷"
          title="No QR code found"
          subtitle="Please scan the QR code at the hotel again."
        />
      </MobilePage>
    );
  }

  // Fatal: network error
  if (fatalError === 'network') {
    return (
      <MobilePage>
        <StatusScreen
          emoji="🔌"
          title="Something went wrong"
          subtitle="Please check your connection and try scanning again."
          action={{ label: 'Try again', onClick: () => submitScan() }}
        />
      </MobilePage>
    );
  }

  // Waiting (no token yet)
  if (!result && !busy) {
    return (
      <MobilePage>
        <StatusScreen
          emoji="🔍"
          title="Waiting…"
          subtitle="Scan the QR code at the hotel to get started."
        />
      </MobilePage>
    );
  }

  // ── REWARD EARNED ──
  if (isReward) {
    return (
      <MobilePage bg="reward">
        <div className="reward-glow w-full max-w-sm p-6 flex flex-col items-center text-center gap-5 bg-card">
          <ProductBottle product={productName} />
          <span className="brand-eyebrow">Reward unlocked</span>
          <h1 className="text-3xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
            Your free drink is ready!
          </h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            Show this screen to the hotel team to claim your reward.
          </p>
          <div
            className="w-full max-w-xs border border-border p-5 text-center"
            style={{ background: 'hsl(var(--card))' }}
          >
            <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Hotel</span>
            <span className="block text-xl font-bold text-foreground">#{hotelId || '--'}</span>
          </div>
        </div>
      </MobilePage>
    );
  }

  // ── CONFIRMATION NEEDED (10th scan) ──
  if (isConfirm) {
    return (
      <MobilePage bg="reward">
        <div className="reward-glow w-full max-w-sm p-6 flex flex-col items-center text-center gap-5 bg-card">
          <ProductBottle product={productName} />
          <span className="brand-eyebrow">10 scans complete</span>
          <h1 className="text-3xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
            You made it!
          </h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            Tap the button below to claim your free Marathon Klassics Cocktail reward.
          </p>
          <ProgressRing count={currentCount} total={10} color="hsl(var(--primary))" />
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            style={primaryButtonStyle(busy)}
          >
            {busy ? 'Confirming…' : 'Confirm & claim free drink'}
          </button>
        </div>
      </MobilePage>
    );
  }

  // ── SUCCESS ──
  if (isSuccess) {
    return (
      <MobilePage bg="success">
        <div className="flex flex-col items-center text-center gap-5 w-full">
          <ProductBottle product={productName} compact />
          <span className="brand-eyebrow">{productName} loyalty progress</span>
          <ProgressRing count={currentCount} total={10} color="hsl(var(--primary))" />
          <h1 className="text-3xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
            Visit counted! ✓
          </h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            {scansRemaining === 1
              ? 'Just 1 more visit and you get a free Marathon Klassics Cocktail!'
              : `${scansRemaining} more visits and you get a free Marathon Klassics Cocktail.`}
          </p>
          <ProgressBar count={currentCount} />
        </div>
      </MobilePage>
    );
  }

  // ── UNREGISTERED (phone sheet handles recovery) ──
  if (isUnregistered) {
    return (
      <MobilePage>
        <div className="flex flex-col items-center text-center gap-6">
          <span style={{ fontSize: 56 }} aria-label="Phone">📋</span>
          <h1 className="text-2xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
            We need your phone number
          </h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            Enter the number you used when you first signed up so we can count this visit.
          </p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={primaryButtonStyle(false)}
          >
            Enter my number
          </button>
          <a
            href="/register"
            style={{
              fontSize: 14,
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            First time here? Sign up
          </a>
        </div>

        <PhoneSheet
          open={sheetOpen}
          busy={linkBusy}
          error={linkError}
          onSubmit={handleLinkPhone}
          onNewUser={() => { window.location.href = '/register'; }}
        />
      </MobilePage>
    );
  }

  // ── TOO SOON ──
  if (isTooSoon) {
    return (
      <MobilePage>
        <div className="w-full max-w-sm border border-yellow-500/50 bg-zinc-900 p-6 flex flex-col items-center text-center gap-6">
          <ProgressRing count={currentCount} total={10} color="hsl(var(--muted-foreground))" />
          <span style={{ fontSize: 48 }} aria-label="Clock">⏰</span>
          <h1 className="text-2xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
            Come back a bit later
          </h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            {result?.nextAllowedScanAt
              ? `You can scan again after ${friendlyTime(result.nextAllowedScanAt)}.`
              : 'Please wait a little while before your next scan.'}
          </p>
          <ProgressBar count={currentCount} />
        </div>
      </MobilePage>
    );
  }

  // ── DAILY LIMIT ──
  if (isDailyLimit) {
    return (
      <MobilePage>
        <div className="w-full max-w-sm border border-red-600/70 bg-red-950/20 p-6 flex flex-col items-center text-center gap-6">
          <ProgressRing count={currentCount} total={10} color="hsl(var(--muted-foreground))" />
          <span style={{ fontSize: 48 }} aria-label="Moon">🌙</span>
          <h1 className="text-2xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
            See you tomorrow!
          </h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            You have already done your visits for today. Come back tomorrow to keep earning.
          </p>
          <ProgressBar count={currentCount} />
        </div>
      </MobilePage>
    );
  }

  // ── EXPIRED / INVALID TOKEN ──
  if (isExpiredToken) {
    return (
      <MobilePage>
        <StatusScreen
          emoji="🔄"
          title="QR code expired"
          subtitle="Please ask the hotel to refresh the QR code and scan again."
        />
      </MobilePage>
    );
  }

  // Fallback loading
  return (
    <MobilePage>
      <div className="flex flex-col items-center gap-6 text-center">
        <Spinner />
        <p className="text-muted-foreground text-base">One moment…</p>
      </div>
    </MobilePage>
  );
}

/* ─── layout helpers ─────────────────────────────────────────── */

function MobilePage({ children, bg }) {
  const bgMap = {
    reward: 'radial-gradient(circle at 50% 0%, hsl(38 95% 58% / 0.12) 0%, transparent 70%)',
    success: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{
          background: bgMap[bg] || undefined,
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </>
  );
}

function StatusScreen({ emoji, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <span style={{ fontSize: 56 }} aria-hidden="true">{emoji}</span>
      <h1 className="text-2xl font-extrabold font-display uppercase tracking-tight text-foreground leading-tight">
        {title}
      </h1>
      <p className="text-muted-foreground text-base max-w-xs leading-relaxed">{subtitle}</p>
      {action && (
        <button type="button" onClick={action.onClick} style={primaryButtonStyle(false)}>
          {action.label}
        </button>
      )}
    </div>
  );
}

function ProgressBar({ count, total = 10 }) {
  return (
    <div
      className="w-full max-w-xs grid gap-1"
      aria-label={`Progress: ${count} of ${total}`}
    >
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 99,
              background: i < count
                ? '#d4af37'
                : 'hsl(var(--muted))',
              transition: 'background 0.4s',
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right mt-1">
        {count} / {total} visits
      </p>
    </div>
  );
}

function ProductBottle({ product, compact = false }) {
  const isGin = product === 'Gin';
  return (
    <div className={`scan-product-card ${isGin ? 'product-gin' : 'product-vodka'} w-full ${compact ? 'max-w-[210px]' : 'max-w-[260px]'}`}>
      <span className="absolute top-3 left-3 brand-eyebrow" style={{ color: 'var(--product-accent)' }}>{product}</span>
      <img
        src={isGin ? ginBottle : vodkaBottle}
        alt={`Marathon Klassics ${product} bottle`}
        style={{ height: compact ? 155 : 210 }}
      />
    </div>
  );
}

function primaryButtonStyle(disabled) {
  return {
    width: '100%',
    maxWidth: 320,
    height: 56,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: disabled ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
    color: disabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
    border: 'none',
    borderRadius: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s, transform 0.1s',
  };
}

export default ScanPage;
