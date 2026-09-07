import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import HoloSlideshowPanel from './HoloSlideshowPanel';
import MethodologyCyberSphere from './MethodologyCyberSphere';
import GideonKineticIntelligenceOverlay from './GideonKineticIntelligenceOverlay';
import SystemLegalPolicyOverlay from './SystemLegalPolicyOverlay';
import { buildMethodologySlides } from '../utils/methodologyAssetUrl';

const METHODOLOGY_SLIDE_INTERVAL_MS = 5500;
const METHODOLOGY_DISMISS_HINT = 'ESC · X · returns to Methodology & Kinetic Research';

/**
 * View System Methodology & Kinetic Research — home sidebar route
 * Screen key: VIEW_SYSTEM_METHODOLOGY_KINETICS
 * Layout mirrors the Gideon Kinetic Intelligence Engine full-screen cybercard dashboard.
 */
export default function ViewSystemMethodologyKinetics({ onNavigate, setCurrentScreen }) {
  const methodologySlides = useMemo(() => buildMethodologySlides(), []);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGideonBio, setShowGideonBio] = useState(false);
  const [showLegalPolicy, setShowLegalPolicy] = useState(false);

  const navigate = onNavigate || setCurrentScreen;

  const goHome = () => {
    navigate?.('CLIENT_PORTAL_LANDING_HOME');
  };

  useEffect(() => {
    if (methodologySlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % methodologySlides.length);
    }, METHODOLOGY_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [methodologySlides.length]);

  const advanceSlide = useCallback(
    (direction) => {
      setSlideIndex((index) => {
        const next = index + direction;
        if (next < 0) return methodologySlides.length - 1;
        if (next >= methodologySlides.length) return 0;
        return next;
      });
    },
    [methodologySlides.length]
  );

  return (
    <div className="relative w-full h-screen min-h-0 flex flex-col overflow-hidden bg-slate-950 font-mono text-white animate-fade-in">
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

      {/* Header strip */}
      <div className="relative shrink-0 flex items-center justify-between gap-4 border-b border-cyan-900/50 bg-gradient-to-r from-cyan-950/50 via-slate-950 to-purple-950/40 px-4 py-3 md:px-8 md:py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] md:text-[10px] font-mono text-cyan-500/80 uppercase tracking-[0.35em] mb-1">
            // LONGEVITY LABORATORY GLOBAL MASTER INDEX
          </p>
          <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-cyan-50 uppercase tracking-[0.05em] leading-tight">
            Longevity Lab System Methodology &amp; Kinetic Research
          </h1>
        </div>
        <button
          type="button"
          onClick={goHome}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 hover:text-cyan-300 hover:border-cyan-600 transition-colors text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
          aria-label="Return to home portal"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">[ ESC // RETURN TO HOME ]</span>
          <span className="sm:hidden">HOME</span>
        </button>
      </div>

      {/* Full-screen two-column body */}
      <div className="relative flex-1 min-h-0 flex flex-col xl:flex-row">
        <HoloSlideshowPanel
          slides={methodologySlides}
          slideIndex={slideIndex}
          onSlideIndexChange={setSlideIndex}
          onAdvance={advanceSlide}
          intervalSeconds={METHODOLOGY_SLIDE_INTERVAL_MS / 1000}
          ariaPrefix="Methodology"
          emptyFallback={
            <div className="flex flex-col items-center gap-4 text-center p-4">
              <MethodologyCyberSphere size="lg" />
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest">
                Visual Uplink Pending
              </p>
              <p className="text-[9px] text-slate-500 max-w-xs leading-relaxed">
                Drop PNG or WebP files into{' '}
                <span className="text-cyan-600">src/assets/methodology/</span> to populate this holo
                carousel.
              </p>
            </div>
          }
          renderSlideFallback={() => (
            <div className="flex flex-col items-center gap-4 text-center">
              <MethodologyCyberSphere size="md" />
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                Awaiting slide asset
              </p>
            </div>
          )}
        />

        {/* Right — scrollable research brief (~62%) */}
        <div className="xl:w-[62%] min-h-0 flex flex-col bg-slate-950/60">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 md:px-8 md:py-7 lg:px-10 space-y-6">
            {/* Section 01 */}
            <section className="rounded-xl border border-cyan-900/55 bg-slate-900/55 overflow-hidden">
              <div className="px-5 py-3 border-b border-cyan-900/45 bg-cyan-950/30">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                  01 · The Biomechanical Laws of Chronic Compensation
                </p>
              </div>
              <div className="p-5 md:p-6 space-y-4">
                <div className="space-y-4 text-[13px] text-slate-300 leading-relaxed">
                  <p>
                    Movement is a chain reaction. When one joint underperforms, neighboring segments absorb
                    the shock wave and redistribute load across the kinetic sequence. What begins as a local
                    restriction quickly becomes a global compensation pattern—quiet, adaptive, and dangerously
                    efficient at hiding the true source of failure.
                  </p>
                  <p>
                    Our laboratory tracks these kinetic leaks in millimeter resolution: where force should
                    travel, where it currently escapes, and which micro-collapses are stealing stability before
                    pain announces itself. By exposing the chain&apos;s weak links early, we interrupt the
                    chronic compensation loop before it calcifies into permanent structural limitation.
                  </p>
                </div>
                <div className="pt-3 border-t border-cyan-900/40">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-400">
                    // LAW: SYMPTOMS MIGRATE — ROOT VECTORS DO NOT
                  </p>
                </div>
              </div>
            </section>

            {/* Section 02 */}
            <section className="rounded-xl border border-purple-900/55 bg-slate-900/55 overflow-hidden">
              <div className="px-5 py-3 border-b border-purple-900/45 bg-purple-950/30">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-300">
                  02 · Contextual Skeletal Inference &amp; Preventative Durability
                </p>
              </div>
              <div className="p-5 md:p-6 space-y-4">
                <div className="space-y-4 text-[13px] text-slate-300 leading-relaxed">
                  <p>
                    When a joint disappears behind the body or exits the camera frame, deep-learning
                    Contextual Skeletal Inference reconstructs its hidden coordinate path from surrounding
                    limb telemetry. Pixel motion becomes physics: acceleration, joint trajectories, and
                    Center of Mass (CoM) drift trends mapped frame-by-frame.
                  </p>
                  <p>
                    That predictive layer is how we insulate athletes and desk-bound systems against
                    structural calcification. Micro-instabilities and CoM oscillations surface long before
                    they harden into chronic restriction—turning preventative durability into a measurable,
                    deployable shield rather than a hopeful guess.
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-900/40">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
                    // PROTOCOL: PREDICT HIDDEN PATHS // LOCK FUTURE RANGE
                  </p>
                </div>
              </div>
            </section>

            {/* Section 03 — Manifesto */}
            <section className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-cyan-950/15 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-900/35 bg-amber-950/20">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
                  03 · Platform Core Mission &amp; Telemetry Manifesto
                </p>
              </div>
              <div className="p-5 md:p-6">
                <p className="text-[13px] md:text-[14px] text-slate-200 leading-relaxed">
                  The core mission of our platform is to democratize elite sports science and advanced
                  ergonomics, unlocking pain-free physical longevity for everyday individuals, corporate
                  professionals, and elite competitors alike. Our markerless movement system transforms
                  multi-dimensional physics data by performing millions of matrix calculations every single
                  second non-intrusively without requiring physical sensors. Every scan automatically adapts
                  to individual anthropometry, isolating trapped structural paths and hidden left-to-right
                  micro-instabilities frame by frame operating within an entirely secure encrypted terminal
                  framework. By translating raw pixel acceleration into precise kinetic blueprints we can
                  decode the analytic measurements matched with 2 decades of in person coaching youth / adults
                  to deliver digital documentation to catch silent muscle compensations in your system. We
                  bridge the gap between Olympic training diagnostics for professional athletes to bring you
                  optimal, precise, actionable insights needed to confidently reclaim, recalibrate, upgrade,
                  know your physical longevity blueprint.
                </p>
                <p className="text-[9px] text-slate-600 uppercase tracking-[0.25em] mt-5 text-center">
                  scroll for full research brief · footer links below
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer navigation strip */}
      <div className="relative shrink-0 border-t border-cyan-900/50 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-purple-950/25 px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={() => setShowLegalPolicy(true)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/70 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 hover:text-orange-400 hover:border-orange-700/60 transition-colors"
          >
            [ ⚖ VIEW SYSTEM LEGAL POLICY // ]
          </button>
          <button
            type="button"
            onClick={() => setShowGideonBio(true)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/70 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 hover:text-cyan-300 hover:border-cyan-600 transition-colors"
          >
            [ PROFESSOR GIDEON // ]
          </button>
        </div>
        <p className="text-[8px] text-slate-600 uppercase tracking-[0.3em] text-center mt-2">
          LONGEVITY LAB · SYSTEM METHODOLOGY FOOTER NAV
        </p>
      </div>

      <GideonKineticIntelligenceOverlay
        open={showGideonBio}
        onClose={() => setShowGideonBio(false)}
        dismissHint={METHODOLOGY_DISMISS_HINT}
      />
      <SystemLegalPolicyOverlay
        open={showLegalPolicy}
        onClose={() => setShowLegalPolicy(false)}
        dismissHint={METHODOLOGY_DISMISS_HINT}
      />
    </div>
  );
}
