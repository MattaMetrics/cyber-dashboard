import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Radio } from 'lucide-react';

const YOLO_API_BASE = 'http://localhost:8001';
const YOLO_WS_BASE = 'ws://localhost:8001/ws/yolo-stream';

/** Portrait full-body tracking frame — bold vertical 9:16 coach viewport */
export const VERTICAL_BODY_VIEWPORT_CLASS =
  'relative w-full max-w-[520px] aspect-[9/16] h-[75vh] max-h-[80vh] bg-black rounded-xl border overflow-hidden shadow-inner shrink-0';

const DEFAULT_CAMERA_SOURCES = [
  { id: 0, name: 'Built-in Webcam', camera_index: 0 },
  { id: 1, name: 'Secondary Camera Feed', camera_index: 1 },
];

/**
 * Standalone live camera preview — WebSocket feed from port 8001.
 * Pass explicit camera_index (0 = laptop default, 1 = tethered phone / secondary).
 */
export default function LiveYoloPreview({
  defaultHeightVh = 28,
  minHeightVh = 18,
  maxHeightVh = 48,
  matchUploadFeed = false,
  variant = 'default',
  cameraIndex: cameraIndexProp,
  onCameraIndexChange,
  defaultCameraIndex = 0,
}) {
  const isTopDeck = variant === 'topDeck';
  const useFixedAspect = matchUploadFeed || isTopDeck;

  const [internalCameraIndex, setInternalCameraIndex] = useState(defaultCameraIndex);
  const cameraIndex = cameraIndexProp ?? internalCameraIndex;

  const setCameraIndex = useCallback(
    (nextIndex) => {
      const normalized = nextIndex === 0 || nextIndex === 1 ? nextIndex : 0;
      if (onCameraIndexChange) {
        onCameraIndexChange(normalized);
      }
      if (cameraIndexProp === undefined) {
        setInternalCameraIndex(normalized);
      }
    },
    [cameraIndexProp, onCameraIndexChange]
  );

  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [serverOnline, setServerOnline] = useState(null);
  const [sources, setSources] = useState(DEFAULT_CAMERA_SOURCES);
  const [probeStatus, setProbeStatus] = useState({});
  const [previewHeightVh, setPreviewHeightVh] = useState(defaultHeightVh);
  const [hasFrame, setHasFrame] = useState(false);

  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const pendingFrameRef = useRef(null);

  const applyFrame = useCallback((frameB64) => {
    if (!frameB64) return;
    pendingFrameRef.current = frameB64;
    if (imgRef.current) {
      imgRef.current.src = `data:image/jpeg;base64,${frameB64}`;
      setHasFrame(true);
    }
  }, []);

  const probeCameraIndex = useCallback(async (index) => {
    try {
      const response = await fetch(`${YOLO_API_BASE}/api/camera/probe?camera_index=${index}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetch(`${YOLO_API_BASE}/api/yolo/health`)
      .then((response) => {
        setServerOnline(response.ok);
        return response.ok ? response.json() : null;
      })
      .then(() =>
        fetch(`${YOLO_API_BASE}/api/camera/sources`)
          .then((response) => response.json())
          .then((data) => {
            if (Array.isArray(data.sources) && data.sources.length) {
              setSources(
                data.sources.map((source) => ({
                  id: source.camera_index ?? source.id,
                  name: source.name,
                  camera_index: source.camera_index ?? source.id,
                }))
              );
            }
          })
      )
      .catch(() => setServerOnline(false));
  }, []);

  useEffect(() => {
    if (serverOnline !== true) return undefined;

    let cancelled = false;
    (async () => {
      const results = {};
      for (const index of [0, 1]) {
        const probe = await probeCameraIndex(index);
        if (cancelled) return;
        results[index] = probe?.available ?? null;
      }
      if (!cancelled) setProbeStatus(results);
    })();

    return () => {
      cancelled = true;
    };
  }, [probeCameraIndex, serverOnline]);

  const stopStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStreaming(false);
    setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
  }, []);

  const startStream = useCallback(() => {
    stopStream();
    setStreaming(true);
    setStatus('connecting');
    setCameraError('');
    setHasFrame(false);

    const socket = new WebSocket(`${YOLO_WS_BASE}?camera_index=${cameraIndex}`);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ camera_index: cameraIndex }));
      setStatus('streaming');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'camera_sleep_warning') {
          setStatus('error');
          setStreaming(false);
          setCameraError(
            data.message ||
              'S26 link asleep. Please unlock your phone screen or open the Windows Camera app to wake the device.'
          );
          socket.close();
          return;
        }
        if (data.error) {
          setStatus('error');
          setStreaming(false);
          setCameraError(
            data.message ||
              `Camera index ${data.camera_index ?? cameraIndex} unavailable. Try the other feed in the dropdown.`
          );
          socket.close();
          return;
        }
        if (data.frame) {
          applyFrame(data.frame);
        }
      } catch {
        // ignore malformed frames
      }
    };

    socket.onerror = () => {
      setStatus('error');
      setServerOnline(false);
      setCameraError('WebSocket connection failed. Confirm yolo_stream_server.py is running on port 8001.');
    };

    socket.onclose = () => {
      setStreaming(false);
      setStatus((prev) => (prev === 'error' ? 'error' : 'disconnected'));
    };
  }, [applyFrame, cameraIndex, stopStream]);

  useEffect(() => () => stopStream(), [stopStream]);

  useEffect(() => {
    if (!streaming || !pendingFrameRef.current || !imgRef.current) return;
    imgRef.current.src = `data:image/jpeg;base64,${pendingFrameRef.current}`;
    setHasFrame(true);
  }, [streaming]);

  const activeSource = sources.find((source) => Number(source.id) === Number(cameraIndex));

  const statusColor =
    status === 'streaming' && hasFrame
      ? 'bg-emerald-500'
      : status === 'connecting'
        ? 'bg-amber-400 animate-pulse'
        : status === 'error' || serverOnline === false
          ? 'bg-red-500'
          : 'bg-slate-600';

  const statusLabel =
    serverOnline === false
      ? 'port 8001 offline'
      : status === 'streaming' && !hasFrame
        ? `index ${cameraIndex} — waiting for frames`
        : status === 'streaming'
          ? `index ${cameraIndex} live`
          : status;

  return (
    <div
      className={`flex flex-col gap-2 w-full ${
        isTopDeck
          ? 'rounded-xl border border-purple-500/40 bg-slate-950/90 p-3 shadow-[0_0_32px_rgba(168,85,247,0.12)]'
          : 'rounded-xl border border-purple-500/30 bg-slate-950/80 p-3 shadow-[0_0_24px_rgba(168,85,247,0.08)]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-purple-300">
            {isTopDeck ? 'YOLO Live Feed — Vertical Full-Body Deck' : 'Live YOLO Camera Feed'}
          </span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} title={statusLabel} />
          <span className="text-[9px] font-mono uppercase text-slate-500 truncate">{statusLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cameraIndex}
            disabled={streaming}
            onChange={(e) => setCameraIndex(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded-lg px-2 py-1.5 outline-none focus:border-purple-500 max-w-[220px]"
            aria-label="Select camera hardware index"
          >
            {sources.map((source) => {
              const index = Number(source.camera_index ?? source.id);
              const probe = probeStatus[index];
              const probeHint =
                probe === true ? ' ✓' : probe === false ? ' ✗' : '';
              return (
                <option key={String(source.id)} value={index}>
                  {source.name} [index {index}]{probeHint}
                </option>
              );
            })}
          </select>

          {!streaming ? (
            <button
              type="button"
              onClick={startStream}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white rounded-lg border border-purple-400/40"
            >
              [ START LIVE FEED ]
            </button>
          ) : (
            <button
              type="button"
              onClick={stopStream}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600"
            >
              Stop Feed
            </button>
          )}
        </div>
      </div>

      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
        Active device: {activeSource?.name ?? 'Built-in Webcam'} · hardware index {cameraIndex}
        {cameraIndex === 1 ? ' (tethered phone / secondary USB webcam)' : ' (laptop default)'}
      </p>

      {serverOnline === false && (
        <p className="text-[10px] font-mono text-red-400/90 bg-red-950/30 border border-red-500/30 rounded-lg px-3 py-2">
          YOLO stream server not detected on port 8001. Start it with:{' '}
          <span className="text-red-300">python yolo_stream_server.py</span> (separate from Gemini on 8000).
        </p>
      )}

      {cameraError && (
        <p className="text-[10px] font-mono text-amber-300/95 bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-2">
          {cameraError}
        </p>
      )}

      {!matchUploadFeed && !isTopDeck && (
        <div className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="live-yolo-height-slider"
              className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-cyan-400"
            >
              Viewport Height
            </label>
            <span className="text-[9px] font-mono text-slate-400 tabular-nums">{previewHeightVh}vh</span>
          </div>
          <input
            id="live-yolo-height-slider"
            type="range"
            min={minHeightVh}
            max={maxHeightVh}
            step={1}
            value={previewHeightVh}
            onChange={(e) => setPreviewHeightVh(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            aria-label="Adjust live YOLO preview height"
          />
        </div>
      )}

      <div className={`w-full ${useFixedAspect ? 'flex justify-center' : ''}`}>
        <div
          className={
            useFixedAspect
              ? `${VERTICAL_BODY_VIEWPORT_CLASS} ${
                  isTopDeck ? 'border-purple-500/40' : 'border-purple-900/40'
                }`
              : 'relative w-full max-w-[520px] mx-auto aspect-[9/16] h-[75vh] max-h-[80vh] bg-black rounded-lg border border-purple-900/50 overflow-hidden shrink-0'
          }
          style={
            useFixedAspect
              ? undefined
              : {
                  height: `${previewHeightVh}vh`,
                  minHeight: `${minHeightVh}vh`,
                  maxHeight: `${maxHeightVh}vh`,
                }
          }
        >
          <img
            ref={imgRef}
            alt="Live YOLO biomechanical feed"
            className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-200 ${
              streaming && hasFrame ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {(!streaming || !hasFrame) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-12 h-12 text-slate-600 mb-3 shrink-0" />
              <p className="text-sm font-bold text-slate-200 mb-1">Live YOLO Preview</p>
              <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                {serverOnline === false
                  ? 'Start yolo_stream_server.py on port 8001, then click Start Live Feed.'
                  : streaming
                    ? `Locking hardware index ${cameraIndex} — allow camera access on the server machine if prompted.`
                    : 'Choose Built-in Webcam (index 0) or Secondary Camera Feed (index 1) for a tethered S26, then click Start Live Feed.'}
              </p>
            </div>
          )}

          {streaming && hasFrame && (
            <div className="absolute top-2 left-2 z-10 font-mono text-[9px] text-emerald-400 bg-slate-900/85 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
              ● Index {cameraIndex} Live
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
