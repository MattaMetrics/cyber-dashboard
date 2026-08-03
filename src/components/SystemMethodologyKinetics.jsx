import React from 'react';

/**
 * 🟢 METHODOLOGY DISCLOSURE SHEET
 * Screen key: VIEW_SYSTEM_METHODOLOGY_KINETICS
 */
export default function SystemMethodologyKinetics({ setCurrentScreen }) {
  return (
    <div className="w-full min-h-screen bg-[#030712] p-8 md:p-12 font-mono text-white text-left selection:bg-[#00FFFF]/30">
      {/* HEADER TIER CONTROLS */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-12">
        <h1 className="text-white text-sm font-bold tracking-widest uppercase">
          // LONGEVITY LABORATORY GLOBAL MASTER INDEX //
        </h1>
        <button
          type="button"
          onClick={() => setCurrentScreen('COACH_DASHBOARD_HOME')}
          className="border border-slate-800 hover:border-[#00FFFF] bg-slate-900/40 hover:bg-[#00FFFF]/10 text-slate-400 hover:text-[#00FFFF] text-[9px] tracking-widest font-bold uppercase px-4 py-3 rounded transition-all duration-300"
        >
          [ ESC // RETURN TO DASHBOARD HOME ]
        </button>
      </div>

      {/* TWO-COLUMN CORE THEORY GRID CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* CARD COLUMN 1: CHRONIC COMPENSATION */}
        <div className="border border-slate-900 bg-slate-950/40 backdrop-blur-sm rounded-lg p-8">
          <h2 className="text-[#00FFFF] text-xs font-bold tracking-widest uppercase mb-4">
            // THE BIOMECHANICAL LAWS OF CHRONIC COMPENSATION
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed tracking-normal mb-6">
            Movement is a chain reaction. When one joint underperforms, neighboring
            segments absorb the shock wave and redistribute load across the kinetic
            sequence. What begins as a local restriction quickly becomes a global
            compensation pattern—quiet, adaptive, and dangerously efficient at hiding
            the true source of failure.
          </p>
          <p className="text-slate-300 text-xs leading-relaxed tracking-normal mb-6">
            Our laboratory tracks these kinetic leaks in millimeter resolution: where
            force should travel, where it currently escapes, and which micro-collapses
            are stealing stability before pain announces itself. By exposing the
            chain&apos;s weak links early, we interrupt the chronic compensation loop
            before it calcifies into permanent structural limitation.
          </p>
          <span className="text-[#FF6600] text-[10px] font-bold tracking-wider uppercase block">
            // LAW: SYMPTOMS MIGRATE - ROOT VECTORS DO NOT
          </span>
        </div>

        {/* CARD COLUMN 2: SKELETAL INFERENCE */}
        <div className="border border-slate-900 bg-slate-950/40 backdrop-blur-sm rounded-lg p-8">
          <h2 className="text-[#FFCC00] text-xs font-bold tracking-widest uppercase mb-4">
            // CONTEXTUAL SKELETAL INFERENCE AND PREVENTATIVE DURABILITY
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed tracking-normal mb-6">
            When a joint disappears behind the body or exits the camera frame,
            deep-learning Contextual Skeletal Inference reconstructs its hidden
            coordinate path from surrounding limb telemetry. Pixel motion becomes
            physics: acceleration, joint trajectories, and Center of Mass (CoM) drift
            trends mapped frame-by-frame.
          </p>
          <p className="text-slate-300 text-xs leading-relaxed tracking-normal mb-6">
            That predictive layer is how we insulate athletes and desk-bound systems
            against structural calcification. Micro-instabilities and CoM oscillations
            surface long before they harden into chronic restriction—turning
            preventative durability into a measurable, deployable shield rather than a
            hopeful guess.
          </p>
          <span className="text-[#00FF66] text-[10px] font-bold tracking-wider uppercase block">
            // PROTOCOL: PREDICT HIDDEN PATHS // LOCK FUTURE RANGE
          </span>
        </div>
      </div>

      {/* LOWER TIER ROW: CORE MISSION MANIFESTO CONTAINER */}
      <div className="border border-slate-900 bg-slate-950/40 backdrop-blur-sm rounded-lg p-8">
        <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">
          // PLATFORM CORE MISSION & TELEMETRY MANIFESTO //
        </h2>
        <p className="text-slate-400 text-[11px] leading-relaxed tracking-wide">
          The core mission of our platform is to democratize elite sports science and
          advanced ergonomics, unlocking pain-free physical longevity for everyday
          individuals, corporate professionals, and elite competitors alike. Our
          markerless movement system transforms multi-dimensional physics data by
          performing millions of matrix calculations every single second
          non-intrusively without requiring physical sensors. Every scan automatically
          adapts to individual anthropometry, isolating trapped structural paths and
          hidden left-to-right micro-instabilities frame by frame operating within an
          entirely secure encrypted terminal framework. By translating raw pixel
          acceleration into precise kinetic blueprints we can decode the analytic
          measurements matched with 2 decades of in person coaching youth / adults to
          deliver digital documentation to catch silent muscle compensations in your
          system. We bridge the gap between Olympic training diagnostics for
          professional athletes to bring you optimal, precise, actionable insights
          needed to confidently reclaim, recalibrate, upgrade, know your physical
          longevity blueprint.
        </p>
      </div>
    </div>
  );
}
