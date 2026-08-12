import React, { useCallback, useEffect, useRef, useState } from 'react';
import MethodologyCyberSphere from './MethodologyCyberSphere';

const SCROLL_TRACK_HEIGHT = 520;

/**
 * View System Methodology & Kinetic Research — home sidebar route
 * Screen key: VIEW_SYSTEM_METHODOLOGY_KINETICS
 */
export default function ViewSystemMethodologyKinetics({ onNavigate, setCurrentScreen }) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);

  const [thumbMetrics, setThumbMetrics] = useState({ height: 48, top: 0 });
  const [canScroll, setCanScroll] = useState(false);

  const goHome = () => {
    const nav = onNavigate || setCurrentScreen;
    nav?.('CLIENT_PORTAL_LANDING_HOME');
  };

  const syncThumbFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    const scrollable = maxScroll > 0;

    setCanScroll(scrollable);

    const trackHeight = trackRef.current?.clientHeight
      ?? Math.min(SCROLL_TRACK_HEIGHT, clientHeight * 0.7);

    if (!scrollable) {
      setThumbMetrics({ height: trackHeight, top: 0 });
      return;
    }

    const thumbHeight = Math.max(40, (clientHeight / scrollHeight) * trackHeight);
    const travel = trackHeight - thumbHeight;
    const top = (scrollTop / maxScroll) * travel;

    setThumbMetrics({ height: thumbHeight, top });
  }, []);

  const scrollToThumbTop = useCallback((thumbTop, trackHeight) => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    const thumbHeight = Math.max(40, (el.clientHeight / el.scrollHeight) * trackHeight);
    const travel = trackHeight - thumbHeight;
    const ratio = travel > 0 ? thumbTop / travel : 0;

    el.scrollTop = ratio * maxScroll;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    syncThumbFromScroll();

    const onScroll = () => syncThumbFromScroll();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => syncThumbFromScroll());
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [syncThumbFromScroll]);

  const handleTrackClick = (event) => {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;

    const rect = track.getBoundingClientRect();
    const trackHeight = rect.height;
    const clickY = event.clientY - rect.top;
    const thumbHeight = thumbMetrics.height;
    const targetTop = Math.min(Math.max(clickY - thumbHeight / 2, 0), trackHeight - thumbHeight);

    scrollToThumbTop(targetTop, trackHeight);
  };

  const handleThumbPointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;

    const rect = track.getBoundingClientRect();
    const trackHeight = rect.height;
    const thumbHeight = Math.max(40, (el.clientHeight / el.scrollHeight) * trackHeight);

    dragRef.current = {
      startY: event.clientY,
      startTop: thumbMetrics.top,
      trackHeight,
      thumbHeight,
    };

    const onMove = (moveEvent) => {
      if (!dragRef.current) return;
      const delta = moveEvent.clientY - dragRef.current.startY;
      const maxTop = dragRef.current.trackHeight - dragRef.current.thumbHeight;
      const nextTop = Math.min(Math.max(dragRef.current.startTop + delta, 0), maxTop);
      scrollToThumbTop(nextTop, dragRef.current.trackHeight);
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const trackHeightCss = 'min(520px, 70vh)';

  return (
    <div className="relative w-full h-screen bg-[#030712] overflow-hidden font-mono text-white text-left selection:bg-[#00FFFF]/30">
      {/* ESC — top left, returns to public home portal */}
      <div className="absolute left-0 top-0 z-30 p-6 md:p-10">
        <button
          type="button"
          onClick={goHome}
          className="border border-slate-800 hover:border-[#00FFFF] bg-slate-900/40 hover:bg-[#00FFFF]/10 text-slate-400 hover:text-[#00FFFF] text-[10px] tracking-widest font-bold uppercase px-5 py-3 rounded transition-all duration-300"
        >
          [ ESC // RETURN TO HOME ]
        </button>
      </div>

      {/* Right-side scroll slider */}
      {canScroll && (
        <div
          className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none"
          aria-hidden={false}
        >
          <span className="text-[8px] tracking-[0.35em] text-slate-600 uppercase pointer-events-none">
            SCROLL
          </span>
          <div
            ref={trackRef}
            role="scrollbar"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(
              (thumbMetrics.top / Math.max((trackRef.current?.clientHeight ?? 520) - thumbMetrics.height, 1)) * 100
            )}
            className="relative w-2 rounded-full bg-slate-900/80 border border-slate-800 pointer-events-auto cursor-pointer"
            style={{ height: trackHeightCss }}
            onClick={handleTrackClick}
          >
            <div
              role="slider"
              tabIndex={0}
              className="absolute left-0 w-full rounded-full bg-gradient-to-b from-[#00FFFF]/90 to-[#00FFFF]/50 border border-[#00FFFF]/60 shadow-[0_0_12px_rgba(0,255,255,0.45)] cursor-grab active:cursor-grabbing transition-[box-shadow] hover:shadow-[0_0_16px_rgba(0,255,255,0.65)]"
              style={{ height: thumbMetrics.height, top: thumbMetrics.top }}
              onPointerDown={handleThumbPointerDown}
              onKeyDown={(event) => {
                const el = scrollRef.current;
                if (!el) return;
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  el.scrollBy({ top: 48, behavior: 'smooth' });
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  el.scrollBy({ top: -48, behavior: 'smooth' });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Scrollable content — native bar hidden */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overflow-x-hidden p-8 md:p-12 pr-14 md:pr-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full flex flex-col items-center justify-center mb-12 pt-14 md:pt-16">
          <div className="mb-4">
            <MethodologyCyberSphere />
          </div>

          <div className="text-center space-y-2">
            <span className="text-slate-500 text-[10px] tracking-widest block font-bold uppercase">
              // LONGEVITY LABORATORY GLOBAL MASTER INDEX //
            </span>
            <h1 className="text-[#00FFFF] text-base md:text-lg font-bold tracking-widest uppercase animate-pulse shadow-sm">
              LONGEVITY LAB SYSTEM METHODOLOGY
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-stretch">
          <div className="border border-slate-900 bg-slate-950/30 backdrop-blur-sm rounded-xl p-8 flex flex-col justify-between hover:border-slate-800 transition-colors">
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-900 pb-3 mb-6">
                <span className="text-[#00FFFF] text-xs">🔹</span>
                <h2 className="text-white text-sm font-bold tracking-widest uppercase">
                  THE BIOMECHANICAL LAWS OF CHRONIC COMPENSATION
                </h2>
              </div>
              <div className="space-y-6 text-slate-300 text-sm md:text-base leading-relaxed tracking-normal font-sans">
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
            </div>
            <div className="border-t border-slate-900/60 mt-8 pt-4">
              <span className="text-[#FF6600] text-xs font-bold tracking-widest uppercase block">
                // LAW: SYMPTOMS MIGRATE - ROOT VECTORS DO NOT
              </span>
            </div>
          </div>

          <div className="border border-slate-900 bg-slate-950/30 backdrop-blur-sm rounded-xl p-8 flex flex-col justify-between hover:border-slate-800 transition-colors">
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-900 pb-3 mb-6">
                <span className="text-[#00FFFF] text-xs">📷</span>
                <h2 className="text-white text-sm font-bold tracking-widest uppercase">
                  CONTEXTUAL SKELETAL INFERENCE AND PREVENTATIVE DURABILITY
                </h2>
              </div>
              <div className="space-y-6 text-slate-300 text-sm md:text-base leading-relaxed tracking-normal font-sans">
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
            </div>
            <div className="border-t border-slate-900/60 mt-8 pt-4">
              <span className="text-[#00FF66] text-xs font-bold tracking-widest uppercase block">
                // PROTOCOL: PREDICT HIDDEN PATHS // LOCK FUTURE RANGE
              </span>
            </div>
          </div>
        </div>

        <div className="border border-slate-900 bg-slate-950/40 rounded-xl p-8 hover:border-slate-800 transition-colors mb-8">
          <div className="flex items-center space-x-2 border-b border-slate-900 pb-3 mb-4">
            <span className="text-slate-500 text-xs">📁</span>
            <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase">
              // PLATFORM CORE MISSION & TELEMETRY MANIFESTO //
            </h2>
          </div>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed tracking-wide font-mono text-justify">
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
        </div>
      </div>
    </div>
  );
}
