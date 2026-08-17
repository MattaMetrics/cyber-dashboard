import fs from 'fs';

const path = 'src/data/assessmentLibrary.js';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("getNodeBlueprintById")) {
  s = s.replace(
    '// 🟢 THE JASMINE DRAGONS LEGACY MOVEMENT LIBRARY',
    "import { getNodeBlueprintById } from '../utils/assessmentAssetUrl';\n\n// 🟢 THE JASMINE DRAGONS LEGACY MOVEMENT LIBRARY"
  );
}

s = s.replace(/\n    biometric_photo_url: '[^']*',/g, '');
s = s.replace('export const staticAssessmentLibrary = [', 'const rawAssessmentLibrary = [');

if (!s.includes('rawAssessmentLibrary.map')) {
  s = s.replace(
    '];\n\n/** Resolve a complete library row by id */',
    `];

export const staticAssessmentLibrary = rawAssessmentLibrary.map((track) => ({
  ...track,
  biometric_photo_url: getNodeBlueprintById(track.id),
}));

/** Resolve a complete library row by id */`
  );
}

fs.writeFileSync(path, s);
console.log('Migrated assessmentLibrary.js');
