import React from 'react';
import { staticAssessmentLibrary } from '../data/assessmentLibrary';

export default function VitalFlowPackageView({ onSelectTrack, onNavigate }) {
  // Vital Flow package slots — original library categories for ids 1–2
  const activePackageTracks = staticAssessmentLibrary.filter((track) =>
    String(track.category || '').includes('Vital Flow')
  );

  return (
    <div className="w-full min-h-screen bg-[#030712] p-8 font-mono text-white text-left select-none">
      <div className="flex justify-between items-baseline border-b border-slate-900 pb-4 mb-8">
        <div>
          <span className="text-slate-500 text-[9px] uppercase tracking-widest block">
            // SYS_STATUS // STABILITY_SECURE // PACKAGE_SUITE_01
          </span>
          <h1 className="text-[#00FFFF] text-xs font-bold tracking-widest uppercase mt-1">
            // VITAL FLOW SUITE // OPERATIONAL ASSESSMENTS TRACK LOGIC
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('COACH_DASHBOARD_HOME')}
          className="border border-slate-800 hover:border-[#00FFFF] bg-slate-900/40 text-slate-400 text-[9px] tracking-widest font-bold uppercase px-4 py-2.5 rounded transition-all duration-300"
        >
          [ ESC // HOME ]
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePackageTracks.map((track, index) => (
          <div
            key={track.id}
            className="border border-slate-900 bg-slate-950/40 p-6 rounded-lg flex flex-col justify-between hover:border-[#00FFFF] transition-all duration-300 group"
          >
            <div>
              <span className="text-slate-600 text-[9px] uppercase tracking-wider block mb-1">
                NODE // SLOT_0{index + 1}
              </span>
              <h4 className="text-white text-sm font-bold tracking-wide mb-2 truncate">
                {track.name}
              </h4>
              <span className="text-[#00FFFF]/60 font-mono text-xs block mb-6">
                $25.00
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectTrack?.(track);
                onNavigate?.('VIEW_SINGLE_ASSESSMENT_CORE');
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-[#00FFFF] group-hover:border-[#00FFFF] text-[10px] tracking-widest font-bold uppercase py-3 rounded transition-all duration-300"
            >
              [ RUN SPECIFIC TELEMETRY ]
            </button>
          </div>
        ))}

        {Array.from({ length: Math.max(0, 6 - activePackageTracks.length) }).map(
          (_, idx) => (
            <div
              key={`blank-${idx}`}
              className="border border-dashed border-slate-900/40 bg-slate-950/5 p-6 rounded-lg flex flex-col justify-center items-center text-center h-[180px] opacity-25"
            >
              <span className="text-slate-700 font-mono text-[9px] uppercase tracking-widest">
                [ SLOT_0{activePackageTracks.length + idx + 1} AWAITING BINDING ]
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
