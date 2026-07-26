import React from 'react';

/**
 * Gated Telemetry Intercept Overlay — blocks unauthenticated assessment starts.
 * When isTokenValidated is true (post-payment unlock), the amber gate bypasses completely.
 */
export default function SecurityLockOverlay({ onRetrieveAccessToken, onClose, isTokenValidated = false }) {
  if (isTokenValidated) return null;

  const handleRetrieveAccessToken = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Route to 6-tier membership matrix; parent closes/unmounts this overlay
    if (typeof onRetrieveAccessToken === 'function') {
      onRetrieveAccessToken();
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md border border-red-500/20 rounded-xl p-6 font-mono text-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-lock-title"
    >
      <span className="text-[9px] text-slate-500 font-bold tracking-[0.25em] uppercase mb-4">
        // MATRIX SECURITY PROTOCOL ALPHA-6
      </span>

      <h2
        id="security-lock-title"
        className="text-sm font-black text-amber-500 tracking-wider uppercase border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 rounded animate-pulse"
      >
        [ ACCESS DENIED // PIPELINE GATED ]
      </h2>

      <p className="font-sans text-slate-200 text-sm md:text-base leading-relaxed font-normal max-w-md mt-5 mb-8">
        Your personalized Longevity Blueprint awaits. Secure end-to-end encryption actively shields your biomechanical
        profile. Initialize your membership framework to deploy your permanent access token.
      </p>

      <button
        type="button"
        onClick={handleRetrieveAccessToken}
        className="px-5 py-2.5 bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-500 hover:text-amber-300 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
      >
        [ RETRIEVE ACCESS TOKEN ]
      </button>

      {typeof onClose === 'function' && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="mt-3 text-[9px] text-slate-600 hover:text-slate-400 uppercase tracking-widest font-bold bg-transparent border-0 cursor-pointer"
        >
          [ DISMISS ]
        </button>
      )}

      <span className="mt-8 text-[8px] text-slate-600 font-bold tracking-[0.18em] uppercase">
        SHA-256 MATRIX ENCRYPTION ACTIVE // SYSTEM STABLE SECURE
      </span>
    </div>
  );
}
