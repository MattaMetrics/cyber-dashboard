import { Award, Target, ShieldCheck, Activity } from 'lucide-react';
import {
  buildModelDataPhases,
  pipelineResultsToPhase,
  pipelineResultsToPhases,
  serializeModelDataPhases,
  extractVideoUrlFromIntercept,
  extractTotalFramesFromIntercept,
  isPlayableVideoSource,
} from './deepCyberPhaseParser';
import { resolveTestConfigFromResults } from '../data/testConfigDictionary';
import { buildPipelineSnapshot } from './aikynetixReportUrl';
import { DEFAULT_PHASES } from './phaseDefaults';

export { DEFAULT_PHASES } from './phaseDefaults';

/** Data blueprint for client profile state — physical baseline + training outputs */
export const initialClientDossierTemplate = {
  clientName: 'Alex Rivera',
  accessCode: '111111',
  // New physical baseline tracking nodes
  clientAge: 62,
  clientGender: 'Male',
  clientHeight: '5ft 10in',
  clientWeight: '185 lbs',
  // Extracted training outputs
  coach_plan_text: '',
  trainingLogPhase1: '',
  trainingLogPhase2: '',
  somaticHealthTips: '',
};

/** Merge persisted client row with dossier template defaults */
export function normalizeClientDossier(client = {}, accessCode = '') {
  const t = initialClientDossierTemplate;
  const coachPlan = client?.longevityReport?.coachPlan || client?.longevityReport?.geminiPlan || {};

  return {
    ...client,
    name: client.name || t.clientName,
    accessCode: accessCode || client.accessCode || t.accessCode,
    clientAge: client.clientAge ?? t.clientAge,
    clientGender: client.clientGender || t.clientGender,
    clientHeight: client.clientHeight || t.clientHeight,
    clientWeight: client.clientWeight || t.clientWeight,
    coach_plan_text:
      client.coach_plan_text || coachPlan.gideon_assessment_summary || t.coach_plan_text,
    trainingLogPhase1:
      client.trainingLogPhase1 || client.longevityReport?.trainingLogPhase1 || t.trainingLogPhase1,
    trainingLogPhase2:
      client.trainingLogPhase2 || client.longevityReport?.trainingLogPhase2 || t.trainingLogPhase2,
    somaticHealthTips:
      client.somaticHealthTips || client.longevityReport?.somaticHealthTips || t.somaticHealthTips,
  };
}

/** Build a new localDatabase client row from the dossier template */
export function createClientDossierFromTemplate(overrides = {}) {
  const merged = { ...initialClientDossierTemplate, ...overrides };
  return normalizeClientDossier(
    {
      name: merged.clientName,
      clientAge: merged.clientAge,
      clientGender: merged.clientGender,
      clientHeight: merged.clientHeight,
      clientWeight: merged.clientWeight,
      coach_plan_text: merged.coach_plan_text,
      trainingLogPhase1: merged.trainingLogPhase1,
      trainingLogPhase2: merged.trainingLogPhase2,
      somaticHealthTips: merged.somaticHealthTips,
      ...overrides,
    },
    merged.accessCode
  );
}

/** Persist dossier training + baseline fields onto client + longevityReport */
export function mergeDossierFieldsForSave(client, dossierFields = {}) {
  const normalized = normalizeClientDossier({ ...client, ...dossierFields });
  const existingReport = client?.longevityReport || {};

  return {
    ...client,
    ...normalized,
    longevityReport: {
      ...existingReport,
      trainingLogPhase1: normalized.trainingLogPhase1,
      trainingLogPhase2: normalized.trainingLogPhase2,
      somaticHealthTips: normalized.somaticHealthTips,
      caseLog: normalized.coach_plan_text || existingReport.caseLog || client?.notes || '',
    },
  };
}

const SUMMARY_ICON_CYCLE = [Award, Target, ShieldCheck, Activity];

function scoreBand(value) {
  const numeric = parseInt(String(value || '').replace(/\D/g, ''), 10);
  if (Number.isNaN(numeric)) return 'PENDING';
  if (numeric >= 90) return 'OPTIMAL';
  if (numeric >= 75) return 'NOMINAL';
  if (numeric >= 60) return 'MODERATE';
  return 'FOCUS';
}

