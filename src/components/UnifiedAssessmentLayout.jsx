import React, { useState } from 'react';
import CenterSphere from './CenterSphere';
import {
  DEFAULT_PROTOCOL_FALLBACK,
  isAssignedPanelUrl,
} from '../constants/guideAssets';

export default function UnifiedAssessmentLayout({
  trackName,
  databaseRecord,
  onNavigate,
  moduleId = '',
  athleteCode = '000000',
  athleteName = 'UNREGISTERED ATHLETE',
  onUploadPipelineSuccess,
  currentActiveIndex: controlledIndex,
  setCurrentActiveIndex: setControlledIndex,
  totalSelectedTracksLength = 1,
}) {
  const [submissionLinkUrl, setSubmissionLinkUrl] = useState('');

  const box1Text =
    databaseRecord?.execution_text ||
    databaseRecord?.execution ||
    'DIRECTIVE_PENDING // No dynamic execution cues loaded in archive.';
  const box2Text =
    databaseRecord?.alignment_text ||
    databaseRecord?.alignment ||
    'TELEMETRY_PENDING // No camera orientation guidelines loaded in archive.';

  const rawImage =
    databaseRecord?.biometric_photo_url ||
    databaseRecord?.biometricPhotoUrl ||
    databaseRecord?.imageUrl ||
    'https://imgur.com';
  const imageSource = isAssignedPanelUrl(rawImage)
    ? rawImage
    : DEFAULT_PROTOCOL_FALLBACK.imageUrl;
  const useCustomGraphic = isAssignedPanelUrl(imageSource);

  const [localIndex, setLocalIndex] = useState(0);
  const currentActiveIndex =
    typeof controlledIndex === 'number' ? controlledIndex : localIndex;
  const setCurrentActiveIndex =
    typeof setControlledIndex === 'function' ? setControlledIndex : setLocalIndex;

  const isLastTrack = currentActiveIndex >= totalSelectedTracksLength - 1;

  const handleContinueOrComplete = () => {
    if (!isLastTrack) {
      setSubmissionLinkUrl('');
      setCurrentActiveIndex((prev) => prev + 1);
      console.log(
        '[ SYSTEM TELEMETRY: INCREMENTING MOVEMENT TARGET MATRIX NODE ]'
      );
      return;
    }

    console.log(
      `[ SECURE DEPLOYMENT: TRANSMITTING PACKET VECTOR LINK: ${submissionLinkUrl} ]`
    );
    alert(
      `STREAM COMPLETE: Your movement telemetry instructions are verified!\n\nPayload Url: ${submissionLinkUrl || 'NO_LINK_ATTACHED'}\n\nAll custom athletic movement data has been compiled and sent straight to Coach Matta for calibration review!`
    );
    onUploadPipelineSuccess?.({
      file: { name: submissionLinkUrl || 'vector.mp4' },
      link: submissionLinkUrl,
    });
    onNavigate?.('CLIENT_PORTAL_LANDING_HOME');
    console.log(
      '[ SECURITY FORCE LOCK: RE-ROUTING COMPLETED USER TO PUBLIC PROFILE RETICLE ]'
    );
  };

  return (
    <div className="w-full h-screen bg-[#030712] px-6 pt-2 pb-4 font-mono text-white flex flex-col justify-between overflow-hidden">
      {/* HEADER TIER */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-1 flex-shrink-0 h-[35px]">
        <div className="text-left">
          <h2 className="text-[#00FFFF] text-sm font-bold tracking-widest uppercase m-0">
            {trackName || 'MOTION CONFIGURATION MATRICES'}
          </h2>
        </div>
        <div className="text-slate-600 text-[10px] tracking-wider uppercase font-bold">
          // LIVE ASSESSMENT SESSION ACTIVE //
          {athleteName && athleteName !== 'UNREGISTERED ATHLETE'
            ? ` // ${athleteName}`
            : ''}
          {moduleId ? ` // ${moduleId}` : ''}
        </div>
      </div>

      {/* CORE WORKSPACE */}
      <div className="flex flex-col flex-1 mt-2 mb-4 overflow-hidden space-y-3 min-h-0">
        <div className="w-full h-[48vh] border border-slate-900 bg-slate-950/20 rounded-lg p-3 flex justify-center items-center overflow-hidden flex-shrink-0">
          {useCustomGraphic ? (
            <img
              src={imageSource}
              alt="Kinetic Blueprint Telemetry"
              className="w-auto h-full max-w-full object-contain rounded"
            />
          ) : (
            <div className="w-full h-full min-h-0 rounded-md overflow-hidden border border-cyan-950/40 bg-[#030d1e]/50">
              <CenterSphere viewState="client_profile" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-5 flex flex-col min-h-0 overflow-hidden text-left">
            <div className="flex items-center space-x-2 border-b border-slate-900/60 pb-2 mb-2 flex-shrink-0">
              <span className="text-[#00FFFF] text-sm">🔹</span>
              <h3 className="text-white text-xs font-bold tracking-widest uppercase">
                Movement Execution Instructions
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 text-slate-300 text-sm leading-relaxed tracking-wide whitespace-pre-line">
              {box1Text}
            </div>
          </div>

          <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-5 flex flex-col min-h-0 overflow-hidden text-left">
            <div className="flex items-center space-x-2 border-b border-slate-900/60 pb-2 mb-2 flex-shrink-0">
              <span className="text-[#00FFFF] text-sm">📷</span>
              <h3 className="text-white text-xs font-bold tracking-widest uppercase">
                Camera Angle & Telemetry Alignment
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 text-slate-300 text-sm leading-relaxed tracking-wide whitespace-pre-line">
              {box2Text}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: left status anchor + right action cluster */}
      <div className="border-t border-slate-900/60 pt-3 flex flex-col sm:flex-row justify-between items-center gap-4 h-[60px] flex-shrink-0">
        <span className="text-slate-600 text-[9px] uppercase tracking-widest font-mono hidden sm:inline">
          [ SYSTEM LIVE OPERATIONAL MODE // CAROUSEL DEPLOYED
          {totalSelectedTracksLength > 1
            ? ` // VECTOR ${currentActiveIndex + 1} OF ${totalSelectedTracksLength}`
            : ''}{' '}
          ]
        </span>

        <div className="flex items-center space-x-3 w-full sm:w-auto flex-1 justify-end">
          <div className="flex items-center space-x-3 bg-slate-950 border border-slate-900 rounded px-3 py-2 w-full max-w-[420px] text-left h-full">
            <span className="text-[#00FFFF] text-[10px] font-bold tracking-widest uppercase flex-shrink-0">
              [ UPLINK_URL ]:
            </span>
            <input
              type="text"
              value={submissionLinkUrl}
              onChange={(e) => setSubmissionLinkUrl(e.target.value)}
              placeholder="Paste your direct media link here..."
              className="flex-1 bg-transparent border-none text-[#00FFFF] text-xs font-mono placeholder-slate-700 outline-none p-0 focus:ring-0 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleContinueOrComplete}
            className="border border-[#00FFFF] bg-[#00FFFF]/5 hover:bg-[#00FFFF]/20 text-[#00FFFF] text-[10px] tracking-widest font-bold uppercase px-6 py-3 rounded transition-all duration-300 shadow-[0_0_12px_rgba(0,255,255,0.05)] whitespace-nowrap h-full"
          >
            {isLastTrack
              ? '[ COMPLETE BLUEPRINT DATA STREAM TRANSMISSION // ]'
              : `[ CONTINUE TO NEXT VECTOR // ROW ${currentActiveIndex + 2} ]`}
          </button>
        </div>
      </div>
    </div>
  );
}
