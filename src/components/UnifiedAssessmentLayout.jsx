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
  // Safe string data extractors (library keys + coach uplink keys)
  const box1Text =
    databaseRecord?.execution_text ||
    databaseRecord?.execution ||
    'DIRECTIVE_PENDING // No dynamic execution cues loaded in archive.';
  const box2Text =
    databaseRecord?.alignment_text ||
    databaseRecord?.alignment ||
    'TELEMETRY_PENDING // No camera orientation guidelines loaded in archive.';
  // ❌ OLD DISCONNECTED TRACKING KEY
  // const imageSource = databaseRecord?.biometric_photo_url || "https://imgur.com";

  // 🟢 NEW BULLETPROOF DETECT MATRIX (Checks BOTH name formats automatically!)
  const rawImage =
    databaseRecord?.biometric_photo_url ||
    databaseRecord?.biometricPhotoUrl ||
    databaseRecord?.imageUrl ||
    'https://imgur.com';
  const imageSource = isAssignedPanelUrl(rawImage)
    ? rawImage
    : DEFAULT_PROTOCOL_FALLBACK.imageUrl;
  const useCustomGraphic = isAssignedPanelUrl(imageSource);

  // Batch progression — controlled from App when a multi-track pool is active
  const [localIndex, setLocalIndex] = useState(0);
  const currentActiveIndex =
    typeof controlledIndex === 'number' ? controlledIndex : localIndex;
  const setCurrentActiveIndex =
    typeof setControlledIndex === 'function' ? setControlledIndex : setLocalIndex;

  const handleContinueOrComplete = () => {
    // 🟢 FIXED ROUTING BLOCK: GATING PUBLIC USERS AWAY FROM THE COACHES DECK
    if (currentActiveIndex < totalSelectedTracksLength - 1) {
      // Advance their viewport to their next selected movement track data row seamlessly
      setCurrentActiveIndex((prev) => prev + 1);
      console.log(
        '[ SYSTEM TELEMETRY: INCREMENTING MOVEMENT TARGET MATRIX NODE ]'
      );
    } else {
      // 🏁 Trigger final ingestion sequence and close out their portal back home safely
      alert(
        'STREAM COMPLETE: All custom athletic movement vectors have been compiled and sent straight to Coach Matta for calibration review!'
      );

      // ❌ OLD ERRANT COMMAND PATH (Sends them to your private space)
      // onNavigate("COACH_DASHBOARD_HOME");

      // 🟢 NEW ACCURATE PRODUCTION COMMAND PATH (Sends them back to the clean public portal login landing screen!)
      onNavigate?.('CLIENT_PORTAL_LANDING_HOME');

      console.log(
        '[ SECURITY FORCE LOCK: RE-ROUTING COMPLETED USER TO PUBLIC PROFILE RETICLE ]'
      );
    }
  };

  const handleEscSuite = () => {
    if (typeof onNavigate === 'function') {
      // Prefer explicit suite return; App handler also accepts bare ESC-style calls
      onNavigate('VITAL_FLOW_DECOMPRESSION_MATRIX');
    }
  };

  return (
    /* 🟢 THE FIX: Force the page wrapper to match your exact screen window size & hide outer text spillovers */
    <div className="w-full h-screen bg-[#030712] p-6 font-mono text-white flex flex-col justify-between overflow-hidden">
      {/* HEADER CONTROLS TIER */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3 min-h-[45px] shrink-0">
        <div className="text-left">
          <span className="text-slate-500 text-[9px] uppercase tracking-widest block">
            // SYS_STATUS // STABILITY_SECURE // ASSESSMENT_CORE
            {moduleId ? ` // ${moduleId}` : ''}
          </span>
          <h2 className="text-[#00FFFF] text-xs font-bold tracking-widest uppercase mt-0.5">
            {trackName || 'MOTION CONFIGURATION MATRICES'}
          </h2>
          {/* PLACE THIS PIECE RIGHT UNDER THE TRACK TITLE INSIDE YOUR DUAL-BOX SHEET CONTAINER */}
          <div className="text-left font-mono my-2">
            {/* 🟢 CONDITIONAL SHIELD: curated / private terminal tracks hide commercial price tags */}
            {databaseRecord?.category === '[ MAIN SYSTEM DIRECTORY ]' ||
            databaseRecord?.category === 'Main Terminal' ||
            databaseRecord?.category === 'VITAL_FLOW_PRESET' ||
            databaseRecord?.isPrivateTerminal ? (
              <span className="bg-slate-900/60 border border-slate-800/80 text-slate-500 text-[9px] tracking-widest font-bold uppercase px-3 py-1 rounded inline-block">
                🛡️ [ ADMINISTRATIVE SECURE DATA VECTOR // FREE ACCESS ]
              </span>
            ) : (
              <span className="text-[#00FFFF] font-bold text-xs tracking-wider block">
                INVESTMENT RATE VALUE: ${databaseRecord?.price || '25.00'}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleEscSuite}
          className="border border-slate-800 hover:border-[#00FFFF] bg-slate-900/40 hover:bg-[#00FFFF]/10 text-slate-400 hover:text-[#00FFFF] text-[9px] tracking-widest font-bold uppercase px-4 py-2.5 rounded transition-all duration-300"
        >
          [ ESC // SUITE INDEX ]
        </button>
      </div>

      {/* TWO-COLUMN GRID DECK: Scaled dynamically relative to remaining window height */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6 items-stretch my-4 overflow-hidden h-[calc(100vh-140px)]">
        {/* 📷 LEFT INTERACTIVE MATRIX COLUMN: Your beautiful 3D Wireframe Render Graphic */}
        <div className="border border-slate-900/80 bg-slate-950/20 rounded-lg p-4 flex justify-center items-center overflow-hidden min-h-0">
          {useCustomGraphic ? (
            <img
              src={imageSource}
              alt="Kinetic Blueprint Mesh"
              /* 🟢 THE FIX: Enforce max height constraints so it scales beautifully to match any desktop screen size */
              className="max-w-full max-h-full h-auto w-auto object-contain rounded-md transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full min-h-0 rounded-md overflow-hidden border border-cyan-950/40 bg-[#030d1e]/50">
              <CenterSphere viewState="client_profile" />
            </div>
          )}
        </div>

        {/* 📁 RIGHT INFORMATION PANEL COLUMN: Stacked text containers */}
        <div className="flex flex-col justify-between space-y-4 min-h-0 overflow-hidden">
          {/* 📦 INFORMATION BOX 1: MOVEMENT DIRECTIVES */}
          <div className="flex-1 border border-slate-900/80 bg-slate-950/40 rounded-lg p-5 flex flex-col min-h-0 overflow-hidden text-left">
            <div className="flex items-center space-x-2 border-b border-slate-900/60 pb-2 mb-2 flex-shrink-0">
              <span className="text-[#00FFFF] text-xs">🔹</span>
              <h3 className="text-white text-[10px] font-bold tracking-widest uppercase">
                Movement Execution Instructions
              </h3>
            </div>
            {/* 🟢 THE FIX: If paragraphs run long, this inner window safely handles its own custom scroll without pushing elements away */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 text-slate-300 text-xs leading-relaxed tracking-wide whitespace-pre-line">
              {box1Text}
            </div>
          </div>

          {/* 📦 INFORMATION BOX 2: CAMERA ALIGNMENT MANUAL */}
          <div className="flex-1 border border-slate-900/80 bg-slate-950/40 rounded-lg p-5 flex flex-col min-h-0 overflow-hidden text-left">
            <div className="flex items-center space-x-2 border-b border-slate-900/60 pb-2 mb-2 flex-shrink-0">
              <span className="text-[#00FFFF] text-xs">📷</span>
              <h3 className="text-white text-[10px] font-bold tracking-widest uppercase">
                Camera Angle & Telemetry Alignment
              </h3>
            </div>
            {/* 🟢 THE FIX: Inner standalone scrolling wrapper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 text-slate-300 text-xs leading-relaxed tracking-wide whitespace-pre-line">
              {box2Text}
            </div>
          </div>
        </div>
      </div>

      {/* LOWER FOOTER COMMAND BAR PANEL */}
      <div className="border-t border-slate-900/60 pt-3 flex justify-between items-center h-[50px] flex-shrink-0">
        <span className="text-slate-600 text-[9px] uppercase tracking-widest font-mono">
          [ SYSTEM LIVE OPERATIONAL MODE // CAROUSEL DEPLOYED
          {athleteName ? ` // ${athleteName}` : ''}
          {athleteCode ? ` // ${athleteCode}` : ''} ]
        </span>

        {/* Dynamic Nav Button Array Link Hook */}
        <button
          type="button"
          onClick={handleContinueOrComplete}
          className="border border-[#00FFFF] bg-[#00FFFF]/5 hover:bg-[#00FFFF]/20 text-[#00FFFF] text-[9px] tracking-widest font-bold uppercase px-6 py-3 rounded transition-all duration-300 shadow-[0_0_12px_rgba(0,255,255,0.05)]"
        >
          {currentActiveIndex < totalSelectedTracksLength - 1
            ? `[ CONTINUE TO NEXT VECTOR ASSESSMENT // ROW ${currentActiveIndex + 2} ]`
            : '[ COMPLETE BLUEPRINT DATA STREAM TRANSMISSION // ]'}
        </button>
      </div>
    </div>
  );
}
