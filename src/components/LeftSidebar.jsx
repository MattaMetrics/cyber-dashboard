import React, { useEffect, useState } from 'react';
import { ANALYSIS_VIEWS } from '../constants/analysisViews';

/** Sliding Informational Parameter Deck — tip-of-cable hover blueprints */
const TRACK_PARAMETER_DECKS = {
  posture: {
    title: '// VITAL FLOW //',
    body:
      'Our flagship all-around body blueprint diagnostic built for every individual. Access lab-grade telemetry across your global kinetic network to isolate hidden vulnerabilities before they manifest as chronic pain. Completely adaptable with seamless virtual or in-person tracking to fit your lifestyle.\n\nStop guessing with your physical longevity. Initialize your diagnostic path to unlock complete biological truth and reclaim effortless alignment.',
  },
  alignment: {
    title: '// ATHLETE PRECISION ENGINE //',
    body:
      'Elite performance tracking designed to keep you commanding an advanced athletic landscape. This engine deploys millions of matrix measurements per second to hand you the secret data required to play harder, scale faster, and perform longer.\n\nSecure your definitive structural advantage. Eliminate physical energy leaks to optimize force outputs and lock in an injury-free, mobile future.',
  },
  mobility: {
    title: '// ERGONOMIC PRESSURE DEFENSE AND REJUVENATION //',
    body:
      'A highly focused workplace wellness interface engineered to maintain workforce vitality, erase desk-bound pain, and sustain peak professional output. This module deploys completely non-intrusive structural tracking directly at your active workstation layout without disrupting the daily flow of your operations.\n\nReclaim your physical baseline. Isolate and neutralize localized lumbar flattening and cervical strain patterns to protect your workday endurance.',
  },
  athlete: {
    title: '// KINETIC POWER INTEGRITY //',
    body:
      'Our powerhouse martial arts and extreme sports engine built to map explosive force generation from the ground up. By processing millions of matrix coordinates per second, the system tracks velocity vectors and torque transfer across your entire striking framework to identify hidden mechanical energy leaks.\n\nWeaponize and Master Self. Secure your definitive physical blueprint and claim the structural advantage required for a devastating, injury-free combat future.',
  },
};

