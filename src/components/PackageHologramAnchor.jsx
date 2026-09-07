import React, { useEffect, useRef, useState } from 'react';
import {
  getPackagePanelDemoVideo,
  PACKAGE_PANEL_IMAGE_DWELL_MS,
} from '../utils/packageHologramMedia';

/**
 * Left-anchor hologram on package terminals — static PNG first, then optional suite MP4.
 */
export default function PackageHologramAnchor({
  panelKey,
  staticImageSrc,
  imageDwellMs = PACKAGE_PANEL_IMAGE_DWELL_MS,
  glowClassName = 'drop-shadow-[0_0_15px_rgba(34,211,238,0.1)]',
  accentBorderClass = 'border-cyan-500/30',
  accentTextClass = 'text-cyan-400',
}) {
  const demoSrc = getPackagePanelDemoVideo(panelKey);
  const videoRef = useRef(null);
  const [mode, setMode] = useState('image');

  useEffect(() => {
    setMode('image');
  }, [panelKey, staticImageSrc]);

  useEffect(() => {
    if (!demoSrc) return undefined;
    const timer = window.setTimeout(() => setMode('video'), imageDwellMs);
    return () => window.clearTimeout(timer);
  }, [demoSrc, imageDwellMs, panelKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !demoSrc) return undefined;

    if (mode === 'video') {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    } else {
      video.pause();
    }

    return () => video.pause();
  }, [mode, demoSrc]);

  return (
    <div
      className={`w-full bg-slate-950/40 border rounded-xl p-3 flex flex-col items-center justify-center ${accentBorderClass}`}
    >
      {demoSrc ? (
        <div className="flex items-center gap-2 w-full mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex-1 px-2 py-1 rounded border text-[8px] font-mono font-bold uppercase tracking-widest transition-colors ${
              mode === 'image'
                ? `${accentTextClass} border-current/40 bg-slate-950/80`
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            [ Hologram ]
          </button>
          <button
            type="button"
            onClick={() => setMode('video')}
            className={`flex-1 px-2 py-1 rounded border text-[8px] font-mono font-bold uppercase tracking-widest transition-colors ${
              mode === 'video'
                ? `${accentTextClass} border-current/40 bg-slate-950/80`
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            [ Suite Demo ]
          </button>
        </div>
      ) : null}

      <div className="relative w-full flex items-center justify-center min-h-[280px] max-h-[750px]">
        <img
          src={staticImageSrc}
          alt="Standing holographic telemetry anchor"
          className={`w-full h-auto object-contain rounded-xl max-h-[750px] transition-opacity duration-700 ${
            mode === 'video' && demoSrc ? 'opacity-0 absolute inset-0' : 'opacity-90'
          } ${glowClassName}`}
        />
        {demoSrc ? (
          <video
            ref={videoRef}
            src={demoSrc}
            className={`w-full h-auto object-contain rounded-xl max-h-[750px] bg-black transition-opacity duration-700 ${
              mode === 'video' ? `opacity-90 ${glowClassName}` : 'opacity-0 absolute inset-0 pointer-events-none'
            }`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Package suite movement demonstration"
          />
        ) : null}
        {demoSrc && mode === 'video' ? (
          <span
            className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded border bg-slate-950/85 text-[8px] font-mono font-bold uppercase tracking-widest ${accentTextClass} ${accentBorderClass}`}
          >
            ▶ MP4
          </span>
        ) : null}
      </div>
    </div>
  );
}
