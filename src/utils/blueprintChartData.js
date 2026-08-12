import { extractFrames } from './metrics_calculator';

const JOINT_ALIASES = {
  hip: ['hip', 'pelvis'],
  knee: ['knee'],
  shoulder: ['shoulder'],
  ankle: ['ankle'],
  spine: ['spine', 'thoracic', 'lumbar', 'trunk'],
};

function formatTimestamp(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = (safe % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
}

function formatDegrees(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toFixed(1)}°`;
}

function normalizeKey(key) {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function matchesJoint(key, jointHint) {
  const norm = normalizeKey(key);
  const hints = JOINT_ALIASES[jointHint] || [jointHint];
  return hints.some((hint) => norm.includes(hint));
}

function isLeftKey(key) {
  return /left|_l$|^l_|_l_/i.test(String(key));
}

function isRightKey(key) {
  return /right|_r$|^r_|_r_/i.test(String(key));
}

function readMetricValue(source, key) {
  if (!source || key == null) return null;
  const val = source[key];
  if (val == null) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function findJointMetricKeys(sampleMetrics, jointHint = 'hip') {
  const keys = Object.keys(sampleMetrics || {});
  const leftKey = keys.find((key) => matchesJoint(key, jointHint) && isLeftKey(key));
  const rightKey = keys.find((key) => matchesJoint(key, jointHint) && isRightKey(key));

  if (leftKey && rightKey) return { leftKey, rightKey };

  const generic = keys.filter((key) => matchesJoint(key, jointHint));
  return {
    leftKey: leftKey || generic[0] || null,
    rightKey: rightKey || generic[1] || generic[0] || null,
  };
}

function seriesFromFrames(frames, jointHint = 'hip') {
  if (!Array.isArray(frames) || frames.length === 0) return null;

  const firstMetrics =
    (frames[0]?.metrics && typeof frames[0].metrics === 'object' ? frames[0].metrics : null) ||
    frames[0] ||
    {};
  const { leftKey, rightKey } = findJointMetricKeys(firstMetrics, jointHint);
  if (!leftKey && !rightKey) return null;

  const data = frames.map((frame, index) => {
    const metrics =
      (frame?.metrics && typeof frame.metrics === 'object' ? frame.metrics : frame) || {};
    const timeSec =
      Number(frame?.time ?? frame?.timestamp ?? frame?.t ?? index * 0.1) || index * 0.1;

    return {
      timestamp: formatTimestamp(timeSec),
      timeSec,
      index,
      left_value: readMetricValue(metrics, leftKey) ?? readMetricValue(metrics, leftKey?.replace('right', 'left')) ?? 0,
      right_value: readMetricValue(metrics, rightKey) ?? readMetricValue(metrics, rightKey?.replace('left', 'right')) ?? 0,
    };
  });

  const values = data.flatMap((row) => [row.left_value, row.right_value]);
  const rangeMin = Math.min(...values, -10);
  const rangeMax = Math.max(...values, 10);
  const last = data[data.length - 1];

  return {
    data,
    activeJointLabel: (jointHint || 'HIP').toUpperCase(),
    currentLeftVal: formatDegrees(last?.left_value),
    currentRightVal: formatDegrees(last?.right_value),
    rangeMin: Math.floor(rangeMin - 5),
    rangeMax: Math.ceil(rangeMax + 5),
    leftKey,
    rightKey,
  };
}

function seriesFromAngleArrays(source, jointHint = 'hip') {
  const angles = source?.angles || source?.joint_angles || {};
  const temporal = source?.temporal || {};
  const leftSeries =
    temporal?.left_hip_angles ||
    temporal?.left_angles ||
    temporal?.[`${jointHint}_left`] ||
    null;
  const rightSeries =
    temporal?.right_hip_angles ||
    temporal?.right_angles ||
    temporal?.[`${jointHint}_right`] ||
    null;

  if (!Array.isArray(leftSeries) && !Array.isArray(rightSeries)) return null;

  const length = Math.max(leftSeries?.length || 0, rightSeries?.length || 0, 1);
  const duration = Number(temporal.duration || length * 0.1) || length * 0.1;

  const data = Array.from({ length }, (_, index) => {
    const timeSec = (index / Math.max(length - 1, 1)) * duration;
    return {
      timestamp: formatTimestamp(timeSec),
      timeSec,
      index,
      left_value: Number(leftSeries?.[index] ?? angles?.hip_flexion ?? 0),
      right_value: Number(rightSeries?.[index] ?? angles?.hip_extension ?? 0),
    };
  });

  const values = data.flatMap((row) => [row.left_value, row.right_value]);
  const last = data[data.length - 1];

  return {
    data,
    activeJointLabel: (jointHint || 'HIP').toUpperCase(),
    currentLeftVal: formatDegrees(last?.left_value),
    currentRightVal: formatDegrees(last?.right_value),
    rangeMin: Math.floor(Math.min(...values, -26) - 5),
    rangeMax: Math.ceil(Math.max(...values, 74) + 5),
  };
}

function generateFallbackSeries({ leftBase = -7.8, rightBase = 5.8, points = 64, duration = 8 } = {}) {
  const data = Array.from({ length: points }, (_, index) => {
    const timeSec = (index / Math.max(points - 1, 1)) * duration;
    const wave = Math.sin(index / 6) * 12 + Math.cos(index / 14) * 6;
    return {
      timestamp: formatTimestamp(timeSec),
      timeSec,
      index,
      left_value: Number((leftBase + wave * 0.85).toFixed(2)),
      right_value: Number((rightBase + wave * 1.05 + 4).toFixed(2)),
    };
  });

  const last = data[data.length - 1];
  return {
    data,
    activeJointLabel: 'HIP',
    currentLeftVal: formatDegrees(last.left_value),
    currentRightVal: formatDegrees(last.right_value),
    rangeMin: -26,
    rangeMax: 74,
    isFallback: true,
  };
}

function inferJointHint(phaseName = '') {
  const text = String(phaseName).toLowerCase();
  if (/knee/.test(text)) return 'knee';
  if (/shoulder|punch/.test(text)) return 'shoulder';
  if (/ankle|sprint|drive/.test(text)) return 'ankle';
  if (/spine|trunk|rotation/.test(text)) return 'spine';
  return 'hip';
}

/** Build chart payload from pipeline snapshot / intercepted JSON */
export function buildBlueprintChartPayload(snapshot, { phaseName = '' } = {}) {
  if (!snapshot) return generateFallbackSeries();

  const jointHint = inferJointHint(phaseName);
  const frameSources = [
    snapshot.time_series,
    snapshot.frames,
    snapshot.raw_aikynetix,
    snapshot.metadata?.time_series,
    snapshot.metadata?.raw_aikynetix,
    snapshot,
  ];

  for (const source of frameSources) {
    const frames = extractFrames(source);
    const fromFrames = seriesFromFrames(frames, jointHint);
    if (fromFrames?.data?.length) return fromFrames;
  }

  for (const source of frameSources) {
    if (!source || typeof source !== 'object') continue;
    const fromArrays = seriesFromAngleArrays(source, jointHint);
    if (fromArrays?.data?.length) return fromArrays;
  }

  const rules = snapshot.rule_results || [];
  const leftRule = rules.find((r) => /left|l_/i.test(String(r.metric || '')));
  const rightRule = rules.find((r) => /right|r_/i.test(String(r.metric || '')));
  const leftBase = Number(leftRule?.raw_score ?? -7.8);
  const rightBase = Number(rightRule?.raw_score ?? 5.8);

  return generateFallbackSeries({
    leftBase: Number.isFinite(leftBase) ? leftBase : -7.8,
    rightBase: Number.isFinite(rightBase) ? rightBase : 5.8,
  });
}

/** Map chart row index → video frame index */
export function chartIndexToFrame(row, totalFrames = 128) {
  if (!row) return 1;
  if (typeof row.index === 'number') {
    const maxIndex = Math.max(totalFrames - 1, 1);
    return Math.min(totalFrames, Math.max(1, Math.round((row.index / maxIndex) * totalFrames)));
  }
  return 1;
}
