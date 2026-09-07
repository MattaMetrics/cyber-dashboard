import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function isVideoSlide(slide) {
  if (!slide) return false;
  if (slide.type === 'video') return true;
  const src = typeof slide.src === 'string' ? slide.src : '';
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
}

function HoloSlideMedia({ slide, isActive }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          /* autoplay blocked — user can use native controls if enabled */
        });
      }
    } else {
      video.pause();
    }

    return () => {
      video.pause();
    };
  }, [isActive, slide?.src]);

  if (!slide?.src) return null;

  if (isVideoSlide(slide)) {
    return (
      <video
        ref={videoRef}
        src={slide.src}
        poster={slide.poster || undefined}
        className="relative z-[1] w-full h-full object-contain object-center drop-shadow-[0_0_40px_rgba(59,130,246,0.5)] bg-black"
        muted
        loop
        playsInline
        preload="metadata"
        controls={Boolean(slide.controls)}
        aria-label={slide.caption || 'Movement demonstration video'}
      />
    );
  }

  return (
    <img
      src={slide.src}
      alt={slide.caption || 'Holographic slide'}
      className="relative z-[1] w-full h-full object-contain object-center drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]"
    />
  );
}

/**
 * Shared holo-projector slideshow — used by Gideon matrix & Methodology pages.
 * Supports image slides and MP4/WebM movement demonstration clips.
 */
export default function HoloSlideshowPanel({
  slides = [],
  slideIndex = 0,
  onSlideIndexChange,
  onAdvance,
  intervalSeconds = 5.5,
  emptyFallback = null,
  renderSlideFallback,
  ariaPrefix = 'Slide',
}) {
  const activeSlide = slides[slideIndex] ?? slides[0];
  const activeIsVideo = isVideoSlide(activeSlide);

  return (
    <div className="xl:w-[38%] shrink-0 flex flex-col min-h-[42vh] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-cyan-900/40 bg-gradient-to-b from-slate-950 via-cyan-950/20 to-purple-950/25">
      <div className="relative flex-1 min-h-[36vh] xl:min-h-0 p-4 md:p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-4 md:inset-6 lg:inset-8 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 blur-3xl"
        />
        <div className="relative h-full w-full">
          {slides.length === 0 ? (
            <div className="holo-effect relative h-full w-full rounded-2xl border border-cyan-400/35 bg-black/80 shadow-[0_0_60px_rgba(34,211,238,0.3)] overflow-hidden flex items-center justify-center">
              <div className="holo-beam" aria-hidden="true" />
              {emptyFallback}
            </div>
          ) : (
            slides.map((slide, index) => (
              <div
                key={`${slide.type || 'image'}-${slide.caption}-${index}`}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === slideIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-[0.98] pointer-events-none'
                }`}
              >
                <div className="holo-effect relative h-full w-full rounded-2xl border border-cyan-400/35 bg-black/80 shadow-[0_0_60px_rgba(34,211,238,0.3)] overflow-hidden">
                  <div className="holo-beam" aria-hidden="true" />
                  {slide.src ? (
                    <HoloSlideMedia slide={slide} isActive={index === slideIndex} />
                  ) : (
                    <div className="relative z-[1] w-full h-full flex flex-col items-center justify-center p-6">
                      {renderSlideFallback ? renderSlideFallback(slide, index) : emptyFallback}
                    </div>
                  )}
                  {isVideoSlide(slide) && index === slideIndex ? (
                    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded border border-cyan-500/40 bg-slate-950/80 text-[8px] font-mono font-bold uppercase tracking-widest text-cyan-300">
                      ▶ MP4 DEMO
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onAdvance?.(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-r-lg bg-slate-950/70 border border-cyan-800/50 text-cyan-400 hover:bg-cyan-950/80 hover:text-cyan-200 transition-colors"
                aria-label={`Previous ${ariaPrefix.toLowerCase()} slide`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onAdvance?.(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-l-lg bg-slate-950/70 border border-cyan-800/50 text-cyan-400 hover:bg-cyan-950/80 hover:text-cyan-200 transition-colors"
                aria-label={`Next ${ariaPrefix.toLowerCase()} slide`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {slides.length > 0 && (
        <div className="shrink-0 px-4 pb-4 md:px-6 md:pb-6 space-y-3">
          <p className="text-center text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            {activeSlide?.caption}
          </p>
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.caption}-dot-${index}`}
                  type="button"
                  onClick={() => onSlideIndexChange?.(index)}
                  aria-label={`Show ${ariaPrefix.toLowerCase()} slide ${index + 1}`}
                  aria-current={index === slideIndex ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-all ${
                    index === slideIndex
                      ? `w-8 shadow-[0_0_10px_rgba(34,211,238,0.8)] ${
                          isVideoSlide(slide) ? 'bg-purple-400' : 'bg-cyan-400'
                        }`
                      : `w-3 hover:bg-cyan-700/60 ${isVideoSlide(slide) ? 'bg-purple-900/80' : 'bg-slate-700'}`
                  }`}
                />
              ))}
            </div>
          )}
          <p className="text-center text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            {activeIsVideo
              ? `HOLO-PROJECTOR // MOVEMENT DEMO UPLINK · AUTO-CYCLE ${intervalSeconds}s`
              : `HOLO-PROJECTOR // AUTO-CYCLE ${intervalSeconds}s · SCANLINE UPLINK ACTIVE`}
          </p>
        </div>
      )}
    </div>
  );
}
