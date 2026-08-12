/** Gemini coach persona keys — must match FastAPI `?coach=` query on port 8000 */

export const COACH_PERSONA_OPTIONS = [
  { value: 'gideon', label: 'Gideon — Laboratory Matrix Co-Pilot' },
  { value: 'combat_coach', label: 'Russian Master — Master of Sport' },
  { value: 'yoga_spirit', label: 'Yoga Spirit — Somatic Longevity' },
];

export const COACH_VOICE_PROFILES = {
  gideon: {
    gender: 'female',
    lang: 'en-GB',
    rate: 0.85,
    pitch: 1.05,
    label: 'Gideon',
  },
  combat_coach: {
    gender: 'male',
    lang: 'en-US',
    langFallback: 'en-GB',
    rate: 0.85,
    pitch: 0.65,
    label: 'Russian Master',
    voiceHints: [
      'Microsoft David',
      'David',
      'Microsoft Mark',
      'Mark',
      'Microsoft Guy',
      'Guy',
      'James',
      'George',
      'Ryan',
      'Daniel',
      'Google US English',
      'English (United States)',
      'English (United Kingdom)',
    ],
  },
  yoga_spirit: {
    voicePreset: 'gideon',
    label: 'Yoga Spirit',
    rate: 0.85,
    pitch: 1.05,
  },
};

export const COACH_VOICE_GREETINGS = {
  gideon: 'Vocal matrix online, Captain. Standing by for biomechanical uplink.',
  combat_coach:
    'Welcome back, Coach, my cyber brother. No days off here — lets train mastery, not comfort. What movement anomaly are we fixing today?',
  yoga_spirit: 'Welcome. Breathe with me. Your somatic movement profile is ready for review.',
};

/** Inner-card copy for GIDEON COACH FEEDBACK — not assessment summaries */
export const COACH_FEEDBACK_LOADING_TEXT =
  'Establishing core diagnostic uplink... Gideon is parsing temporal kinetic trajectories.';

export const COACH_FEEDBACK_IDLE_TEXT =
  "Click 'Get Coach Analysis' to engage telemetry.";

/** Legacy voice-placeholder text that must never appear in the feedback card */
export const LEGACY_GIDEON_FEEDBACK_PLACEHOLDER =
  'Good evening. I am Gideon. Your biomechanical analysis is ready.';

export const isLegacyCoachFeedbackPlaceholder = (text) =>
  (text || '').trim().toLowerCase() === LEGACY_GIDEON_FEEDBACK_PLACEHOLDER.toLowerCase();

/** Legacy dossier keys → current API persona key */
export const normalizeCoachPersonaKey = (key) => {
  const k = (key || 'gideon').toLowerCase();
  if (k === 'joe_rogan' || k === 'mma_coach') return 'combat_coach';
  return k;
};

export const getCoachPersonaLabel = (key) => {
  const normalized = normalizeCoachPersonaKey(key);
  return (
    COACH_PERSONA_OPTIONS.find((o) => o.value === normalized)?.label ||
    COACH_VOICE_PROFILES[normalized]?.label ||
    'Gideon'
  );
};

/** TTS engine label shown on voice toggle (yoga_spirit → Gideon) */
export function getCoachVoiceEngineLabel(personaKey) {
  const key = normalizeCoachPersonaKey(personaKey);
  const profile = COACH_VOICE_PROFILES[key];
  if (profile?.voicePreset) {
    return COACH_VOICE_PROFILES[profile.voicePreset]?.label || 'Gideon';
  }
  return profile?.label || 'Gideon';
}

/** Merge voicePreset (e.g. yoga_spirit → gideon voice engine) with persona overrides */
export function resolveCoachVoiceProfile(personaKey) {
  const key = normalizeCoachPersonaKey(personaKey);
  const profile = COACH_VOICE_PROFILES[key] || COACH_VOICE_PROFILES.gideon;
  if (profile.voicePreset) {
    const preset = COACH_VOICE_PROFILES[profile.voicePreset] || COACH_VOICE_PROFILES.gideon;
    return {
      ...preset,
      ...profile,
      gender: profile.gender || preset.gender,
      lang: profile.lang || preset.lang,
      langFallback: profile.langFallback || preset.langFallback,
    };
  }
  return profile;
}

