import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Radio,
  MonitorPlay,
  ClipboardCopy,
  Terminal,
} from 'lucide-react';
import { staticAssessmentLibrary } from '../data/assessmentLibrary';
import { evaluateTrackingStream } from '../api/assessment_endpoint.js';

const API_BASE = import.meta.env.VITE_ASSESSMENT_API_URL || '';
const AIKYNETIX_WEB_URL =
  import.meta.env.VITE_AIKYNETIX_WEB_URL || 'https://aikynetix.com';
const EXTENSION_ID = import.meta.env.VITE_AIKYNETIX_EXTENSION_ID || '';

/** Paste into Aikynetix DevTools Console (F12) before/during assessment */
const AIKYNETIX_CONSOLE_EXTRACTOR = `(function () {
  'use strict';
  if (window.__LL_AIKYNETIX_EXTRACTOR__) {
    console.log('[Life Longevity] Extractor already active. Run: __LL_AIKYNETIX_EXPORT__()');
    return;
  }
  window.__LL_AIKYNETIX_EXTRACTOR__ = true;
  window.__LL_AIKYNETIX_CAPTURE__ = window.__LL_AIKYNETIX_CAPTURE__ || {};

  const POSE_HINTS = ['keypoints', 'pose', 'skeleton', 'landmarks', 'joints', 'angles', 'joint_angles'];

  function deepFindPose(node, depth) {
    if (!node || typeof node !== 'object' || (depth || 0) > 7) return null;
    if (Array.isArray(node.keypoints) && node.keypoints.length) return node;
    if (node.angles && Object.keys(node.angles).length) return node;
    if (node.joint_angles && Object.keys(node.joint_angles).length) return node;
    if (Array.isArray(node.frames) && node.frames.length) return node;
    if (Array.isArray(node.time_series) && node.time_series.length) return node;
    for (const key of POSE_HINTS) {
      if (node[key] && typeof node[key] === 'object') {
        const hit = deepFindPose(node[key], (depth || 0) + 1);
        if (hit) return hit;
      }
    }
    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') {
        const hit = deepFindPose(val, (depth || 0) + 1);
        if (hit) return hit;
      }
    }
    return null;
  }

  function normalizeKeypoints(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map(function (kp, i) {
        if (!kp || typeof kp !== 'object') return null;
        return {
          label: kp.label || kp.name || kp.joint || ('joint_' + i),
          x: kp.x ?? kp[0] ?? 0,
          y: kp.y ?? kp[1] ?? 0,
          z: kp.z ?? kp[2] ?? 0,
          confidence: kp.confidence ?? kp.score ?? 1,
        };
      }).filter(Boolean);
    }
    if (typeof raw === 'object') {
      return Object.entries(raw).map(function (entry) {
        var label = entry[0];
        var kp = entry[1];
        if (!kp || typeof kp !== 'object') return null;
        return {
          label: label,
          x: kp.x ?? 0,
          y: kp.y ?? 0,
          z: kp.z ?? 0,
          confidence: kp.confidence ?? 1,
        };
      }).filter(Boolean);
    }
    return [];
  }

  function mergeCapture(found) {
    if (!found) return;
    var keypoints = normalizeKeypoints(found.keypoints || found.landmarks || found.pose);
    window.__LL_AIKYNETIX_CAPTURE__ = Object.assign({}, window.__LL_AIKYNETIX_CAPTURE__, found, {
      keypoints: keypoints.length ? keypoints : (window.__LL_AIKYNETIX_CAPTURE__.keypoints || []),
      angles: found.angles || found.joint_angles || window.__LL_AIKYNETIX_CAPTURE__.angles || {},
      joint_angles: found.joint_angles || found.angles || window.__LL_AIKYNETIX_CAPTURE__.joint_angles || {},
      time_series: found.time_series || found.frames || window.__LL_AIKYNETIX_CAPTURE__.time_series || [],
      frames: found.frames || found.time_series || window.__LL_AIKYNETIX_CAPTURE__.frames || [],
    });
  }

  // Hook fetch — Aikynetix may still emit analysis payloads on some endpoints
  var origFetch = window.fetch;
  window.fetch = async function () {
    var resp = await origFetch.apply(this, arguments);
    try {
      var clone = resp.clone();
      var data = await clone.json();
      mergeCapture(deepFindPose(data));
    } catch (e) {}
    return resp;
  };

  // Scan React / WebGL globals every 2s (client-side pose stays in memory)
  setInterval(function () {
    mergeCapture(deepFindPose(window));
    var canvases = document.querySelectorAll('canvas');
    canvases.forEach(function (canvas) {
      var ctx = canvas.__LL_POSE_CTX__ || canvas._poseContext || canvas.__pose;
      if (ctx) mergeCapture(deepFindPose(ctx));
    });
  }, 2000);

  window.__LL_AIKYNETIX_EXPORT__ = function () {
    mergeCapture(deepFindPose(window));
    var cap = window.__LL_AIKYNETIX_CAPTURE__ || {};
    var payload = {
      source: 'aikynetix_console_extractor',
      captured_at: new Date().toISOString(),
      page_url: location.href,
      keypoints: cap.keypoints || [],
      angles: cap.angles || cap.joint_angles || {},
      joint_angles: cap.joint_angles || cap.angles || {},
      center_of_mass: cap.center_of_mass || {},
      symmetry: cap.symmetry || {},
      temporal: cap.temporal || {},
      time_series: cap.time_series || cap.frames || [],
      frames: cap.frames || cap.time_series || [],
    };
    var json = JSON.stringify(payload, null, 2);
    console.log('[Life Longevity] Copy the JSON below into the portal \\"Paste Aikynetix Data\\" field:');
    console.log(json);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () {
        console.log('[Life Longevity] Copied to clipboard.');
      });
    }
    return payload;
  };

  console.log('[Life Longevity] Aikynetix extractor armed. After your assessment, run: __LL_AIKYNETIX_EXPORT__()');
})();`;

