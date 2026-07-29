import React, { useEffect, useRef, useState } from 'react';

const PROMO_PAYPAL_URL = 'https://www.paypal.com/ncp/payment/GH32EXJ3LWSQC';

/**
 * High-converting promo intercept — shown when a free-token user tries to deploy a personal client card.
 */
export default function PromoInterceptModal({ onLockPromoRate, onContinueRestricted }) {
  const [isSecuring, setIsSecuring] = useState(false);
  const secureTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (secureTimerRef.current) clearTimeout(secureTimerRef.current);
    };
  }, []);

  const handleLockInPromoRate = () => {
    if (isSecuring) return;
    setIsSecuring(true);

    secureTimerRef.current = setTimeout(() => {
      secureTimerRef.current = null;
      window.open(PROMO_PAYPAL_URL, '_blank');
      setIsSecuring(false);
      if (typeof onLockPromoRate === 'function') onLockPromoRate();
    }, 1500);
  };

  const handleDismiss = () => {
    if (secureTimerRef.current) {
      clearTimeout(secureTimerRef.current);
      secureTimerRef.current = null;
    }
    setIsSecuring(false);
    if (typeof onContinueRestricted === 'function') onContinueRestricted();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md pointer-events-auto p-4 animate-fade-in">
      <div className="bg-slate-950/95 border border-cyan-500/20 backdrop-blur-xl rounded-xl p-6 text-center max-w-md mx-auto z-50 flex flex-col justify-between shadow-[0_0_48px_rgba(6,182,212,0.12)]">
        <div className="space-y-4">
          <p className="text-[11px] font-mono font-black tracking-[0.2em] uppercase text-cyan-400">
            // TERMINAL OVERRIDE // SECURE PROFILE PROMOTION
          </p>

          <p className="font-sans text-sm text-slate-300 leading-relaxed text-left">
            Your intake telemetry profile signature has been successfully transmitted to our sports science network.
            However, your personal archive folder—containing your interactive 3D skeletal art models, movement radian
            degree videos, and clinical lab report documents—requires active node validation.
          </p>

          <p className="font-sans text-sm text-slate-200 leading-relaxed text-left">
            Bypass the traditional pipeline now. Secure your lifetime terminal placement at an exclusive, introductory
            promo rate of just $99.
          </p>
        </div>

        <div className="mt-2 flex flex-col items-center">
          <button
            type="button"
            onClick={handleLockInPromoRate}
            disabled={isSecuring}
            className={`bg-cyan-400 text-slate-950 font-mono font-bold tracking-widest text-[10px] p-3 rounded-lg w-full mt-4 uppercase transition-colors cursor-pointer active:scale-[0.98] disabled:cursor-wait ${
              isSecuring ? 'animate-pulse opacity-90' : 'hover:bg-cyan-300'
            }`}
          >
            {isSecuring ? '[ SECURING PROMO GATEWAY... ]' : '[ LOCK IN PROMO RATE & UNLOCK PORTAL ]'}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="mt-4 text-[10px] font-mono tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-0"
          >
            [ CONTINUE IN RESTRICTED TERMINAL SHELL // ]
          </button>
        </div>
      </div>
    </div>
  );
}