function pipelineBand(score) {
  const num = Number(score);
  if (!Number.isFinite(num)) return 'Pending';
  if (num >= 90) return 'Optimal';
  if (num >= 75) return 'Nominal';
  if (num >= 60) return 'Moderate';
  return 'Focus';
}

function formatPipelineScore(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : '—';
}

export function buildSummaryFromMetrics(metrics = {}) {
  return [
    { label: 'DEEP SQUAT MOBILITY', val: scoreBand(metrics.squat), icon: Award },
    { label: 'SINGLE-LEG STABILITY', val: scoreBand(metrics.land), icon: Target },
    { label: 'KINETIC POWER (CMJ)', val: scoreBand(metrics.cmj), icon: ShieldCheck },
    { label: 'MULTI-PLANE AGILITY', val: scoreBand(metrics.agility), icon: Activity },
  ];
}

/** Reattach Lucide icons after localStorage hydration */
export function rehydrateSummaryItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return buildSummaryFromMetrics();
  }
  return items.map((item, index) => ({
    ...item,
    icon: item.icon || SUMMARY_ICON_CYCLE[index % SUMMARY_ICON_CYCLE.length],
  }));
}

export function getClientProfilePhoto(client) {
  return (
    client?.longevityReport?.profilePhotoUrl ||
    client?.biometricPhotoUrl ||
    client?.assessmentPhoto ||
    ''
  );
}

export function syncNarrativeFromDossier(client, report = {}) {
  return {
    ...report,
    profilePhotoUrl: getClientProfilePhoto(client),
    archetypeVector: client?.desc || report.archetypeVector || '',
    caseLog: client?.notes || report.caseLog || '',
    narrativeLayout: report.narrativeLayout || client?.longevityReport?.narrativeLayout || 'separate',
  };
}

/** Convert Aikynetix / interpreter JSON into report phases + summary */
export function buildLongevityReportFromPipelineResults(results, client, clientCode) {
  const header = results?.header || {};
  const enhanced = results?.enhanced_metrics || {};
  const movementAge = enhanced.movement_age || results?.biomechanical_age || {};
  const energy = enhanced.energy_analysis || results?.energy_analysis || {};
  const photoUrl = getClientProfilePhoto(client);

  const testConfig = resolveTestConfigFromResults(results);
  const phaseList = pipelineResultsToPhases(results, photoUrl);
  const phase = phaseList[0] || pipelineResultsToPhase(results, photoUrl);

  const summaryItems = [
    { label: 'OVERALL GRADE', val: String(header.grade || '—').toUpperCase(), icon: Award },
    {
      label: 'MOVEMENT QUALITY',
      val: String(header.performance_level || 'OPTIMAL').toUpperCase(),
      icon: Target,
    },
    {
      label: 'MOVEMENT AGE',
      val: String(
        movementAge.overall_movement_age ??
          movementAge.biological_movement_age ??
          movementAge.chronological_delta ??
          '—'
      ),
      icon: ShieldCheck,
    },
    {
      label: 'ENERGY LEAK INDEX',
      val: String(energy.risk_level || energy.leak_severity || energy.severity || 'LOW').toUpperCase(),
      icon: Activity,
    },
  ];

  return syncNarrativeFromDossier(client, {
    clientName: client?.name || 'Unknown Client',
    clientCode,
    phases: phaseList.length > 0 ? phaseList : [phase],
    summaryItems,
    assessmentId: results?.assessment_id || '',
    testId: results?.test_id || '',
    testName: header.test_name || '',
    testConfigKey: testConfig.key,
    mainTitle: testConfig.mainTitle,
    aikynetixSourceUrl: results?.metadata?.source_url || '',
    pipelineSnapshot: buildPipelineSnapshot(results),
    lastPipelineAt: new Date().toISOString(),
    source: 'pipeline',
  });
}

