/**
 * Photo 3 — upright standing holographic male model (live Imgur graphic).
 * Used as the suite left anchor and as the instruction-panel fallback
 * when a test has no custom panel URL assigned.
 */
export const DEFAULT_STANDING_HOLOGRAM_PANEL = 'https://i.imgur.com/jbkxKoD.png';

/** Default draft image shown in the coach Telemetry Uplink modulator. */
export const DEFAULT_PANEL_DRAFT_URL = 'https://i.imgur.com/m0UrRMJ.png';

/**
 * Streamlit-parity assessment fallbacks — used when coach has not broadcast
 * uplink text / imagery for a selected track yet.
 */
export const DEFAULT_PROTOCOL_FALLBACK = {
  imageUrl: DEFAULT_PANEL_DRAFT_URL,
  execution:
    'SYSTEM_ALERT: No custom movement directives broadcasted for this track yet. Initialize telemetry updates from the main Coach Intelligence Dashboard.',
  alignment:
    'CAMERA_ENVELOPE: Device tracking coordinates pending. Standard setup: Align recording sensor at mid-torso height, 8 feet out from the central vector.',
};

/** Treat bare imgur shells / blanks as "no custom asset assigned". */
export function isAssignedPanelUrl(url) {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  if (/^https?:\/\/(www\.)?imgur\.com\/?$/i.test(value)) return false;
  return true;
}

/**
 * Normalize a guide-asset leaf — legacy string URL or protocol packet object.
 * Returns { imageUrl, execution, alignment }.
 */
export function normalizeGuideProtocolLeaf(leaf) {
  if (typeof leaf === 'string') {
    return { imageUrl: leaf, execution: '', alignment: '' };
  }
  if (leaf && typeof leaf === 'object') {
    return {
      imageUrl: String(leaf.imageUrl || leaf.image_url || '').trim(),
      execution: String(leaf.execution || '').trim(),
      alignment: String(leaf.alignment || '').trim(),
    };
  }
  return { imageUrl: '', execution: '', alignment: '' };
}

/**
 * Master guide-asset map — nested by suite track → assessment slot → image URL
 * (or protocol packet `{ imageUrl, execution, alignment }`).
 * Coaches overwrite leaves live via the Telemetry Uplink Modulator.
 */
export const DEFAULT_GUIDE_ASSETS = {
  vital_flow: {
    neck_mobility: 'https://imgur.com',
    back_mobility: 'https://imgur.com',
    thoracic_dissociation: 'https://imgur.com',
    deep_squat: 'https://imgur.com',
    single_leg_hold: 'https://imgur.com',
    shoulder_girdle: 'https://imgur.com',
  },
  athlete_precision: {
    neck_mobility: 'https://imgur.com',
    dynamic_single_leg_squat: 'https://imgur.com',
    back_mobility: 'https://imgur.com',
    shoulder_girdle: 'https://imgur.com',
    overhead_bilateral_squat: 'https://imgur.com',
  },
  posture_ergonomics: {
    seated_desk_neck: 'https://imgur.com',
    posture_axis: 'https://imgur.com',
    single_leg_hold: 'https://imgur.com',
    lumbar_spine: 'https://imgur.com',
    shoulder_rotation: 'https://imgur.com',
  },
  kinetic_integrity: {
    back_mobility: 'https://imgur.com',
    neck_mobility: 'https://imgur.com',
    deep_squat_overhead_bar: 'https://imgur.com',
    fight_stance: 'https://imgur.com',
    shoulder_mobility: 'https://imgur.com',
    striking_analysis: 'https://imgur.com',
  },
};

/**
 * Flat coach asset-matrix select — value is suite.slot nested path.
 * Labels match the live 5/6-assessment suite cards exactly.
 */
