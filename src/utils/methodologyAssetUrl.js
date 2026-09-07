/**
 * Methodology & Kinetic Research slideshow assets.
 * Drop PNG/WebP files into src/assets/methodology/ — they auto-register in filename order.
 * Suggested names: slide-01.png, slide-02.png, slide-03.png, …
 */

const assetModules = import.meta.glob('../assets/methodology/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

export const METHODOLOGY_SLIDE_CAPTIONS = [
  'Biomechanical Laws · Chronic Compensation Matrix',
  'Contextual Skeletal Inference · Preventative Durability',
  'Platform Core Mission · Telemetry Manifesto',
  'Kinetic Research Uplink · Visual Archive',
  'Longevity Lab · System Methodology Index',
  'Markerless Vision · Lab-Grade Telemetry',
];

export function buildMethodologySlides() {
  const entries = Object.entries(assetModules).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return METHODOLOGY_SLIDE_CAPTIONS.slice(0, 3).map((caption) => ({ src: null, caption }));
  }

  return entries.map(([path, src], index) => {
    const fileStem = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? `slide-${index + 1}`;
    return {
      src,
      caption:
        METHODOLOGY_SLIDE_CAPTIONS[index] ||
        fileStem.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  });
}