/** Merge pipeline output onto an existing dossier report (replaces motion phases) */
export function applyPipelineResultsToClient(client, clientCode, results, { replacePhases = true } = {}) {
  const pipelineReport = buildLongevityReportFromPipelineResults(results, client, clientCode);
  const existing = client?.longevityReport || {};
  const scores = results?.scores || {};

  const phases = replacePhases
    ? pipelineReport.phases
    : [...(existing.phases || DEFAULT_PHASES), ...pipelineReport.phases].slice(-3);

  const videoUrl =
    extractVideoUrlFromIntercept(results) ||
    existing.videoUrl ||
    (isPlayableVideoSource(client.reportUrl) ? String(client.reportUrl).trim() : '');
  const totalFrames = extractTotalFramesFromIntercept(results, existing.totalFrames || 128);

  const phasesWithMedia = phases.map((phase) => ({
    ...phase,
    videoUrl: phase.videoUrl || videoUrl,
    totalFrames: phase.totalFrames || totalFrames,
  }));

  const longevityReport = {
    ...existing,
    ...pipelineReport,
    phases: phasesWithMedia,
    summaryItems: pipelineReport.summaryItems,
    videoUrl,
    totalFrames,
    testId: pipelineReport.testId || existing.testId || results?.test_id || '',
    testName: pipelineReport.testName || existing.testName || '',
    testConfigKey: pipelineReport.testConfigKey || existing.testConfigKey || '',
    mainTitle: pipelineReport.mainTitle || existing.mainTitle || '',
    aikynetixSourceUrl:
      pipelineReport.aikynetixSourceUrl || existing.aikynetixSourceUrl || results?.metadata?.source_url || '',
    pipelineSnapshot: pipelineReport.pipelineSnapshot || existing.pipelineSnapshot || buildPipelineSnapshot(results),
    hasLocalVideo: existing.hasLocalVideo || false,
    videoStorageKey: existing.videoStorageKey || '',
    narrativeLayout: existing.narrativeLayout || 'separate',
    modelDataPhases: serializeModelDataPhases(
      buildModelDataPhases({
        phases: phasesWithMedia,
        summaryItems: pipelineReport.summaryItems,
        profilePhotoUrl: getClientProfilePhoto(client),
      })
    ),
    diagnostics: buildDiagnosticsFromNarrative(
      client?.desc || existing.archetypeVector,
      client?.notes || existing.caseLog,
      pipelineReport.phases?.[0]?.alignments
    ),
    verificationBars: buildVerificationBarsFromPhases(phasesWithMedia),
    coreMetrics: buildCoreMetricsFromSummary(pipelineReport.summaryItems),
    trainingProfile: existing.trainingProfile || client?.archetype || 'Load Balance Mod .A',
  };

  const metrics = {
    ...(client?.metrics || {}),
    squat: `${Math.round(Number(scores.flexibility ?? scores.mobility ?? 0) || 0)}/100`,
    land: `${Math.round(Number(scores.balance ?? 0) || 0)}/100`,
    cmj: `${Math.round(Number(scores.technique ?? 0) || 0)}/100`,
    agility: `${Math.round(Number(scores.symmetry ?? 0) || 0)}/100`,
  };

  return {
    ...client,
    metrics,
    streamStatus: 'STREAM CALIBRATED',
    longevityReport,
  };
}

/**
 * Format structured Gemini program block → dossier-readable plain text.
 */
export function formatProtocolBlock(block) {
  if (!block) return '';
  if (typeof block === 'string') return block.trim();
  if (Array.isArray(block)) return block.filter(Boolean).map(String).join('\n');
  if (typeof block !== 'object') return String(block);

  const sections = [];
  const pushSection = (label, value) => {
    const text = (value || '').toString().trim();
    if (text) sections.push(`${label}\n${text}`);
  };

  pushSection('DAY-BY-DAY / WEEKLY SCHEDULE', block.day_by_day_schedule || block.schedule_overview);
  pushSection('STRETCHING & MOBILITY LAYOUT', block.stretching_mobility_layout);
  pushSection('MASSAGE & SOFT TISSUE PLAN', block.massage_soft_tissue_plan);
  pushSection('DAILY LIFE HEALTH TIPS', block.daily_life_health_tips);

  return sections.join('\n\n');
}

