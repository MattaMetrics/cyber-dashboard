import React from 'react';

export default function HorizontalPhaseSelector({
  activePhase,
  setActivePhase,
  phases = [],
  statusLabel = 'REVIEW ACTIVE',
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 font-mono text-xs w-full print:hidden">
      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-500 font-bold shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_#06b6d4]" />
        PIPELINE STATUS: <span className="text-slate-900">{statusLabel}</span>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner overflow-x-auto">
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => setActivePhase(phase.id)}
            className={`px-4 py-2 rounded-lg font-bold tracking-wide transition-all duration-200 uppercase whitespace-nowrap ${
              activePhase === phase.id
                ? 'bg-slate-950 text-white shadow-md transform scale-[1.02]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>
    </div>
  );
}