export const GUIDE_TRACK_OPTIONS = [
  { path: 'vital_flow.neck_mobility', label: 'Vital Flow // Neck Mobility Matrix' },
  { path: 'vital_flow.back_mobility', label: 'Vital Flow // Multi-Plane Spinal Articulation' },
  { path: 'vital_flow.thoracic_dissociation', label: 'Vital Flow // Thoracic Rotation Dissociation' },
  { path: 'vital_flow.deep_squat', label: 'Vital Flow // Deep Squat & Kinetic Depth' },
  { path: 'vital_flow.single_leg_hold', label: 'Vital Flow // Unilateral Cognitive Stability' },
  { path: 'vital_flow.shoulder_girdle', label: 'Vital Flow // Shoulder Girdle Telemetry' },

  { path: 'athlete_precision.neck_mobility', label: 'Athlete Precision // Neck Mobility' },
  {
    path: 'athlete_precision.dynamic_single_leg_squat',
    label: 'Athlete Precision // Dynamic Single-Leg Squat',
  },
  {
    path: 'athlete_precision.back_mobility',
    label: 'Athlete Precision // Multi-Plane Spinal Articulation',
  },
  { path: 'athlete_precision.shoulder_girdle', label: 'Athlete Precision // Shoulder Girdle' },
  {
    path: 'athlete_precision.overhead_bilateral_squat',
    label: 'Athlete Precision // Overhead Bilateral Squat',
  },

  {
    path: 'posture_ergonomics.seated_desk_neck',
    label: 'Posture & Ergonomics // Seated Desk Neck Mobility',
  },
  { path: 'posture_ergonomics.posture_axis', label: 'Posture & Ergonomics // Posture Axis Tracking' },
  {
    path: 'posture_ergonomics.single_leg_hold',
    label: 'Posture & Ergonomics // Single-Leg Hold Stability',
  },
  {
    path: 'posture_ergonomics.lumbar_spine',
    label: 'Posture & Ergonomics // Lumbar Spine & Pelvic Movement',
  },
  {
    path: 'posture_ergonomics.shoulder_rotation',
    label: 'Posture & Ergonomics // Shoulder Rotation Dissociation',
  },

  {
    path: 'kinetic_integrity.back_mobility',
    label: 'Kinetic Power Integrity // Multi-Plane Spinal Articulation',
  },
  { path: 'kinetic_integrity.neck_mobility', label: 'Kinetic Power Integrity // Neck Mobility Matrix' },
  {
    path: 'kinetic_integrity.deep_squat_overhead_bar',
    label: 'Kinetic Power Integrity // Deep Squat with Overhead Bar',
  },
  {
    path: 'kinetic_integrity.fight_stance',
    label: 'Kinetic Power Integrity // Fight Stance Stability',
  },
  {
    path: 'kinetic_integrity.shoulder_mobility',
    label: 'Kinetic Power Integrity // Shoulder Girdle Telemetry',
  },
  {
    path: 'kinetic_integrity.striking_analysis',
    label: 'Kinetic Power Integrity // Striking Punch / Kick Vector Analysis',
  },
];

/** Parse coach select value `suite.slot` into nested guide-asset keys. */
export function parseGuideAssetPath(path) {
  if (typeof path !== 'string' || !path.includes('.')) {
    return { suiteKey: 'vital_flow', slotKey: 'neck_mobility' };
  }
  const [suiteKey, slotKey] = path.split('.');
  return { suiteKey, slotKey };
}

/**
 * Module / portal IDs → [suiteKey, assessmentSlot] inside DEFAULT_GUIDE_ASSETS.
 * Keeps TrackPortals resolvers aligned with the nested coach matrix.
 */
export const ASSESSMENT_ASSET_PATHS = {
  // Vital Flow
  vf_neck: ['vital_flow', 'neck_mobility'],
  vf_spinal: ['vital_flow', 'back_mobility'],
  vf_ext: ['vital_flow', 'back_mobility'],
  vf_thoracic: ['vital_flow', 'thoracic_dissociation'],
  vf_squat: ['vital_flow', 'deep_squat'],
  deep_squat: ['vital_flow', 'deep_squat'],
  vf_hold: ['vital_flow', 'single_leg_hold'],
  vf_shoulder: ['vital_flow', 'shoulder_girdle'],
  // Athlete Precision
  ap_neck: ['athlete_precision', 'neck_mobility'],
  ap_cervical: ['athlete_precision', 'neck_mobility'],
  ap_single: ['athlete_precision', 'dynamic_single_leg_squat'],
  ap_spinal: ['athlete_precision', 'back_mobility'],
  ap_shoulder: ['athlete_precision', 'shoulder_girdle'],
  ap_overhead: ['athlete_precision', 'overhead_bilateral_squat'],
  ap_hold: ['athlete_precision', 'dynamic_single_leg_squat'],
  // Posture & Ergonomics
  pe_cervical: ['posture_ergonomics', 'seated_desk_neck'],
  pe_axis: ['posture_ergonomics', 'posture_axis'],
  pe_hold: ['posture_ergonomics', 'single_leg_hold'],
  pe_lumbar: ['posture_ergonomics', 'lumbar_spine'],
  pe_shoulder: ['posture_ergonomics', 'shoulder_rotation'],
  pe_thoracic: ['posture_ergonomics', 'lumbar_spine'],
  // Kinetic Power Integrity
  kp_spinal: ['kinetic_integrity', 'back_mobility'],
  kp_neck: ['kinetic_integrity', 'neck_mobility'],
  kp_overhead: ['kinetic_integrity', 'deep_squat_overhead_bar'],
  kp_stance: ['kinetic_integrity', 'fight_stance'],
  kp_bound: ['kinetic_integrity', 'fight_stance'],
  kp_shoulder: ['kinetic_integrity', 'shoulder_mobility'],
  kp_strike: ['kinetic_integrity', 'striking_analysis'],
  kp_boxing: ['kinetic_integrity', 'striking_analysis'],
};

