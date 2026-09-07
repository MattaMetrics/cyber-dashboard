import gideonSpecsProfile1 from '../assets/gideon-specs-profile1.png';
import gideonSpecsProfile2 from '../assets/gideon-specs-profile2.png';
import gideonSpecsProfile3 from '../assets/gideon-specs-profile3.png';
import gideonSpecsProfile4 from '../assets/gideon-specs-profile4.png';
import gideonSpecsProfile5 from '../assets/gideon-specs-profile5.png';
import gideonSpecsProfile6 from '../assets/gideon-specs-profile6.png';

/** Bundled movement demos — drop .mp4 / .webm into src/assets/gideon/demos/ */
const bundledDemoVideos = import.meta.glob('../assets/gideon/demos/*.{mp4,webm,mov}', {
  eager: true,
  import: 'default',
});

export const GIDEON_SLIDE_INTERVAL_MS = 5500;

/** Longer dwell when a movement demo clip is showing (loop still active). */
export const GIDEON_VIDEO_SLIDE_INTERVAL_MS = 12000;

export const GIDEON_IMAGE_SLIDES = [
  { type: 'image', src: gideonSpecsProfile1, caption: 'Command Interface · HUD Matrix Active' },
  { type: 'image', src: gideonSpecsProfile2, caption: 'Telemetry Uplink · Life Longevity Lab Protocols' },
  { type: 'image', src: gideonSpecsProfile3, caption: 'Primary AI Class 10 · Operational Standby' },
  { type: 'image', src: gideonSpecsProfile4, caption: 'Orbital Command Console · Global Biometric Desk' },
  { type: 'image', src: gideonSpecsProfile6, caption: 'Field Deployment · Core Protocols Corridor Uplink' },
  { type: 'image', src: gideonSpecsProfile5, caption: 'Mobile Telemetry Suite · LLL-7X9-88A Classified' },
];

function fileStemToCaption(stem) {
  return stem
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .concat(' · Movement Demo');
}

export function buildGideonDemoVideoSlides() {
  return Object.entries(bundledDemoVideos)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, src]) => {
      const stem = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'demo';
      return {
        type: 'video',
        src,
        caption: fileStemToCaption(stem),
      };
    });
}

/** Full Gideon holo reel — movement MP4 demos first, then portrait stills. */
export const GIDEON_SPEC_SLIDES = [...buildGideonDemoVideoSlides(), ...GIDEON_IMAGE_SLIDES];

export function isGideonVideoSlide(slide) {
  if (!slide) return false;
  if (slide.type === 'video') return true;
  const src = typeof slide.src === 'string' ? slide.src : '';
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
}

export function getGideonSlideIntervalMs(slide) {
  return isGideonVideoSlide(slide) ? GIDEON_VIDEO_SLIDE_INTERVAL_MS : GIDEON_SLIDE_INTERVAL_MS;
}
