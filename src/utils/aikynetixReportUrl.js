/**
 * Resolve the best URL for embedding / opening the original Aikynetix web report.
 */

const AIKYNETIX_WEB_URL =
  import.meta.env.VITE_AIKYNETIX_WEB_URL || 'https://aikynetix.com';

const BLOCKED_SOURCE = /manual_paste|localhost:8000\/api/i;

export function isAikynetixWebReportUrl(raw) {
  const url = String(raw || '').trim();
  if (!url || BLOCKED_SOURCE.test(url)) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (!/aikynetix/i.test(url)) return false;
  if (/\/api\//i.test(url) && !/\/app\//i.test(url)) return false;
  return true;
}

export function resolveAikynetixReportUrl(client) {
  const stored = client?.longevityReport || {};
  const candidates = [
    stored.aikynetixReportUrl,
    stored.aikynetixWebUrl,
    client?.aikynetixReportUrl,
  ];

  for (const raw of candidates) {
    if (isAikynetixWebReportUrl(raw)) return String(raw).trim();
  }

  const sourceUrl = String(stored.aikynetixSourceUrl || '').trim();
  if (isAikynetixWebReportUrl(sourceUrl)) return sourceUrl;

  return AIKYNETIX_WEB_URL;
}

export function resolveAikynetixSourceLabel(client) {
  const stored = client?.longevityReport || {};
  const source = String(stored.aikynetixSourceUrl || '').trim();
  if (source && !BLOCKED_SOURCE.test(source)) return source;
  return resolveAikynetixReportUrl(client);
}

export function buildPipelineSnapshot(results) {
  if (!results || typeof results !== 'object') return null;
  return {
    assessmentId: results.assessment_id || '',
    testId: results.test_id || '',
    clientId: results.client_id || '',
    header: results.header || {},
    scores: results.scores || {},
    rule_results: results.rule_results || [],
    enhanced_metrics: results.enhanced_metrics || {},
    metadata: results.metadata || {},
    time_series:
      results.time_series ||
      results.frames ||
      results.raw_telemetry?.time_series ||
      results.raw_aikynetix?.time_series ||
      null,
    raw_aikynetix: results.raw_aikynetix || results.aikynetix_response || null,
    capturedAt: new Date().toISOString(),
  };
}

export { AIKYNETIX_WEB_URL };
