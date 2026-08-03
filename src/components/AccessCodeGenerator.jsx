import React, { useState } from 'react';

export default function AccessCodeGenerator() {
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

  return (
    <div className="w-full bg-[#030712] border border-slate-900 rounded-lg p-5 font-mono text-left mt-6">
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
