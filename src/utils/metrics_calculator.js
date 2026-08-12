/** Default metric values when a frame omits a tracking key (legacy streams) */
export const METRIC_DEFAULTS = {
  hip_flexion_angle: 180,
  spine_lateral_displacement: 0,
  shoulder_extension_angle: 180,
  ground_force_est_left: 50,
  ground_force_est_right: 50,
  knee_flexion_angle: 180,
  trunk_lean_angle: 0,
  center_of_mass_drift: 0,
  hip_to_shoulder_torsion: 0,
  ankle_dorsiflexion_angle: 0,
};

const LIBRARY_ID_TO_TEST = {
  1: 'LL001',
  2: 'LL002',
  3: 'LL003',
};

/** Pull time_series / frames from common stream envelope shapes */
export function extractFrames(payload = {}) {
  if (payload?.data?.time_series) return payload.data.time_series;
  if (payload?.data?.frames) return payload.data.frames;
  if (Array.isArray(payload.time_series)) return payload.time_series;
  if (Array.isArray(payload.frames)) return payload.frames;
  return [];
}

export function resolveAssessmentKey(payload = {}, override = '') {
  const raw =
    override ||
    payload.test_id ||
    payload.assessment_name ||
    payload.assessment ||
    payload.track_key ||
    payload.library_id ||
    payload.track_id ||
    '';

  const key = String(raw).trim();
  if (/^\d+$/.test(key)) {
    return LIBRARY_ID_TO_TEST[Number(key)] || key;
  }
  return key;
}

/** @deprecated use resolveAssessmentKey */
export function resolveAssessmentName(payload = {}, override = '') {
  return resolveAssessmentKey(payload, override);
}

export function listAssessments(rubrics = {}) {
  return rubrics.assessments || [];
}

/** Resolve assessment object by test_id, library id, or display name */
export function findAssessment(rubrics = {}, key = '') {
  const assessments = listAssessments(rubrics);
  const normalized = String(key || '').trim().toLowerCase();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    const testId = LIBRARY_ID_TO_TEST[Number(normalized)];
    if (testId) {
      const byId = assessments.find(
        (a) => a.test_id?.toLowerCase() === testId.toLowerCase()
      );
      if (byId) return byId;
    }
  }

  return (
    assessments.find(
      (a) =>
        a.test_id?.toLowerCase() === normalized ||
        a.name?.toLowerCase() === normalized ||
        a.name?.toLowerCase().includes(normalized)
    ) || null
  );
}

function asNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getAssessmentMetricKeys(assessment) {
  const keys = new Set();
  for (const bucket of [assessment?.metrics?.primary, assessment?.metrics?.secondary]) {
    if (bucket && typeof bucket === 'object') {
      Object.keys(bucket).forEach((k) => keys.add(k));
    }
  }
  return [...keys];
}

function framePhase(frame) {
  return String(frame?.phase || frame?.metrics?.phase || '').toLowerCase();
}

function phaseMatches(framePhaseValue, rulePhase) {
  if (!rulePhase) return true;
  const rule = String(rulePhase).toLowerCase();
  if (!framePhaseValue) return true;
  return framePhaseValue.includes(rule) || rule.includes(framePhaseValue);
}

/** Aggregate metric values from frames; phase-aware when frames carry phase tags */
export function collectMetricValues(frames = [], assessment = null) {
  const metricKeys = assessment ? getAssessmentMetricKeys(assessment) : [];
  const values = {};

  for (const key of metricKeys) {
    const samples = [];
    for (const frame of frames) {
      const metrics =
        frame?.metrics && typeof frame.metrics === 'object' ? frame.metrics : frame;
      const n = asNumber(metrics?.[key]);
      if (n != null) samples.push(n);
    }
    if (samples.length) values[key] = Math.max(...samples);
  }

  return values;
}

export function getMetricValueForRule(frames, rule, fallbackValues = {}) {
  const metric = rule.metric;
  const samples = [];

  for (const frame of frames) {
    if (!phaseMatches(framePhase(frame), rule.phase)) continue;
    const metrics =
      frame?.metrics && typeof frame.metrics === 'object' ? frame.metrics : frame;
    const n = asNumber(metrics?.[metric]);
    if (n != null) samples.push(n);
  }

  if (samples.length) return Math.max(...samples);
  return fallbackValues[metric] ?? null;
}

export function scoreBand(value, thresholds = {}) {
  for (const band of ['excellent', 'good', 'fair', 'poor']) {
    const t = thresholds[band];
    if (t && value >= t.min && value <= t.max) return band;
  }
  return 'poor';
}