/** Build Card 2 — kinetic directives + right-now cues + optional chat thread */
export function buildKineticDirectivesLog(plan, chatMessages = [], coachPersona = 'gideon') {
  const parts = [];
  const summary = (plan?.gideon_assessment_summary || '').toString().trim();
  if (summary) parts.push(summary);

  const rightNow = plan?.right_now_adjustment;
  if (Array.isArray(rightNow) && rightNow.length) {
    parts.push(`RIGHT NOW ADJUSTMENTS:\n${rightNow.map((line) => `• ${line}`).join('\n')}`);
  }

  if (chatMessages?.length) {
    const userLabel = coachPersona === 'gideon' ? 'Captain' : 'Coach';
    parts.push(
      `${userLabel.toUpperCase()} FOLLOW-UP THREAD:\n${chatMessages
        .map((msg) => `${msg.role === 'user' ? userLabel : 'Gideon'}: ${msg.content}`)
        .join('\n')}`
    );
  }

  return parts.join('\n\n');
}

/** Build Card 5 — somatic / ergonomic daily targets */
export function buildSomaticHealthBlock(plan) {
  const parts = [];
  const somatic = (plan?.somatic_health_tips || '').toString().trim();
  if (somatic) parts.push(somatic);

  const longTerm = plan?.long_term_vision;
  if (Array.isArray(longTerm) && longTerm.length) {
    parts.push(longTerm.join('\n'));
  } else if (typeof longTerm === 'string' && longTerm.trim()) {
    parts.push(longTerm.trim());
  }

  for (const key of ['two_week_protocol', 'four_week_protocol']) {
    const block = plan?.[key];
    if (block?.daily_life_health_tips) {
      parts.push(String(block.daily_life_health_tips).trim());
    }
  }

  return [...new Set(parts.filter(Boolean))].join('\n\n');
}

/** Premium tier dossier card labels (CoachDashboard 6-card stack) */
export const DOSSIER_CARD_LABELS = {
  archetype: '[ BIOMECHANICAL ARCHETYPE VECTOR // ]',
  coachPlan: '[ IMMEDIATE COACH PLAN & "RIGHT NOW" CUES // ]',
  kinetic: '[ KINETIC DIRECTIVES & GLOBAL RE-TEST LOG // ]',
  phase1: '[ PREMIUM UPGRADE: PHASE 1 // 2-WEEK ACTIVATION PROGRAM ]',
  phase2: '[ PREMIUM UPGRADE: PHASE 2 // 4-WEEK STABILIZATION PROGRAM ]',
  somatic: '[ SOMATIC HEALTH & THERAPEUTIC STRATEGIES // ]',
};

export const PREMIUM_LOCK_BANNER =
  '// AUTOMATED UPLINK STAGED // CLOAKING SHIELD LOCKED. DEPLOY PREMIUM UPGRADE BLOCK TO GENERATE REHAB REGIMENT.';

const DOSSIER_TEXTAREA_CLASS =
  'w-full min-h-[140px] bg-slate-950/80 border border-slate-800 rounded-lg p-4 text-base md:text-[17px] font-sans font-medium text-slate-100 leading-relaxed resize-y focus:outline-none focus:border-cyan-500/40 custom-scrollbar';

export { DOSSIER_TEXTAREA_CLASS };

export function getAnatomicalArtworkUrl(client) {
  return (client?.biometricPhotoUrl || client?.assessmentPhoto || '').trim();
}

export function buildImmediateCoachPlanBlock(client) {
  const plan = client?.longevityReport?.coachPlan || client?.longevityReport?.geminiPlan || {};
  const summary = (
    client?.coach_plan_text ||
    plan.gideon_assessment_summary ||
    ''
  ).trim();
  const rightNow = plan.right_now_adjustment || client?.right_now_adjustment || [];
  const parts = [];
  if (summary) parts.push(summary);
  if (Array.isArray(rightNow) && rightNow.length) {
    parts.push(`RIGHT NOW CUES:\n${rightNow.map((line) => `• ${line}`).join('\n')}`);
  }
  return parts.join('\n\n') || '';
}