export default function LeftSidebar({
  onLaunchAnalysis,
  onUnlockMembership,
  onViewMethodology,
  virtualAccessUnlocked = false,
  isTokenValidated = false,
  isCoachMode = false,
}) {
  const hasActiveAccess = Boolean(isTokenValidated || virtualAccessUnlocked || isCoachMode);
  const [isBootingNodes, setIsBootingNodes] = useState(true);

  const sidebarBtnClass =
    'w-full justify-center text-center font-mono text-[10px] tracking-widest uppercase text-cyan-400/70 hover:text-cyan-400 bg-slate-950/40 border border-slate-900 hover:border-cyan-500/30 px-3 py-2 rounded-lg transition-all cursor-pointer';

  // Boot node cables on mount, and again when access unlocks
  useEffect(() => {
    setIsBootingNodes(true);
    const bootTimer = setTimeout(() => {
      setIsBootingNodes(false);
    }, 3000);
    return () => clearTimeout(bootTimer);
  }, [hasActiveAccess]);

  return (
    <div className="flex flex-col gap-4 w-72 pointer-events-auto overflow-visible p-5 bg-slate-900/30 border border-slate-900 rounded-xl min-h-[160px] backdrop-blur-md shadow-2xl transition-all">
      <div className="text-[10px] text-cyan-400/70 font-mono font-bold uppercase tracking-widest border-b border-slate-900 pb-2 text-center w-full">
        // SYSTEM OPERATIONAL MATRIX //
      </div>

      <button type="button" onClick={onUnlockMembership} className={sidebarBtnClass}>
        [ VIEW MEMBERSHIP TIERS ]
      </button>

      <button
        type="button"
        onClick={onViewMethodology}
        className={`${sidebarBtnClass} whitespace-normal leading-snug px-2.5 break-words`}
      >
        [ VIEW SYSTEM METHODOLOGY & KINETIC RESEARCH // ]
      </button>

      {(virtualAccessUnlocked || isCoachMode) && (
        <div className="my-2 p-2 border border-cyan-500/30 bg-cyan-950/20 text-center rounded-lg animate-pulse text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
          {isCoachMode
            ? '[ GLOBAL BYPASS TOKEN ACTIVE // ALL ACCESS ALLOWED ]'
            : '[ ACCESS GRANTED // SELECT TRACK TO INITIALIZE ]'}
        </div>
      )}

      {/* Track panels — permanently mounted; gated overlay handles unauthorized init */}
      {Object.keys(ANALYSIS_VIEWS).map((key, index) => {
          // Alternate 45° elbow direction for a connected node-graph feel
          const elbowUp = index % 2 === 0;
          const wirePath = elbowUp
            ? 'M 6 32 H 28 L 44 16 H 72 M 72 8 L 84 16 L 72 24'
            : 'M 6 32 H 28 L 44 48 H 72 M 72 40 L 84 48 L 72 56';
          const nodeY = 32;
          const endNodeY = elbowUp ? 16 : 48;
          const deck = TRACK_PARAMETER_DECKS[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onLaunchAnalysis(key)}
              className="w-full justify-center text-center font-mono text-[10px] tracking-widest uppercase text-cyan-400/70 hover:text-cyan-400 bg-slate-950/40 border border-slate-900 hover:border-cyan-500/30 px-3 py-2 rounded-lg transition-all cursor-pointer group active:scale-[0.98] flex flex-col gap-1 relative overflow-visible"
            >
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 group-hover:from-cyan-500/5 transition-all duration-300" />
              </div>
              <p className="relative z-10 font-mono text-[10px] tracking-widest uppercase text-cyan-400/70 group-hover:text-cyan-400 transition-colors py-0.5">
                {`> [ ${ANALYSIS_VIEWS[key].label} ]`}
              </p>

              {/* ComfyUI / Blender-style node wireframe pipeline — boot pulse, then hover */}
              <svg
                viewBox="0 0 96 64"
                className={`w-24 h-16 pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-1 z-30 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] ${
                  isBootingNodes
                    ? 'opacity-100 translate-x-2 animate-pulse'
                    : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 ease-out'
                }`}
                fill="none"
                aria-hidden="true"
              >
                {/* Origin node anchor at button edge */}
                <circle
                  cx="6"
                  cy={nodeY}
                  r="2.2"
                  fill="rgba(34,211,238,0.85)"
                  stroke="rgba(34,211,238,0.5)"
                  strokeWidth="1"
                />
                {/* Unbroken architectural connection strand → outer > bracket */}
                <path
                  d={wirePath}
                  stroke="rgba(34,211,238,0.5)"
                  strokeWidth="1"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  fill="none"
                />
                {/* Outer target node */}
                <circle
                  cx="84"
                  cy={endNodeY}
                  r="1.6"
                  fill="rgba(34,211,238,0.7)"
                  stroke="rgba(34,211,238,0.45)"
                  strokeWidth="1"
                />
              </svg>

              {/* Sliding Informational Parameter Deck — tip of node cable */}
              {deck && (
                <div className="absolute left-[calc(100%+6rem)] top-1/2 -translate-y-1/2 w-80 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-500 ease-out z-40 shadow-[0_0_25px_rgba(6,182,212,0.05)] text-left">
                  <p className="font-mono text-[11px] font-black tracking-widest uppercase text-cyan-400 mb-2">
                    {deck.title}
                  </p>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed tracking-wide font-normal whitespace-pre-line">
                    {deck.body}
                  </p>
                </div>
              )}
            </button>
          );
        })}
    </div>
  );
}
