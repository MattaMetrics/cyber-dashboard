import { staticAssessmentLibrary, getLibraryTrackById } from '../data/assessmentLibrary';
import { DECK_CARD_PRESENTATION } from './packageDeckPresentation';

/** Package deck keys used across the longevity lab terminal. */
export const PACKAGE_DECK_KEYS = {
  VITAL_FLOW: 'VITAL_FLOW',
  ATHLETE_PRECISION: 'ATHLETE PRECISION',
  POSTURE_ERGONOMICS: 'POSTURE & ERGONOMICS',
  KINETIC_POWER: 'KINETIC POWER INTEGRITY',
};

/** UI accent tokens — match each package terminal page (Vital=cyan, Athlete=amber, etc.) */
export const PACKAGE_DECK_THEME = {
  [PACKAGE_DECK_KEYS.VITAL_FLOW]: {
    shortLabel: 'Vital Flow',
    label: 'text-cyan-400',
    labelMuted: 'text-cyan-500/85',
    cardBorder: 'border-cyan-500/30',
    cardBg: 'bg-cyan-950/15',
    selectBorder: 'border-cyan-800/80',
    selectFocus: 'focus:border-cyan-500',
  },
  [PACKAGE_DECK_KEYS.ATHLETE_PRECISION]: {
    shortLabel: 'Athlete Precision',
    label: 'text-amber-400',
    labelMuted: 'text-amber-500/85',
    cardBorder: 'border-amber-500/30',
    cardBg: 'bg-amber-950/15',
    selectBorder: 'border-amber-800/80',
    selectFocus: 'focus:border-amber-500',
  },
  [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS]: {
    shortLabel: 'Posture & Ergonomics',
    label: 'text-emerald-400',
    labelMuted: 'text-emerald-500/85',
    cardBorder: 'border-emerald-500/30',
    cardBg: 'bg-emerald-950/15',
    selectBorder: 'border-emerald-800/80',
    selectFocus: 'focus:border-emerald-500',
  },
  [PACKAGE_DECK_KEYS.KINETIC_POWER]: {
    shortLabel: 'Kinetic Power',
    label: 'text-indigo-300',
    labelMuted: 'text-indigo-400/85',
    cardBorder: 'border-indigo-500/30',
    cardBg: 'bg-indigo-950/15',
    selectBorder: 'border-indigo-800/80',
    selectFocus: 'focus:border-indigo-500',
  },
};

const DEFAULT_DECK_THEME = PACKAGE_DECK_THEME[PACKAGE_DECK_KEYS.VITAL_FLOW];

export function getPackageDeckTheme(packageKey) {
  return PACKAGE_DECK_THEME[packageKey] || DEFAULT_DECK_THEME;
}

/** Card portal id → [packageKey, slot tag] e.g. ASSESSMENT_3-4 */
export const CARD_PACKAGE_SLOT = {
  vf_neck: [PACKAGE_DECK_KEYS.VITAL_FLOW, '1-1'],
  vf_spinal: [PACKAGE_DECK_KEYS.VITAL_FLOW, '1-2'],
  vf_thoracic: [PACKAGE_DECK_KEYS.VITAL_FLOW, '1-3'],
  vf_squat: [PACKAGE_DECK_KEYS.VITAL_FLOW, '1-4'],
  vf_hold: [PACKAGE_DECK_KEYS.VITAL_FLOW, '1-5'],
  vf_shoulder: [PACKAGE_DECK_KEYS.VITAL_FLOW, '1-6'],
  ap_neck: [PACKAGE_DECK_KEYS.ATHLETE_PRECISION, '2-1'],
  ap_single: [PACKAGE_DECK_KEYS.ATHLETE_PRECISION, '2-2'],
  ap_spinal: [PACKAGE_DECK_KEYS.ATHLETE_PRECISION, '2-3'],
  ap_shoulder: [PACKAGE_DECK_KEYS.ATHLETE_PRECISION, '2-4'],
  ap_overhead: [PACKAGE_DECK_KEYS.ATHLETE_PRECISION, '2-5'],
  pe_cervical: [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS, '3-1'],
  pe_axis: [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS, '3-2'],
  pe_hold: [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS, '3-3'],
  pe_lumbar: [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS, '3-4'],
  pe_shoulder: [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS, '3-5'],
  kp_spinal: [PACKAGE_DECK_KEYS.KINETIC_POWER, '4-1'],
  kp_neck: [PACKAGE_DECK_KEYS.KINETIC_POWER, '4-2'],
  kp_overhead: [PACKAGE_DECK_KEYS.KINETIC_POWER, '4-3'],
  kp_stance: [PACKAGE_DECK_KEYS.KINETIC_POWER, '4-4'],
  kp_shoulder: [PACKAGE_DECK_KEYS.KINETIC_POWER, '4-5'],
  kp_strike: [PACKAGE_DECK_KEYS.KINETIC_POWER, '4-6'],
};

