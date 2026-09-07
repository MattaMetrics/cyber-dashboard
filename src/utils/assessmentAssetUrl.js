/**
 * Local assessment blueprint + suite panel asset paths (Vite-resolved).
 * Drop PNG files into src/assets/assessments/ using the filenames below.
 */

const assetModules = import.meta.glob('../assets/assessments/*', {
  eager: true,
  import: 'default',
});

export function assessmentAsset(filename) {
  const key = `../assets/assessments/${filename}`;
  if (assetModules[key]) return assetModules[key];
  return new URL(`../assets/assessments/${filename}`, import.meta.url).href;
}

/** Master node blueprint filenames keyed by assessment library id */
export const NODE_ASSET_FILES = {
  1: 'node_1_neck_mobility.png',
  2: 'node_2_back_mobility.png',
  3: 'node_3_trunk_thoracic_rotation.png',
  4: 'node_4_hand_balance.png',
  5: 'node_5_seated_desk_neck.png',
  6: 'node_6_basketball_shot.png',
  7: 'node_7_baseball_throw.png',
  8: 'node_8_wrestling_takedown.png',
  9: 'node_9_golf_swing.png',
  10: 'node_10_deep_squat.png',
  11: 'node_11_yoga_warrior.png',
  12: 'node_12_shoulder_flexion.png',
  13: 'node_13_fight_stance.png',
  14: 'node_14_deep_lunge.png',
  15: 'node_15_single_leg_hold.png',
  16: 'node_16_plyometric_rebound.png',
  18: 'node_18_sprint_start.png',
  19: 'node_19_hockey_shot.png',
  20: 'node_20_striking_punch.png',
  22: 'node_22_trunk_thoracic_posture.png',
  23: 'node_23_lateral_deceleration.png',
  24: 'node_24_plyometric_box_jump.png',
  25: 'node_25_plumb_line_posture.png',
  26: 'node_26_cervical_desk_posture.png',
  27: 'node_27_dynamic_single_leg_squat.png',
  29: 'node_29_deep_squat_overhead_bar.png',
  30: 'node_30_multi_plane_spinal.png',
  31: 'node_31_neck_mobility_kinetic.png',
  32: 'node_32_gait_cycle.png',
  33: 'node_33_running_stride.png',
  34: 'node_34_deadlift.png',
  35: 'node_35_pushup.png',
  36: 'node_36_pullup.png',
  37: 'node_37_functional_reach.png',
  38: 'node_38_core_endurance.png',
  39: 'node_39_ankle_mobility.png',
  40: 'node_40_hip_mobility.png',
  41: 'node_41_thoracic_spine.png',
  42: 'node_42_y_balance.png',
  43: 'node_43_landing_mechanics.png',
  44: 'node_44_tennis_serve.png',
  45: 'node_45_swimming_stroke.png',
  46: 'node_46_pelvic_floor.png',
  47: 'node_47_grip_strength.png',
  48: 'node_48_agility_shuttle.png',
  49: 'node_49_roundhouse_kick.png',
  50: 'node_50_kinetic_chain_integration.png',
};

/** Suite left-anchor hologram panels */
export const PANEL_ASSET_FILES = {
  defaultStanding: 'panel_default_standing_hologram.png',
  kineticPower: 'panel_kinetic_power_hologram.png',
  postureErgonomics: 'panel_posture_ergonomics_hologram.png',
  athletePrecision: 'panel_athlete_precision_hologram.png',
  vitalFlow: 'panel_vital_flow_hologram.png',
  draftDefault: 'panel_draft_default.png',
};

export function getNodeBlueprintById(id) {
  const file = NODE_ASSET_FILES[Number(id)];
  return file ? assessmentAsset(file) : '';
}

export function getPanelAsset(key) {
  const file = PANEL_ASSET_FILES[key];
  return file ? assessmentAsset(file) : '';
}

/** Bundled movement demos — auto-linked to assessment tests by library node id. */
const bundledAssessmentDemos = import.meta.glob('../assets/assessments/demos/node_*.{mp4,webm,mov}', {
  eager: true,
  import: 'default',
});

const ASSESSMENT_DEMO_VIDEO_BY_ID = Object.fromEntries(
  Object.entries(bundledAssessmentDemos).flatMap(([path, src]) => {
    const match = path.match(/node_(\d+)_/i);
    return match ? [[Number(match[1]), src]] : [];
  })
);

/** Resolve a bundled movement demo MP4 for an assessment library id (e.g. 10 → deep squat). */
export function getAssessmentDemoVideoById(libraryId) {
  return ASSESSMENT_DEMO_VIDEO_BY_ID[Number(libraryId)] || null;
}

export function hasAssessmentDemoVideo(libraryId) {
  return Boolean(getAssessmentDemoVideoById(libraryId));
}

/** Suite slot → node blueprint file (DEFAULT_GUIDE_ASSETS) */
export const SUITE_NODE_BLUEPRINT_FILES = {
  vital_flow: {
    neck_mobility: NODE_ASSET_FILES[1],
    back_mobility: NODE_ASSET_FILES[2],
    thoracic_dissociation: NODE_ASSET_FILES[3],
    deep_squat: NODE_ASSET_FILES[10],
    single_leg_hold: NODE_ASSET_FILES[15],
    shoulder_girdle: NODE_ASSET_FILES[12],
  },
  athlete_precision: {
    neck_mobility: NODE_ASSET_FILES[1],
    dynamic_single_leg_squat: NODE_ASSET_FILES[27],
    back_mobility: NODE_ASSET_FILES[2],
    shoulder_girdle: NODE_ASSET_FILES[12],
    overhead_bilateral_squat: NODE_ASSET_FILES[29],
  },
  posture_ergonomics: {
    seated_desk_neck: NODE_ASSET_FILES[26],
    posture_axis: NODE_ASSET_FILES[25],
    single_leg_hold: NODE_ASSET_FILES[15],
    lumbar_spine: NODE_ASSET_FILES[2],
    shoulder_rotation: NODE_ASSET_FILES[22],
  },
  kinetic_integrity: {
    back_mobility: NODE_ASSET_FILES[30],
    neck_mobility: NODE_ASSET_FILES[31],
    deep_squat_overhead_bar: NODE_ASSET_FILES[29],
    fight_stance: NODE_ASSET_FILES[13],
    shoulder_mobility: NODE_ASSET_FILES[12],
    striking_analysis: NODE_ASSET_FILES[20],
  },
};

export function resolveSuiteNodeBlueprintUrl(suiteKey, slotKey) {
  const file = SUITE_NODE_BLUEPRINT_FILES?.[suiteKey]?.[slotKey];
  return file ? assessmentAsset(file) : '';
}

/** Build nested guide-asset map with resolved local URLs */
export function buildDefaultGuideAssetUrls() {
  const out = {};
  for (const [suiteKey, slots] of Object.entries(SUITE_NODE_BLUEPRINT_FILES)) {
    out[suiteKey] = {};
    for (const [slotKey, filename] of Object.entries(slots)) {
      out[suiteKey][slotKey] = assessmentAsset(filename);
    }
  }
  return out;
}

/** Full drag-and-drop checklist (relative to src/assets/assessments/) */
export const ASSESSMENT_ASSET_CHECKLIST = [
  ...Object.values(NODE_ASSET_FILES),
  ...Object.values(PANEL_ASSET_FILES),
];