function libraryIdToTestId(id) {
  return `LL${String(id).padStart(3, '0')}`;
}

function formatScore(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : '—';
}

/** Pull JSON object from raw console paste (may include log prefixes / fences) */
function parsePastedConsoleJson(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) throw new Error('Paste is empty');

  try {
    return JSON.parse(trimmed);
  } catch {
    /* try embedded object */
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error('Could not parse JSON from pasted console output');
}

/** Normalize LL export / nested snapshots into interpreter-friendly shape */
function normalizeAikynetixPayload(parsed) {
  const root =
    parsed?.ll_aikynetix_export ||
    parsed?.raw_snapshot ||
    parsed?.aikynetix_data ||
    parsed?.data ||
    parsed;

  if (typeof root !== 'object' || root === null) {
    throw new Error('Pasted data is not a JSON object');
  }

  const angles = root.angles || root.joint_angles || {};
  const frames = root.time_series || root.frames || [];
  const keypoints = root.keypoints || root.landmarks || [];

  return {
    source: root.source || 'console_paste',
    captured_at: root.captured_at || new Date().toISOString(),
    page_url: root.page_url || '',
    keypoints: Array.isArray(keypoints) ? keypoints : [],
    angles,
    joint_angles: root.joint_angles || angles,
    center_of_mass: root.center_of_mass || {},
    symmetry: root.symmetry || {},
    temporal: root.temporal || {},
    time_series: Array.isArray(frames) ? frames : [],
    frames: Array.isArray(frames) ? frames : [],
  };
}

function scoreToGrade(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return '—';
  if (n >= 90) return 'A';
  if (n >= 80) return 'B';
  if (n >= 70) return 'C';
  if (n >= 60) return 'D';
  return 'F';
}

function mapClientEvaluationToResults(evalResult, { clientId, testId }) {
  const assessmentId = `LL_${Date.now()}`;
  const score = Number(evalResult.composite_score ?? 0);
  const rehabPhases = evalResult.rehabilitation_plan?.phases || [];

  return {
    status: 'completed',
    assessment_id: assessmentId,
    client_id: clientId,
    results: {
      assessment_id: assessmentId,
      client_id: clientId,
      test_id: testId,
      header: {
        overall_score: score,
        grade: scoreToGrade(score),
        test_id: testId,
        test_name: evalResult.assessment_name || testId,
      },
      scores: evalResult.assessment_summary || {},
      enhanced_metrics: {
        energy_analysis: {
          total_efficiency: score,
          energy_leaks: evalResult.energy_leaks || [],
        },
        movement_age: null,
        longevity_recommendations: {
          immediate_priorities: rehabPhases.slice(0, 4).map((phase) => ({
            issue: phase.name || phase.focus || phase.title || 'Priority',
            impact: phase.description || phase.goal || '',
          })),
        },
      },
      metadata: {
        source: 'portal_interpreter_fallback',
        frame_count: evalResult.frame_count,
      },
    },
  };
}

