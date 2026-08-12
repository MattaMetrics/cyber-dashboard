/**
 * Maps legacy phase arrays + pipeline JSON into DeepCyberDashboard modelDataPhases
 * without dropping metrics — specs, gauges, and summaries are built dynamically.
 */

import { DEFAULT_PHASES } from './phaseDefaults';
import {
  resolveTestConfigFromResults,
  buildPhasesFromTestConfig,
  extractTelemetryPool,
  getTestConfigByKey,
} from '../data/testConfigDictionary';

export function metricToPercent(val) {
  const raw = String(val ?? '');
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(num)) return 55;
  if (num <= 1 && !raw.includes('%')) return Math.round(Math.min(100, num * 100));
  if (num <= 100) return Math.round(num);
  return Math.min(100, Math.round(num / 1.8));
}

export function bandFromPercent(percent) {
  if (percent >= 90) return 'OPTIMAL';
  if (percent >= 75) return 'NOMINAL';
  if (percent >= 60) return 'MODERATE';
  return 'FOCUS';
}

export function slugifyMetricKey(label) {
  return String(label || 'metric')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function humanizeSpecKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toUpperCase();
}

/** Parse "SHOULDER TURN: 94.0°" → gauge object */
export function parseAlignmentToGauge(alignment) {
  const str = String(alignment || '').trim();
  const match = str.match(/^(.+?):\s*(.+)$/);
  const label = (match ? match[1] : str).trim().toUpperCase();
  const val = match ? match[2].trim() : '—';
  const percent = metricToPercent(val);
  return {
    label,
    val,
    percent,
    status: bandFromPercent(percent),
  };
}

/** Every phase metric → specs record (no truncation) */
export function metricsToSpecs(metrics = []) {
  const specs = {};
  (metrics || []).forEach((metric) => {
    const key = slugifyMetricKey(metric.label);
    if (!key) return;
    specs[key] = String(metric.val ?? '—');
  });
  return specs;
}

/** Metrics → gauge rows (preserves target/status when present) */
export function metricsToGauges(metrics = []) {
  return (metrics || []).map((metric) => {
    const percent = metricToPercent(metric.val);
    return {
      label: String(metric.label || 'METRIC').toUpperCase(),
      val: String(metric.val ?? '—'),
      percent,
      status: String(metric.target || bandFromPercent(percent)).toUpperCase(),
    };
  });
}

/**
 * Combine alignment strings + metric rows into one gauge list.
 * Alignments first; metrics whose label is not already present are appended.
 */
export function buildGaugesForPhase(metrics = [], alignments = []) {
  const fromAlignments = (alignments || []).map(parseAlignmentToGauge);
  const seen = new Set(fromAlignments.map((g) => g.label));
  const fromMetrics = metricsToGauges(metrics).filter((g) => {
    if (seen.has(g.label)) return false;
    seen.add(g.label);
    return true;
  });
  return [...fromAlignments, ...fromMetrics];
}

const SUMMARY_KEYS = ['rom', 'quality', 'stability', 'risk'];

export function summaryItemsToSummaries(summaryItems = []) {
  const defaults = {
    rom: 'COMPLETE',
    quality: 'OPTIMAL',
    stability: 'NOMINAL',
    risk: 'LOW',
  };
  if (!Array.isArray(summaryItems) || summaryItems.length === 0) {
    return { ...defaults };
  }

  const summaries = { ...defaults };
  summaryItems.forEach((item, index) => {
    const key =
      index < SUMMARY_KEYS.length
        ? SUMMARY_KEYS[index]
        : slugifyMetricKey(item.label) || `metric_${index + 1}`;
    summaries[key] = String(item.val ?? '—').toUpperCase();
  });
  return summaries;
}

export function extractPhaseName(title) {
  const text = String(title || 'PHASE');
  if (text.includes('//')) {
    return text.split('//').pop().trim();
  }
  return text.replace(/^PHASE\s*\d*\s*/i, '').trim() || 'CAPTURE';
}

/** Single legacy/pipeline phase block → deep cyber phase object */
export function phaseToDeepCyberBlock(phase, { globalSummaries, profilePhotoUrl, phaseIndex }) {
  const metrics = phase?.metrics || [];
  const alignments = phase?.alignments || [];

  return {
    name: extractPhaseName(phase?.title),
    specs: phase?.specs || metricsToSpecs(metrics),
    gauges: phase?.gauges || buildGaugesForPhase(metrics, alignments),
    summaries: phase?.summaries || globalSummaries || summaryItemsToSummaries(),
    imageUrl:
      phase?.imageUrl ||
      (phaseIndex === 0 ? profilePhotoUrl : '') ||
      '',
    diagnosticCue:
      phase?.diagnosticCue ||
      `Analyzing vector paths for ${extractPhaseName(phase?.title)}. All incoming telemetry nodes mapped with no overflow truncation.`,
    videoUrl: phase?.videoUrl || '',
    totalFrames: phase?.totalFrames || 128,
  };
}

