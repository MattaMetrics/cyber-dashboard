/**
 * Test-type dictionary — maps pipeline JSON (test_id / test_name) to report UI layout:
 * main title, phase tab count/names, registry specs, and angle-threshold labels.
 */

import { staticAssessmentLibrary } from '../data/assessmentLibrary';

/** @typedef {{ id: string, name: string, labels: string[], specLabels?: string[] }} TestPhaseDef */
/** @typedef {{ key: string, mainTitle: string, phases: TestPhaseDef[], aliases: string[] }} TestConfigEntry */

export const testConfigDictionary = {
  combat_stance: {
    key: 'combat_stance',
    mainTitle: 'LIFE LONGEVITY LAB BLUEPRINT',
    aliases: [
      'combat_stance',
      'combat stance',
      'fight stance',
      'fight_stance',
      'cross punch',
      'knee strike',
      'striking',
      'LL013',
      'LL020',
      '013',
      '020',
    ],
    phases: [
      {
        id: 'phase1',
        name: 'COMBAT STANCE',
        specLabels: ['Balance Index', 'Center of Mass', 'Symmetry Score'],
        labels: ['Head Alignment', 'Shoulder Alignment', 'Hip Alignment'],
      },
      {
        id: 'phase2',
        name: 'CROSS PUNCH',
        specLabels: ['Shoulder Turn', 'Elbow Extension', 'Load Distribution'],
        labels: ['Shoulder Turn', 'Elbow Extension', 'Spinal Rotation'],
      },
      {
        id: 'phase3',
        name: 'KNEE STRIKE',
        specLabels: ['Knee Flexion', 'Hip Flexion', 'Balance Index'],
        labels: ['Knee Flexion', 'Hip Flexion', 'Ankle Plantar'],
      },
    ],
  },
  sprint_takeoff: {
    key: 'sprint_takeoff',
    mainTitle: 'SPRINT TAKE OFF PERFORMANCE BLUEPRINT',
    aliases: [
      'sprint_takeoff',
      'sprint takeoff',
      'sprint start',
      'kinetic sprint',
      'acceleration',
      'LL018',
      '018',
    ],
    phases: [
      {
        id: 'phase1',
        name: 'SET POSITION',
        specLabels: ['Torso Angle', 'Front Knee Flexion', 'Rear Knee Flexion'],
        labels: ['Torso Angle', 'Front Knee Flexion', 'Rear Knee Flexion'],
      },
      {
        id: 'phase2',
        name: 'DRIVE PHASE (STEP 1)',
        specLabels: ['Hip Extension Torque', 'Ankle Drive Force', 'Shin Projection Angle'],
        labels: ['Hip Extension Torque', 'Ankle Drive Force', 'Shin Projection Angle'],
      },
      {
        id: 'phase3',
        name: 'TRANSITION PHASE',
        specLabels: ['Stride Frequency', 'Vertical Oscillation', 'Ground Contact Time'],
        labels: ['Stride Frequency', 'Vertical Oscillation', 'Ground Contact Time'],
      },
    ],
  },
  neck_mobility: {
    key: 'neck_mobility',
    mainTitle: 'NECK MOBILITY MATRIX BLUEPRINT',
    aliases: ['neck mobility', 'neck_mobility', 'LL001', '001'],
    phases: [
      {
        id: 'phase1',
        name: 'FLEXION / EXTENSION',
        specLabels: ['Cervical Flexion', 'Cervical Extension', 'Range Symmetry'],
        labels: ['Flexion Angle', 'Extension Angle', 'Plumb Deviation'],
      },
      {
        id: 'phase2',
        name: 'LATERAL FLEXION',
        specLabels: ['Left Lateral', 'Right Lateral', 'Bilateral Delta'],
        labels: ['Left Lateral Flexion', 'Right Lateral Flexion', 'Axial Rotation'],
      },
    ],
  },
  single_leg_stability: {
    key: 'single_leg_stability',
    mainTitle: 'SINGLE-LEG STABILITY BLUEPRINT',
    aliases: ['single leg', 'single_leg', 'balance matrix', 'LL015', '015'],
    phases: [
      {
        id: 'phase1',
        name: 'RIGHT LEG HOLD',
        specLabels: ['Sway Frequency', 'Center of Mass', 'Hip Alignment'],
        labels: ['Knee Valgus', 'Pelvic Drop', 'Ankle Stability'],
      },
      {
        id: 'phase2',
        name: 'NEUTRAL BASELINE',
        specLabels: ['Balance Index', 'Postural Sway', 'Symmetry Score'],
        labels: ['Head Alignment', 'Shoulder Level', 'Hip Level'],
      },
      {
        id: 'phase3',
        name: 'LEFT LEG HOLD',
        specLabels: ['Sway Frequency', 'Center of Mass', 'Hip Alignment'],
        labels: ['Knee Valgus', 'Pelvic Drop', 'Ankle Stability'],
      },
    ],
  },
};

