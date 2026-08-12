import React from 'react';

/**
 * Right-rail access keyhole — 6-digit numeric lock + deploy CTA.
 * Styling mirrors the AccessKeyhole terminal card while preserving App.jsx auth wiring.
 */
export default function RightSidebar({
  accessCode,
  onAccessCodeChange,
  onOpenCoachMenu,
  terminalAlert = '',
  virtualAccessUnlocked = false,
  onLaunchProfileSequence,
}) {
  const handleInputChange = (e) => {
    // Strip non-numeric characters and lock length to 6
    const cleanValue = String(e.target.value || '')
      .replace(/[^0-9]/g, '')
      .slice(0, 6);
    onAccessCodeChange?.({
      ...e,
      target: { ...e.target, value: cleanValue },
    });
  };

  const handleDeployClick = () => {
    if (String(accessCode || '').length !== 6) {
      alert('CRITICAL ERROR: Access code sequence must contain exactly 6 digits.');
      return;
    }
    onLaunchProfileSequence?.();
  };

  return (
    <div className="pointer-events-auto bg-[#030712] border border-slate-800 rounded-lg p-6 w-72 min-h-[220px] font-mono text-center shadow-2xl backdrop-blur-md flex flex-col">
      <button
        type="button"
        onClick={onOpenCoachMenu}
        className="w-full text-[#00FFFF] text-xs font-bold tracking-widest uppercase mb-4 hover:text-cyan-200 transition-colors cursor-pointer bg-transparent border-0"
      >
        Assessment Reports
      </button>

      <label className="text-white text-[10px] font-bold tracking-wider uppercase block mb-2">
        Enter Your Code
      </label>

      <div className="relative mb-6">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={accessCode}
          onChange={handleInputChange}
          placeholder="••••••"
          aria-label="Enter 6-digit access code"
          className="w-full bg-transparent border border-[#00FFFF] rounded text-[#00FFFF] text-center tracking-[12px] font-bold text-xl py-3 outline-none focus:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all placeholder:text-cyan-900 caret-[#00FFFF]"
        />
      </div>

      <div className="mt-auto">
        {terminalAlert && String(terminalAlert).includes('DENIED') ? (
          <div className="w-full p-3 border border-amber-500/40 bg-amber-950/20 text-amber-400 font-mono text-[10px] tracking-wider rounded text-center animate-pulse">
            {terminalAlert}
          </div>
        ) : virtualAccessUnlocked ? (
          <button
            type="button"
            onClick={handleDeployClick}
            className="w-full border border-slate-700 hover:border-[#00FFFF] bg-slate-900/50 hover:bg-[#00FFFF]/10 text-slate-400 hover:text-[#00FFFF] text-[10px] tracking-widest font-bold uppercase py-4 rounded transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            [ Deploy Personal Client Card Report ]
          </button>
        ) : terminalAlert ? (
          <div className="w-full p-3 border border-cyan-500/30 bg-cyan-950/20 text-[#00FFFF] font-mono text-[10px] tracking-wider rounded text-center animate-pulse">
            {terminalAlert}
          </div>
        ) : (
          <div className="w-full border border-dashed border-slate-800 rounded py-4 text-center">
            <span className="font-mono text-[9px] tracking-widest text-slate-600 uppercase">
              // AWAITING ACCESS SIGNAL
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