/**
 * Build { phase1, phase2, ... } from phases array.
 * Pads with DEFAULT_PHASES when fewer than 3; keeps extra phases as phase4, phase5, ...
 */
export function buildModelDataPhases({
  phases = [],
  summaryItems = [],
  profilePhotoUrl = '',
  storedModelDataPhases = null,
}) {
  if (
    storedModelDataPhases &&
    typeof storedModelDataPhases === 'object' &&
    Object.keys(storedModelDataPhases).length > 0
  ) {
    return storedModelDataPhases;
  }

  const globalSummaries = summaryItemsToSummaries(summaryItems);
  const sourcePhases = phases.length > 0 ? phases : DEFAULT_PHASES.map((p) => ({ ...p }));
  const isDictionaryPhases = sourcePhases.some((p) => p.phaseId);

  const padded = [...sourcePhases];
  if (!isDictionaryPhases) {
    while (padded.length < Math.max(3, sourcePhases.length)) {
      const template = DEFAULT_PHASES[padded.length % DEFAULT_PHASES.length];
      padded.push({ ...template, imageUrl: padded.length === 0 ? profilePhotoUrl : '' });
    }
  }

  const modelDataPhases = {};
  padded.forEach((phase, index) => {
    const key = `phase${index + 1}`;
    modelDataPhases[key] = phaseToDeepCyberBlock(phase, {
      globalSummaries,
      profilePhotoUrl,
      phaseIndex: index,
    });
  });

  return modelDataPhases;
}

/** Parse raw Aikynetix / interpreter payload → phase with ALL rule_results kept */
export function pipelineResultsToPhase(results, profilePhotoUrl = '') {
  const header = results?.header || {};
  const scores = results?.scores || {};
  const ruleResults = Array.isArray(results?.rule_results) ? results.rule_results : [];

  const scoreEntries = Object.entries(scores).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').toUpperCase(),
    val: Number.isFinite(Number(value)) ? Number(value).toFixed(1) : String(value),
    target: bandFromPercent(metricToPercent(value)),
  }));

  const ruleMetrics = ruleResults.map((rule) => ({
    label: String(rule.metric || 'METRIC').replace(/_/g, ' ').toUpperCase(),
    val: Number.isFinite(Number(rule.raw_score))
      ? Number(rule.raw_score).toFixed(1)
      : String(rule.raw_score ?? '—'),
    target: String(rule.band || rule.status || bandFromPercent(rule.raw_score)).toUpperCase(),
  }));

  const alignments = ruleResults.map((rule) => {
    const label = String(rule.metric || 'METRIC').replace(/_/g, ' ').toUpperCase();
    const val = Number.isFinite(Number(rule.raw_score))
      ? `${Number(rule.raw_score).toFixed(1)}`
      : String(rule.raw_score ?? '—');
    return `${label}: ${val}`;
  });

  if (header.overall_score != null) {
    alignments.unshift(`OVERALL SCORE: ${Number(header.overall_score).toFixed(1)}`);
  }

  const metrics = [...scoreEntries, ...ruleMetrics];

  return {
    title: `PHASE // ${String(header.test_name || results.test_id || 'ASSESSMENT').toUpperCase()}`,
    duration: 'CAPTURE COMPLETE',
    imageUrl: profilePhotoUrl,
    videoUrl: extractVideoUrlFromIntercept(results),
    totalFrames: extractTotalFramesFromIntercept(results),
    metrics,
    alignments,
  };
}

/**
 * Dictionary-driven multi-phase build — matches test_id / test_name to UI layout,
 * then merges live JSON telemetry into each phase's specs and gauges.
 */
export function pipelineResultsToPhases(results, profilePhotoUrl = '') {
  const config = resolveTestConfigFromResults(results);
  const singlePhase = pipelineResultsToPhase(results, profilePhotoUrl);
  const telemetry = extractTelemetryPool(results, singlePhase);
  return buildPhasesFromTestConfig(config, telemetry, profilePhotoUrl);
}

/** Rebuild phases from a stored test config key (dev simulator / manual refresh) */
export function rebuildPhasesForTestKey(testConfigKey, storedPhases = [], profilePhotoUrl = '') {
  const config = getTestConfigByKey(testConfigKey);
  const firstPhase = storedPhases[0] || {};
  const telemetry = {
    metrics: storedPhases.flatMap((p) => p.metrics || []),
    alignments: storedPhases.flatMap((p) => p.alignments || []),
    scores: {},
    ruleResults: [],
    videoUrl: firstPhase.videoUrl || '',
    totalFrames: firstPhase.totalFrames || 128,
  };
  return buildPhasesFromTestConfig(config, telemetry, profilePhotoUrl);
}

