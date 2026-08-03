import React, { useState, useMemo } from 'react';
// Import your stable, hardcoded local movement inventory library file
import { staticAssessmentLibrary } from '../data/assessmentLibrary';

export default function InteractiveModalBatchDirectory({
  onNavigate,
  onSelectTrack,
  onAuthorizeBatch,
  setCurrentScreen,
}) {
  // Selection and Canvas Preview States
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [previewTrack, setPreviewTrack] = useState(
    staticAssessmentLibrary[0] || null
  );

  // Alphabetical Sorting Engine
  const alphabetizedTracks = useMemo(() => {
    return [...staticAssessmentLibrary].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }, []);

  // Checkbox Selection Toggle Handler
  const toggleTrackSelection = (id, e) => {
    e.stopPropagation(); // Stops the box click from overriding your art preview switch
    setSelectedTrackIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Compile the objects that are currently checked true
  const activeSelectedTracks = staticAssessmentLibrary.filter((track) =>
    selectedTrackIds.includes(track.id)
  );

  const goHome = () => {
    if (typeof setCurrentScreen === 'function') {
      setCurrentScreen('COACH_DASHBOARD_HOME');
    } else {
      onNavigate?.('COACH_DASHBOARD_HOME');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#030712] p-8 font-mono text-white text-left flex flex-col justify-between select-none">
      {/* TERMINAL RUNTIME MAIN HEADER */}
      <div className="border border-slate-900 rounded-lg p-6 mb-8 flex justify-between items-center bg-slate-950/20">
        <div>
          <h1 className="text-[#00FFFF] text-xs font-bold tracking-widest uppercase">
            // MASTER COMPREHENSIVE BATCH SELECTION CALIBRATION INDEX //
          </h1>
          <p className="text-slate-500 text-[10px] mt-1">
            Check assessment boxes to compile a custom routine package. Click row to
            preview visual data layers.
          </p>
        </div>
        <div className="text-right flex items-center space-x-4">
          <div className="text-slate-500 text-[10px]">
            SYS_MODE: COMPILING_BATCH
            <br />
            TOTAL REGISTERED MODULES:{' '}
            <span className="text-[#00FFFF]">{alphabetizedTracks.length}</span>
          </div>
          <button
            type="button"
            onClick={goHome}
            className="border border-slate-800 hover:border-[#FF6600] bg-slate-900/40 hover:bg-[#FF6600]/10 text-slate-400 hover:text-[#FF6600] text-[9px] tracking-widest font-bold uppercase px-4 py-3 rounded transition-all duration-300"
          >
            [ ESC // HOME ]
          </button>
        </div>
      </div>

      {/* INVERTED TWO-COLUMN WORKSPACE INTERFACE */}
      {/* 🟢 CHANGED: Left side is now 1.8fr width for lists, Right side is 1.2fr for image previews */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-8 items-start flex-1 mb-32 relative">
        {/* 📁 LEFT COLUMN: THE COMPACT TERMINAL LIST WITH SCROLLBAR */}
        <div className="w-full max-h-[65vh] overflow-y-auto border border-slate-900/60 rounded-lg bg-slate-950/10 backdrop-blur-sm divide-y divide-slate-900/40 custom-scrollbar pr-2 relative z-20">
          {alphabetizedTracks.map((track) => {
            const isChecked = selectedTrackIds.includes(track.id);
            const isCurrentlyPreviewed = previewTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => setPreviewTrack(track)} // Clicking rows immediately updates your 3D view on the right
                className={`flex items-center justify-between p-4 transition-all duration-200 cursor-pointer group relative ${
                  isCurrentlyPreviewed
                    ? 'bg-[#00FFFF]/5 border-l-2 border-l-[#00FFFF]'
                    : 'hover:bg-slate-900/20'
                }`}
              >
                {/* Active Row Targeting Micro-Node Glow */}
                {isCurrentlyPreviewed && (
                  <span className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_8px_#00FFFF]" />
                )}

                <div className="flex items-center space-x-4 min-w-0">
                  {/* SQUARE TERMINAL CHECKBOX */}
                  <div
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onClick={(e) => toggleTrackSelection(track.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleTrackSelection(track.id, e);
                      }
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
                      isChecked
                        ? 'border-[#00FFFF] bg-[#00FFFF]/20 text-[#00FFFF]'
                        : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                    }`}
                  >
                    {isChecked && '✓'}
                  </div>

                  {/* 🟢 RE-MOVED: Node text labels are completely stripped out to keep it super clean */}
                  <span className="text-white text-xs font-bold tracking-widest uppercase truncate group-hover:translate-x-1 transition-transform">
                    {track.name}
                  </span>
                </div>

                <div className="text-slate-600 text-[9px] uppercase tracking-widest font-mono hidden md:inline pl-4 shrink-0">
                  [ {track.category || 'MAIN TERMINAL'} ]
                </div>
              </div>
            );
          })}
        </div>

        {/* 📷 RIGHT COLUMN: THE ARTWORK CANVAS IMAGE CARD HOLDER */}
        <div className="border border-slate-900 bg-slate-950/40 backdrop-blur-sm rounded-lg p-4 flex flex-col justify-between h-full sticky top-8 z-20">
          <span className="text-slate-600 text-[9px] uppercase tracking-widest block mb-4">
            // BIOMETRIC CANVAS PREVIEWER
          </span>

          <div className="flex-1 flex justify-center items-center overflow-hidden min-h-[350px]">
            <img
              src={previewTrack?.biometric_photo_url || 'https://imgur.com'}
              alt="Telemetry Mesh Asset"
              className="w-full h-auto object-contain max-h-[50vh] rounded transition-all duration-300"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-900/60 text-left">
            <h4 className="text-white font-bold text-xs tracking-wide uppercase mb-1">
              {previewTrack?.name}
            </h4>
            <p className="text-[#00FFFF] text-[9px] uppercase tracking-widest mb-2">
              {previewTrack?.category}
            </p>
            <p className="text-slate-400 text-[10px] leading-relaxed tracking-normal line-clamp-3">
              {previewTrack?.execution_text}
            </p>
            {previewTrack && typeof onSelectTrack === 'function' && (
              <button
                type="button"
                onClick={() => onSelectTrack(previewTrack)}
                className="mt-4 w-full border border-[#00FFFF]/40 bg-[#00FFFF]/5 hover:bg-[#00FFFF]/15 text-[#00FFFF] text-[9px] tracking-widest font-bold uppercase py-3 rounded transition-all"
              >
                [ Run Specific Telemetry // ]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📡 FLOATING BOTTOM TIER LAYER: TRANSACTION CONTROL PANEL */}
      <div className="w-full bg-[#030712]/95 border border-slate-800 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4 fixed bottom-8 left-0 right-0 max-w-[calc(100vw-64px)] mx-auto z-40 shadow-2xl backdrop-blur-md">
        <div className="text-left flex-1 min-w-0">
          <span className="text-slate-500 text-[9px] uppercase tracking-widest block mb-1.5">
            // ACTIVE RECIPIENT PACKAGE QUEUE //
          </span>
          <div className="flex flex-wrap gap-2">
            {activeSelectedTracks.map((t) => (
              <span
                key={t.id}
                className="bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] text-[10px] font-bold px-3 py-1 rounded"
              >
                + {t.name}
              </span>
            ))}
            {activeSelectedTracks.length === 0 && (
              <span className="text-slate-600 text-xs italic tracking-wide">
                [ NO COMPONENT CHANNELS TARGETED FOR TRANSACTIONS ]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right font-mono">
            <span className="text-slate-500 text-[9px] uppercase tracking-widest block">
              COMPILED TOTAL INVESTMENT:
            </span>
            <span className="text-[#00FFFF] font-bold text-xl tracking-wide">
              $
              {activeSelectedTracks.reduce(
                (sum, item) => sum + (item.price || 0),
                0
              )}
              .00
            </span>
          </div>

          <button
            type="button"
            disabled={activeSelectedTracks.length === 0}
            onClick={() => {
              const compiledTotal = activeSelectedTracks.reduce(
                (sum, item) => sum + (item.price || 0),
                0
              );
              const trackNames = activeSelectedTracks
                .map((t) => t.name)
                .join(', ');
              console.log(
                `[ SECURE TRANSACTION SUITE: INITIALIZING STRIPE HANDSHAKE FOR $${compiledTotal} ]`
              );
              alert(
                `📡 [ TELEMETRY PAYLOAD ENVELOPE SECURED ]\n\nTotal Due: $${compiledTotal}.00\nSelected Tracks: ${trackNames}\n\nFormspree linkage will deploy. Proceeding straight to encrypted billing layer checkout vector...`
              );
              // Launch compiled batch into twin-box assessment progression
              onAuthorizeBatch?.(activeSelectedTracks);
            }}
            className={`border font-mono text-[10px] tracking-widest font-bold uppercase px-8 py-4 rounded transition-all duration-300 ${
              activeSelectedTracks.length > 0
                ? 'border-[#00FFFF] bg-[#00FFFF]/5 text-[#00FFFF] hover:bg-[#00FFFF]/20 shadow-[0_0_15px_rgba(0,255,255,0.15)] cursor-pointer'
                : 'border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            [ AUTHORIZE ASSESSMENT SUITE & PAY // ]
          </button>
        </div>
      </div>
    </div>
  );
}
