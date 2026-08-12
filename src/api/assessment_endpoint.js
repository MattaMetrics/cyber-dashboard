import rubrics from '../core_analytics/rubrics.json' with { type: 'json' };
import {
  evaluateAssessmentRubric,
  extractFrames,
  extractMetricSeries,
  findAssessment,
  listAssessments,
  resolveAssessmentKey,
} from '../utils/metrics_calculator.js';

const PLAN_BY_BAND = {
  excellent: 'Optimal Health Foundation',
  good: 'Maintenance Longevity Track',
  fair: 'Corrective Mobility Protocol',
  poor: 'Intensive Rehabilitation Matrix',
};

const THEME_BY_BAND = {
  excellent: 'optimal_cyan_flow',
  good: 'optimal_cyan_flow',
  fair: 'amber_compensation_alert',
  poor: 'critical_red_leak',
};

const DEFAULT_FLASK_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_ASSESSMENT_API_URL
    ? import.meta.env.VITE_ASSESSMENT_API_URL
    : 'http://localhost:5000';

/**
 * Browser client for the Python Flask assessment service (AikynetixAIInterpreter).
 * Video uploads → POST /api/assess ; progress history → GET /api/progress/:testId
 */
export class AssessmentClient {
  constructor(baseURL = DEFAULT_FLASK_BASE) {
    this.baseURL = String(baseURL).replace(/\/$/, '');
  }

  /** Normalize generate_report() output into portal-friendly shape */
  processResults(data) {
    const report = data?.data ?? data ?? {};
    const header = report.header || {};

    return {
      overview: {
        score: header.overall_score,
        grade: header.grade,
        level: header.performance_level,
        testId: header.test_id,
        testName: header.test_name,
        date: header.date,
      },
      detailedScores: report.scores || {},
      biomechanicalAge: report.biomechanical_age || {},
      kineticChain: report.kinetic_chain || {},
      compensations: report.compensations || [],
      recommendations: report.recommendations || [],
      rehabPlan: report.rehabilitation_plan || {},
      progress: report.progress || {},
      ruleResults: report.rule_results || [],
      telemetry: report.raw_telemetry || {},
      raw: report,
    };
  }

  /**
   * Upload a movement video for rubric scoring via Flask /api/assess.
   * @param {File|Blob} videoFile
   * @param {string} testId  e.g. LL001
   */
  async assessMovement(videoFile, testId) {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('test_id', testId);

    const response = await fetch(`${this.baseURL}/api/assess`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Assessment failed (${response.status})`);
    }

    const payload = await response.json();
    if (payload?.success === false) {
      throw new Error(payload.error || 'Assessment failed');
    }

    return this.processResults(payload);
  }

  /**
   * Evaluate a JSON time-series payload via the local Vite middleware
   * (POST /api/assessment/evaluate) — no video upload required.
   * @param {Record<string, unknown>} payload
   * @param {string} [testId]
   */
  async assessTimeSeries(payload, testId = '') {
    const query = testId
      ? `?test_id=${encodeURIComponent(testId)}`
      : '';
    const response = await fetch(`/api/assessment/evaluate${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || result.ok === false) {
      throw new Error(result?.error?.message || result?.error || 'Evaluation failed');
    }

    return {
      overview: {
        score: result.composite_score,
        grade: result.grade || null,
        level: result.performance_level || result.overall_band,
        testId: result.assessment_executed,
        testName: result.assessment_name,
      },
      detailedScores: result.assessment_summary || {},
      compensations: result.compensation_patterns || [],
      recommendations: result.recommendations || [],
      rehabPlan: result.rehabilitation_plan || [],
      rehabWindow: result.rehabilitation_window,
      detectedFlaws: result.detected_flaws || [],
      ruleResults: result.rule_results || [],
      renderEngine: result.render_engine_trigger,
      raw: result,
    };
  }

  async getProgressHistory(testId) {
    const response = await fetch(
      `${this.baseURL}/api/progress/${encodeURIComponent(testId)}`
    );

    if (!response.ok) {
      throw new Error(`Progress fetch failed (${response.status})`);
    }

    return response.json();
  }
}

export default AssessmentClient;

/**
 * Evaluate a structured tracking stream payload (AiKYNETIX / phone API shape).
 * @param {Record<string, unknown>} payload
 * @param {string} [assessmentOverride]
 */
export function evaluateTrackingStream(payload = {}, assessmentOverride = '') {
  const assessmentKey = resolveAssessmentKey(payload, assessmentOverride);
  const assessment = findAssessment(rubrics, assessmentKey);
  const frames = extractFrames(payload);

  if (!assessment) {
    return {
      ok: false,
      status: 'error',
      error: {
        code: 'UNKNOWN_ASSESSMENT',
        message: `Assessment '${assessmentKey || '(missing)'}' is not in rubrics.json.`,
        supported: listAssessments(rubrics).map((a) => a.test_id),
      },
      assessment_executed: assessmentKey || null,
      detected_flaws: [],
      prescribed_wellness_plan: null,
      cyber_render_ready: false,
      render_engine_trigger: { theme: 'idle_slate', active_mesh_warp: false },
    };
  }

  if (!frames.length) {
    return {
      ok: false,
      status: 'error',
      error: { code: 'EMPTY_TIME_SERIES', message: 'No time-series frame data captured.' },
      assessment_executed: assessment.test_id,
      detected_flaws: [],
      prescribed_wellness_plan: null,
      cyber_render_ready: false,
      render_engine_trigger: { theme: 'idle_slate', active_mesh_warp: false },
    };
  }

  const evaluation = evaluateAssessmentRubric(assessment, frames);
  const series = extractMetricSeries(frames, assessment);
  const band = evaluation.overall_band;
  const detectedFlaws = [
    ...evaluation.detected_flags,
    ...evaluation.compensation_patterns.map((p) => p.pattern),
    ...evaluation.energy_leaks.map((e) => e.message),
  ];

  return {
    ok: true,
    status: 'evaluated',
    assessment_executed: assessment.test_id,
    assessment_name: assessment.name,
    athlete_code: payload.athlete_code || payload.access_code || null,
    source: payload.source || 'tracking_stream',
    frame_count: frames.length,
    global_config: rubrics.global_config || null,
    composite_score: evaluation.composite_score,
    overall_band: band,
    assessment_summary: evaluation.metric_values,
    metric_series: series,
    rule_results: evaluation.rule_results,
    detected_flaws: detectedFlaws,
    compensation_patterns: evaluation.compensation_patterns,
    energy_leaks: evaluation.energy_leaks,
    rehabilitation_plan: evaluation.rehabilitation_plan,
    rehabilitation_window: evaluation.rehabilitation_window,
    prescribed_wellness_plan: PLAN_BY_BAND[band] || PLAN_BY_BAND.fair,
    cyber_render_ready: true,
    render_engine_trigger: {
      theme: THEME_BY_BAND[band] || THEME_BY_BAND.fair,
      active_mesh_warp: detectedFlaws.length > 0,
    },
  };
}

/** Vite dev-server middleware — POST /api/assessment/evaluate */
export function assessmentEvaluateMiddleware() {
  return (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/assessment/evaluate' || req.method !== 'POST') {
      next();
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const query = new URL(req.url, 'http://localhost').searchParams;
        const assessmentOverride =
          query.get('test_id') || query.get('assessment_name') || '';
        const result = evaluateTrackingStream(payload, assessmentOverride);

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = result.ok ? 200 : 422;
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
    });
  };
}
