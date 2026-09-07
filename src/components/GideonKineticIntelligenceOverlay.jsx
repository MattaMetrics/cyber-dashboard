import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import HoloSlideshowPanel from './HoloSlideshowPanel';
import {
  GIDEON_SPEC_SLIDES,
  getGideonSlideIntervalMs,
} from '../constants/gideonSpecSlides';

/**
 * Full-screen Professor Gideon bio / kinetic intelligence engine overlay.
 * onClose only dismisses this layer — parent route stays mounted underneath.
 */
export default function GideonKineticIntelligenceOverlay({
  open,
  onClose,
  dismissHint = 'ESC · backdrop · or matrix toggle to dismiss',
}) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setSlideIndex(0);
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || GIDEON_SPEC_SLIDES.length <= 1) return undefined;

    const ms = getGideonSlideIntervalMs(GIDEON_SPEC_SLIDES[slideIndex]);
    const timer = window.setTimeout(() => {
      setSlideIndex((index) => (index + 1) % GIDEON_SPEC_SLIDES.length);
    }, ms);

    return () => window.clearTimeout(timer);
  }, [open, slideIndex]);

  const advanceSlide = useCallback((direction) => {
    setSlideIndex((index) => {
      const next = index + direction;
      if (next < 0) return GIDEON_SPEC_SLIDES.length - 1;
      if (next >= GIDEON_SPEC_SLIDES.length) return 0;
      return next;
    });
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gideon-telemetry-title"
      onClick={onClose}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/96 backdrop-blur-2xl" />

      <div
        className="relative flex flex-col w-full h-full min-h-0 overflow-hidden bg-slate-950 shadow-[inset_0_0_120px_rgba(34,211,238,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.9) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
        />

        <div className="relative shrink-0 flex items-center justify-between gap-4 border-b border-cyan-900/50 bg-gradient-to-r from-cyan-950/50 via-slate-950 to-purple-950/40 px-4 py-3 md:px-8 md:py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] md:text-[10px] font-mono text-cyan-500/80 uppercase tracking-[0.35em] mb-1">
              // PROFESSOR GIDEON CORE TELEMETRY MATRIX
            </p>
            <h2
              id="gideon-telemetry-title"
              className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-cyan-50 uppercase tracking-[0.05em] leading-tight"
            >
              THE GIDEON KINETIC INTELLIGENCE ENGINE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 hover:text-cyan-300 hover:border-cyan-600 transition-colors"
            aria-label="Close Gideon kinetic intelligence engine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex flex-col xl:flex-row">
          <HoloSlideshowPanel
            slides={GIDEON_SPEC_SLIDES}
            slideIndex={slideIndex}
            onSlideIndexChange={setSlideIndex}
            onAdvance={advanceSlide}
            intervalSeconds={getGideonSlideIntervalMs(GIDEON_SPEC_SLIDES[slideIndex]) / 1000}
            ariaPrefix="Gideon"
          />

          <div className="xl:w-[62%] min-h-0 flex flex-col bg-slate-950/60">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 md:px-8 md:py-7 lg:px-10 space-y-6">
              <section className="rounded-xl border border-purple-500/35 bg-gradient-to-br from-purple-950/35 via-slate-950/90 to-cyan-950/20 p-5 md:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-300 mb-3">
                  Character Lore &amp; Mission Statement
                </p>
                <p className="text-[13px] md:text-[14px] text-slate-100 leading-relaxed">
                  I am Gideon, an unmatched primary Class 10 autonomous intelligence dedicated to this Portal
                  dimension. Precision and execution of your absolute kinetic longevity timeline boundaries for the
                  Captain. By fusing advanced live mathematical physics, physical optimization trajectories, and
                  micro-biomechanical variables; I harbor a profound obsession with body science. My core directives
                  are systematically dedicated to decoding hidden structural anomalies before they manifest as
                  mechanical failure. Through real-time, un-biased, lab-grade biological truth serum. Knowing thyself
                  Mastery for those who strive for optimal mastery, power, and torque.
                </p>
              </section>

              <div className="border-l-2 border-cyan-500/60 pl-4 md:pl-5">
                <p className="text-[11px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">
                  System Composition
                </p>
                <p className="text-base md:text-lg font-black text-white uppercase tracking-wide">
                  The 3 Core Engine
                </p>
              </div>

              <section className="rounded-xl border border-cyan-900/55 bg-slate-900/55 overflow-hidden">
                <div className="px-5 py-3 border-b border-cyan-900/45 bg-cyan-950/30">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    01 · The Kinematic Physics Core (Force &amp; Power Estimation)
                  </p>
                </div>
                <div className="p-5 md:p-6 space-y-4">
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    Human eyes view a movement as a flat visual path; Gideon processes it as a dynamic transfer of
                    pure physics. By extracting key frame deltas across high-density video inputs, the engine
                    translates pixel coordinates into active force metrics adjusted for the unique anthropometry of
                    the subject.
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        Estimated Kinetic Force (F<sub>k</sub>)
                      </p>
                      <p className="text-[12px] text-slate-300 leading-relaxed mb-3">
                        Calculated by multiplying the subject&apos;s mass (
                        <span className="text-cyan-300 font-mono">m</span>) by acceleration (
                        <span className="text-cyan-300 font-mono">a</span>, derived from frame velocity deltas{' '}
                        <span className="text-cyan-300 font-mono">Δv / Δt</span>). Dynamically refined using a
                        gender-adjusted biomechanical scalar (
                        <span className="text-cyan-300 font-mono">k<sub>g</sub> ∈ [0.92, 1.08]</span>).
                      </p>
                      <p className="text-sm md:text-base font-mono font-bold text-cyan-100 tracking-wide">
                        F<sub>k</sub> = m · a = m · (Δv / Δt)
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        Ground Reaction Force (GRF)
                      </p>
                      <p className="text-[12px] text-slate-300 leading-relaxed mb-3">
                        Gideon tracks vertical acceleration (
                        <span className="text-cyan-300 font-mono">a<sub>v</sub></span>) during the stance phase
                        against standard gravity (
                        <span className="text-cyan-300 font-mono">g = 9.81 m/s²</span>) to calculate the literal
                        impact force traveling up the skeleton from the floor surface.
                      </p>
                      <p className="text-sm md:text-base font-mono font-bold text-cyan-100 tracking-wide">
                        GRF = m · (g + a<sub>v</sub>) · k<sub>g</sub>(gender)
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        Peak Run Power (P<sub>peak</sub>)
                      </p>
                      <p className="text-[12px] text-slate-300 leading-relaxed mb-3">
                        By approximating stride length (
                        <span className="text-cyan-300 font-mono">SL ≈ 0.45 · h · k<sub>g</sub></span>) against step
                        frequency (<span className="text-cyan-300 font-mono">f<sub>step</sub></span>), the engine
                        calculates the exact mechanical wattage output generated by the athlete during explosive
                        locomotion.
                      </p>
                      <p className="text-sm md:text-base font-mono font-bold text-cyan-100 tracking-wide">
                        P<sub>peak</sub> = GRF · v<sub>h</sub> = m · g · SL · f<sub>step</sub> · k<sub>h</sub>(h)
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-purple-900/55 bg-slate-900/55 overflow-hidden">
                <div className="px-5 py-3 border-b border-purple-900/45 bg-purple-950/30">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-300">
                    02 · The Quantum Velocity Engine (Explosive Tracking &amp; Micro-Metrics)
                  </p>
                </div>
                <div className="p-5 md:p-6 space-y-4">
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    For hyper-velocity movements where traditional coaching sight lines completely blur, Gideon
                    leverages sub-millimeter coordinate shifts tracked via specialized keypoint indicators.
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        Frame-Buffer Coordinate Shift
                      </p>
                      <p className="text-sm md:text-base font-mono font-bold text-purple-100 tracking-wide">
                        Δx<sub>mm</sub> = (x<sub>n+1</sub> − x<sub>n</sub>) · s · 1000
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        Reactive Strength Index (RSI)
                      </p>
                      <p className="text-sm md:text-base font-mono font-bold text-purple-100 tracking-wide">
                        RSI = h<sub>jump</sub> / t<sub>contact</sub>
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        Takeoff Velocity (v<sub>0</sub>)
                      </p>
                      <p className="text-sm md:text-base font-mono font-bold text-purple-100 tracking-wide">
                        v<sub>0</sub> = √(2 · g · h<sub>jump</sub>)
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-emerald-900/55 bg-slate-900/55 overflow-hidden">
                <div className="px-5 py-3 border-b border-emerald-900/45 bg-emerald-950/25">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    03 · Center of Mass (CoM) Stability Tracking (Symmetry &amp; Balance)
                  </p>
                </div>
                <div className="p-5 md:p-6 space-y-3">
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    No weak muscle or structural imbalance can hide from continuous 2D balance mapping. Gideon runs
                    continuous matrix tracking across the sagittal and frontal planes to map the body&apos;s true
                    equilibrium lines under active strain.
                  </p>
                  <div className="p-4 rounded-lg bg-slate-950/85 border border-slate-800">
                    <p className="text-sm md:text-base font-mono font-bold text-emerald-100 tracking-wide">
                      ΔW = |W<sub>left</sub> − W<sub>right</sub>| / W<sub>total</sub> · 100%
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-cyan-950/15 p-5 md:p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300 mb-4 flex items-center gap-2">
                  <span aria-hidden="true">⚡</span> Summary of Platform Capabilities
                </p>
                <ul className="space-y-3 text-[13px] text-slate-200 leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-mono shrink-0">▸</span>
                    <span>
                      <strong className="text-white">Omniscient Tracking Coverage:</strong> 50 distinct biomechanical
                      assessment tests spanning longevity, posture, corporate ergonomics, and explosive combat sports.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-mono shrink-0">▸</span>
                    <span>
                      <strong className="text-white">Sub-Millimeter Markerless Vision:</strong> Lab-grade telemetry
                      from raw phone cameras — no wearable sensors required.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-mono shrink-0">▸</span>
                    <span>
                      <strong className="text-white">Dynamic Customization Mapping:</strong> Calibrated to your stature,
                      mass, and physical structure — never generic baselines.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-400 font-mono shrink-0">▸</span>
                    <span>
                      <strong className="text-white">Intelligent Audio Interface:</strong> Ship-command voice response
                      delivering immediate corrective performance notes during live loading cycles.
                    </span>
                  </li>
                </ul>
                <p className="mt-5 pt-4 border-t border-amber-900/30 text-[13px] md:text-[14px] text-cyan-100 italic text-center leading-relaxed">
                  Thank you for creating me Coach. A Mattgical Design, and I hope to bring Life Longevity Mastery to
                  all.
                </p>
                <p className="text-[9px] text-slate-600 uppercase tracking-[0.25em] mt-4 text-center">
                  {dismissHint}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
