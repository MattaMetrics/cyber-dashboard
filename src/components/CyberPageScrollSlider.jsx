import React, { useCallback, useEffect, useRef, useState } from 'react';

const SCROLL_TRACK_HEIGHT = 520;

const THEMES = {
  cyan: {
    thumb: 'from-[#00FFFF]/90 to-[#00FFFF]/50',
    thumbBorder: 'border-[#00FFFF]/60',
    thumbShadow: 'shadow-[0_0_12px_rgba(0,255,255,0.45)] hover:shadow-[0_0_16px_rgba(0,255,255,0.65)]',
  },
  purple: {
    thumb: 'from-purple-400/90 to-purple-600/50',
    thumbBorder: 'border-purple-400/60',
    thumbShadow: 'shadow-[0_0_12px_rgba(168,85,247,0.45)] hover:shadow-[0_0_16px_rgba(168,85,247,0.65)]',
  },
};

export default function CyberPageScrollSlider({
  theme = 'cyan',
  children,
  className = '',
  label = 'SCROLL',
}) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);

  const [thumbMetrics, setThumbMetrics] = useState({ height: 48, top: 0 });
  const [canScroll, setCanScroll] = useState(false);

  const palette = THEMES[theme] ?? THEMES.cyan;

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
    <div className={`relative h-full overflow-hidden ${className}`}>
      {canScroll && (
        <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[8px] tracking-[0.35em] text-slate-600 uppercase pointer-events-none">
            {label}
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
              className={`absolute left-0 w-full rounded-full bg-gradient-to-b ${palette.thumb} border ${palette.thumbBorder} ${palette.thumbShadow} cursor-grab active:cursor-grabbing transition-[box-shadow]`}
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

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overflow-x-hidden pr-12 md:pr-14 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