/** True when a SpeechSynthesis voice is a clear English male profile */
function isEnglishMaleVoice(voice) {
  const name = (voice?.name || '').toLowerCase();
  const lang = (voice?.lang || '').toLowerCase();
  if (!lang.startsWith('en')) return false;
  if (/female|zira|samantha|karen|aria|fiona|hazel|libby|sonia|susan|emma|jenny|linda|michelle|natasha|paulina|irina|elena|maria|helen|kate|amy|laura|sara|anna|victoria|alloy|nova|shimmer|fable|echo/i.test(name)) {
    return false;
  }
  if (/male|david|mark|guy|james|tom|ryan|george|daniel|christopher|brian|eric|steven|richard|paul|andrew|martin|roger|fred|sam|onnx/i.test(name)) {
    return true;
  }
  return !/female|woman|girl/i.test(name);
}

/** Pick best system TTS voice for a coach profile */
export function pickCoachSpeechVoice(voices, profile) {
  const list = voices || [];
  if (!list.length || !profile) return null;

  const hints = profile.voiceHints || [];
  const langPrimary = profile.lang || 'en-US';

  for (const hint of hints) {
    const hintLower = hint.toLowerCase();
    const byHint = list.find(
      (v) =>
        isEnglishMaleVoice(v) &&
        (v.name.toLowerCase().includes(hintLower) ||
          (v.lang || '').toLowerCase().includes(hintLower))
    );
    if (byHint) return byHint;
  }

  if (profile.gender === 'female') {
    if (langPrimary.startsWith('en-GB')) {
      const gbFemale = list.find(
        (v) =>
          v.lang.startsWith('en-GB') &&
          (/female|fiona|kate|amy|sonia|libby|hazel/i.test(v.name) || !/male/i.test(v.name))
      );
      if (gbFemale) return gbFemale;
    }
    const usFemale = list.find(
      (v) =>
        v.lang.startsWith('en-US') &&
        (/female|samantha|karen|zira|aria/i.test(v.name) || !/male/i.test(v.name))
    );
    if (usFemale) return usFemale;
    return list.find((v) => /female/i.test(v.name)) || null;
  }

  const maleUs = list.find(
    (v) => v.lang.startsWith('en-US') && isEnglishMaleVoice(v)
  );
  if (maleUs) return maleUs;

  const maleGb = list.find(
    (v) => v.lang.startsWith('en-GB') && isEnglishMaleVoice(v)
  );
  if (maleGb) return maleGb;

  const maleAnyEn = list.find(
    (v) => v.lang.startsWith('en') && isEnglishMaleVoice(v)
  );
  if (maleAnyEn) return maleAnyEn;

  return list.find((v) => v.lang.startsWith(langPrimary)) || list.find((v) => v.lang.startsWith('en')) || list[0];
}

export function cleanCoachSpeechText(text) {
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~`>|]/g, '')
    .replace(/^[•\-–—]\s*/gm, '')
    .replace(/[🔴🟡🟢✅⚠️🤖]/g, '')
    .replace(/[°±≤≥]/g, ' degrees ')
    .replace(/[%]/g, ' percent ')
    .replace(/\u2014|\u2013/g, ', ')
    .replace(/\s*\/\/\s*/g, '. ')
    .replace(/\.\.\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shared Web Speech API helper — used by CoachDashboard + BlueprintAssessments */
export function speakCoachText(speechSynth, text, coachKey = 'gideon', { force = false, voiceEnabled = true } = {}) {
  if ((!voiceEnabled && !force) || !speechSynth || !text) return;

  speechSynth.cancel();

  const cleanText = cleanCoachSpeechText(text);
  if (!cleanText) return;

  const profile = resolveCoachVoiceProfile(coachKey);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = profile.rate ?? 1;
  utterance.pitch = profile.pitch ?? 1;
  utterance.volume = 0.9;

  const voices = speechSynth.getVoices();
  const bestVoice = pickCoachSpeechVoice(voices, profile);
  if (bestVoice) {
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang || profile.lang || 'en-US';
  } else if (profile.lang) {
    utterance.lang = profile.lang;
  }

  speechSynth.speak(utterance);
}