function parseSimpleCondition(condition, metricValues, primaryValue = null) {
  const expr = String(condition || '').trim();
  if (!expr) return false;

  if (expr.startsWith('value')) {
    const match = expr.match(/value\s*([><=]+)\s*([\d.]+)/i);
    if (!match || primaryValue == null) return false;
    const op = match[1];
    const threshold = Number(match[2]);
    if (op === '>') return primaryValue > threshold;
    if (op === '>=') return primaryValue >= threshold;
    if (op === '<') return primaryValue < threshold;
    if (op === '<=') return primaryValue <= threshold;
    return false;
  }

  const clauses = expr.split(/\s+AND\s+/i);
  return clauses.every((clause) => {
    const match = clause.trim().match(/^([\w_]+)\s*([><=]+)\s*([\d.]+)$/);
    if (!match) return false;
    const [, metric, op, rawThreshold] = match;
    const value = metricValues[metric];
    const threshold = Number(rawThreshold);
    if (value == null) return false;
    if (op === '>') return value > threshold;
    if (op === '>=') return value >= threshold;
    if (op === '<') return value < threshold;
    if (op === '<=') return value <= threshold;
    return false;
  });
}

/** Score assessment using rubrics.json scoring_rules */
export function evaluateAssessmentRubric(assessment, frames = []) {
  const metricValues = collectMetricValues(frames, assessment);
  const scoringRules = assessment?.scoring_rules || [];
  const ruleResults = [];
  const flags = [];
  const energyLeaks = [];
  let weightedScore = 0;
  let totalWeight = 0;

  for (const rule of scoringRules) {
    const value = getMetricValueForRule(frames, rule, metricValues);
    if (value == null) continue;

    const band = scoreBand(value, rule.thresholds);
    const points = rule.scoring?.[band] ?? 0;
    const weight = rule.weight || 0;
    weightedScore += points * weight;
    totalWeight += weight;

    ruleResults.push({
      rule_id: rule.rule_id,
      metric: rule.metric,
      phase: rule.phase,
      value,
      band,
      score: points,
      weight,
    });

    for (const flagRule of rule.compensation_flags || []) {
      if (parseSimpleCondition(flagRule.condition, metricValues, value)) {
        flags.push(flagRule.flag);
      }
    }

    const leak = rule.energy_leak_detection;
    if (leak && parseSimpleCondition(leak.condition, metricValues, value)) {
      energyLeaks.push({
        message: leak.message,
        affected_chain: leak.affected_chain || [],
        metric: rule.metric,
        value,
      });
    }
  }

  const compositeScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const overallBand =
    compositeScore >= 90
      ? 'excellent'
      : compositeScore >= 75
        ? 'good'
        : compositeScore >= 55
          ? 'fair'
          : 'poor';

  const compensationMatches = [];
  for (const pattern of assessment?.compensation_patterns || []) {
    if (parseSimpleCondition(pattern.detection, metricValues)) {
      compensationMatches.push({
        pattern: pattern.pattern,
        root_cause: pattern.root_cause,
        kinetic_chain_impact: pattern.kinetic_chain_impact,
        recommendation: pattern.recommendation,
      });
    }
  }

  const rehabPlans = assessment?.rehabilitation_plans || {};
  const rehabWindow =
    overallBand === 'excellent' || overallBand === 'good'
      ? '2_week'
      : overallBand === 'fair'
        ? '4_week'
        : '8_week';

  return {
    test_id: assessment.test_id,
    assessment_name: assessment.name,
    composite_score: Math.round(compositeScore * 10) / 10,
    overall_band: overallBand,
    metric_values: metricValues,
    rule_results: ruleResults,
    detected_flags: [...new Set(flags)],
    energy_leaks: energyLeaks,
    compensation_patterns: compensationMatches,
    rehabilitation_plan: rehabPlans[rehabWindow] || [],
    rehabilitation_window: rehabWindow,
  };
}

/** Build column arrays from frame.metrics objects (legacy + rubric keys) */
export function extractMetricSeries(frames = [], assessment = null) {
  const keys = assessment
    ? getAssessmentMetricKeys(assessment)
    : Object.keys(METRIC_DEFAULTS);
  const series = Object.fromEntries(keys.map((key) => [key, []]));

  for (const frame of frames) {
    const metrics =
      frame?.metrics && typeof frame.metrics === 'object' ? frame.metrics : frame;
    for (const key of keys) {
      const fallback = METRIC_DEFAULTS[key] ?? null;
      series[key].push(asNumber(metrics?.[key], fallback));
    }
  }

  return series;
}

/** @deprecated legacy summary — prefer evaluateAssessmentRubric */
export function computeAssessmentSummary(assessmentName, series) {
  return collectMetricValues(
    Object.entries(series).flatMap(([key, values]) =>
      (values || []).map((value) => ({ metrics: { [key]: value } }))
    ),
    findAssessment({ assessments: [] }, assessmentName)
  );
}