const DEFAULT_CONFIG_KEY = 'combat_stance';

/** Library id → LL test id string */
function libraryIdToTestId(id) {
  return `LL${String(id).padStart(3, '0')}`;
}

/** Build lookup: normalized token → config key */
function buildAliasIndex() {
  const index = new Map();
  Object.values(testConfigDictionary).forEach((entry) => {
    index.set(entry.key.toLowerCase(), entry.key);
    (entry.aliases || []).forEach((alias) => {
      index.set(String(alias).toLowerCase().replace(/[^a-z0-9]/g, ''), entry.key);
      index.set(String(alias).toLowerCase(), entry.key);
    });
  });

  staticAssessmentLibrary.forEach((track) => {
    const testId = libraryIdToTestId(track.id);
    const nameNorm = track.name.toLowerCase();
    let matchedKey = null;

    if (/fight stance|combat|striking|punch|kick/i.test(track.name)) {
      matchedKey = 'combat_stance';
    } else if (/sprint|acceleration|takeoff/i.test(track.name)) {
      matchedKey = 'sprint_takeoff';
    } else if (/neck/i.test(track.name)) {
      matchedKey = 'neck_mobility';
    } else if (/single.?leg|balance matrix/i.test(track.name)) {
      matchedKey = 'single_leg_stability';
    }

    if (matchedKey) {
      index.set(testId.toLowerCase(), matchedKey);
      index.set(testId.replace(/^LL/, '').toLowerCase(), matchedKey);
      index.set(nameNorm.replace(/[^a-z0-9]/g, ''), matchedKey);
    }
  });

  return index;
}

const ALIAS_INDEX = buildAliasIndex();