function sendExtensionMessage(payload) {
  return new Promise((resolve, reject) => {
    if (!EXTENSION_ID || !window.chrome?.runtime?.sendMessage) {
      reject(new Error('Chrome extension not detected'));
      return;
    }

    window.chrome.runtime.sendMessage(EXTENSION_ID, payload, (response) => {
      const err = window.chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

export default function AssessmentPipeline({
  defaultClientId = '',
  defaultTestId = '',
  clientAge = 35,
  onComplete,
}) {
  const [selectedTest, setSelectedTest] = useState(defaultTestId);
  const [clientId, setClientId] = useState(defaultClientId);
  const [assessmentId, setAssessmentId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [extensionReady, setExtensionReady] = useState(false);
  const [showEmbeddedLab, setShowEmbeddedLab] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [scriptCopied, setScriptCopied] = useState(false);
  const aikynetixWindowRef = useRef(null);
  const pendingVideoUrlRef = useRef('');

  const availableTests = useMemo(
    () =>
      staticAssessmentLibrary.map((track) => ({
        id: libraryIdToTestId(track.id),
        libraryId: track.id,
        name: track.name,
        category: track.category,
      })),
    []
  );

  const applyCompletedResults = useCallback(
    (payload) => {
      if (payload.status === 'failed') {
        setStatus('failed');
        setError(payload.error || 'Intercept processing failed');
        return;
      }

      const resolvedResults = payload.results || payload;
      const pendingVideo = pendingVideoUrlRef.current;
      if (pendingVideo && resolvedResults) {
        resolvedResults.video_url = pendingVideo;
        resolvedResults.metadata = {
          ...(resolvedResults.metadata || {}),
          video_url: pendingVideo,
        };
      }
      setAssessmentId(resolvedResults.assessment_id || payload.assessment_id || null);
      setResults(resolvedResults);
      setStatus('completed');
      setProgress(100);
      setError(null);
      onComplete?.({
        ...resolvedResults,
        client_id: resolvedResults.client_id || payload.client_id || clientId,
      });
    },
    [onComplete, clientId]
  );

  const pingExtension = useCallback(async () => {
    if (!EXTENSION_ID) {
      setExtensionReady(false);
      return;
    }
    try {
      const response = await sendExtensionMessage({ type: 'PING' });
      setExtensionReady(Boolean(response?.ok));
    } catch {
      setExtensionReady(false);
    }
  }, []);

  useEffect(() => {
    pingExtension();
  }, [pingExtension]);

  useEffect(() => {
    if (defaultClientId) setClientId(defaultClientId);
  }, [defaultClientId]);

  useEffect(() => {
    if (defaultTestId) setSelectedTest(defaultTestId);
  }, [defaultTestId]);

  useEffect(() => {
    const onCapture = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== 'LL_AIKYNETIX_CAPTURE') return;

      applyCompletedResults(data);
    };

    const onMedia = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== 'LL_AIKYNETIX_MEDIA') return;
      if (data.video_url) pendingVideoUrlRef.current = data.video_url;
    };

    window.addEventListener('message', onCapture);
    window.addEventListener('message', onMedia);
    return () => {
      window.removeEventListener('message', onCapture);
      window.removeEventListener('message', onMedia);
    };
  }, [applyCompletedResults]);

  const registerInterceptSession = async () => {
    const sessionPayload = {
      type: 'REGISTER_SESSION',
      test_id: selectedTest,
      client_id: clientId,
      client_age: clientAge,
      api_base: API_BASE || 'http://localhost:8000',
    };

    if (EXTENSION_ID && window.chrome?.runtime?.sendMessage) {
      await sendExtensionMessage(sessionPayload);
      return;
    }

    await fetch(`${API_BASE || ''}/api/health`).catch(() => {
      throw new Error(
        'FastAPI lab server unreachable. Start uvicorn on port 8000 or install the Chrome extension.'
      );
    });
  };

  const launchAikynetixLab = async () => {
    if (!selectedTest || !clientId) {
      setError('Please select a test and enter a client ID');
      return;
    }

    setError(null);
    setResults(null);
    setAssessmentId(null);
    setStatus('listening');
    setProgress(25);

    try {
      await registerInterceptSession();
      setProgress(40);

      if (showEmbeddedLab) {
        setProgress(55);
        return;
      }

      if (aikynetixWindowRef.current && !aikynetixWindowRef.current.closed) {
        aikynetixWindowRef.current.focus();
        return;
      }

      aikynetixWindowRef.current = window.open(
        AIKYNETIX_WEB_URL,
        'll_aikynetix_lab',
        'noopener,noreferrer,width=1280,height=900'
      );

      setProgress(60);
    } catch (err) {
      setStatus('failed');
      setError(err.message || 'Failed to arm intercept session');
      setProgress(0);
    }
  };

  const processManualJson = async () => {
    if (!selectedTest || !clientId) {
      setError('Please select a test and enter a client ID');
      return;
    }

    setStatus('processing');
    setProgress(75);
    setError(null);

    try {
      const parsed = parsePastedConsoleJson(manualJson);
      const aikynetixPayload = normalizeAikynetixPayload(parsed);

      if (
        !aikynetixPayload.keypoints?.length &&
        !Object.keys(aikynetixPayload.angles || {}).length &&
        !aikynetixPayload.time_series?.length
      ) {
        throw new Error(
          'No pose/angle data found in paste. Run __LL_AIKYNETIX_EXPORT__() in Aikynetix DevTools after your assessment.'
        );
      }

      // Primary: Python AI interpreter (FastAPI port 8000)
      try {
        const response = await fetch(`${API_BASE}/api/assess/intercept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: selectedTest,
            client_id: clientId,
            client_age: clientAge,
            aikynetix_response: aikynetixPayload,
            source_url: aikynetixPayload.page_url || 'console_paste',
          }),
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail.detail || detail.error || 'Intercept evaluation failed');
        }

        const data = await response.json();
        applyCompletedResults(data);
        return;
      } catch (serverErr) {
        // Fallback: Vite rubric interpreter (same rubrics.json rules)
        const evalResult = evaluateTrackingStream(
          { ...aikynetixPayload, test_id: selectedTest, source: 'console_paste' },
          selectedTest
        );

        if (!evalResult.ok) {
          throw new Error(
            serverErr.message ||
              evalResult.error?.message ||
              'Interpreter could not evaluate pasted data'
          );
        }

        applyCompletedResults(
          mapClientEvaluationToResults(evalResult, {
            clientId,
            testId: selectedTest,
          })
        );
      }
    } catch (err) {
      setStatus('failed');
      setError(err.message || 'Failed to process pasted Aikynetix data');
      setProgress(0);
    }
  };

  const copyExtractorScript = async () => {
    try {
      await navigator.clipboard.writeText(AIKYNETIX_CONSOLE_EXTRACTOR);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2500);
    } catch {
      setError('Could not copy script — select and copy manually from the code block below.');
    }
  };

  const downloadReport = async (format) => {
    if (!assessmentId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/assess/download/${assessmentId}?format=${format}`
      );
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${assessmentId}_report.${format === 'json' ? 'json' : 'pdf'}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Download failed');
    }
  };

  const resetPipeline = () => {
    setStatus('idle');
    setProgress(0);
    setResults(null);
    setError(null);
    setAssessmentId(null);
    setManualJson('');
    setScriptCopied(false);
    setShowEmbeddedLab(false);
  };

  const isIdle = status === 'idle';
  const isListening = status === 'listening';
  const energyLeaks = results?.enhanced_metrics?.energy_analysis?.energy_leaks || [];
  const movementAge = results?.enhanced_metrics?.movement_age;
  const longevity = results?.enhanced_metrics?.longevity_recommendations;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 font-mono text-white text-left">
      <div className="mb-8 border-b border-slate-900 pb-4">
        <h1 className="text-[#00FFFF] text-lg font-bold tracking-widest uppercase m-0">
          // AIKYNETIX INTERCEPT PIPELINE
        </h1>
        <p className="text-slate-500 text-[10px] tracking-wider uppercase mt-2">
          Coach Dashboard → Aikynetix Web Lab → DevTools console extract → AI interpreter →
          results dashboard
        </p>
      </div>

      <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-6 mb-6">
        <h2 className="text-white text-xs font-bold tracking-widest uppercase mb-4">
          Step 1 // Configure Session
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-2">
              Select Test
            </label>
            <select
              className="w-full bg-[#030712] border border-slate-900 rounded-lg p-3 text-[#00FFFF] text-xs outline-none focus:border-[#00FFFF]"
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              disabled={!isIdle && !isListening}
            >
              <option value="">Choose a test...</option>
              {availableTests.map((test) => (
                <option key={test.id} value={test.id}>
                  [{test.id}] {test.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-2">
              Client ID
            </label>
            <input
              type="text"
              className="w-full bg-[#030712] border border-slate-900 rounded-lg p-3 text-white text-xs outline-none focus:border-[#00FFFF]"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="6-digit access code or client identifier"
              disabled={!isIdle && !isListening}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border border-slate-900 rounded-lg px-4 py-3 bg-[#030712]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <Radio size={14} className={extensionReady ? 'text-emerald-400' : 'text-amber-400'} />
            <span className={extensionReady ? 'text-emerald-400' : 'text-amber-400'}>
              {extensionReady
                ? 'Chrome extension linked'
                : 'Extension not detected — load unpacked from /chrome-extension'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowEmbeddedLab((prev) => !prev)}
            className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#00FFFF]"
          >
            {showEmbeddedLab ? 'Use New Tab Instead' : 'Try Embedded Lab Panel'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={launchAikynetixLab}
            disabled={!selectedTest || !clientId || status === 'processing'}
            className="flex-1 border border-indigo-500/70 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40 text-indigo-300 text-[10px] tracking-widest font-bold uppercase py-3 px-6 rounded-lg flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            [ Arm Intercept + Launch Aikynetix Lab // ]
          </button>
          <button
            type="button"
            onClick={pingExtension}
            className="border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-[10px] tracking-widest font-bold uppercase py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Recheck Extension
          </button>
        </div>
      </div>

      {showEmbeddedLab && (isListening || isIdle) && (
        <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 mb-3">
            <MonitorPlay size={14} className="text-[#00FFFF]" />
            Embedded Aikynetix Lab (iframe)
          </div>
          <iframe
            title="Aikynetix Web Lab"
            src={AIKYNETIX_WEB_URL}
            className="w-full h-[70vh] rounded-lg border border-slate-900 bg-black"
            allow="camera; microphone; clipboard-read; clipboard-write"
          />
          <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-wider">
            If the frame stays blank, Aikynetix may block embedding — use the new-tab launcher
            instead.
          </p>
        </div>
      )}

      {status !== 'idle' && (
        <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xs font-bold tracking-widest uppercase mb-4">
            Step 2 // Intercept + Interpret
          </h2>

          <div className="mb-4">
            <div className="flex justify-between mb-2 text-[10px] uppercase tracking-wider">
              <span className="text-slate-400">
                {status === 'listening' && 'Waiting for Aikynetix API response...'}
                {status === 'processing' && 'Running AI interpreter...'}
                {status === 'completed' && 'Assessment complete'}
                {status === 'failed' && 'Pipeline failed'}
              </span>
              <span className="text-[#00FFFF]">{progress}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  status === 'completed'
                    ? 'bg-emerald-500'
                    : status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-indigo-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            {status === 'listening' && (
              <RefreshCw className="animate-spin text-indigo-300" size={16} />
            )}
            {status === 'completed' && (
              <CheckCircle className="text-emerald-400" size={16} />
            )}
            {status === 'failed' && <AlertCircle className="text-red-400" size={16} />}
            <span>
              {assessmentId && `[ ${assessmentId} ] `}
              {status === 'listening' &&
                'Run the assessment in Aikynetix, then paste console export JSON below and click Process.'}
              {status === 'completed' && 'Results synced to Life Longevity dashboard'}
              {status === 'failed' && (error || 'Processing failed')}
            </span>
          </div>
        </div>
      )}

      <div className="border border-amber-900/40 bg-amber-950/10 rounded-lg p-6 mb-6">
        <h2 className="text-amber-300 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
          <Terminal size={14} />
          Step 2 // Extract Pose Data (Console Method)
        </h2>
        <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
          Aikynetix processes biomechanics client-side — pose data never hits their server.
          Copy the extractor script, paste it into Aikynetix DevTools Console (F12), run your
          assessment, then run <code className="text-amber-300">__LL_AIKYNETIX_EXPORT__()</code>{' '}
          and paste the JSON output below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            type="button"
            onClick={copyExtractorScript}
            className="flex-1 border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] tracking-widest font-bold uppercase py-3 px-5 rounded-lg flex items-center justify-center gap-2"
          >
            <ClipboardCopy size={14} />
            {scriptCopied ? 'Script Copied!' : 'Copy Extractor Script'}
          </button>
        </div>

        <details className="mb-4">
          <summary className="text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer mb-2">
            View extractor script
          </summary>
          <pre className="text-[9px] text-slate-500 bg-[#030712] border border-slate-900 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap">
            {AIKYNETIX_CONSOLE_EXTRACTOR}
          </pre>
        </details>

        <label className="block text-slate-500 text-[10px] uppercase tracking-wider mb-2">
          Paste Aikynetix Data
        </label>
        <textarea
          value={manualJson}
          onChange={(e) => setManualJson(e.target.value)}
          placeholder='Paste JSON from __LL_AIKYNETIX_EXPORT__() or DevTools console output here...'
          rows={8}
          className="w-full bg-[#030712] border border-slate-900 rounded-lg p-3 text-xs text-slate-300 outline-none focus:border-amber-400 font-mono"
        />
        <button
          type="button"
          onClick={processManualJson}
          disabled={!manualJson.trim() || !selectedTest || !clientId || status === 'processing'}
          className="mt-3 border border-amber-500/60 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 text-amber-200 text-[10px] tracking-widest font-bold uppercase py-2.5 px-5 rounded-lg"
        >
          Process Aikynetix Data
        </button>
        <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-wider">
          Routes through Python interpreter when port 8000 is online · falls back to portal rubrics
        </p>
      </div>

      <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-6 mb-6 opacity-80">
        <h2 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-3">
          Optional // Chrome Extension Auto-Capture
        </h2>
        <p className="text-[10px] text-slate-600 mb-3 uppercase tracking-wider">
          Extension may still help for server-side API responses. Primary workflow is console paste
          above.
        </p>
      </div>

      {results && (
        <div className="border border-slate-900 bg-slate-950/40 rounded-lg p-6 mb-6">
          <h2 className="text-white text-xs font-bold tracking-widest uppercase mb-4">
            Step 3 // Assessment Results
          </h2>
          <p className="text-emerald-400/90 text-[10px] tracking-wider uppercase mb-4 border border-emerald-900/40 bg-emerald-950/20 rounded-lg px-3 py-2">
            ✓ Longevity report auto-attached to client dossier — open from coach roster or client profile card
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-slate-900 bg-[#030712] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#00FFFF]">
                {formatScore(results.header?.overall_score)}%
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">
                Overall Score
              </div>
            </div>
            <div className="border border-slate-900 bg-[#030712] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {results.header?.grade || '—'}
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Grade</div>
            </div>
            <div className="border border-slate-900 bg-[#030712] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {formatScore(results.scores?.symmetry)}%
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">
                Symmetry
              </div>
            </div>
            <div className="border border-slate-900 bg-[#030712] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400">
                {formatScore(results.enhanced_metrics?.energy_analysis?.total_efficiency)}%
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">
                Energy Efficiency
              </div>
            </div>
          </div>

          {energyLeaks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase mb-3 text-red-400">
                // Energy Leaks Detected
              </h3>
              {energyLeaks.map((leak, index) => (
                <div
                  key={`${leak.location}-${index}`}
                  className="bg-red-950/20 border border-red-900/60 rounded-lg p-3 mb-2"
                >
                  <p className="text-red-300 text-sm">{leak.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Efficiency loss: {leak.efficiency_loss}%
                  </p>
                </div>
              ))}
            </div>
          )}

          {movementAge && (
            <div className="mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase mb-3">
                Biological Movement Age
              </h3>
              <div className="border border-slate-900 bg-[#030712] rounded-lg p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Overall Movement Age</span>
                  <span className="text-xl font-bold text-white">
                    {movementAge.overall_movement_age} years
                  </span>
                </div>
                <div className="mt-2 text-[11px]">
                  {(movementAge.age_differential ?? 0) > 0 ? (
                    <span className="text-emerald-400">
                      {movementAge.age_differential} years younger than chronological age
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      Movement patterns indicate accelerated aging
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {longevity?.immediate_priorities?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase mb-3">// Action Plan</h3>
              {longevity.immediate_priorities.map((item, index) => (
                <div
                  key={`priority-${index}`}
                  className="border border-slate-900 bg-[#030712] rounded-lg p-3 mb-2"
                >
                  <p className="text-sm text-white font-bold">{item.issue}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{item.impact}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => downloadReport('pdf')}
              className="flex-1 border border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] tracking-widest font-bold uppercase py-3 px-6 rounded-lg flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => downloadReport('json')}
              className="flex-1 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-[10px] tracking-widest font-bold uppercase py-3 px-6 rounded-lg flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download JSON
            </button>
            <button
              type="button"
              onClick={resetPipeline}
              className="border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-[10px] tracking-widest font-bold uppercase py-3 px-6 rounded-lg"
            >
              New Assessment
            </button>
          </div>
        </div>
      )}

      {error && status !== 'listening' && status !== 'processing' && (
        <div className="bg-red-950/20 border border-red-900/60 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={18} />
            <span className="font-bold uppercase tracking-wider text-[10px]">
              Error: {error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