export function getPremiumBlockText(client, block) {
  const d = normalizeClientDossier(client);
  if (block === 'phase1') return (d.trainingLogPhase1 || '').trim();
  if (block === 'phase2') return (d.trainingLogPhase2 || '').trim();
  if (block === 'somatic') return (d.somaticHealthTips || '').trim();
  return '';
}

export function hasPremiumBlockData(client, block) {
  return getPremiumBlockText(client, block).length > 0;
}

/** Build port-8000 YOLO metrics payload from dossier + optional live telemetry */
export function buildGeminiMetricsPayload(client, accessCode, options = {}) {
  const dossier = normalizeClientDossier(client, accessCode);
  const template = initialClientDossierTemplate;
  const clientAge = Number(dossier.clientAge);
  const parsedAge = Number.isFinite(clientAge) && clientAge > 0 ? clientAge : template.clientAge;
  const jointAngles = options.jointAngles || {};

  return {
    client_age: parsedAge,
    client_gender: dossier.clientGender || template.clientGender,
    client_height: dossier.clientHeight || template.clientHeight,
    client_weight: dossier.clientWeight || template.clientWeight,
    client_demographic: `${parsedAge}y/o ${dossier.clientGender || template.clientGender} — ${dossier.clientHeight || template.clientHeight} / ${dossier.clientWeight || template.clientWeight}`,
    test_activity:
      options.testActivity ||
      `Premium Matrix Compile — ${dossier.name || accessCode || 'Client Dossier'}`,
    joint_angles_measured: jointAngles,
    asymmetry_index_percentage:
      options.asymmetryIndex != null ? Number(options.asymmetryIndex) : 0,
    postural_compensation_notes:
      options.compensationNotes ||
      dossier.notes ||
      'Compiled from active client dossier — coach-initiated premium block generation.',
    request_two_week_plan: !!options.request_two_week_plan,
    request_four_week_plan: !!options.request_four_week_plan,
    request_health_tips: !!options.request_health_tips,
  };
}

export function extractPremiumBlockFromGemini(plan, block) {
  if (!plan || typeof plan !== 'object') return '';
  if (block === 'phase1') return formatProtocolBlock(plan.two_week_protocol);
  if (block === 'phase2') return formatProtocolBlock(plan.four_week_protocol);
  if (block === 'somatic') return buildSomaticHealthBlock(plan);
  return '';
}

/** Persist a single premium block onto client row + longevityReport (local + Supabase via saveClientRecord) */
export function applyPremiumBlockToClient(client, block, text) {
  const normalized = normalizeClientDossier(client);
  const existingReport = client?.longevityReport || {};
  const coachPlan = existingReport.coachPlan || existingReport.geminiPlan || {};
  const trimmed = (text || '').trim();

  const fieldPatch =
    block === 'phase1'
      ? { trainingLogPhase1: trimmed }
      : block === 'phase2'
        ? { trainingLogPhase2: trimmed }
        : block === 'somatic'
          ? { somaticHealthTips: trimmed }
          : {};

  const coachPlanPatch =
    block === 'phase1'
      ? { two_week_protocol: coachPlan.two_week_protocol || {} }
      : block === 'phase2'
        ? { four_week_protocol: coachPlan.four_week_protocol || {} }
        : block === 'somatic'
          ? { somatic_health_tips: trimmed }
          : {};

  return mergeDossierFieldsForSave(
    {
      ...client,
      ...fieldPatch,
      longevityReport: {
        ...existingReport,
        ...fieldPatch,
        coachPlan: { ...coachPlan, ...coachPlanPatch, last_updated_timestamp: new Date().toISOString() },
        geminiPlan: { ...coachPlan, ...coachPlanPatch, last_updated_timestamp: new Date().toISOString() },
        lastUpdated: new Date().toISOString(),
      },
    },
    fieldPatch
  );
}

/**
 * Maps strict Gemini schemas to both top-level dossier fields and longevityReport.coachPlan.
 */
