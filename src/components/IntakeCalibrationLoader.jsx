import React, { useEffect, useRef, useState } from 'react';

const CALIBRATION_LINES = [
  '⚡ [ DECODING PLATFORM REGISTRATION SIGNATURE... SUCCESS ]',
  '🧬 [ CALIBRATING PERSONAL ANATOMICAL PERSPECTIVE GRID... INITIALIZED ]',
  '📡 [ OPENING LAB ENCRYPTED INTAKE PIPELINE... ]',
];

/** Total sequence targets ~2000ms before intake / home handoff */
const LINE_STAGGER_MS = 500;
const HOLD_AFTER_LAST_MS = 500;

/**
 * Animated terminal calibration loader — bridges Payment Success → Intake Onboarding Terminal.
 */
export default function IntakeCalibrationLoader({ onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers = [];

    CALIBRATION_LINES.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(index + 1);
        }, LINE_STAGGER_MS * (index + 1))
      );
    });

    const totalMs = LINE_STAGGER_MS * CALIBRATION_LINES.length + HOLD_AFTER_LAST_MS;
    timers.push(
      setTimeout(() => {
        if (typeof onCompleteRef.current === 'function') onCompleteRef.current();
      }, totalMs)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.07)_0%,transparent_55%)]" />

      <div className="relative z-10 w-full max-w-xl bg-slate-950/90 border border-cyan-500/25 rounded-2xl p-7 md:p-8 shadow-[0_0_48px_rgba(34,211,238,0.12)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
          <span className="text-[11px] tracking-widest text-cyan-400 uppercase font-black">
            // MATRIX CALIBRATION SEQUENCE
          </span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
        </div>

        <div className="space-y-3.5 min-h-[120px]">
          {CALIBRATION_LINES.map((line, index) => {
            const isVisible = index < visibleCount;
            const isLatest = index === visibleCount - 1;
            return (
              <p
                key={line}
                className={`text-[11px] md:text-sm tracking-wide transition-all duration-500 ${
                  isVisible
                    ? `opacity-100 translate-y-0 ${isLatest ? 'text-cyan-300 animate-pulse' : 'text-slate-300'}`
                    : 'opacity-0 translate-y-2 text-slate-600'
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>

        <div className="mt-7 pt-4 border-t border-slate-900">
          <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase animate-pulse text-center">
            [ STAND BY // INTAKE TERMINAL HANDSHAKE ]
          </p>
        </div>
      </div>
    </div>
  );
}
