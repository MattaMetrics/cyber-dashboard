import React, { useState } from 'react';

/**
 * Gated Telemetry Intercept Overlay — blocks unauthenticated assessment starts.
 * Mounts inside a specific assessment card (absolute inset). Bypasses when
 * isTokenValidated (post-payment) or isCoachMode (Global System Bypass Token).
 * Local 6-digit terminal unlocks this card when a valid matrix pin is entered.
 */
export default function SecurityLockOverlay({
  onRetrieveAccessToken,
  onClose,
  isTokenValidated = false,
  isCoachMode = false,
  acceptedAccessPins = [],
  onLocalTokenAccepted,
}) {
  const [localPin, setLocalPin] = useState('');
  const [localPinAlert, setLocalPinAlert] = useState('');

  if (isTokenValidated || isCoachMode) return null;

  const handleRetrieveAccessToken = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onRetrieveAccessToken === 'function') {
      onRetrieveAccessToken();
    }
  };

  const tryAcceptLocalPin = (digits) => {
    const pinSet = new Set(
      (acceptedAccessPins || []).map((pin) => String(pin)).filter(Boolean)
    );
    if (!pinSet.has(digits)) {
      setLocalPinAlert('[ TOKEN REJECTED // ACCESS DENIED ]');
      window.setTimeout(() => setLocalPinAlert(''), 1800);
      setLocalPin('');
      return;
    }
    setLocalPinAlert('[ TOKEN ACCEPTED // CHANNEL OPEN ]');
    window.setTimeout(() => {
      setLocalPinAlert('');
      if (typeof onLocalTokenAccepted === 'function') {
        onLocalTokenAccepted(digits);
      }
    }, 450);
  };

  const handleLocalPinChange = (e) => {
    e.stopPropagation();
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocalPin(digits);
    setLocalPinAlert('');
    if (digits.length === 6) {
      tryAcceptLocalPin(digits);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md border border-red-500/20 rounded-xl p-4 font-mono text-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-lock-title"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-[8px] text-slate-500 font-bold tracking-[0.25em] uppercase mb-3">
        // MATRIX SECURITY PROTOCOL ALPHA-6
      </span>

      <h2
        id="security-lock-title"
        className="text-[11px] font-black text-amber-500 tracking-wider uppercase border border-amber-500/30 bg-amber-950/20 px-2.5 py-1 rounded animate-pulse"
      >
        [ ACCESS DENIED // PIPELINE GATED ]
      </h2>

      <p className="font-sans text-slate-200 text-xs leading-relaxed font-normal max-w-sm mt-3 mb-5 px-1">
        Secure encryption shields this assessment suite. Initialize membership to deploy your permanent access
        token.
      </p>

      <button
        type="button"
        onClick={handleRetrieveAccessToken}
        className="px-4 py-2 bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-500 hover:text-amber-300 text-[9px] font-bold tracking-widest uppercase rounded-lg transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
      >
        [ RETRIEVE ACCESS TOKEN ]
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={localPin}
        onChange={handleLocalPinChange}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="[ ENTER 6-DIGIT TOKENS // ]"
        aria-label="Enter 6-digit access token"
        className="bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-lg p-2 text-center text-xs tracking-widest text-slate-200 placeholder-slate-600 outline-none w-full max-w-[220px] mx-auto block mt-3 font-mono"
      />

      {localPinAlert ? (
        <p
          className={`mt-2 text-[8px] font-bold tracking-widest uppercase ${
            localPinAlert.includes('ACCEPTED') ? 'text-emerald-400 animate-pulse' : 'text-rose-400 animate-pulse'
          }`}
        >
          {localPinAlert}
        </p>
      ) : null}

      {typeof onClose === 'function' && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="mt-2 text-[8px] text-slate-600 hover:text-slate-400 uppercase tracking-widest font-bold bg-transparent border-0 cursor-pointer"
        >
          [ DISMISS ]
        </button>
      )}

      <span className="mt-4 text-[7px] text-slate-600 font-bold tracking-[0.18em] uppercase">
        SHA-256 MATRIX ENCRYPTION ACTIVE
      </span>
    </div>
  );
}