export function applyGeminiCoachPlanToClient(
  client,
  clientCode,
  geminiPlanOutput,
  {
    coachPersona = 'gideon',
    movementTitle = '',
    chatMessages = [],
    includeTwoWeekPlan = true,
    includeFourWeekPlan = true,
    includeHealthTips = true,
  } = {}
) {
  if (!geminiPlanOutput || typeof geminiPlanOutput !== 'object') {
    return client || {};
  }

  const timestamp = new Date().toISOString();
  const existingReport = client?.longevityReport || {};
  const existingCoachPlan = existingReport.coachPlan || existingReport.geminiPlan || {};

  const kineticLog = buildKineticDirectivesLog(geminiPlanOutput, chatMessages, coachPersona);
  const phase1Text = includeTwoWeekPlan
    ? formatProtocolBlock(geminiPlanOutput.two_week_protocol)
    : client?.trainingLogPhase1 || existingReport.trainingLogPhase1 || '';
  const phase2Text = includeFourWeekPlan
    ? formatProtocolBlock(geminiPlanOutput.four_week_protocol)
    : client?.trainingLogPhase2 || existingReport.trainingLogPhase2 || '';
  const somaticText = includeHealthTips
    ? buildSomaticHealthBlock(geminiPlanOutput)
    : client?.somaticHealthTips || existingReport.somaticHealthTips || '';

  const coachPlan = {
    gideon_assessment_summary: geminiPlanOutput.gideon_assessment_summary || '',
    right_now_adjustment: geminiPlanOutput.right_now_adjustment || [],
    two_week_protocol: includeTwoWeekPlan
      ? geminiPlanOutput.two_week_protocol || {}
      : existingCoachPlan.two_week_protocol || client?.two_week_protocol || {},
    four_week_protocol: includeFourWeekPlan
      ? geminiPlanOutput.four_week_protocol || {}
      : existingCoachPlan.four_week_protocol || client?.four_week_protocol || {},
    long_term_vision: geminiPlanOutput.long_term_vision || [],
    somatic_health_tips: includeHealthTips
      ? geminiPlanOutput.somatic_health_tips || somaticText
      : existingCoachPlan.somatic_health_tips || client?.somaticHealthTips || '',
    chat_thread: chatMessages,
    // legacy keys preserved for older dossiers / PDF fallbacks
    two_week_activation_strategy: includeTwoWeekPlan
      ? geminiPlanOutput.two_week_activation_strategy || {}
      : existingCoachPlan.two_week_activation_strategy || {},
    four_week_adaptation_strategy: includeFourWeekPlan
      ? geminiPlanOutput.four_week_adaptation_strategy || {}
      : existingCoachPlan.four_week_adaptation_strategy || {},
    long_term_longevity_vision: geminiPlanOutput.long_term_longevity_vision || {},
    retesting_comparison_benchmarks: geminiPlanOutput.retesting_comparison_benchmarks || {},
    coach_persona: coachPersona,
    movement_title: movementTitle,
    last_updated_timestamp: timestamp,
    export_flags: {
      includeTwoWeekPlan,
      includeFourWeekPlan,
      includeHealthTips,
    },
  };

  return {
    ...(client || {}),
    coach_plan_text: coachPlan.gideon_assessment_summary,
    right_now_adjustment: coachPlan.right_now_adjustment,
    two_week_protocol: coachPlan.two_week_protocol,
    four_week_protocol: coachPlan.four_week_protocol,
    long_term_vision: coachPlan.long_term_vision,
    somaticHealthTips: somaticText,
    trainingLogPhase1: phase1Text,
    trainingLogPhase2: phase2Text,
    notes: kineticLog || client?.notes || '',
    long_term_protocol: coachPlan.long_term_longevity_vision,
    retest_benchmarks: coachPlan.retesting_comparison_benchmarks,
    last_updated_timestamp: timestamp,
    streamStatus: client?.streamStatus || 'STREAM CALIBRATED',
    longevityReport: {
      ...existingReport,
      coachPlan,
      geminiPlan: coachPlan,
      lastCoachAnalysisAt: timestamp,
      caseLog: kineticLog || coachPlan.gideon_assessment_summary || existingReport.caseLog || '',
      trainingLogPhase1: phase1Text,
      trainingLogPhase2: phase2Text,
      somaticHealthTips: somaticText,
    },
  };
}

