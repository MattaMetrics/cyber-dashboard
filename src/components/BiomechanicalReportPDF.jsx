import React, { useState } from 'react';

export default function BiomechanicalReportPDF({ clientName, clientCode, onNavigate }) {
  // 📝 MUTABLE LEFT COLUMN DATA STATES (Fully editable text fields right on your screen!)
  const [movementTitle, setMovementTitle] = useState(
    'MOVEMENT ANALYSIS: SPRINT ACCELERATION'
  );
  const [phaseText, setPhaseText] = useState('PHASE 1 OF 3 // TRIPLE EXTENSION MAXIMA');
  const [balanceMetric, setBalanceMetric] = useState('0.97');
  const [powerVector, setPowerVector] = useState('0.98');
  const [upperTorque, setUpperTorque] = useState('0.85');
  const [lowerDrive, setLowerDrive] = useState('0.97');
  const [centerOfMass, setCenterOfMass] = useState('54.2%');
  const [symmetryScore, setSymmetryScore] = useState('96.5%');
  const [customNotes, setCustomNotes] = useState(
    'Slight initial ankle collapse observed during block clearance. Recommend local stability loading drill sets.'
  );

  // 📷 FLAT IMAGE CARRIER STATE (Paste any direct Imgur image URL string right here)
  const [flatImageSource, setFlatImageSource] = useState('https://imgur.com');

  const executeSystemPrint = () => {
    console.log('[ PROTOCOL_0X-BA: TRIGGERING SYSTEM PRINT CONTEXT LAYER ]');
    window.print(); // Automatically opens your laptop browser's clean "Save as PDF" print layout window!
  };

  return (
    <div className="w-full max-w-[1100px] min-h-screen bg-[#030712] p-8 font-mono text-white text-left mx-auto relative select-none print:p-0 print:bg-black">
      {/* 📡 FLOATING CONTROLS HEADER BAR (Automatically disappears inside your saved PDF report!) */}
      <div className="w-full bg-slate-950/80 border border-slate-900 p-4 rounded-lg flex justify-between items-center mb-8 print:hidden">
        <div>
          <h4 className="text-[#00FFFF] text-xs font-bold uppercase tracking-widest">
            // PDF REPORT COMPILED VAULT
          </h4>
          <p className="text-slate-500 text-[10px] mt-0.5">
            Type directly into the text fields below to adjust metrics before freezing the
            file canvas.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={executeSystemPrint}
            className="border border-[#00FFFF] bg-[#00FFFF]/5 hover:bg-[#00FFFF]/20 text-[#00FFFF] text-[10px] tracking-widest font-bold uppercase px-6 py-3 rounded transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.05)]"
          >
            🖨️ [ Export Dynamic Lab PDF // ]
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('COACH_DASHBOARD_HOME')}
            className="border border-slate-800 hover:border-[#FF6600] bg-slate-900/40 text-slate-400 text-[10px] tracking-widest font-bold uppercase px-4 py-3 rounded transition-all duration-300"
          >
            [ ESC ]
          </button>
        </div>
      </div>

      {/* 📄 MASTER LAB PDF CANVAS FRAME */}
      <div className="border border-slate-900 rounded-xl p-8 bg-slate-950/20 backdrop-blur-sm print:border-none print:p-0">
        {/* TOP BRAND HEADER ROW */}
        <div className="flex justify-between items-baseline border-b border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-white text-base font-bold tracking-widest uppercase m-0">
              LONGEVITY LABORATORY
            </h1>
            <span className="text-[#00FFFF] text-[9px] uppercase tracking-widest font-bold block mt-1">
              // CLINICAL BIOMECHANICAL RETICLE ANALYSIS REPORT
            </span>
          </div>
          <div className="text-right text-slate-500 text-[10px] font-bold leading-relaxed">
            RECIPIENT:{' '}
            <span className="text-white uppercase">
              {clientName || 'Alex Rivera'}
            </span>
            <br />
            ACCESS ID: <span className="text-white">{clientCode || '111111'}</span>
            <br />
            TIMESTAMP: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* MIDDLE WORKSPACE: EDITABLE LEFT LIST VS FLAT GRAPHIC CANVAS RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-8 items-stretch mb-8">
          {/* 📁 LEFT HALF: EDITABLE READOUT PODS */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* INTAKE RUN TIME FRAME */}
            <div className="border border-slate-900/60 bg-slate-950/40 rounded p-4 space-y-2">
              <span className="text-slate-600 text-[8px] uppercase tracking-widest block">
                // CORE TRACK PROFILE //
              </span>
              <input
                type="text"
                value={movementTitle}
                onChange={(e) => setMovementTitle(e.target.value)}
                className="w-full bg-transparent border-none text-[#00FFFF] font-bold text-xs tracking-wider outline-none p-0 focus:ring-0 uppercase focus:border-b focus:border-[#00FFFF]"
              />
              <input
                type="text"
                value={phaseText}
                onChange={(e) => setPhaseText(e.target.value)}
                className="w-full bg-transparent border-none text-slate-400 text-[10px] tracking-wide outline-none p-0 focus:ring-0 uppercase"
              />
            </div>

            {/* DYNAMIC METRIC ARRAYS */}
            <div className="border border-slate-900/60 bg-slate-950/40 rounded p-4 space-y-3 flex-1">
              <span className="text-slate-600 text-[8px] uppercase tracking-widest block mb-1">
                // VECTOR ANALYSIS LOG NODES //
              </span>

              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-slate-400 text-[10px] uppercase">
                  BALANCE REGISTER:
                </span>
                <input
                  type="text"
                  value={balanceMetric}
                  onChange={(e) => setBalanceMetric(e.target.value)}
                  className="w-12 bg-transparent text-right text-white font-bold text-xs outline-none p-0 focus:ring-0"
                />
              </div>
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-slate-400 text-[10px] uppercase">
                  POWER VECTOR PROFILER:
                </span>
                <input
                  type="text"
                  value={powerVector}
                  onChange={(e) => setPowerVector(e.target.value)}
                  className="w-12 bg-transparent text-right text-white font-bold text-xs outline-none p-0 focus:ring-0"
                />
              </div>
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-slate-400 text-[10px] uppercase">
                  UPPER BODY TORQUE INDEX:
                </span>
                <input
                  type="text"
                  value={upperTorque}
                  onChange={(e) => setUpperTorque(e.target.value)}
                  className="w-12 bg-transparent text-right text-white font-bold text-xs outline-none p-0 focus:ring-0"
                />
              </div>
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-slate-400 text-[10px] uppercase">
                  LOWER BODY DRIVE FORCE:
                </span>
                <input
                  type="text"
                  value={lowerDrive}
                  onChange={(e) => setLowerDrive(e.target.value)}
                  className="w-12 bg-transparent text-right text-white font-bold text-xs outline-none p-0 focus:ring-0"
                />
              </div>
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                <span className="text-slate-400 text-[10px] uppercase">
                  CENTER OF MASS DRIFT:
                </span>
                <input
                  type="text"
                  value={centerOfMass}
                  onChange={(e) => setCenterOfMass(e.target.value)}
                  className="w-12 bg-transparent text-right text-[#00FFFF] font-bold text-xs outline-none p-0 focus:ring-0"
                />
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-400 text-[10px] uppercase">
                  GLOBAL ASYMMETRY SCORE:
                </span>
                <input
                  type="text"
                  value={symmetryScore}
                  onChange={(e) => setSymmetryScore(e.target.value)}
                  className="w-12 bg-transparent text-right text-[#00FFFF] font-bold text-xs outline-none p-0 focus:ring-0"
                />
              </div>
            </div>

            {/* CUSTOM LAB NOTES SUMMARY MEMO CONTAINER */}
            <div className="border border-slate-900/60 bg-slate-950/40 rounded p-4 h-24 flex flex-col">
              <span className="text-slate-600 text-[8px] uppercase tracking-widest block mb-1.5">
                // DIAGNOSTIC SPECIALIST SUMMARY CUES //
              </span>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
                className="w-full flex-1 bg-transparent border-none text-slate-300 text-[11px] leading-relaxed tracking-normal outline-none p-0 focus:ring-0 resize-none font-mono"
              />
            </div>
          </div>

          {/* 📷 RIGHT HALF: FLAT HIGH-ART COMPONENT CARD OVERLAY CONTAINER */}
          <div className="border border-slate-900 bg-slate-950/40 rounded p-4 flex flex-col justify-between relative overflow-hidden group min-h-[400px]">
            <div className="text-slate-600 text-[8px] uppercase tracking-widest block mb-2 print:mb-0">
              // KINETIC RECORD EXTRACT MATRIX CANVASES
            </div>

            <div className="flex-1 flex justify-center items-center overflow-hidden max-h-[50vh]">
              <img
                src={flatImageSource}
                alt="Lab Output Layout"
                className="max-w-full max-h-full h-auto object-contain rounded"
              />
            </div>

            {/* Hidden Input box field to paste new image codes URL strings dynamically */}
            <div className="mt-2 pt-2 border-t border-slate-900/40 flex items-center space-x-2 print:hidden">
              <span className="text-slate-700 text-[8px] uppercase font-bold">
                [ SOURCE_URL ]:
              </span>
              <input
                type="text"
                value={flatImageSource}
                onChange={(e) => setFlatImageSource(e.target.value)}
                placeholder="Paste your image string link line here..."
                className="flex-1 bg-slate-950 border border-slate-900/60 rounded px-2 py-1 text-[9px] text-slate-500 font-mono outline-none focus:border-[#00FFFF]"
              />
            </div>
          </div>
        </div>

        {/* LOWER TIER ROW: FORCE, GRAPH, AND SUMMARY BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.1fr_1fr] gap-6 border-t border-slate-900/80 pt-6">
          <div className="border border-slate-900/60 bg-slate-950/40 rounded p-4 flex items-center justify-between text-left">
            <div>
              <span className="text-slate-500 text-[8px] uppercase block tracking-widest mb-2">
                // FORCE DISTRIBUTION
              </span>
              <div className="text-xs font-bold text-slate-400">
                RIGHT FLANK: <span className="text-[#00FFFF]">53%</span>
              </div>
              <div className="text-xs font-bold text-slate-400 mt-1">
                LEFT FLANK: <span className="text-slate-500">47%</span>
              </div>
            </div>
            <div className="text-xl opacity-40">👣</div>
          </div>

          <div className="border border-slate-900/60 bg-slate-950/40 rounded p-4 text-left">
            <span className="text-slate-500 text-[8px] uppercase block tracking-widest mb-1">
              // CENTER OF MASS SYSTEM OSCILLATION
            </span>
            <div className="h-10 flex items-center justify-center border-b border-dashed border-slate-900/60 text-slate-600 text-[9px]">
              [ ~ ~ GRID_TRACK_WAVE_ACTIVE ~ ~ ]
            </div>
          </div>

          <div className="border border-slate-900/60 bg-slate-950/40 rounded p-4 text-left font-mono text-[10px] space-y-1">
            <span className="text-slate-500 text-[8px] uppercase block tracking-widest mb-1.5">
              // MOVEMENT SUMMARY SPECS
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">RANGE OF MOTION:</span>{' '}
              <span className="text-white font-bold">COMPLETE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MOVEMENT QUALITY:</span>{' '}
              <span className="text-[#00FFFF] font-bold">OPTIMAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">STABILITY VECTOR:</span>{' '}
              <span className="text-white font-bold">NOMINAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">INJURY RISK INDEX:</span>{' '}
              <span className="text-[#00FF66] font-bold">LOW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
