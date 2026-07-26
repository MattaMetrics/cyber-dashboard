import React from 'react';

export default function RightSidebar({ accessCode, onAccessCodeChange, onOpenCoachMenu, terminalAlert = '' }) {
  return (
    <div className="flex flex-col gap-3 w-72 min-h-[220px] pointer-events-auto bg-slate-950/70 border border-slate-800 p-4 rounded-xl backdrop-blur-md shadow-2xl text-right">
      <button
        type="button"
        onClick={onOpenCoachMenu}
        className="w-full text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-950/40 pb-1 mb-1 text-right hover:text-cyan-300 transition-colors cursor-pointer"
      >
        ASSESSMENT REPORTS
      </button>

      <div className="border-r-2 border-cyan-500 pr-2">
        <div className="text-[12px] font-bold text-slate-300 uppercase tracking-wide">Enter Your Code</div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={accessCode}
          onChange={onAccessCodeChange}
          placeholder="····"
          aria-label="Enter access code"
          className="mt-0.5 w-3/4 ml-auto bg-slate-900/80 border border-cyan-500/40 rounded-md px-2 py-1 text-2xl font-black text-cyan-400 tracking-[0.35em] text-center outline-none focus:border-cyan-400 placeholder:text-cyan-900 caret-cyan-400"
        />
      </div>

      <div className="mt-auto pt-2 border-t border-slate-800/80">
        {terminalAlert ? (
          <div
            className={`w-full p-3 border font-mono text-[10px] tracking-wider rounded text-center animate-pulse shadow-[0_0_18px_rgba(34,211,238,0.12)] ${
              terminalAlert.includes('DENIED')
                ? 'border-amber-500/40 bg-amber-950/20 text-amber-400'
                : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'
            }`}
          >
            {terminalAlert}
          </div>
        ) : (
          <div className="w-full p-3 border border-dashed border-slate-800/80 rounded text-center">
            <span className="font-mono text-[9px] tracking-widest text-slate-600 uppercase">
              // AWAITING ACCESS SIGNAL
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