export function buildDeepCyberDashboardPayload(client, clientCode, baseReport) {
  const stored = client?.longevityReport || {};
  const phases = baseReport?.phases || DEFAULT_PHASES;
  const summaryItems = baseReport?.summaryItems || [];
  const testConfig = stored.testConfigKey
    ? getTestConfigByKey(stored.testConfigKey)
    : resolveTestConfigFromResults({
        test_id: stored.testId,
        header: { test_name: stored.testName },
      });

  const modelDataPhases = buildModelDataPhases({
    phases,
    summaryItems,
    profilePhotoUrl: baseReport?.profilePhotoUrl || '',
    storedModelDataPhases: stored.modelDataPhases,
  });

  const resolvedVideoUrl = stored.videoUrl || resolveClientVideoUrl(client) || '';
  const resolvedTotalFrames = stored.totalFrames || 128;

  if (resolvedVideoUrl) {
    Object.keys(modelDataPhases).forEach((key) => {
      if (!modelDataPhases[key].videoUrl) {
        modelDataPhases[key] = {
          ...modelDataPhases[key],
          videoUrl: resolvedVideoUrl,
          totalFrames: modelDataPhases[key].totalFrames || resolvedTotalFrames,
        };
      }
    });
  }

  return {
    clientName: baseReport?.clientName || client?.name || 'Unknown Client',
    clientCode,
    modelDataPhases,
    profilePhotoUrl: baseReport?.profilePhotoUrl || '',
    videoUrl: resolvedVideoUrl,
    totalFrames: resolvedTotalFrames,
    mainTitle: stored.mainTitle || testConfig.mainTitle,
    testConfigKey: stored.testConfigKey || testConfig.key,
    testId: stored.testId || '',
    testName: stored.testName || '',
    archetypeVector: baseReport?.archetypeVector || '',
    caseLog: baseReport?.caseLog || '',
    narrativeLayout: baseReport?.narrativeLayout || 'separate',
    trainingProfile: stored.trainingProfile || client?.archetype || 'Load Balance Mod .A',
  };
}

/** Serialize modelDataPhases for localStorage (already plain JSON) */
export function serializeModelDataPhases(modelDataPhases) {
  return JSON.parse(JSON.stringify(modelDataPhases || {}));
}

const VIDEO_URL_BLOCKLIST = /manual_paste|aikynetix\.com\/(?:app|analysis)|localhost:8000\/api/i;

/** True when a string is likely a direct playable video source */
export function isPlayableVideoSource(raw) {
  const url = String(raw || '').trim();
  if (!url) return false;
  if (VIDEO_URL_BLOCKLIST.test(url)) return false;
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)) return true;
  if (/^(blob:|data:video)/i.test(url)) return true;
  if (/drive\.google\.com|dropbox\.com|w3schools\.com|cloudfront\.net|amazonaws\.com/i.test(url)) {
    return true;
  }
  return /^https?:\/\//i.test(url) && /video|media|stream|mp4|reel|uplink|drive|dropbox/i.test(url);
}

/** Pull video URL from intercepted Aikynetix / interpreter JSON (multiple key paths) */
export function extractVideoUrlFromIntercept(results) {
  if (!results || typeof results !== 'object') return '';

  const meta = results.metadata || {};
  const candidates = [
    results.videoUrl,
    results.video_url,
    meta.videoUrl,
    meta.video_url,
    meta.media_url,
    meta.stream_url,
    results.media_url,
    results.stream_url,
    results.raw_telemetry?.video_url,
    results.raw_telemetry?.videoUrl,
  ];

  for (const raw of candidates) {
    const url = String(raw || '').trim();
    if (isPlayableVideoSource(url)) return url;
  }

  const nested = results.aikynetix_response || results.aikynetixResponse || results.raw_aikynetix;
  if (nested && typeof nested === 'object') {
    for (const [key, val] of Object.entries(nested)) {
      if (!/video|mp4|media|stream|reel|clip/i.test(key)) continue;
      const url = String(val || '').trim();
      if (isPlayableVideoSource(url)) return url;
    }
  }

  return '';
}

export function extractTotalFramesFromIntercept(results, fallback = 128) {
  const meta = results?.metadata || {};
  const candidates = [
    results?.frame_count,
    results?.frameCount,
    meta?.frame_count,
    meta?.total_frames,
    results?.progress?.frame_count,
  ];
  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return Math.round(num);
  }
  return fallback;
}

/** Resolve best video URL from dossier + stored report */
export function resolveClientVideoUrl(client) {
  if (!client) return '';
  const stored = client.longevityReport || {};
  if (stored.videoUrl && isPlayableVideoSource(stored.videoUrl)) return stored.videoUrl;
  if (isPlayableVideoSource(client.reportUrl)) return String(client.reportUrl).trim();
  return '';
}
