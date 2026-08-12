import React, { useMemo } from 'react';

/** Tall cyan slide rail — viewport-height track with smooth scrub transitions */
export default function ReportSectionSlideRail({
  sections = [],
  activeIndex = 0,
  onIndexChange,
}) {
  const maxIndex = Math.max(sections.length - 1, 0);
  const clampedIndex = Math.min(Math.max(activeIndex, 0), maxIndex);
  const fillPercent = sections.length <= 1 ? 100 : (clampedIndex / maxIndex) * 100;

  const markers = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        index,
        active: index === clampedIndex,
        positionPercent: sections.length <= 1 ? 50 : (index / maxIndex) * 100,
      })),
    [sections, clampedIndex, maxIndex]
  );

  if (sections.length <= 1) return null;

  return (
    <>
      {/* Screen: interactive cyan slide rail */}
      <div
        className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 print:hidden"
        aria-label="Report section navigator"
      >
        <div className="bg-white/95 backdrop-blur-md border border-cyan-200/80 rounded-2xl shadow-xl shadow-cyan-500/15 px-2.5 py-5 flex flex-col items-center gap-4 w-[3.25rem] min-h-[min(72vh,680px)] max-h-[720px]">
          <span className="text-[8px] font-black font-mono text-cyan-600 uppercase tracking-[0.22em] [writing-mode:vertical-rl] rotate-180 shrink-0">
            Review
          </span>

          <div className="relative flex-1 w-full min-h-[min(52vh,520px)] flex items-center justify-center">
            {/* Track rail */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 rounded-full bg-slate-100 border border-slate-200/80 shadow-inner" />
            {/* Smooth fill */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 rounded-full bg-gradient-to-t from-cyan-600 via-cyan-400 to-cyan-300 transition-[height] duration-500 ease-out shadow-[0_0_14px_rgba(6,182,212,0.35)]"
              style={{ height: `${Math.max(fillPercent, 4)}%` }}
            />

            {/* Marker ticks on track */}
            {markers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                title={marker.label}
                onClick={() => onIndexChange?.(marker.index)}
                className="absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-out"
                style={{
                  bottom: `calc(${marker.positionPercent}% - 6px)`,
                }}
              >
                <span
                  className={`block rounded-full border-2 transition-all duration-500 ease-out ${
                    marker.active
                      ? 'w-3.5 h-3.5 bg-cyan-500 border-white shadow-[0_0_12px_rgba(6,182,212,0.65)] scale-110'
                      : 'w-2.5 h-2.5 bg-white border-cyan-300 hover:border-cyan-500 hover:scale-110'
                  }`}
                />
              </button>
            ))}

            <input
              type="range"
              min={0}
              max={maxIndex}
              step={1}
              value={clampedIndex}
              onChange={(e) => onIndexChange?.(Number(e.target.value))}
              className="report-cyan-vertical-slider relative z-10 cursor-grab active:cursor-grabbing"
              aria-valuetext={sections[clampedIndex]?.label}
              style={{
                '--slide-fill': `${fillPercent}%`,
              }}
            />
          </div>

          <div className="shrink-0 text-center px-0.5">
            <span className="text-[9px] font-bold font-mono text-cyan-700 block leading-tight max-w-[4.5rem] transition-opacity duration-300">
              {sections[clampedIndex]?.label}
            </span>
            <span className="text-[8px] font-mono text-slate-400 mt-1 block">
              {clampedIndex + 1} / {sections.length}
            </span>
          </div>
        </div>
      </div>

      {/* Print: static cyan review track in margin */}
      <div
        className="hidden print:block fixed right-0 top-0 bottom-0 w-5 border-l-2 border-cyan-500 bg-gradient-to-b from-cyan-50 via-white to-cyan-50 z-50"
        aria-hidden
      >
        <div className="h-full flex flex-col justify-around py-8 pr-0.5 items-center">
          {markers.map((marker) => (
            <div key={marker.id} className="flex flex-col items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  marker.active ? 'bg-cyan-500' : 'bg-cyan-200 border border-cyan-400'
                }`}
              />
              <span className="text-[6px] font-mono font-bold text-cyan-700 uppercase [writing-mode:vertical-rl] rotate-180 max-h-16 truncate">
                {marker.short || marker.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
