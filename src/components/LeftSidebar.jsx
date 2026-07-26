import React from 'react';
import { ANALYSIS_VIEWS } from '../constants/analysisViews';

export default function LeftSidebar({ onLaunchAnalysis, onUnlockMembership, virtualAccessUnlocked = false }) {
  return (
    <div className="flex flex-col gap-4 w-80 pointer-events-auto bg-slate-950/80 border border-cyan-500/20 p-5 rounded-xl backdrop-blur-md shadow-2xl transition-all">
      <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-950/40 pb-2 mb-1 text-left font-mono">
        // SYSTEM OPERATIONAL MATRIX
      </div>

      {virtualAccessUnlocked && (
        <div className="px-3 py-2.5 rounded-lg border border-cyan-400/50 bg-cyan-950/40 text-center shadow-[0_0_18px_rgba(34,211,238,0.35)] animate-pulse">
          <span className="text-[9px] font-black tracking-[0.14em] uppercase text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]">
            [ ACCESS GRANTED // SELECT TRACK TO INITIALIZE ]
          </span>
        </div>
      )}

      {Object.keys(ANALYSIS_VIEWS).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onLaunchAnalysis(key)}
          className="w-full text-left px-4 py-3 bg-slate-900/40 hover:bg-slate-900/90 border border-slate-900 hover:border-cyan-400/60 rounded-xl transition-all duration-200 group active:scale-[0.98] cursor-pointer flex flex-col gap-1 shadow-inner relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 group-hover:from-cyan-500/5 transition-all duration-300" />
          <p className="text-sm font-black text-slate-300 group-hover:text-cyan-400 font-mono tracking-wider transition-colors uppercase">
            › {ANALYSIS_VIEWS[key].label}
          </p>
          <p className="text-[10px] font-sans text-slate-500 group-hover:text-slate-300 transition-colors tracking-wide leading-normal font-normal pl-3 border-l border-slate-800 group-hover:border-cyan-500/40 duration-300 whitespace-normal">
            {ANALYSIS_VIEWS[key].hoverDesc}
          </p>
        </button>
      ))}

      <div className="mt-2 pt-2 border-t border-slate-900">
        <button
          type="button"
          onClick={onUnlockMembership}
          className="w-full text-center py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-lg text-[11px] tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
        >
          ⚡ [ UNLOCK MATRIX MEMBERSHIP ]
        </button>
      </div>
    </div>
  );
}
