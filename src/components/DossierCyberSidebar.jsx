import React from 'react';
import { buildQuickResultsOverview } from '../utils/longevityReportData';

/**
 * Right dossier rail — pure CSS neon wireframe cube + DNA helix loop.
 * No WebGL; continuous animation for studio command aesthetic.
 */
export default function DossierCyberSidebar({ clientName = 'CLIENT', accessCode = '', activeClientProfile }) {
  const telemetry = buildQuickResultsOverview(activeClientProfile || {});
  const telemetryLines = telemetry.split('\n').filter(Boolean).slice(0, 8);

  return (
    <aside className="dossier-cyber-sidebar sticky top-4 space-y-4">
      <div className="p-4 bg-slate-950/70 border border-cyan-500/25 rounded-xl overflow-hidden relative min-h-[320px] flex flex-col">
        <div className="text-[9px] font-mono font-bold text-cyan-400/80 uppercase tracking-[0.2em] mb-3 z-10">
          // BIOMETRIC MATRIX UPLINK
        </div>

        <div className="dossier-cyber-stage flex-1 flex items-center justify-center min-h-[220px] relative">
          <div className="dossier-cyber-glow" aria-hidden="true" />

          {/* Wireframe geo cube */}
          <div className="dossier-wire-cube-scene" aria-hidden="true">
            <div className="dossier-wire-cube">
              <div className="dossier-wire-face dossier-wire-face--front" />
              <div className="dossier-wire-face dossier-wire-face--back" />
              <div className="dossier-wire-face dossier-wire-face--right" />
              <div className="dossier-wire-face dossier-wire-face--left" />
              <div className="dossier-wire-face dossier-wire-face--top" />
              <div className="dossier-wire-face dossier-wire-face--bottom" />
            </div>
          </div>

          {/* DNA double helix strands */}
          <div className="dossier-dna-helix" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="dossier-dna-rung"
                style={{ '--i': i, animationDelay: `${i * -0.35}s` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-cyan-900/40 z-10 space-y-1 font-mono">
          <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider truncate">
            {clientName}
          </p>
          <p className="text-[9px] text-cyan-500/70 uppercase tracking-widest">
            PIN // {accessCode || '——'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-900/50 border border-indigo-500/20 rounded-xl">
        <div className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-[0.18em] mb-3">
          // QUICK RESULTS TELEMETRY
        </div>
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
          {telemetryLines.length ? (
            telemetryLines.map((line) => (
              <p
                key={line}
                className="text-[11px] font-mono font-semibold text-slate-300 leading-snug border-l-2 border-indigo-500/40 pl-2"
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-[11px] font-mono text-slate-500 italic">
              Awaiting YOLO lab telemetry sync.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
