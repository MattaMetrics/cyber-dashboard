import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, Anchor } from 'lucide-react';
import SecurityLockOverlay from './SecurityLockOverlay';

export default function TrackPortals({
  viewState,
  renderSystemHeader,
  uploadStatus,
  setUploadStatus,
  activePostureModule,
  setActivePostureModule,
  activeVitalModule,
  setActiveVitalModule,
  activeAthleteModule,
  setActiveAthleteModule,
  activeCombatModule,
  setActiveCombatModule,
  hasSecureAccess = false,
  isTokenValidated = false,
  onRetrieveAccessToken,
}) {
  const [showSecurityGate, setShowSecurityGate] = useState(false);

  // Post-payment token validation permanently bypasses the amber security gate
  useEffect(() => {
    if (isTokenValidated || hasSecureAccess) {
      setShowSecurityGate(false);
    }
  }, [isTokenValidated, hasSecureAccess]);

  const requireSecureAccess = (action) => {
    if (isTokenValidated || hasSecureAccess) {
      action();
      return;
    }
    setShowSecurityGate(true);
  };

  const securityOverlay =
    showSecurityGate && !isTokenValidated ? (
      <SecurityLockOverlay
        isTokenValidated={isTokenValidated}
        onClose={() => setShowSecurityGate(false)}
        onRetrieveAccessToken={() => {
          // Unmount gate first, then hand off to App pricing_matrix router
          setShowSecurityGate(false);
          onRetrieveAccessToken?.();
        }}
      />
    ) : null;

  // SYSTEM FRAME A: Unified Posture & Ergonomics Workspace
  if (viewState === 'mobility') {
    const postureModules = [
      {
        id: 'pe_cervical',
        title: 'Test 1: Cervical & Desk-Posture Grid',
        direction: 'Forward Head Translation & Spine Angles // Side View Capture',
        metrics: 'Neck Mobility & Extension Constraints',
        duration: '3 Minutes',
        icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
        desc: 'Maps exact forward skull carriage distances and shoulder rounding vectors directly caused by long hours at a computer terminal screen.',
      },
      {
        id: 'pe_lumbar',
        title: 'Test 2: Lumbar Spine & Pelvic Recruitment',
        direction: 'Lumbar Curve & Pelvic Tilt Bias // Side View Capture',
        metrics: 'Posterior/Anterior Pelvic Loading Lines',
        duration: '3 Minutes',
        icon: <Activity className="w-5 h-5 text-emerald-400" />,
        desc: 'Maps lumbar hyper-extension and pelvic angle drop patterns under controlled tilt recruitment to isolate lower-spine compression bias.',
      },
      {
        id: 'pe_thoracic',
        title: 'Test 3: Trunk & Thoracic Rotation Matrix',
        direction: 'Ribcage Transverse Flexibility // Frontal View Capture',
        metrics: 'Spinal Twisting Decompression Lines',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-amber-400" />,
        desc: 'Measures core rotation limits and trunk stiffness lines built up during workplace shifts, isolating trapped structural paths.',
      },
    ];

    // Intercept card click mechanics to switch into deep corporate portal views
    const handlePostureModuleAction = (id) => {
      requireSecureAccess(() => {
        if (id === 'pe_cervical') {
          setActivePostureModule('pe_cervical');
          return;
        }
        if (id === 'pe_lumbar') {
          setActivePostureModule('pe_lumbar');
          return;
        }
        if (id === 'pe_thoracic') {
          setActivePostureModule('pe_thoracic');
          return;
        }
        document.getElementById(id).click();
      });
    };

    const handlePostureFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // POSTURE SUB-PORTAL 1: Cervical & Desk-Posture Grid
    // =========================================================================
    if (activePostureModule === 'pe_cervical') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('POSTURE_ERGONOMICS // CERVICAL_GRID_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActivePostureModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    CERVICAL & DESK-POSTURE GRID
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// SPINE_COMPRESSION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // INITIAL BASE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop your first bodyless skeleton asset here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // DYNAMIC APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop your peak joint angle vector asset here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // TERMINAL STABILITY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop your load deceleration holding asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Stand naturally or sit in your habitual computer workspace stance. Look straight ahead for 3
                      seconds, then drop your chin completely down to your chest, return slowly to center, and look
                      fully upward toward the ceiling vector.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">FORWARD HEAD JUT</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">PLUMB LINE MATRIX</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera exactly at shoulder height, standing 5 to 6 feet away directly facing
                      your side profile path (90-degree lateral profile view). Frame the base of the skull down to
                      mid-torso lines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // POSTURE SUB-PORTAL 2: Lumbar Spine & Pelvic Loading
    // =========================================================================
    if (activePostureModule === 'pe_lumbar') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('POSTURE_ERGONOMICS // LUMBAR_PELVIC_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActivePostureModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-emerald-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    LUMBAR SPINE & PELVIC RECRUITMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-emerald-400 font-bold uppercase">// PELVIC_TILT_BIAS</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-emerald-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // NEUTRAL STANDING
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop lumbar curve baseline graphic here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-emerald-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // FLEXION VECTOR
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop posterior pelvic rotation tracking asset here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-emerald-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // EXTENSION OVERLOAD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop anterior shear angle summary metric here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Place your hands on your hip crest lines. Gently tuck your tailbone completely underneath you to
                      flatten your lower back (posterior tilt), hold for 2 seconds, then reverse the pattern by
                      exaggerating your lower spinal curve outward (anterior tilt).
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-emerald-400">LUMBAR HYPER-EXT</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-emerald-400">PELVIC ANGLE DROP</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set your capture device precisely at pelvic crest line height, standing 6 feet away directly
                      matching your lateral profile axis (90-degree side view). Keep loose shirts tucked away to avoid
                      obscuring spinal marker telemetry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // POSTURE SUB-PORTAL 3: Trunk & Thoracic Rotation Matrix
    // =========================================================================
    if (activePostureModule === 'pe_thoracic') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('POSTURE_ERGONOMICS // THORACIC_ROTATION')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-orange-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActivePostureModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-orange-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TRUNK & THORACIC ROTATION MATRIX
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-orange-400 font-bold uppercase">// CORE_DECOMPRESSION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-orange-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-orange-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // SEATED AXIAL ALIGNMENT
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop seated neutral spine rotation axis here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-orange-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-orange-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // LEFT DEFLECTION APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop left shoulder transverse plane angle vector here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-orange-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-orange-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // RIGHT DEFLECTION APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop right shoulder transverse plane angle vector here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Sit tall on a bench or chair with a straight rod across your upper shoulders. Keeping your hips
                      completely forward and fixed, rotate your upper torso fully to the left side and hold for 2
                      seconds, then rotate fully to the right side and hold for 2 seconds.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-orange-400">THORACIC MOBILITY RANGE</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-orange-400">PELVIC ASYMMETRY ROTATION</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera exactly at chest height, standing 6 to 7 feet away directly facing the
                      front center profile path (full frontal view capture). Both shoulders must stay visible throughout
                      the twisting motion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // MAIN SUITE LISTING: Render Standardized Posture & Ergonomics Grid
    // =========================================================================
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('POSTURE_ERGONOMICS_COMPRESSION_MATRIX')}

        {/* Scrollable Container Box Matching Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="relative w-full max-w-5xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {securityOverlay}
            {/* Standardized Branded Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // POSTURE & ERGONOMICS
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide border-l-2 border-cyan-500/40 pl-4">
                "Corporate & Desk Worker Track — Combating Screen Compression." This premium assessment path shifts
                focus to foundational durability, exposing hidden spinal degradation, neck posture strain, and
                workplace structural fatigue.
              </p>
            </div>

            {/* Double-Column Grid Container Mapping Hook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {postureModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handlePostureModuleAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                      ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                      ${
                        current?.state === 'complete'
                          ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handlePostureFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* High-Tech Infinite Loop Overlay Tracker */}
                    {current?.state === 'scanning' && (
                      <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 text-center font-mono">
                        <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                          ∞
                        </div>
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                          RUNNING KINETIC TELEMETRY SCAN...
                        </p>
                      </div>
                    )}

                    {/* Card Media Information Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-cyan-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      {/* Card Identity Header */}
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight font-mono">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-cyan-500/90 font-bold uppercase tracking-widest mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-medium">{item.metrics}</span>

                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME F: Unified Vital Flow Longevity Suite Workspace
  if (viewState === 'vital_flow') {
    const vitalModules = [
      {
        id: 'vf_squat',
        title: 'Deep Squat & Mobility Matrix',
        direction: 'Bilateral Wide Stance // Frontal View Capture',
        metrics: '46 Mobility Data Points',
        duration: '4 Minutes',
        icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
        desc: 'Analyzes dynamic lateral tracking paths, deep knee alignment profiles, and pelvic drop depth vectors under loading cycles.',
      },
      {
        id: 'vf_ext',
        title: 'Mobility Back Extension Assessment',
        direction: 'Kinetic Power & Structural Extension // Side Profile View',
        metrics: 'Spinal Articulation Coefficients',
        duration: '3 Minutes',
        icon: <Activity className="w-5 h-5 text-amber-400" />,
        desc: 'Maps segmented thoracic expansion arcs against lumbar shear limits to ensure overhead extensions are shielded.',
      },
      {
        id: 'vf_hold',
        title: 'Single-Leg Hold Stability Secure Assessment',
        direction: 'Static Unilateral Postural Sway // Frontal View',
        metrics: 'Postural Sway Radius Matrix',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-emerald-400" />,
        desc: 'Exposes hidden left-to-right micro-instabilities and stabilizer sway frequencies under persistent loading patterns.',
      },
    ];

    const handleModuleCardAction = (id) => {
      requireSecureAccess(() => {
        if (id === 'vf_squat') {
          setActiveVitalModule('vf_squat');
          return;
        }
        if (id === 'vf_ext') {
          setActiveVitalModule('vf_ext');
          return;
        }
        if (id === 'vf_hold') {
          setActiveVitalModule('vf_hold');
          return;
        }
        document.getElementById(id)?.click();
      });
    };

    const handleVitalFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // SUB-ROUTER CONDITIONAL: Render Test One Sub-Portal
    // =========================================================================
    if (activeVitalModule === 'vf_squat') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('VITAL_FLOW // DEEP_SQUAT_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              {/* PORTAL TITLE DECK HEADLINE */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveVitalModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-blue-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    DEEP SQUAT & MOBILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">// MOBILITY_ANALYSIS</span>
              </div>

              {/* CLEAN DUAL-COLUMN HIGH-ART RECORDING SYSTEM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: MASSIVE HOLOGRAPHIC BIOMETRIC EXAMPLES */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // STANDING SETUP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop first bodyless skeleton model profile here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // ECCENTRIC TRANSITION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop hip-crease alignment vector graphics here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // MAXIMUM DEPTH HOLD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop deep apex telemetry outline asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: UPSCALE SYSTEM TELEMETRY INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  {/* EXPANDED INSTRUCTIONS CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Stand with your feet shoulder-width apart, arms extended straight out in front of your chest.
                      Descend smoothly into your maximum controlled deep squat, pulling your hips low while keeping your
                      heels firmly anchored to the floor. Hold the absolute bottom position for 3 full seconds before
                      returning to the start line.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-blue-400">ANKLE DORSIFLEXION</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-blue-400">HIP DEPTH SHIFT</span>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CAMERA ALIGNMENT CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera device exactly at knee height, standing 7 to 8 feet away directly facing
                      your side profile (90-degree lateral view capture). Ensure your entire body, from your feet to peak
                      extended hand line, remains tracked within the screen workspace throughout the entire pattern.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // VITAL FLOW MODULE: Mobility Back Extension Assessment
    // =========================================================================
    if (activeVitalModule === 'vf_ext') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('VITAL_FLOW // SPINE_EXTENSION_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveVitalModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    MOBILITY BACK EXTENSION ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// THORACIC_ALIGNMENT</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // PRONE EXTENSION SETUP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop prone resting alignment skeleton here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // SEGMENTAL SPINE DRIVE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dynamic lumbar thoracic extension arcs here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // MAXIMUM POSTERIOR HOLD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop apex chest-lift clearance tracking file here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Lie completely prone face down on your training mat. Place your hands flat directly underneath your
                      shoulders. Keeping your pelvis and legs firmly glued down to the floor, press through your hands to
                      extend your upper torso upward. Arrive at a comfortable peak range, holding for 3 full seconds.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">THORACIC SEGMENT EXTN</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">PELVIC ANCHOR BREAK</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set your camera device directly on the floor or a low platform at mat level. Position it 7 to 8 feet
                      away, perfectly square to your side profile (90-degree lateral profile capture). Ensure your entire
                      length from head to toes stays framed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // VITAL FLOW MODULE: Single Leg Hold Stability Assessment
    // =========================================================================
    if (activeVitalModule === 'vf_hold') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('VITAL_FLOW // UNILATERAL_BALANCE_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveVitalModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SINGLE LEG HOLD STABILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                  // CORE_STABILIZER_MATRIX
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // UNILATERAL SETUP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop static single leg ankle loading map here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // CENTER MASS SWAY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop torso sway lateral displacement graph here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // BASE ANCHOR STABILITY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop proprietary anchor pronation summary file here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Lift one foot cleanly off the floor, keeping your standing support leg completely straight with
                      your hands placed firmly on your hip crest lines. Maintain this frozen posture perfectly still for
                      20 continuous seconds, tracking balance micro-corrections.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">TORSO ANGLE OSCILLATION</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">FOOT CONTROLLER SWAY</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera device exactly at waist height, standing 6 feet away directly facing the
                      front path vector (full frontal view capture). Frame both hip points and feet clearly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ORIGINAL MATRIX SUITE LISTING CONTENT DISPLAY (Wrap beneath sub-router)
    // =========================================================================
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('VITAL_FLOW_DECOMPRESSION_MATRIX')}

        {/* Scrollable Container Box Matching the Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="relative w-full max-w-5xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {securityOverlay}
            {/* Standardized Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // VITAL FLOW
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide">
                "Flexibility without stability is a recipe for joint wear-and-tear." Select an assessment pathway below
                to view setup grids and start your movement calibration.
              </p>
            </div>

            {/* Clean Grid Framework Matching the Image Exactly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vitalModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleModuleCardAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                      ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                      ${
                        current?.state === 'complete'
                          ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.02)]'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handleVitalFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* High-Tech Infinite Loop Overlay Tracker */}
                    {current?.state === 'scanning' && (
                      <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 text-center">
                        <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                          ∞
                        </div>
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                          RUNNING KINETIC TELEMETRY SCAN...
                        </p>
                      </div>
                    )}

                    {/* Card Top Row */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-cyan-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      {/* Card Identity Header */}
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium font-mono">{item.metrics}</span>

                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform font-mono">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold font-mono">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME G: Dedicated Athlete Precision Workspace
  if (viewState === 'athlete_precision') {
    const athleteModules = [
      {
        id: 'ap_overhead',
        title: 'Test 1: Overhead Bilateral Squat',
        direction: 'Bilateral Overhead Extension // Frontal View Capture',
        metrics: 'Knee Valgus Angle & Depth Symmetry',
        duration: '4 Minutes',
        icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
        desc: 'Tracks dynamic frontal knee tracking paths and rotational valgus collapse limits. Pinpoints unweighted hip-to-ankle alignment shifts under core extension.',
      },
      {
        id: 'ap_single',
        title: 'Test 2: Dynamic Single-Leg Squat',
        direction: 'Unilateral Lower Body Load // Frontal View Capture',
        metrics: 'Limb Symmetry Index (LSI) Telemetry',
        duration: '5 Minutes',
        icon: <Activity className="w-5 h-5 text-indigo-400" />,
        desc: 'Compares left-leg stabilizer tracking values directly against right-leg parameters to isolate hidden muscular asymmetries and quad dominance ratios.',
      },
      {
        id: 'ap_hold',
        title: 'Test 3: Single Leg Hold Stability',
        direction: 'Unilateral Static Balance // Frontal View Capture',
        metrics: 'Core Stabilizer & Foot Sway Telemetry',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-cyan-400" />,
        desc: 'Tracks torso oscillation and foot-controller sway under a frozen single-leg lockout hold to isolate balance micro-corrections and ankle loading bias.',
      },
    ];

    // Intercept card click mechanics to switch into deep athlete precision portals
    const handleAthleteModuleAction = (id) => {
      requireSecureAccess(() => {
        if (id === 'ap_overhead') {
          setActiveAthleteModule('ap_overhead');
          return;
        }
        if (id === 'ap_single') {
          setActiveAthleteModule('ap_single');
          return;
        }
        if (id === 'ap_hold') {
          setActiveAthleteModule('ap_hold');
          return;
        }
        // Fallback file input click loop for the remaining cards
        document.getElementById(id).click();
      });
    };

    const handleAthleteFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // SUB-ROUTER CONDITIONAL: Render Athlete Test One Sub-Portal (Overhead Squat)
    // =========================================================================
    if (activeAthleteModule === 'ap_overhead') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // OVERHEAD_SQUAT_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              {/* PORTAL TITLE DECK HEADLINE */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveAthleteModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    OVERHEAD BILATERAL SQUAT ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// SYMMETRY_ANALYSIS</span>
              </div>

              {/* CLEAN DUAL-COLUMN HIGH-ART RECORDING SYSTEM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: MASSIVE HOLOGRAPHIC BIOMETRIC EXAMPLES */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // OVERHEAD LOCKOUT
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dowel/bar track skeleton model here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // BILATERAL DRIVE DEPTH
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop frontal knee-tracking lateral shift matrix here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // BILATERAL AXIS STICK
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop shoulder torso angle symmetry metrics here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: UPSCALE SYSTEM TELEMETRY INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  {/* EXPANDED INSTRUCTIONS CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Raise your arms directly overhead, holding a PVC pipe, dowel rod, or light straight line bar vector
                      with elbows locked out crisp. Keep your chest up high and squat downward as low as your anatomy
                      allows. Press your weight evenly through both feet, holding the absolute base threshold stable for
                      2 seconds before pushing upright.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">THORACIC EXTENSION</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">VALGUS KNEE DEVIA</span>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CAMERA ALIGNMENT CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set your recording device perfectly at mid-torso height, positioned 8 feet out directly facing your
                      front center profile (full frontal view capture). Your hands, shoulders, knees, and feet must stay
                      completely tracked inside the capture envelope at all times.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Dynamic Single-Leg Squat Assessment
    // =========================================================================
    if (activeAthleteModule === 'ap_single') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // SINGLE_LEG_SQUAT_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveAthleteModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-blue-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    DYNAMIC SINGLE-LEG SQUAT ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">// BILATERAL_SYMMETRY</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // SINGLE LEG BALANCE UNLOAD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop unilateral stance baseline skeletal frame here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // ECCENTRIC VALGUS APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dynamic knee tracking deviation vector files here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // HIP STABILITY DROP CONSOLE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop pelvis tilt asymmetry tracking metrics here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Balance firmly on your target tracking leg, raising your opposite foot cleanly off the floor
                      surface. Extend your arms out forward for balance, descend smoothly to your maximum comfortable
                      single-leg depth, and push straight back up to complete the rep vector.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-blue-400">VALGUS KNEE TRACK</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-blue-400">LATERAL HIP SHIFT</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set up your video recording device exactly at knee height, standing 7 to 8 feet away directly facing
                      the front center profile line (full frontal view capture). Keep your entire frame from base to
                      shoulders tracked.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Single Leg Hold Stability Assessment
    // =========================================================================
    if (activeAthleteModule === 'ap_hold') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // SINGLE_LEG_HOLD_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveAthleteModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SINGLE LEG HOLD STABILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                  // CORE_STABILIZER_MATRIX
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // UNILATERAL LOCKOUT TIMELINE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop static single leg ankle loading map here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // CENTER VECTOR DRIFT ANALYSIS
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop torso sway lateral displacement graph here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // FOOT APEX DEVIATION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop proprietary anchor pronation summary file here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Lift one foot cleanly off the floor, keeping your standing support leg straight with your hands
                      placed firmly on your hip crest lines. Maintain this frozen posture perfectly still for 20
                      continuous seconds, tracking balance micro-corrections.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">TORSO ANGLE OSCILL</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">FOOT CONTROLLER SWAY</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your device camera exactly at waist height, standing 6 feet away directly facing the front
                      path vector (full frontal view capture). Frame both hip points and feet clearly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('ATHLETE_PRECISION_DURABILITY_MATRIX')}

        {/* Scrollable Container Box Matching Your Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="relative w-full max-w-4xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {securityOverlay}
            {/* Standardized Branded Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // ATHLETE PRECISION
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide border-l-2 border-cyan-500/40 pl-4">
                "This assessment shifts the focus from raw power to foundational durability, exposing hidden asymmetries."
                This targeted tracking matrix identifies micro-asymmetries and neuromuscular imbalances before they evolve
                into long-term mechanical degradation.
              </p>
            </div>

            {/* Clean Grid Framework Matching the Vital Flow & Posture Standard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {athleteModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAthleteModuleAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                      ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                      ${
                        current?.state === 'complete'
                          ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handleAthleteFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* High-Tech Infinite Loop Loader Overlay */}
                    {current?.state === 'scanning' && (
                      <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 text-center font-mono">
                        <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                          ∞
                        </div>
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                          RUNNING KINETIC TELEMETRY SCAN...
                        </p>
                      </div>
                    )}

                    {/* Card Media Information Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-cyan-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      {/* Card Track Title Specs */}
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight font-mono">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-cyan-500/90 font-bold uppercase tracking-widest mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-medium">{item.metrics}</span>

                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME H: Unified Kinetic Power Integrity Combat Track Workspace
  if (viewState === 'kinetic_power') {
    const combatModules = [
      {
        id: 'kp_boxing',
        title: 'Test 1: Shadow Boxing Cross or Hook',
        direction: 'General Mobility Assessment // Frontal View Capture',
        metrics: 'Kinetic Energy Leak & Rotation Ratios',
        duration: '3 Minutes',
        icon: <Sparkles className="w-5 h-5 text-rose-400" />,
        desc: 'Maps the transfer of kinetic force from the ground up. Tracking rotation angles reveals exactly where striking energy is lost before reaching the target.',
      },
      {
        id: 'kp_bound',
        title: 'Test 2: Lateral Single-Leg Bound and Hold',
        direction: 'Jump / Landing Assessment (Sideways Bound) // Frontal View',
        metrics: 'Dynamic Ankle & Knee Torque Stabilization',
        duration: '4 Minutes',
        icon: <Activity className="w-5 h-5 text-amber-400" />,
        desc: 'Measures how quickly joint angles stabilize after absorbing sharp lateral force vectors, testing directly for structural ligament protection.',
      },
      {
        id: 'kp_stance',
        title: 'Test 3: Low Combat Stance Hold',
        direction: 'Squat Solution Module // Frontal View Capture',
        metrics: 'Weight-Distribution Shift Percentages',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-cyan-400" />,
        desc: 'Checks left vs. right knee loading angles to see if a fighter overloads their lead or rear tracking leg while maintaining their center-of-mass balance.',
      },
    ];

    // Intercept card click mechanics to switch into deep combat portal views
    const handleCombatModuleAction = (id) => {
      requireSecureAccess(() => {
        if (id === 'kp_boxing') {
          setActiveCombatModule('kp_boxing');
          return;
        }
        if (id === 'kp_bound') {
          setActiveCombatModule('kp_bound');
          return;
        }
        if (id === 'kp_stance') {
          setActiveCombatModule('kp_stance');
          return;
        }
        document.getElementById(id).click();
      });
    };

    const handleCombatFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // COMBAT TEST SUB-PORTAL 1: Shadow Boxing Cross or Hook Assessment
    // =========================================================================
    if (activeCombatModule === 'kp_boxing') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('KINETIC_POWER // STRIKING_MOBILITY_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-rose-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveCombatModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-rose-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 1: SHADOW BOXING CROSS OR HOOK
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-rose-400 font-bold uppercase">// ENERGY_TRANSFER</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-rose-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-rose-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // STANCE DRIVE LINE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop rear-foot heel rotation vector file here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-rose-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-rose-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // HIP ROTATIONAL SNAP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop kinetic energy pelvis slinging outline here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-rose-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-rose-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // PEAK IMPACT EXTENSION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop torso alignment lumbar guard asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Square up into your fighting stance. Fire 3 maximum-velocity rear-hand cross punches or heavy lead
                      hooks into shadow boxing space. Exaggerate your heel-pivoting drive and hip snap, freezing the peak
                      extension line perfectly stable for 1 full second on the final repetition.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-rose-400">ROTATIONAL FORCE LEAKS</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-rose-400">LUMBAR SHEAR PROTECTION</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set up your device camera exactly at chest height, standing 7 to 8 feet away directly facing your
                      front center-line vector (full frontal view capture). Your entire frame from your tracking feet up
                      to the punch arc path must stay tracked.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // COMBAT TEST SUB-PORTAL 2: Lateral Single-Leg Bound and Hold
    // =========================================================================
    if (activeCombatModule === 'kp_bound') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('KINETIC_POWER // LATERAL_DECELERATION_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveCombatModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-amber-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 2: LATERAL SINGLE-LEG BOUND AND HOLD
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-amber-400 font-bold uppercase">// LIGAMENT_PROTECTION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-amber-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-amber-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // SIDEWAYS LAUNCH DRIVE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop explosive lateral drive force graphic here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-amber-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-amber-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // TORQUE STABILIZATION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dynamic knee deceleration vector file here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-amber-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-amber-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // STATUE BASE ANCHOR
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop terminal ankle angle stability metric asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Bound sideways explosively into the tracking frame, landing firmly on your outside tracking leg.
                      Drop deeply into your hips to absorb the incoming force vectors and stick the landing like a
                      statue. Hold that frozen single-leg base completely stable for 3 full seconds without resetting.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-amber-400">DYNAMIC KNEE TORQUE</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-amber-400">DECELERATION ANKLE ANCHOR</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your camera device exactly at knee height, standing 8 feet away directly facing your
                      jumping trajectory path (full frontal view capture). Make sure the full width of your lateral
                      bound track stays within the workspace boundary.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // COMBAT TEST SUB-PORTAL 3: Low Combat Stance Hold Assessment
    // =========================================================================
    if (activeCombatModule === 'kp_stance') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('KINETIC_POWER // LOW_STANCE_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveCombatModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 3: LOW COMBAT STANCE HOLD
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// WEIGHT_DISTRIBUTION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // STANCE DEPTH ENTRY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop grappling base alignment silhouette here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // LEAD VS REAR BIAS LOADING
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop left vs right knee loading balance mesh here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // CENTER MASS SUSTAIN
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop pelvis center-of-mass tracking vectors here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Sink down deep into your maximum functional low combat stance or grappling base. Hold that exact
                      center-of-mass depth perfectly stable for 10 full seconds without creeping or rising up,
                      maintaining a crisp high defensive guard line throughout the entire duration.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">LEAD/REAR KNEE ANGLES</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">CENTER DEPTH TRACKING</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera device exactly at pelvic crest height, centered 7 to 8 feet away
                      directly facing the front center-line layout (full frontal view capture). Frame both feet and
                      knees clearly within the active scanning plane.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // MAIN SUITE LISTING: Render Standardized Kinetic Power Integrity Grid
    // =========================================================================
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('KINETIC_POWER_INTEGRITY_COMBAT_MATRIX')}

        {/* Scrollable Container Box Matching Your Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="relative w-full max-w-4xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {securityOverlay}
            {/* Standardized Branded Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // KINETIC POWER INTEGRITY
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide border-l-2 border-rose-500/40 pl-4">
                "This assessment focuses on absolute joint torque bracing and elite impact stabilization metrics."
                Engineered explicitly for combat sport athletes to track fascial force transmission and protect
                structural cartilage.
              </p>
            </div>

            {/* Clean Grid Framework Matching the Look Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {combatModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCombatModuleAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                        ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                        ${
                          current?.state === 'complete'
                            ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-md'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                        }
                      `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handleCombatFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* Card Media Information Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-rose-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight font-mono">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-rose-400/90 font-bold uppercase tracking-widest mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-medium">{item.metrics}</span>
                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }


  return null;
}