/** Build ReportLab plan_data from dossier (top-level tracking row + longevityReport coachPlan) */
export function buildPdfPlanFromClient(client) {
  const longevityReport = client?.longevityReport || {};
  const coachPlan = longevityReport.coachPlan || longevityReport.geminiPlan || {};
  const pipelineSnapshot = longevityReport.pipelineSnapshot || {};

  return {
    gideon_assessment_summary:
      client?.coach_plan_text ||
      coachPlan.gideon_assessment_summary ||
      client?.notes ||
      client?.desc ||
      longevityReport.caseLog ||
      'Biomechanical assessment compiled from YOLO lab telemetry and longevity blueprint dossier.',
    right_now_adjustment:
      client?.right_now_adjustment || coachPlan.right_now_adjustment || [],
    two_week_protocol:
      client?.two_week_protocol || coachPlan.two_week_protocol || [],
    four_week_protocol:
      client?.four_week_protocol || coachPlan.four_week_protocol || [],
    long_term_vision:
      client?.long_term_vision || coachPlan.long_term_vision || [],
    two_week_activation_strategy:
      coachPlan.two_week_activation_strategy || client?.two_week_protocol || {},
    four_week_adaptation_strategy:
      coachPlan.four_week_adaptation_strategy || client?.four_week_protocol || {},
    long_term_longevity_vision:
      coachPlan.long_term_longevity_vision || client?.long_term_protocol || {},
    retesting_comparison_benchmarks:
      client?.retest_benchmarks ||
      coachPlan.retesting_comparison_benchmarks ||
      pipelineSnapshot.scores ||
      {},
  };
}

/** Build CleanLongevityReport props from a client dossier record */
export function buildLongevityReportFromClient(client, clientCode) {
  if (!client) {
    return {
      clientName: 'Unknown Client',
      clientCode: clientCode || '000000',
      phases: DEFAULT_PHASES,
      summaryItems: buildSummaryFromMetrics(),
      profilePhotoUrl: '',
      archetypeVector: '',
      caseLog: '',
      narrativeLayout: 'separate',
    };
  }

  const stored = client.longevityReport || {};
  const photoUrl = getClientProfilePhoto(client);
  const phases = (stored.phases || DEFAULT_PHASES).map((phase, index) => ({
    ...phase,
    imageUrl: phase.imageUrl || (index === 0 ? photoUrl : '') || '',
  }));

  return syncNarrativeFromDossier(client, {
    clientName: client.name,
    clientCode,
    phases,
    summaryItems: rehydrateSummaryItems(
      stored.summaryItems || buildSummaryFromMetrics(client.metrics)
    ),
    narrativeLayout: stored.narrativeLayout || 'separate',
    assessmentId: stored.assessmentId || '',
    testId: stored.testId || '',
    testName: stored.testName || '',
    testConfigKey: stored.testConfigKey || '',
    mainTitle: stored.mainTitle || '',
    lastPipelineAt: stored.lastPipelineAt || '',
    source: stored.source || 'dossier',
  });
}

/** Strip non-serializable icon refs before persisting */
export function serializeLongevityReport(report) {
  if (!report || typeof report !== 'object') return {};
  return {
    ...report,
    summaryItems: (report.summaryItems || []).map(({ label, val }) => ({ label, val })),
    coreMetrics: (report.coreMetrics || []).map(({ label, val, desc, descColor, icon }) => ({
      label,
      val,
      desc,
      descColor,
      icon: typeof icon === 'string' ? icon : undefined,
    })),
    modelDataPhases: report.modelDataPhases
      ? serializeModelDataPhases(report.modelDataPhases)
      : undefined,
  };
}