function normalizeToken(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function matchConfigKey(token) {
  if (!token) return null;
  const lower = String(token).trim().toLowerCase();
  const compact = normalizeToken(token);
  return ALIAS_INDEX.get(lower) || ALIAS_INDEX.get(compact) || null;
}

/**
 * Resolve dictionary entry from pipeline / intercept JSON.
 * Checks test_id, header.test_name, metadata, and assessment library names.
 */
export function resolveTestConfigFromResults(results) {
  if (!results || typeof results !== 'object') {
    return testConfigDictionary[DEFAULT_CONFIG_KEY];
  }

  const header = results.header || {};
  const candidates = [
    results.testConfigKey,
    results.test_config_key,
    results.test_id,
    results.testId,
    header.test_id,
    header.test_name,
    header.testName,
    results.metadata?.test_id,
    results.metadata?.test_name,
  ].filter(Boolean);

  for (const raw of candidates) {
    const key = matchConfigKey(raw);
    if (key && testConfigDictionary[key]) {
      return testConfigDictionary[key];
    }
  }

  const fuzzy = `${header.test_name || ''} ${results.test_id || ''}`.toLowerCase();
  if (/sprint|takeoff|acceleration/.test(fuzzy)) return testConfigDictionary.sprint_takeoff;
  if (/neck|cervical/.test(fuzzy)) return testConfigDictionary.neck_mobility;
  if (/single.?leg|sway|balance hold/.test(fuzzy)) return testConfigDictionary.single_leg_stability;
  if (/combat|fight|punch|kick|strike|stance/.test(fuzzy)) return testConfigDictionary.combat_stance;

  return testConfigDictionary[DEFAULT_CONFIG_KEY];
}

export function getTestConfigByKey(key) {
  return testConfigDictionary[key] || testConfigDictionary[DEFAULT_CONFIG_KEY];
}

export function listTestConfigKeys() {
  return Object.keys(testConfigDictionary);
}

function normalizeLabel(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const SCORE_ALIASES = {
  balanceindex: ['balance', 'stability'],
  centerofmass: ['center_of_mass', 'com', 'mass'],
  symmetryscore: ['symmetry'],
  torsangle: ['torso', 'flexibility'],
  stridefrequency: ['cadence', 'agility'],
  groundcontacttime: ['contact', 'tempo'],
};

/** Find best telemetry value for a dictionary label */
export function findMetricValueForLabel(label, telemetry = {}) {
  const { metrics = [], scores = {}, ruleResults = [] } = telemetry;
  const norm = normalizeLabel(label);

  for (const metric of metrics) {
    const mNorm = normalizeLabel(metric.label);
    if (mNorm === norm || mNorm.includes(norm) || norm.includes(mNorm)) {
      return String(metric.val ?? '—');
    }
  }

  for (const rule of ruleResults) {
    const rNorm = normalizeLabel(rule.metric);
    if (rNorm === norm || rNorm.includes(norm) || norm.includes(rNorm)) {
      const val = rule.raw_score;
      return Number.isFinite(Number(val)) ? `${Number(val).toFixed(1)}°` : String(val ?? '—');
    }
  }

  const aliasList = SCORE_ALIASES[norm];
  if (aliasList) {
    for (const alias of aliasList) {
      if (scores[alias] != null) {
        const num = Number(scores[alias]);
        return Number.isFinite(num) ? num.toFixed(1) : String(scores[alias]);
      }
    }
  }

  for (const [scoreKey, scoreVal] of Object.entries(scores)) {
    if (normalizeLabel(scoreKey).includes(norm) || norm.includes(normalizeLabel(scoreKey))) {
      const num = Number(scoreVal);
      return Number.isFinite(num) ? num.toFixed(1) : String(scoreVal);
    }
  }

  return null;
}

function defaultGaugeVal(label) {
  return /angle|flexion|extension|rotation|turn|torque|projection/i.test(label) ? '0.0°' : '—';
}

/**
 * Build legacy phase array from dictionary + live telemetry.
 * @param {object} config - resolved test config entry
 * @param {object} telemetry - { metrics, alignments, scores, ruleResults, videoUrl, totalFrames }
 */
export function buildPhasesFromTestConfig(config, telemetry = {}, profilePhotoUrl = '') {
  const phases = config?.phases || testConfigDictionary[DEFAULT_CONFIG_KEY].phases;

  return phases.map((phaseDef, index) => {
    const specLabels = phaseDef.specLabels || phaseDef.labels || [];
    const gaugeLabels = phaseDef.labels || [];

    const metrics = specLabels.map((label) => ({
      label: label.toUpperCase(),
      val: findMetricValueForLabel(label, telemetry) || defaultGaugeVal(label),
      target: 'NOMINAL',
    }));

    const alignments = gaugeLabels.map((label) => {
      const val = findMetricValueForLabel(label, telemetry);
      const display = val ?? defaultGaugeVal(label);
      const suffix = display.includes('°') || display === '—' ? '' : '°';
      return `${label.toUpperCase()}: ${display}${suffix && display !== '—' && !display.includes('°') ? '°' : ''}`;
    });

    return {
      title: `PHASE // ${phaseDef.name}`,
      duration: 'CAPTURE COMPLETE',
      imageUrl: index === 0 ? profilePhotoUrl : '',
      videoUrl: telemetry.videoUrl || '',
      totalFrames: telemetry.totalFrames || 128,
      metrics,
      alignments,
      phaseId: phaseDef.id,
    };
  });
}

/** Extract flat telemetry pool from interpreter results (single-phase parse output) */
export function extractTelemetryPool(results, singlePhase) {
  const scores = results?.scores || {};
  const ruleResults = Array.isArray(results?.rule_results) ? results.rule_results : [];

  return {
    metrics: singlePhase?.metrics || [],
    alignments: singlePhase?.alignments || [],
    scores,
    ruleResults,
    videoUrl: singlePhase?.videoUrl || '',
    totalFrames: singlePhase?.totalFrames || 128,
  };
}

/** Split main title for styled header: prefix + "BLUEPRINT" suffix */
export function splitMainTitle(mainTitle) {
  const text = String(mainTitle || 'LIFE LONGEVITY LAB BLUEPRINT').trim();
  if (/BLUEPRINT/i.test(text)) {
    const prefix = text.replace(/\s*BLUEPRINT\s*$/i, '').trim() || 'LIFE LONGEVITY LAB';
    return { prefix, suffix: 'BLUEPRINT' };
  }
  return { prefix: text, suffix: 'BLUEPRINT' };
}