/** Ordered card ids per package deck (UI slot positions are fixed; library ids are swappable). */
export const PACKAGE_DECK_CARD_ORDER = {
  [PACKAGE_DECK_KEYS.VITAL_FLOW]: [
    'vf_neck',
    'vf_spinal',
    'vf_thoracic',
    'vf_squat',
    'vf_hold',
    'vf_shoulder',
  ],
  [PACKAGE_DECK_KEYS.ATHLETE_PRECISION]: [
    'ap_neck',
    'ap_single',
    'ap_spinal',
    'ap_shoulder',
    'ap_overhead',
  ],
  [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS]: [
    'pe_cervical',
    'pe_axis',
    'pe_hold',
    'pe_lumbar',
    'pe_shoulder',
  ],
  [PACKAGE_DECK_KEYS.KINETIC_POWER]: [
    'kp_spinal',
    'kp_neck',
    'kp_overhead',
    'kp_stance',
    'kp_shoulder',
    'kp_strike',
  ],
};

/**
 * Coach-editable default overrides — applied on top of assessmentLibrary.packageSlots.
 * Example: Posture slot 3-4 pulls library id 3 (TRUNK & THORACIC) instead of id 22.
 */
export const DEFAULT_SLOT_BINDING_OVERRIDES = {
  [PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS]: {
    '3-4': 3,
  },
};

export const PACKAGE_SLOT_BINDINGS_STORAGE_KEY = 'MATRIX_PACKAGE_SLOT_BINDINGS';
export const PACKAGE_BINDINGS_PANEL_EXPANDED_KEY = 'MATRIX_DECK_BINDINGS_EXPANDED';

/** Package filter tabs for coach deck binding panel. */
export const PACKAGE_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All' },
  { id: PACKAGE_DECK_KEYS.VITAL_FLOW, label: 'Vital Flow' },
  { id: PACKAGE_DECK_KEYS.ATHLETE_PRECISION, label: 'Athlete' },
  { id: PACKAGE_DECK_KEYS.POSTURE_ERGONOMICS, label: 'Posture' },
  { id: PACKAGE_DECK_KEYS.KINETIC_POWER, label: 'Kinetic' },
];

/** Build default slot → libraryId map from the master movement library. */
export function buildDefaultSlotBindings() {
  const bindings = {};

  for (const track of staticAssessmentLibrary) {
    const slots = track.packageSlots || {};
    for (const [packageKey, slot] of Object.entries(slots)) {
      if (!bindings[packageKey]) bindings[packageKey] = {};
      bindings[packageKey][slot] = track.id;
    }
  }

  for (const [packageKey, slotMap] of Object.entries(DEFAULT_SLOT_BINDING_OVERRIDES)) {
    if (!bindings[packageKey]) bindings[packageKey] = {};
    Object.assign(bindings[packageKey], slotMap);
  }

  return bindings;
}

/** Merge coach-saved bindings over system defaults (deep merge per package). */
export function mergeSlotBindings(saved) {
  const merged = buildDefaultSlotBindings();
  if (!saved || typeof saved !== 'object') return merged;

  for (const packageKey of Object.keys(saved)) {
    const savedPackage = saved[packageKey];
    if (!savedPackage || typeof savedPackage !== 'object') continue;
    merged[packageKey] = {
      ...(merged[packageKey] || {}),
      ...savedPackage,
    };
  }

  return merged;
}

export function readPersistedSlotBindings() {
  try {
    const raw = window.localStorage?.getItem(PACKAGE_SLOT_BINDINGS_STORAGE_KEY);
    if (!raw) return mergeSlotBindings(null);
    return mergeSlotBindings(JSON.parse(raw));
  } catch {
    return mergeSlotBindings(null);
  }
}

