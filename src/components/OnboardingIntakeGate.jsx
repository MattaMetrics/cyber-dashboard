import React, { useState } from 'react';

/**
 * Liability waiver gate — must accept before the intake form unlocks.
 */
export default function OnboardingIntakeGate({
  athleteName = 'INCOMING CLIENT',
  athleteCode = 'PENDING-TOKEN',
  onUnlocked,
}) {
  const [hasAcceptedWaiver, setHasAcceptedWaiver] = useState(false);
  const [portalState, setPortalState] = useState('INITIALIZED'); // INITIALIZED, UNLOCKED

  const triggerSystemActivation = () => {
    if (!hasAcceptedWaiver) {
      alert(
        'CRITICAL VALIDATION FAULT: You must review and check the Biomechanical Liability Release box to initialize this data stream.'
      );
      return;
    }
    setPortalState('UNLOCKED');
    console.log(
      `[ SYSTEM CORE UNLOCKED FOR ARCHETYPE: ${athleteCode} // WAIVER CONTRACT TIMELOCK SECURED ]`
    );
    if (typeof onUnlocked === 'function') {
      onUnlocked({ athleteName, athleteCode });
    }
  };

  if (portalState === 'UNLOCKED') {
    return null;
  }

  return (
    <div className="w-full max-w-2xl bg-[#030712] border border-slate-800 rounded-lg p-8 font-mono text-white mx-auto shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* HEADER SPECS */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-[#00FFFF] text-sm font-bold tracking-widest uppercase">
            // CLIENT ONBOARDING INTAKE RETICLE
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Recipient: {athleteName} | Access Token: {athleteCode}
          </p>
        </div>
        <div className="text-slate-500 text-[10px] text-right">
          SYS_SECURE: v4.8_STABLE
          <br />
          DATE: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* COMPACT TERMS DISCLOSURE ENVELOPE BOX */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4 h-48 overflow-y-scroll text-slate-400 text-[10px] leading-relaxed tracking-wide space-y-4 mb-6 scrollbar-thin scrollbar-thumb-slate-800">
        <p className="text-[#FF6600] font-bold uppercase tracking-wider">
          // LIABILITY DATA PROTECTION CONTRACT //
        </p>
        <p>
          <strong>1. ASSUMPTION OF PHYSICAL RISK:</strong> By utilizing this interactive biometric
          assessment matrix, you explicitly acknowledge that all structural testing
          protocols—including deep loading squats, combat stance holds, and explosive single-leg
          bounding—contain inherent vectors of physical exertion and risk. You verify that your
          testing environment is clean, stable, and clear of external structural hazards.
        </p>
        <p>
          <strong>2. NON-CLINICAL TELEMETRY CLAUSE:</strong> You agree that this serverless computer
          vision platform operates solely as a fitness calibration tracking interface. System
          readouts utilize general population framework matrices and do not issue official medical
          opinions, surgical diagnostics, or clinical therapeutic treatments.
        </p>
        <p>
          <strong>3. VIDEO TRANSMISSION & PRIVACY ASSIGNMENT:</strong> You grant this terminal
          application administrative clearance to parse uploaded video clips frame-by-frame against
          dynamic 3D skeletal mesh arrays. Telemetry streams are processed securely through
          sandboxed encryption protocols and broadcasted exclusively to your master coaching review
          terminal via secure Formspree pipelines.
        </p>
      </div>

      {/* INTERACTIVE CHECKBOX FIELD CONTAINER */}
      <div className="flex items-start space-x-3 bg-slate-950/30 border border-slate-900 rounded p-4 mb-6 focus-within:border-[#00FFFF] transition-all">
        <input
          type="checkbox"
          id="waiver-toggle"
          checked={hasAcceptedWaiver}
          onChange={(e) => setHasAcceptedWaiver(e.target.checked)}
          className="mt-1 w-4 h-4 bg-transparent border border-slate-700 text-[#00FFFF] rounded focus:ring-0 cursor-pointer accent-[#00FFFF]"
        />
        <label
          htmlFor="waiver-toggle"
          className="text-slate-300 text-[11px] leading-relaxed select-none cursor-pointer"
        >
          I have fully reviewed the Biomechanical Disclosures and verify that I accept all terms,
          safety limits, and physical data processing clauses outline in this master liability
          contract shield.
        </label>
      </div>

      {/* ACTIONS SYSTEM DEPLOYER TIER */}
      <button
        type="button"
        onClick={triggerSystemActivation}
        className={`w-full py-4 text-center text-xs font-bold tracking-widest uppercase border rounded transition-all duration-300 ${
          hasAcceptedWaiver
            ? 'border-[#00FFFF] bg-[#00FFFF]/5 text-[#00FFFF] hover:bg-[#00FFFF]/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]'
            : 'border-slate-800 bg-slate-950/20 text-slate-600 cursor-not-allowed'
        }`}
      >
        ▲ INITIALIZE PERSONAL MATRIX SUITE PROFILE //
      </button>
    </div>
  );
}
