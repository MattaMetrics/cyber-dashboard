/**
 * Package suite left-anchor hologram MP4 demos.
 *
 * Drop files into: src/assets/assessments/panel-demos/
 *
 * Filenames (match your PNG panel stems):
 *   panel_vital_flow_hologram.mp4
 *   panel_athlete_precision_hologram.mp4
 *   panel_posture_ergonomics_hologram.mp4
 *   panel_kinetic_power_hologram.mp4
 *
 * Static PNGs stay in src/assets/assessments/ — videos auto-wire by name.
 */

import { PANEL_ASSET_FILES } from './assessmentAssetUrl';

/** panelKey passed to getPanelAsset() in guideAssets.js */
export const PACKAGE_PANEL_KEYS = {
  VITAL_FLOW: 'vitalFlow',
  ATHLETE_PRECISION: 'athletePrecision',
  POSTURE_ERGONOMICS: 'postureErgonomics',
  KINETIC_POWER: 'kineticPower',
};

const bundledPanelDemos = import.meta.glob('../assets/assessments/panel-demos/*.{mp4,webm,mov}', {
  eager: true,
  import: 'default',
});

/** PNG stem (panel_kinetic_power_hologram) → panelKey (kineticPower) */
const PANEL_STEM_TO_KEY = Object.fromEntries(
  Object.entries(PANEL_ASSET_FILES)
    .filter(([key]) => key !== 'defaultStanding' && key !== 'draftDefault')
    .map(([panelKey, filename]) => [filename.replace(/\.[^.]+$/, ''), panelKey])
);

const PANEL_DEMO_VIDEO_BY_KEY = Object.fromEntries(
  Object.entries(bundledPanelDemos).flatMap(([path, src]) => {
    const stem = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
    const panelKey = PANEL_STEM_TO_KEY[stem];
    return panelKey ? [[panelKey, src]] : [];
  })
);

/** Resolve suite left-anchor MP4 demo for a package (e.g. kineticPower). */
export function getPackagePanelDemoVideo(panelKey) {
  return PANEL_DEMO_VIDEO_BY_KEY[panelKey] || null;
}

export function hasPackagePanelDemoVideo(panelKey) {
  return Boolean(getPackagePanelDemoVideo(panelKey));
}

/** Milliseconds to show static hologram PNG before auto-switching to MP4. */
export const PACKAGE_PANEL_IMAGE_DWELL_MS = 6500;