export function persistSlotBindings(bindings) {
  try {
    window.localStorage?.setItem(PACKAGE_SLOT_BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    /* ignore quota errors */
  }
}

/** Resolve library track id for a package deck slot. */
export function resolveLibraryIdForSlot(packageKey, slot, slotBindings = buildDefaultSlotBindings()) {
  const key = String(packageKey || '');
  const slotKey = String(slot || '');
  const fromBindings = slotBindings?.[key]?.[slotKey];
  if (fromBindings != null) return Number(fromBindings);

  const fromLibrary = staticAssessmentLibrary.find(
    (track) => track.packageSlots?.[key] === slotKey
  );
  return fromLibrary?.id ?? null;
}

/** Resolve full library row for a deck slot using the centralized pool. */
export function getTrackForDeckSlot(packageKey, slot, slotBindings) {
  const libraryId = resolveLibraryIdForSlot(packageKey, slot, slotBindings);
  if (libraryId == null) return null;
  return getLibraryTrackById(libraryId);
}

/** Resolve library track from a portal card id (vf_neck, pe_lumbar, …). */
export function getTrackForCardId(cardId, slotBindings) {
  const mapping = CARD_PACKAGE_SLOT[cardId];
  if (!mapping) return null;
  const [packageKey, slot] = mapping;
  return getTrackForDeckSlot(packageKey, slot, slotBindings);
}

/** Dropdown options for coach deck binding panel. */
export function getLibraryTrackOptions() {
  return staticAssessmentLibrary.map((track) => ({
    value: track.id,
    label: `#${String(track.id).padStart(2, '0')} · ${track.name}`,
  }));
}

/**
 * Build live deck cards for a package terminal — presentation blocks stay on the slot;
 * title + execution data follow the bound library track.
 */
export function buildDeckCardsForPackage(packageKey, slotBindings) {
  const cardIds = PACKAGE_DECK_CARD_ORDER[packageKey] || [];

  return cardIds.map((cardId) => {
    const mapping = CARD_PACKAGE_SLOT[cardId];
    const slot = mapping?.[1] || '';
    const presentation = DECK_CARD_PRESENTATION[cardId] || {};
    const track = getTrackForDeckSlot(packageKey, slot, slotBindings);

    return {
      id: cardId,
      tag: slot ? `// ASSESSMENT_${slot} //` : '// ASSESSMENT //',
      title: track?.name || presentation.title || cardId,
      subtitle: presentation.subtitle,
      blocks: presentation.blocks || [],
      libraryId: track?.id ?? null,
      slot,
      packageKey,
    };
  });
}

/** Flat list of bindable deck slots for coach dashboard UI. */
export function listBindableDeckSlots() {
  return Object.entries(PACKAGE_DECK_CARD_ORDER).flatMap(([packageKey, cardIds]) =>
    cardIds.map((cardId) => {
      const slot = CARD_PACKAGE_SLOT[cardId]?.[1] || '';
      return {
        packageKey,
        cardId,
        slot,
        label: `${packageKey} · ASSESSMENT_${slot}`,
      };
    })
  );
}

/** Serialize slot bindings for coach export backup. */
export function exportSlotBindingsJSON(bindings) {
  return JSON.stringify(
    {
      version: 1,
      type: 'MATRIX_PACKAGE_SLOT_BINDINGS',
      exportedAt: new Date().toISOString(),
      bindings,
    },
    null,
    2
  );
}

/** Parse imported JSON and merge over system defaults. */
export function importSlotBindingsJSON(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const bindings = parsed?.bindings ?? parsed;
  if (!bindings || typeof bindings !== 'object') {
    throw new Error('Invalid bindings file — expected { bindings: { ... } }');
  }
  return mergeSlotBindings(bindings);
}

export function readBindingsPanelExpanded() {
  try {
    return window.localStorage?.getItem(PACKAGE_BINDINGS_PANEL_EXPANDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistBindingsPanelExpanded(expanded) {
  try {
    window.localStorage?.setItem(PACKAGE_BINDINGS_PANEL_EXPANDED_KEY, String(Boolean(expanded)));
  } catch {
    /* ignore */
  }
}
