import React from 'react';
import CenterSphere from './CenterSphere';
import IntegratedTerminalFooter from './IntegratedTerminalFooter';
import {
  DEFAULT_PROTOCOL_FALLBACK,
  isAssignedPanelUrl,
} from '../constants/guideAssets';

/**
 * Unified assessment blueprint — left visual + mandated Box 1 / Box 2 stack,
 * with IntegratedTerminalFooter for Formspree video uplink.
 */
export default function UnifiedAssessmentLayout({
  trackName = 'TELEMETRY',
  databaseRecord,
  moduleId = '',
  athleteCode = '000000',
  athleteName = 'UNREGISTERED ATHLETE',
  onUploadPipelineSuccess,
}) {
  // Hardcoded terminal defaults so boxes NEVER disappear
  const fallbackData = {
    execution:
      'SYSTEM_ALERT: No custom movement directives broadcasted for this track yet. Initialize telemetry updates from the main Coach Intelligence Dashboard.',
    alignment:
      'CAMERA_ENVELOPE: Device tracking coordinates pending. Standard setup: Align recording sensor at mid-torso height, 8 feet out from the central vector.',
  };

  const box1Text = databaseRecord?.execution || fallbackData.execution;
  const box2Text = databaseRecord?.alignment || fallbackData.alignment;
  const rawImage = databaseRecord?.imageUrl || DEFAULT_PROTOCOL_FALLBACK.imageUrl;
  const imageUrl = isAssignedPanelUrl(rawImage) ? rawImage : DEFAULT_PROTOCOL_FALLBACK.imageUrl;
  const useCustomGraphic = isAssignedPanelUrl(imageUrl);

  return (
    <div className="w-full flex flex-col">
      <div className="w-full grid grid-cols-1 md:grid-cols-[1.8fr_1.2fr] gap-8 p-1 md:p-2 bg-[#030712]/40 font-mono text-white">
        {/* LEFT COLUMN: 3D / guide visual */}
        <div className="border border-slate-800/50 rounded-lg p-4 bg-slate-950/20 backdrop-blur-sm flex flex-col justify-center items-center min-h-[420px]">
          <div className="text-[9px] text-slate-500 tracking-widest uppercase mb-4 self-start w-full">
            // MULTI-PHASE KINEMATIC TELEMETRY CORE
          </div>
          {useCustomGraphic ? (
            <img
              src={imageUrl}
              alt={`${trackName} Telemetry UI`}
              className="w-full h-auto object-contain max-h-[80vh] rounded-lg opacity-90"
            />
          ) : (
            <div className="w-full flex-1 min-h-[420px] rounded-lg overflow-hidden border border-cyan-950/40 bg-[#030d1e]/50">
              <CenterSphere viewState="client_profile" />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: mandated two-box terminal stack */}
        <div className="flex flex-col space-y-6">
          {/* BOX 1: MOVEMENT EXECUTION INSTRUCTIONS */}
          <div className="border border-slate-800/80 bg-slate-950/40 backdrop-blur-sm rounded-lg p-6 relative overflow-hidden focus-within:border-[#00FFFF] transition-all flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-[#00FFFF] text-xs">🔹</span>
              <h3 className="text-white text-xs font-bold tracking-widest uppercase">
                Movement Execution Instructions
              </h3>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed tracking-wide whitespace-pre-line">
              {box1Text}
            </p>
          </div>

          {/* BOX 2: CAMERA ANGLE & TELEMETRY ALIGNMENT */}
          <div className="border border-slate-800/80 bg-slate-950/40 backdrop-blur-sm rounded-lg p-6 relative overflow-hidden focus-within:border-[#FF6600] transition-all flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-[#FF6600] text-xs">📷</span>
              <h3 className="text-white text-xs font-bold tracking-widest uppercase">
                Camera Angle & Telemetry Alignment
              </h3>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed tracking-wide whitespace-pre-line">
              {box2Text}
            </p>
          </div>
        </div>
      </div>

      {/* PLACE DIRECTLY BELOW GRID — Formspree video uplink footer */}
      <IntegratedTerminalFooter
        athleteCode={athleteCode}
        athleteName={athleteName}
        currentTrack={trackName || moduleId}
        onPipelineSuccess={onUploadPipelineSuccess}
      />
    </div>
  );
}