export function clientHasLongevityReport(client) {
  if (!client) return false;
  if (client.longevityReport?.modelDataPhases) return true;
  if (client.longevityReport?.phases?.length) return true;
  if (client.longevityReport?.lastPipelineAt) return true;
  if (client.longevityReport?.verificationBars?.length) return true;
  const status = String(client.streamStatus || '').toUpperCase();
  return status === 'STREAM LOCKED' || status === 'STREAM CALIBRATED';
}

function metricToPercent(val) {
  const raw = String(val || '');
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(num)) return 55;
  if (num <= 1 && !raw.includes('%')) return Math.round(Math.min(100, num * 100));
  if (num <= 100) return Math.round(num);
  return Math.min(100, Math.round(num / 1.8));
}

const DEFAULT_DIAGNOSTICS = [
  {
    title: 'Key Observation',
    body: 'Stance width stability index measures within target ranges. Right foot ankle flexion shows minor compression variance.',
  },
  {
    title: 'Vector Variance Check',
    body: 'Asymmetry reads nominal at 1.5° center mass displacement across standard load thresholds.',
  },
];

const METRIC_DESC_MAP = {
  OPTIMAL: 'Zero Jitter Sync',
  NOMINAL: 'Static Lock Confirmed',
  COMPLETE: 'Full Arc Clearance',
  MINIMAL: 'Green Safety Range',
  LOW: 'Green Safety Range',
  MODERATE: 'Watch Vector Drift',
  FOCUS: 'Corrective Track Advised',
  PENDING: 'Awaiting Calibration',
};

function buildDiagnosticsFromNarrative(archetypeVector, caseLog, alignments = []) {
  if (!archetypeVector && !caseLog) return DEFAULT_DIAGNOSTICS;
  return [
    {
      title: 'Key Observation',
      body: archetypeVector || DEFAULT_DIAGNOSTICS[0].body,
    },
    {
      title: 'Vector Variance Check',
      body: caseLog || alignments[0] || DEFAULT_DIAGNOSTICS[1].body,
    },
  ];
}

function buildVerificationBarsFromPhases(phases) {
  const metrics = phases?.[0]?.metrics?.length
    ? phases[0].metrics
    : DEFAULT_PHASES[0].metrics;
  return metrics.slice(0, 3).map((metric, index) => ({
    id: `0${index + 1}`,
    label: metric.label,
    val: metric.val,
    zone: String(metric.target || 'NOMINAL').toUpperCase(),
    percent: metricToPercent(metric.val),
  }));
}

function buildCoreMetricsFromSummary(summaryItems) {
  const icons = ['Target', 'Zap', 'Shield', 'Cpu'];
  const items = (summaryItems || buildSummaryFromMetrics()).slice(0, 4);
  return items.map((item, index) => {
    const val = String(item.val || '—').toUpperCase();
    return {
      label: item.label,
      val: item.val,
      desc: METRIC_DESC_MAP[val] || 'Calibrated Readout',
      descColor:
        val === 'MINIMAL' || val === 'LOW' || val === 'OPTIMAL'
          ? 'text-emerald-500'
          : undefined,
      icon: icons[index % icons.length],
    };
  });
}

/** Build CyberLightDashboard props from dossier + stored longevity report */
export function buildCyberDashboardPayload(client, clientCode) {
  const base = buildLongevityReportFromClient(client, clientCode);
  const stored = client?.longevityReport || {};

  return {
    clientName: base.clientName,
    clientCode: base.clientCode,
    profilePhotoUrl: base.profilePhotoUrl,
    archetypeVector: base.archetypeVector,
    caseLog: base.caseLog,
    narrativeLayout: base.narrativeLayout,
    diagnostics:
      stored.diagnostics ||
      buildDiagnosticsFromNarrative(
        base.archetypeVector,
        base.caseLog,
        base.phases?.[0]?.alignments
      ),
    trainingProfile:
      stored.trainingProfile || client?.archetype || 'Load Balance Mod .A',
    verificationBars:
      stored.verificationBars || buildVerificationBarsFromPhases(base.phases),
    coreMetrics:
      stored.coreMetrics || buildCoreMetricsFromSummary(base.summaryItems),
    phases: base.phases,
    summaryItems: base.summaryItems,
  };
}
