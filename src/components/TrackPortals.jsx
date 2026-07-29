import React, { useState, useEffect, useRef } from 'react';
import VitalFlowTerminal from './VitalFlowTerminal';
import AthletePrecisionTerminal from './AthletePrecisionTerminal';
import PostureErgonomicsTerminal from './PostureErgonomicsTerminal';
import KineticPowerTerminal from './KineticPowerTerminal';
import UnifiedAssessmentLayout from './UnifiedAssessmentLayout';
import {
  DEFAULT_GUIDE_ASSETS,
  DEFAULT_PROTOCOL_FALLBACK,
  resolveGuideAssetUrl,
  resolveGuideProtocolField,
} from '../constants/guideAssets';

/** Resolve panel URL — coach uplink first, then Streamlit pending default graphic. */
function getAssessmentPanelUrl(moduleId, guideAssets = DEFAULT_GUIDE_ASSETS) {
  return resolveGuideAssetUrl(moduleId, guideAssets) || DEFAULT_PROTOCOL_FALLBACK.imageUrl;
}

/**
 * Unified blueprint body — always renders Box 1 + Box 2 together.
 * Coach uplink overrides → optional baked-in fallbacks → system defaults inside layout.
 */
function AssessmentBlueprintSplit({
  moduleId,
  guideAssets,
  trackName,
  fallbackExecution = '',
  fallbackAlignment = '',
  setUploadStatus,
  athleteCode = '000000',
  athleteName = 'UNREGISTERED ATHLETE',
}) {
  const imageUrl = getAssessmentPanelUrl(moduleId, guideAssets);
  const execution =
    resolveGuideProtocolField(moduleId, guideAssets, 'execution') || fallbackExecution || '';
  const alignment =
    resolveGuideProtocolField(moduleId, guideAssets, 'alignment') || fallbackAlignment || '';

  const handleUploadPipelineSuccess = ({ file }) => {
    if (typeof setUploadStatus !== 'function' || !moduleId) return;
    setUploadStatus((prev) => ({
      ...prev,
      [moduleId]: { state: 'complete', fileName: file?.name || 'vector.mp4' },
    }));
  };

  return (
    <UnifiedAssessmentLayout
      trackName={trackName || moduleId}
      moduleId={moduleId}
      databaseRecord={{
        imageUrl,
        execution,
        alignment,
      }}
      athleteCode={athleteCode}
      athleteName={athleteName}
      onUploadPipelineSuccess={handleUploadPipelineSuccess}
    />
  );
}


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
  guideAssets = DEFAULT_GUIDE_ASSETS,
  hasSecureAccess = false,
  isTokenValidated = false,
  isCoachMode = false,
  acceptedAccessPins = [],
  onRetrieveAccessToken,
  onReturnToCore,
  athleteCode = '000000',
  athleteName = 'UNREGISTERED ATHLETE',
}) {
  // Per-card amber gate — track overviews stay readable; only Initialize is locked
  const [activeCardLockGate, setActiveCardLockGate] = useState(null);
  const pendingScanRef = useRef(null);

  const readMasterCoachSession = () => {
    try {
      return window.localStorage?.getItem('MATRIX_COACH_SESSION') === 'active';
    } catch {
      return false;
    }
  };

  // Global System Bypass Token: coach / validated / virtual / persistent master session
  const hasAllAccess = Boolean(
    isCoachMode || isTokenValidated || hasSecureAccess || readMasterCoachSession()
  );

  // Clear card gate on track change or when master access unlocks
  useEffect(() => {
    setActiveCardLockGate(null);
    pendingScanRef.current = null;
  }, [viewState]);

  useEffect(() => {
    if (hasAllAccess) {
      setActiveCardLockGate(null);
      pendingScanRef.current = null;
    }
  }, [hasAllAccess]);

  /** Initialize Assessment Suite — bypass or lock that specific card */
  const tryInitializeAssessment = (cardId, openScan) => {
    const coachSessionActive =
      isCoachMode ||
      isTokenValidated ||
      hasSecureAccess ||
      (() => {
        try {
          return window.localStorage?.getItem('MATRIX_COACH_SESSION') === 'active';
        } catch {
          return false;
        }
      })();

    if (coachSessionActive) {
      setActiveCardLockGate(null);
      pendingScanRef.current = null;
      openScan();
      return;
    }
    pendingScanRef.current = openScan;
    setActiveCardLockGate(cardId);
  };

  /** Local 6-digit gate unlock — drop card lock and open the pending assessment suite */
  const handleLocalCardTokenAccepted = () => {
    const openScan = pendingScanRef.current;
    pendingScanRef.current = null;
    setActiveCardLockGate(null);
    if (typeof openScan === 'function') {
      openScan();
    }
  };

  const cardLockProps = {
    lockedCardId: activeCardLockGate,
    isTokenValidated: isTokenValidated || hasSecureAccess,
    isCoachMode,
    acceptedAccessPins,
    onDismissCardLock: () => {
      pendingScanRef.current = null;
      setActiveCardLockGate(null);
    },
    onLocalTokenAccepted: handleLocalCardTokenAccepted,
    onRetrieveAccessToken: () => {
      pendingScanRef.current = null;
      setActiveCardLockGate(null);
      onRetrieveAccessToken?.();
    },
  };

  // SYSTEM FRAME A: Unified Posture & Ergonomics Workspace
  if (viewState === 'posture_ergonomics' || viewState === 'mobility') {
    // Intercept initialize actions → deep corporate assessment portals
    const handlePostureModuleAction = (id) => {
      tryInitializeAssessment(id, () => {
        if (
          id === 'pe_cervical' ||
          id === 'pe_lumbar' ||
          id === 'pe_thoracic' ||
          id === 'pe_axis' ||
          id === 'pe_hold' ||
          id === 'pe_shoulder'
        ) {
          setActivePostureModule(id);
        }
      });
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SEATED DESK NECK MOBILITY
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// SPINE_COMPRESSION</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="pe_cervical"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="pe_cervical"
                fallbackExecution={`Stand naturally or sit in your habitual computer workspace stance. Look straight ahead for 3 seconds, then drop your chin completely down to your chest, return slowly to center, and look fully upward toward the ceiling vector.`}
                fallbackAlignment={`Position your phone camera exactly at shoulder height, standing 5 to 6 feet away directly facing your side profile path (90-degree lateral profile view). Frame the base of the skull down to mid-torso lines.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    LUMBAR SPINE & PELVIC MOVEMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-emerald-400 font-bold uppercase">// PELVIC_TILT_BIAS</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="pe_lumbar"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="pe_lumbar"
                fallbackExecution={`Place your hands on your hip crest lines. Gently tuck your tailbone completely underneath you to flatten your lower back (posterior tilt), hold for 2 seconds, then reverse the pattern by exaggerating your lower spinal curve outward (anterior tilt).`}
                fallbackAlignment={`Set your capture device precisely at pelvic crest line height, standing 6 feet away directly matching your lateral profile axis (90-degree side view). Keep loose shirts tucked away to avoid obscuring spinal marker telemetry.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TRUNK & THORACIC ROTATION MATRIX
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-orange-400 font-bold uppercase">// CORE_DECOMPRESSION</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="pe_thoracic"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="pe_thoracic"
                fallbackExecution={`Sit tall on a bench or chair with a straight rod across your upper shoulders. Keeping your hips completely forward and fixed, rotate your upper torso fully to the left side and hold for 2 seconds, then rotate fully to the right side and hold for 2 seconds.`}
                fallbackAlignment={`Position your phone camera exactly at chest height, standing 6 to 7 feet away directly facing the front center profile path (full frontal view capture). Both shoulders must stay visible throughout the twisting motion.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // POSTURE SUB-PORTAL: Axis / Hold / Shoulder Rotation (new suite cards)
    // =========================================================================
    if (activePostureModule === 'pe_axis' || activePostureModule === 'pe_hold' || activePostureModule === 'pe_shoulder') {
      const postureStubMeta = {
        pe_axis: {
          header: 'POSTURE_ERGONOMICS // AXIS_TRACKING_MATRIX',
          title: 'POSTURE AXIS TRACKING',
          tag: '// PLUMB_LINE_TELEMETRY',
          panelKey: 'pe_axis',
          blurb:
            'Capture full-body standing and seated side profiles. Frame ear, shoulder, hip, and ankle landmarks on a shared plumb line for axis drift indexing.',
        },
        pe_hold: {
          header: 'POSTURE_ERGONOMICS // UNILATERAL_HOLD_MATRIX',
          title: 'SINGLE-LEG HOLD STABILITY',
          tag: '// DESK_STABILIZER_SWAY',
          panelKey: 'pe_hold',
          blurb:
            'Lift one foot cleanly off the floor after prolonged sitting. Hold a frozen single-leg posture for 20 seconds while framing hips, knees, and ankles for sway telemetry.',
        },
        pe_shoulder: {
          header: 'POSTURE_ERGONOMICS // SHOULDER_DISSOCIATION_MATRIX',
          title: 'SHOULDER ROTATION DISSOCIATION',
          tag: '// SCAPULAR_ROTATION_GRID',
          panelKey: 'pe_shoulder',
          blurb:
            'Seat with pelvis locked. Capture left/right trunk and shoulder rotation arcs without hip shift — indexing dissociation from the workstation reach plane.',
        },
      }[activePostureModule];

      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader(postureStubMeta.header)}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    {postureStubMeta.title}
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-emerald-400 font-bold uppercase">
                  {postureStubMeta.tag}
                </span>
              </div>
              <AssessmentBlueprintSplit
                moduleId={postureStubMeta.panelKey}
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName={postureStubMeta.panelKey}
                fallbackExecution={postureStubMeta.blurb}
              />
            </div>
          </div>
        </div>
      );
    }

    // Wide split-screen Posture & Ergonomics clinical evaluation sub-terminal
    return (
      <PostureErgonomicsTerminal
        renderSystemHeader={renderSystemHeader}
        onReturnToCore={onReturnToCore}
        {...cardLockProps}
        onSelectAssessment={(id) => handlePostureModuleAction(id)}
      />
    );
  }

  // SYSTEM FRAME F: Unified Vital Flow Longevity Suite Workspace
  if (viewState === 'vital_flow') {
    const handleModuleCardAction = (id) => {
      tryInitializeAssessment(id, () => {
        // Multi-Plane Spinal Articulation → existing back-extension portal
        if (id === 'vf_spinal') {
          setActiveVitalModule('vf_ext');
          return;
        }
        if (
          id === 'vf_squat' ||
          id === 'vf_ext' ||
          id === 'vf_hold' ||
          id === 'vf_neck' ||
          id === 'vf_thoracic' ||
          id === 'vf_shoulder'
        ) {
          setActiveVitalModule(id);
        }
      });
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    DEEP SQUAT & MOBILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">// MOBILITY_ANALYSIS</span>
              </div>

              {/* CLEAN DUAL-COLUMN HIGH-ART RECORDING SYSTEM */}
              <AssessmentBlueprintSplit
                moduleId="vf_squat"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="vf_squat"
                fallbackExecution={`Stand with your feet shoulder-width apart, arms extended straight out in front of your chest. Descend smoothly into your maximum controlled deep squat, pulling your hips low while keeping your heels firmly anchored to the floor. Hold the absolute bottom position for 3 full seconds before returning to the start line.`}
                fallbackAlignment={`Position your phone camera device exactly at knee height, standing 7 to 8 feet away directly facing your side profile (90-degree lateral view capture). Ensure your entire body, from your feet to peak extended hand line, remains tracked within the screen workspace throughout the entire pattern.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    MOBILITY BACK EXTENSION ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// THORACIC_ALIGNMENT</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="vf_ext"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="vf_ext"
                fallbackExecution={`Lie completely prone face down on your training mat. Place your hands flat directly underneath your shoulders. Keeping your pelvis and legs firmly glued down to the floor, press through your hands to extend your upper torso upward. Arrive at a comfortable peak range, holding for 3 full seconds.`}
                fallbackAlignment={`Set your camera device directly on the floor or a low platform at mat level. Position it 7 to 8 feet away, perfectly square to your side profile (90-degree lateral profile capture). Ensure your entire length from head to toes stays framed.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SINGLE LEG HOLD STABILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                  // CORE_STABILIZER_MATRIX
                </span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="vf_hold"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="vf_hold"
                fallbackExecution={`Lift one foot cleanly off the floor, keeping your standing support leg completely straight with your hands placed firmly on your hip crest lines. Maintain this frozen posture perfectly still for 20 continuous seconds, tracking balance micro-corrections.`}
                fallbackAlignment={`Position your phone camera device exactly at waist height, standing 6 feet away directly facing the front path vector (full frontal view capture). Frame both hip points and feet clearly.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // Wide 6-card Vital Flow clinical evaluation sub-terminal
    if (activeVitalModule === 'vf_neck' || activeVitalModule === 'vf_thoracic' || activeVitalModule === 'vf_shoulder') {
      const stubMeta = {
        vf_neck: {
          header: 'VITAL_FLOW // NECK_MOBILITY_MATRIX',
          title: 'NECK MOBILITY MATRIX',
          tag: '// CERVICAL_ARC_TELEMETRY',
          blurb:
            'Capture side-profile neck flexion, extension, and chin-to-shoulder rotations. Frame ear-to-shoulder landmarks against a plain backdrop for clean cervical angle indexing.',
        },
        vf_thoracic: {
          header: 'VITAL_FLOW // THORACIC_DISSOCIATION_MATRIX',
          title: 'THORACIC DISSOCIATION INDEX // UPPER TRUNK',
          tag: '// RIBCAGE_ROTATION_INDEX',
          blurb:
            'Seat the athlete with pelvis locked. Capture overhead or rear trunk twist arcs left and right without hip shift — indexing upper-trunk dissociation from the pelvis.',
        },
        vf_shoulder: {
          header: 'VITAL_FLOW // SHOULDER_GIRDLE_MATRIX',
          title: 'SHOULDER GIRDLE TELEMETRY',
          tag: '// SCAPULAR_CLEARANCE_GRID',
          blurb:
            'Frame both shoulders and upper torso. Capture controlled elevation, reach, and scapular upward rotation bilaterally for girdle symmetry telemetry.',
        },
      }[activeVitalModule];

      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader(stubMeta.header)}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    {stubMeta.title}
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">{stubMeta.tag}</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId={activeVitalModule}
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName={activeVitalModule}
                fallbackExecution={stubMeta.blurb}
              />
            </div>
          </div>
        </div>
      );
    }

    // Wide 6-card Vital Flow clinical evaluation sub-terminal
    return (
      <VitalFlowTerminal
        renderSystemHeader={renderSystemHeader}
        onReturnToCore={onReturnToCore}
        {...cardLockProps}
        guideAssets={guideAssets}
        onSelectAssessment={(id) => handleModuleCardAction(id)}
      />
    );
  }

  // SYSTEM FRAME G: Dedicated Athlete Precision Workspace
  if (viewState === 'athlete_precision') {
    // Intercept initialize actions → deep athlete precision assessment portals
    const handleAthleteModuleAction = (id) => {
      tryInitializeAssessment(id, () => {
        // Neck Mobility Matrix → cervical instruction portal
        if (id === 'ap_neck') {
          setActiveAthleteModule('ap_cervical');
          return;
        }
        if (
          id === 'ap_overhead' ||
          id === 'ap_single' ||
          id === 'ap_spinal' ||
          id === 'ap_shoulder' ||
          id === 'ap_cervical'
        ) {
          setActiveAthleteModule(id);
        }
      });
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    OVERHEAD BILATERAL SQUAT ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// SYMMETRY_ANALYSIS</span>
              </div>

              {/* CLEAN DUAL-COLUMN HIGH-ART RECORDING SYSTEM */}
              <AssessmentBlueprintSplit
                moduleId="ap_overhead"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="ap_overhead"
                fallbackExecution={`Raise your arms directly overhead, holding a PVC pipe, dowel rod, or light straight line bar vector with elbows locked out crisp. Keep your chest up high and squat downward as low as your anatomy allows. Press your weight evenly through both feet, holding the absolute base threshold stable for 2 seconds before pushing upright.`}
                fallbackAlignment={`Set your recording device perfectly at mid-torso height, positioned 8 feet out directly facing your front center profile (full frontal view capture). Your hands, shoulders, knees, and feet must stay completely tracked inside the capture envelope at all times.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    DYNAMIC SINGLE-LEG SQUAT ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">// BILATERAL_SYMMETRY</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="ap_single"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="ap_single"
                fallbackExecution={`Balance firmly on your target tracking leg, raising your opposite foot cleanly off the floor surface. Extend your arms out forward for balance, descend smoothly to your maximum comfortable single-leg depth, and push straight back up to complete the rep vector.`}
                fallbackAlignment={`Set up your video recording device exactly at knee height, standing 7 to 8 feet away directly facing the front center profile line (full frontal view capture). Keep your entire frame from base to shoulders tracked.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SINGLE LEG HOLD STABILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                  // CORE_STABILIZER_MATRIX
                </span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="ap_hold"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="ap_hold"
                fallbackExecution={`Lift one foot cleanly off the floor, keeping your standing support leg straight with your hands placed firmly on your hip crest lines. Maintain this frozen posture perfectly still for 20 continuous seconds, tracking balance micro-corrections.`}
                fallbackAlignment={`Position your device camera exactly at waist height, standing 6 feet away directly facing the front path vector (full frontal view capture). Frame both hip points and feet clearly.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Cervical / Neck Mobility Assessment
    // =========================================================================
    if (activeAthleteModule === 'ap_cervical') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // NECK_MOBILITY_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    NECK MOBILITY MATRIX
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-amber-400 font-bold uppercase">
                  // CERVICAL_ARC_TELEMETRY
                </span>
              </div>
              <AssessmentBlueprintSplit
                moduleId="ap_cervical"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="ap_cervical"
                fallbackExecution={`Capture side-profile neck flexion, extension, and chin-to-shoulder rotations. Frame ear-to-shoulder landmarks against a plain backdrop for clean cervical angle indexing.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Multi-Plane Spinal Articulation
    // =========================================================================
    if (activeAthleteModule === 'ap_spinal') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // SPINAL_ARTICULATION_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    MULTI-PLANE SPINAL ARTICULATION // BACK MOBILITY
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-amber-400 font-bold uppercase">
                  // SEGMENTAL_EXTENSION_GRID
                </span>
              </div>
              <AssessmentBlueprintSplit
                moduleId="ap_spinal"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="ap_spinal"
                fallbackExecution={`Capture standing and prone spinal articulation packs. Track segmental vertebral extension without forcing the lumbar spine to overcompensate for a locked thoracic cage.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Shoulder Girdle Telemetry
    // =========================================================================
    if (activeAthleteModule === 'ap_shoulder') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // SHOULDER_GIRDLE_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SHOULDER GIRDLE TELEMETRY
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-amber-400 font-bold uppercase">
                  // SCAPULAR_CLEARANCE_GRID
                </span>
              </div>
              <AssessmentBlueprintSplit
                moduleId="ap_shoulder"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="ap_shoulder"
                fallbackExecution={`Frame both shoulders and upper torso. Capture controlled elevation, reach, and scapular upward rotation bilaterally for girdle symmetry telemetry.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // Wide split-screen Athlete Precision clinical evaluation sub-terminal
    return (
      <AthletePrecisionTerminal
        renderSystemHeader={renderSystemHeader}
        onReturnToCore={onReturnToCore}
        {...cardLockProps}
        onSelectAssessment={(id) => handleAthleteModuleAction(id)}
      />
    );
  }

  // SYSTEM FRAME H: Unified Kinetic Power Integrity Combat Track Workspace
  if (viewState === 'kinetic_power') {
    // Intercept initialize actions → deep combat assessment portals
    const handleCombatModuleAction = (id) => {
      tryInitializeAssessment(id, () => {
        // Striking punch/kick analysis reuses the shadow-box instruction portal
        if (id === 'kp_strike') {
          setActiveCombatModule('kp_boxing');
          return;
        }
        if (
          id === 'kp_boxing' ||
          id === 'kp_bound' ||
          id === 'kp_stance' ||
          id === 'kp_spinal' ||
          id === 'kp_neck' ||
          id === 'kp_overhead' ||
          id === 'kp_shoulder'
        ) {
          setActiveCombatModule(id);
        }
      });
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    STRIKING PUNCH / KICK VECTOR ANALYSIS
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-rose-400 font-bold uppercase">// ENERGY_TRANSFER</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="kp_boxing"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="kp_boxing"
                fallbackExecution={`Square up into your fighting stance. Fire 3 maximum-velocity rear-hand cross punches or heavy lead hooks into shadow boxing space. Exaggerate your heel-pivoting drive and hip snap, freezing the peak extension line perfectly stable for 1 full second on the final repetition.`}
                fallbackAlignment={`Set up your device camera exactly at chest height, standing 7 to 8 feet away directly facing your front center-line vector (full frontal view capture). Your entire frame from your tracking feet up to the punch arc path must stay tracked.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 2: LATERAL SINGLE-LEG BOUND AND HOLD
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-amber-400 font-bold uppercase">// LIGAMENT_PROTECTION</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="kp_bound"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="kp_bound"
                fallbackExecution={`Bound sideways explosively into the tracking frame, landing firmly on your outside tracking leg. Drop deeply into your hips to absorb the incoming force vectors and stick the landing like a statue. Hold that frozen single-leg base completely stable for 3 full seconds without resetting.`}
                fallbackAlignment={`Position your camera device exactly at knee height, standing 8 feet away directly facing your jumping trajectory path (full frontal view capture). Make sure the full width of your lateral bound track stays within the workspace boundary.`}
              />
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
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    FIGHT STANCE STABILITY
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// WEIGHT_DISTRIBUTION</span>
              </div>

              <AssessmentBlueprintSplit
                moduleId="kp_stance"
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName="kp_stance"
                fallbackExecution={`Sink down deep into your maximum functional low combat stance or grappling base. Hold that exact center-of-mass depth perfectly stable for 10 full seconds without creeping or rising up, maintaining a crisp high defensive guard line throughout the entire duration.`}
                fallbackAlignment={`Position your phone camera device exactly at pelvic crest height, centered 7 to 8 feet away directly facing the front center-line layout (full frontal view capture). Frame both feet and knees clearly within the active scanning plane.`}
              />
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // COMBAT SUITE: Spinal / Neck / Overhead / Shoulder instruction portals
    // =========================================================================
    if (
      activeCombatModule === 'kp_spinal' ||
      activeCombatModule === 'kp_neck' ||
      activeCombatModule === 'kp_overhead' ||
      activeCombatModule === 'kp_shoulder'
    ) {
      const combatStubMeta = {
        kp_spinal: {
          header: 'KINETIC_POWER // SPINAL_ARTICULATION_MATRIX',
          title: 'MULTI-PLANE SPINAL ARTICULATION // BACK MOBILITY',
          tag: '// SEGMENTAL_EXTENSION_GRID',
          panelKey: 'kp_spinal',
          blurb:
            'Capture standing and prone spinal articulation packs. Track segmental vertebral extension without forcing the lumbar spine to overcompensate for a locked thoracic cage.',
        },
        kp_neck: {
          header: 'KINETIC_POWER // NECK_MOBILITY_MATRIX',
          title: 'NECK MOBILITY MATRIX',
          tag: '// IMPACT_ABSORPTION_GRID',
          panelKey: 'kp_neck',
          blurb:
            'Capture side-profile neck flexion, extension, and chin-to-shoulder rotations under combat-ready torso bracing. Frame ear-to-shoulder landmarks for cervical angle indexing.',
        },
        kp_overhead: {
          header: 'KINETIC_POWER // OVERHEAD_DEEP_SQUAT_MATRIX',
          title: 'DEEP SQUAT WITH OVERHEAD BAR',
          tag: '// SYMMETRY_LOCKOUT_GRID',
          panelKey: 'kp_overhead',
          blurb:
            'Hold an overhead bar lockout and descend into controlled deep squat depth. Frame hands, torso, hips, and ankles for multi-segmental kinetic synchronization telemetry.',
        },
        kp_shoulder: {
          header: 'KINETIC_POWER // SHOULDER_GIRDLE_MATRIX',
          title: 'SHOULDER GIRDLE TELEMETRY',
          tag: '// TERMINAL_SNAP_CLEARANCE',
          panelKey: 'kp_shoulder',
          blurb:
            'Frame both shoulders and upper torso. Capture elevation, reach, and scapular upward rotation bilaterally for girdle symmetry and strike-snap clearance.',
        },
      }[activeCombatModule];

      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader(combatStubMeta.header)}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    {combatStubMeta.title}
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-indigo-400 font-bold uppercase">
                  {combatStubMeta.tag}
                </span>
              </div>
              <AssessmentBlueprintSplit
                moduleId={combatStubMeta.panelKey}
                guideAssets={guideAssets}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                athleteCode={athleteCode}
                athleteName={athleteName}
                trackName={combatStubMeta.panelKey}
                fallbackExecution={combatStubMeta.blurb}
              />
            </div>
          </div>
        </div>
      );
    }

    // Wide split-screen Kinetic Power clinical evaluation sub-terminal
    return (
      <KineticPowerTerminal
        renderSystemHeader={renderSystemHeader}
        onReturnToCore={onReturnToCore}
        {...cardLockProps}
        onSelectAssessment={(id) => handleCombatModuleAction(id)}
      />
    );
  }


  return null;
}
