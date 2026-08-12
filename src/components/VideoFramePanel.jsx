import React, { useEffect, useRef } from 'react';
import { Layers, Sliders } from 'lucide-react';

/**
 * Live HTML5 video frame controller — scrubber jumps to exact timestamp.
 * Hidden on print; PDF export uses static poster only.
 */
export default function VideoFramePanel({
  videoUrl = '',
  phaseLabel = 'MATRIX',
  frameScroll = 1,
  totalFrames = 128,
  onFrameChange,
  printPosterUrl = '',
}) {
  const videoRef = useRef(null);
  const framePercent = (frameScroll / totalFrames) * 100;

  const seekToFrame = (frame, duration) => {
    if (!duration || !Number.isFinite(duration)) return;
    const clamped = Math.min(Math.max(frame, 1), totalFrames);
    const ratio = clamped / totalFrames;
    videoRef.current.currentTime = duration * ratio;
  };

  const handleSliderChange = (e) => {
    const targetFrame = Number(e.target.value);
    onFrameChange?.(targetFrame);
    if (videoRef.current?.duration) {
      seekToFrame(targetFrame, videoRef.current.duration);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return undefined;

    const onLoaded = () => {
      seekToFrame(frameScroll, video.duration);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    if (video.readyState >= 1) onLoaded();

    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [videoUrl, frameScroll, totalFrames]);

  return (
    <>
      {/* Screen: live video + scrubber */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
            {phaseLabel} // LIVE VIDEO STREAM
          </span>
          <Layers size={14} className="text-cyan-500" />
        </div>

        <div className="aspect-[4/3] bg-slate-950 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-900 shadow-inner">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                playsInline
                muted
                preload="metadata"
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/10 mix-blend-screen bg-gradient-to-b from-cyan-500/5 to-transparent" />
            </>
          ) : (
            <div className="font-mono text-[11px] text-slate-500 tracking-widest uppercase animate-pulse">
              Awaiting Frame Uplink
            </div>
          )}
          <div className="absolute bottom-3 right-3 font-mono text-[9px] text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30">
            FRAME_IDX: {String(frameScroll).padStart(3, '0')}
          </div>
          {videoUrl ? (
            <div className="absolute top-3 left-3 font-mono text-[9px] text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/20">
              STREAM_LOCK_OK
            </div>
          ) : null}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center mb-1.5 font-mono text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Sliders size={11} className="text-cyan-500" /> TIMELINE FRAME SCRUBBER
            </span>
            <span className="text-cyan-500">
              FRAME {frameScroll} / {totalFrames}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max={totalFrames}
            value={frameScroll}
            onChange={handleSliderChange}
            disabled={!videoUrl}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none disabled:opacity-40"
            style={{
              background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${framePercent}%, #f1f5f9 ${framePercent}%, #f1f5f9 100%)`,
            }}
          />
        </div>
      </div>

      {/* Print / PDF: static poster — no video element */}
      <div className="hidden print:block">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
            {phaseLabel} // CAPTURED FRAME
          </span>
        </div>
        <div className="aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
          {printPosterUrl ? (
            <img
              src={printPosterUrl}
              alt="Report frame capture"
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider text-center px-4">
              Video stream omitted from PDF export
              <br />
              Frame index: {String(frameScroll).padStart(3, '0')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
