import React from 'react';

/**
 * Payment Success Verification Overlay — shown after PayPal checkout handoff.
 */
export default function ThankYouOverlay({ onDeployAssessmentSuite }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#01040a]/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-950/95 border border-cyan-500/20 backdrop-blur-xl rounded-xl p-6 text-center max-w-sm mx-auto shadow-2xl shadow-cyan-950/20 font-mono">
        <span className="text-[9px] text-slate-500 font-bold tracking-[0.25em] uppercase block mb-3">
          // PAYMENT SUCCESS VERIFICATION
        </span>

        <h2 className="text-cyan-400 text-sm md:text-base font-black tracking-widest uppercase mb-4">
          // KINETIC MATRIX INITIALIZED
        </h2>

        <p className="font-sans text-slate-300 text-sm leading-relaxed font-normal mb-6">
          Thank you for securing your framework placement. Your transaction has been linked to your biometric profile
          signature.
        </p>

        <button
          type="button"
          onClick={onDeployAssessmentSuite}
          className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[10px] tracking-widest uppercase rounded-lg transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
        >
          [ ENTER UNLOCKED TERMINAL MATRIX ]
        </button>
      </div>
    </div>
  );
}
