import React from 'react';
// Import your stable, local movement library file
import { staticAssessmentLibrary } from '../data/assessmentLibrary';

export default function MasterAssessmentDirectory({ onSelectTrack, onNavigate }) {
  // Alphabetically sort the full hardcoded movement inventory
  const alphabetizedTracks = [...staticAssessmentLibrary].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] bg-[#030712] p-6 md:p-8 font-mono text-white text-left select-none flex flex-col overflow-hidden">
      {/* HEADER CONTROLS — pinned */}
      <div className="border border-slate-900 rounded-lg p-6 mb-6 flex justify-between items-center bg-slate-950/20 shrink-0">
        <div>
          <h1 className="text-[#00FFFF] text-xs font-bold tracking-widest uppercase">
            // MASTER COMPREHENSIVE ASSESSMENT CALIBRATION INDEX //
          </h1>
          <p className="text-slate-500 text-[10px] mt-1">
            Select an active structural diagnostic node to deploy terminal telemetry panels.
          </p>
        </div>
        <div className="text-right flex items-center space-x-4">
          <div className="text-slate-500 text-[10px]">
            TERMINAL_STATE: STANDALONE_STABLE
            <br />
            AVAILABLE TRACK NODES:{' '}
            <span className="text-[#00FFFF]">{alphabetizedTracks.length}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('COACH_DASHBOARD_HOME')}
            className="border border-slate-800 hover:border-[#FF6600] bg-slate-900/40 hover:bg-[#FF6600]/10 text-slate-400 hover:text-[#FF6600] text-[9px] tracking-widest font-bold uppercase px-4 py-3 rounded transition-all duration-300"
          >
            [ ESC // HOME ]
          </button>
        </div>
      </div>

      {/* SCROLLABLE LINE LIST MATRIX */}
      <div className="flex-1 min-h-0 overflow-y-auto border border-slate-900/60 rounded-lg bg-slate-950/10 backdrop-blur-sm divide-y divide-slate-900/40 custom-scrollbar pr-2">
        {alphabetizedTracks.map((track) => (
          <div
            key={track.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectTrack?.(track)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectTrack?.(track);
            }}
            className="flex items-center justify-between p-4 hover:bg-[#00FFFF]/5 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center space-x-6 min-w-0">
              <span className="text-[#00FFFF]/40 group-hover:text-[#00FFFF] text-[10px] shrink-0">
                // NODE_{String(track.id).padStart(2, '0')}
              </span>
              <span className="text-white text-xs font-bold tracking-wide group-hover:translate-x-1 transition-transform truncate">
                {track.name}
              </span>
              <span className="text-slate-600 text-[9px] uppercase tracking-widest shrink-0 hidden sm:inline">
                [ {track.category} ]
              </span>
            </div>
            <div className="text-slate-500 group-hover:text-[#00FFFF] text-[9px] font-bold uppercase tracking-widest transition-colors shrink-0 ml-4">
              [ DEPLOY INTERFACE SUITE // ]
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