/** Deep-merge saved coach assets over defaults (suite → slot). */
export function mergeGuideAssets(saved) {
  const merged = cloneGuideAssets(DEFAULT_GUIDE_ASSETS);
  if (!saved || typeof saved !== 'object') return merged;

  for (const suiteKey of Object.keys(DEFAULT_GUIDE_ASSETS)) {
    const savedSuite = saved[suiteKey];
    if (!savedSuite || typeof savedSuite !== 'object') continue;
    merged[suiteKey] = {
      ...merged[suiteKey],
      ...savedSuite,
    };
  }
  return merged;
}

function cloneGuideAssets(source) {
  const out = {};
  for (const suiteKey of Object.keys(source)) {
    out[suiteKey] = { ...source[suiteKey] };
  }
  return out;
}

/** Resolve a protocol packet for a suite.slot coach path. */
export function resolveGuideProtocolByPath(path, guideAssets = DEFAULT_GUIDE_ASSETS) {
  const { suiteKey, slotKey } = parseGuideAssetPath(path);
  const assets = guideAssets || DEFAULT_GUIDE_ASSETS;
  const leaf = assets?.[suiteKey]?.[slotKey] ?? DEFAULT_GUIDE_ASSETS?.[suiteKey]?.[slotKey];
  return normalizeGuideProtocolLeaf(leaf);
}

/** Resolve a protocol packet for a module / portal id. */
export function resolveGuideProtocol(moduleId, guideAssets = DEFAULT_GUIDE_ASSETS) {
  const assets = guideAssets || DEFAULT_GUIDE_ASSETS;
  const path = ASSESSMENT_ASSET_PATHS[moduleId];
  if (!path) return normalizeGuideProtocolLeaf(null);
  const [suiteKey, slotKey] = path;
  const leaf = assets?.[suiteKey]?.[slotKey] ?? DEFAULT_GUIDE_ASSETS?.[suiteKey]?.[slotKey];
  return normalizeGuideProtocolLeaf(leaf);
}

/** Resolve a single protocol text field, or empty string if unset. */
export function resolveGuideProtocolField(moduleId, guideAssets, field) {
  const protocol = resolveGuideProtocol(moduleId, guideAssets);
  if (field === 'execution') return protocol.execution;
  if (field === 'alignment') return protocol.alignment;
  return '';
}

/**
 * Live protocol packet with Streamlit-style defaults when coach uplink is empty.
 * Priority: coach broadcast field → pending fallback constant.
 */
export function resolveGuideProtocolWithDefaults(moduleId, guideAssets = DEFAULT_GUIDE_ASSETS) {
  const live = resolveGuideProtocol(moduleId, guideAssets);
  return {
    imageUrl: isAssignedPanelUrl(live.imageUrl)
      ? live.imageUrl.trim()
      : DEFAULT_PROTOCOL_FALLBACK.imageUrl,
    execution: live.execution || DEFAULT_PROTOCOL_FALLBACK.execution,
    alignment: live.alignment || DEFAULT_PROTOCOL_FALLBACK.alignment,
  };
}

/** Resolve a custom panel URL for a module / portal id, or null if unassigned. */
export function resolveGuideAssetUrl(moduleId, guideAssets = DEFAULT_GUIDE_ASSETS) {
  const { imageUrl } = resolveGuideProtocol(moduleId, guideAssets);
  return isAssignedPanelUrl(imageUrl) ? imageUrl.trim() : null;
}
