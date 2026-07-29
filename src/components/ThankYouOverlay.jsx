import React, { useState } from 'react';

const MASTER_TEST_OVERRIDE = 'MASTER_TEST_9999';

/**
 * Payment Success Verification Overlay — shown after PayPal checkout handoff.
 * Validates against the captured `tx` URL token (securePaypalToken) or master demo key.
 */
export default function ThankYouOverlay({ onDeployAssessmentSuite, securePaypalToken = '' }) {
  const [transactionCode, setTransactionCode] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleUnlockAttempt = () => {
    const normalized = String(transactionCode || '').trim();
    const capturedToken = String(securePaypalToken || '').trim();
    const isValid =
      (capturedToken !== '' && normalized === capturedToken) || normalized === MASTER_TEST_OVERRIDE;

    if (isValid) {
      setAuthError(false);
      onDeployAssessmentSuite?.();
      return;
    }

    setAuthError(true);
    window.setTimeout(() => setAuthError(false), 2200);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#01040a]/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-950/95 border border-cyan-500/20 backdrop-blur-xl rounded-xl p-6 text-center max-w-sm mx-auto shadow-2xl shadow-cyan-950/20 font-mono">
        <span className="text-[9px] text-slate-500 font-bold tracking-[0.25em] uppercase block mb-3">
          // PAYMENT SUCCESS VERIFICATION
        </span>

        <h2 className="text-cyan-400 text-sm md:text-base font-black tracking-widest uppercase mb-4">
          // KINETIC MATRIX INITIALIZED
        </h2>

        <p className="font-sans text-slate-300 text-sm leading-relaxed font-normal mb-5">
          Thank you for securing your framework placement. Enter your Transaction Key to authorize terminal unlock and
          begin biometric calibration.
        </p>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={transactionCode}
            onChange={(e) => {
              setTransactionCode(e.target.value);
              if (authError) setAuthError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlockAttempt();
            }}
            placeholder="[ ENTER VERIFICATION KEY ]"
            className="w-full bg-slate-950 border border-slate-900 rounded p-2 text-center text-xs text-amber-500 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 tracking-[0.2em]"
            autoComplete="one-time-code"
          />

          {authError ? (
            <div className="text-[10px] text-rose-400 font-bold tracking-widest uppercase animate-pulse">
              [ ! ] INVALID TRANSACTION TOKEN // ENTRY BLOCKED
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleUnlockAttempt}
          className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[10px] tracking-widest uppercase rounded-lg transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
        >
          [ ENTER UNLOCKED TERMINAL MATRIX ]
        </button>
      </div>
    </div>
  );
}
