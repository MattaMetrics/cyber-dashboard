import React, { useState } from 'react';

export default function AccessCodeGenerator({ variant = 'default' }) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedTimestamp, setGeneratedTimestamp] = useState('');

  const executeCodeGenerationPipeline = () => {
    // Generates an ultra-clean random 6-digit biometric token passcode matrix string
    const freshPinToken = Math.floor(100000 + Math.random() * 900000);
    const dateStamp = new Date().toLocaleDateString();

    setGeneratedCode(String(freshPinToken));
    setGeneratedTimestamp(dateStamp);
    console.log(
      `[ SYSTEM CORE SECURED: TOKEN VECTOR GENERATED // ${freshPinToken} ]`
    );
  };

  if (variant === 'statusBar') {
    return (
      <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2.5 font-mono text-left shrink-0 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-slate-500 text-[8px] font-bold tracking-[0.2em] uppercase flex items-center gap-1.5">
            <span className="opacity-60">🔑</span>
            <span>// ADMINISTRATIVE CREDENTIAL TOKEN MATRIX</span>
          </span>
          <button
            type="button"
            onClick={executeCodeGenerationPipeline}
            className="border border-cyan-500/25 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-400/90 text-[8px] tracking-widest font-bold uppercase px-2.5 py-1 rounded transition-all"
          >
            ▲ Generate Token
          </button>
        </div>
        {generatedCode ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px]">
            <span className="text-slate-600 uppercase tracking-wider">
              Credential:{' '}
              <span className="text-amber-500/90 font-bold tracking-widest">{generatedCode}</span>
            </span>
            <span className="text-slate-600 uppercase tracking-wider">
              Stamp: <span className="text-slate-400">{generatedTimestamp}</span>
            </span>
          </div>
        ) : (
          <p className="text-[8px] text-slate-700 uppercase tracking-widest">
            Subdued admin status · portal token generation
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#030712] border border-slate-900 rounded-lg p-5 font-mono text-left">
      <div className="text-[#00FFFF] text-[10px] font-bold tracking-widest uppercase mb-4 flex items-center space-x-2">
        <span>🔑</span> <span>// ADMINISTRATIVE CREDENTIAL TOKEN MATRIX</span>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={executeCodeGenerationPipeline}
          className="w-full border border-[#00FFFF] bg-[#00FFFF]/5 hover:bg-[#00FFFF]/20 text-[#00FFFF] text-[9px] tracking-widest font-bold uppercase py-3 rounded transition-all duration-300 shadow-sm"
        >
          ▲ GENERATE SECURE CLIENT PORTAL TOKEN ACCESS
        </button>

        {generatedCode && (
          <div className="bg-slate-950 border border-slate-900 p-3 rounded flex justify-between items-center animate-fade-in">
            <div>
              <span className="text-slate-500 text-[9px] uppercase block tracking-wider">
                NEW ACCESS CREDENTIAL:
              </span>
              <span className="text-[#FF6600] font-bold text-sm tracking-widest">
                {generatedCode}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[9px] uppercase block tracking-wider">
                CONTRACT START STAMP:
              </span>
              <span className="text-slate-300 text-[10px] font-bold">
                {generatedTimestamp}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
