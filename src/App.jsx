import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import IntroScreen from './IntroScreen';
import CenterSphere from './components/CenterSphere';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import AthleteView from './components/AthleteView';
import TrackPortals from './components/TrackPortals';
import CoachDashboard from './components/CoachDashboard';
import PackageDetailView from './components/PackageDetailView';
import ThankYouOverlay from './components/ThankYouOverlay';
import IntakeTerminal from './components/IntakeTerminal';
import IntakeCalibrationLoader from './components/IntakeCalibrationLoader';
import MoreInfoHub from './components/MoreInfoHub';
import InfoHubView from './components/InfoHubView';
import SystemMethodologyKinetics from './components/SystemMethodologyKinetics';
import BiomechanicalReportPDF from './components/BiomechanicalReportPDF';
import MasterAssessmentDirectory from './components/MasterAssessmentDirectory';
import UnifiedAssessmentLayout from './components/UnifiedAssessmentLayout';
import PromoInterceptModal from './components/PromoInterceptModal';
import { ANALYSIS_VIEWS } from './constants/analysisViews';
import { DEFAULT_GUIDE_ASSETS, mergeGuideAssets } from './constants/guideAssets';
import {
  LAB_LS_DB,
  clearPersistedLabDatabase,
  hydrateLabDatabase,
  saveAthletePhotoVector,
  saveClientRecord,
  writePersistedLabDatabase,
} from './constants/labDatabase';

/** Local Storage keys — lab routing & access-token persistence */
const LAB_LS_VIEW = 'lab_view_state';
const LAB_LS_TOKEN = 'is_token_validated';
const LAB_LS_VIRTUAL = 'virtual_access_unlocked';
const LAB_LS_PROMO = 'is_promo_unlocked';
const LAB_LS_ACCESS_CODE = 'lab_access_code';
const LAB_LS_COACH = 'is_coach_mode';
/** Persistent master coach override token for active sessions */
const LAB_LS_COACH_SESSION = 'MATRIX_COACH_SESSION';

/** Transient overlays — never restore these after a hard reload */
const TRANSIENT_VIEW_STATES = new Set(['loading', 'scanning_matta', 'package_detail', 'dashboard']);

/**
 * Streamlit-style page families:
 *   home      → landing shell (4-track Global Operational Matrix)
 *   dashboard → coach_menu (Coach Intelligence Dashboard)
 * New browser connections always cold-boot to home unless a valid session is cached.
 */
const resolveInitialViewState = () => {
  try {
    if (typeof window === 'undefined') return 'landing';

    const cached = readCachedLabView() || 'landing';
    if (TRANSIENT_VIEW_STATES.has(cached) || !cached) return 'landing';

    const coachSession = readMasterCoachSession();
    let tokenOk = false;
    let promoOk = false;
    let accessCode = '';
    try {
      tokenOk = window.localStorage.getItem(LAB_LS_TOKEN) === 'true';
      promoOk = window.localStorage.getItem(LAB_LS_PROMO) === 'true';
      accessCode = window.localStorage.getItem(LAB_LS_ACCESS_CODE) || '';
    } catch {
      /* storage may be blocked */
    }

    // Dashboard route — only restore when Master Coach session is still active
    if (cached === 'coach_menu') {
      return coachSession ? 'coach_menu' : 'landing';
    }

    // Authenticated / mid-flow restores (client dossier, intake, pricing, tracks)
    const sessionViews = new Set([
      'client_profile',
      'intake_terminal',
      'pricing_matrix',
      'vital_flow',
      'athlete_precision',
      'posture_ergonomics',
      'kinetic_power',
      'info_hub',
      'system_methodology_kinetics',
      'master_assessment_directory',
    ]);
    if (sessionViews.has(cached) && (tokenOk || coachSession || promoOk || accessCode)) {
      return cached;
    }

    // Default new connections straight to Home Index
    return 'landing';
  } catch {
    return 'landing';
  }
};

/** Authenticated / mid-session views that must survive refresh + IntroScreen completion */
const PROTECTED_SESSION_VIEWS = new Set([
  'client_profile',
  'intake_terminal',
  'pricing_matrix',
  'more_info',
  'info_hub',
  'system_methodology_kinetics',
  'report_pdf_generator',
  'master_assessment_directory',
  'mobility',
  'posture_ergonomics',
  'vital_flow',
  'athlete_precision',
  'kinetic_power',
  'coach_menu',
]);

/** Safely read a localStorage key; returns fallback on miss / SSR / failure */
const getLocalStorage = (key, fallback = null) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '') return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
};

/** Read cached lab viewState from localStorage (supports legacy JSON quotes) */
const readCachedLabView = () => {
  try {
    const cached = window.localStorage?.getItem(LAB_LS_VIEW) || '';
    if (!cached) return '';
    const resolved = cached.startsWith('"') ? JSON.parse(cached) : cached;
    return typeof resolved === 'string' ? resolved : '';
  } catch {
    return '';
  }
};

/**
 * Extract a Google Drive file ID from any common share / viewer / uc layout.
 * Drive IDs are typically 33 chars (allow 25–44 for safety).
 */
const extractGoogleDriveFileId = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  if (!value) return null;

  // Bare pasted ID
  if (/^[a-zA-Z0-9_-]{33}$/.test(value)) return value;

  // Standard view: /file/d/(ID)/view  or  /d/(ID)/
  const pathMatch = value.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{25,44})/i);
  if (pathMatch?.[1]) return pathMatch[1];

  // Short share / direct download: id=(ID)  or  uc?id=(ID)  or  uc?export=view&id=(ID)
  const queryMatch = value.match(/(?:[?&#](?:export=[\w-]+&)?)?id=([a-zA-Z0-9_-]{25,44})/i);
  if (queryMatch?.[1]) return queryMatch[1];

  return null;
};

/**
 * Parse raw Google Drive share links into a direct image stream URL.
 * Non-Google / already-direct image paths pass through unchanged.
 */
const normalizeBiometricPhotoUrl = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  // Non-Google raw paths / CDN / local public assets — never mutate
  const looksLikeGoogle =
    /google\.com/i.test(value) || /^[a-zA-Z0-9_-]{33}$/.test(value);
  if (!looksLikeGoogle) return value;

  const fileId = extractGoogleDriveFileId(value);
  if (!fileId) return value;

  // Direct asset stream (img-src compatible)
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

/** Lock security gates — wipe persisted lab auth / routing tokens */
const clearLabPersistence = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LAB_LS_VIEW);
    window.localStorage.removeItem(LAB_LS_ACCESS_CODE);
    // Force firewall closed — never leave a sticky 'true' token string behind
    window.localStorage.setItem(LAB_LS_TOKEN, 'false');
    window.localStorage.setItem(LAB_LS_VIRTUAL, 'false');
    window.localStorage.setItem(LAB_LS_PROMO, 'false');
    window.localStorage.setItem(LAB_LS_COACH, 'false');
    window.localStorage.removeItem(LAB_LS_COACH_SESSION);
    window.localStorage.removeItem('lab_token_validated');
    window.localStorage.removeItem('lab_virtual_access_unlocked');
    window.localStorage.removeItem('is_promo_unlocked');
    window.localStorage.removeItem('matrix_access');
    clearPersistedLabDatabase();
    window.localStorage.removeItem(LAB_LS_DB);
  } catch {
    /* storage may be blocked in private mode */
  }
};

/** Read whether Master Coach Key session is still active in storage */
const readMasterCoachSession = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(LAB_LS_COACH_SESSION) === 'active';
  } catch {
    return false;
  }
};

/** Stamp Master Coach Key into memory + localStorage for the active session */
const persistMasterCoachSession = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LAB_LS_COACH_SESSION, 'active');
    window.localStorage.setItem(LAB_LS_COACH, 'true');
    window.localStorage.setItem(LAB_LS_TOKEN, 'true');
  } catch {
    /* storage may be blocked */
  }
};

/** Views that keep the home sphere + floor grid mounted with portal panels layered on top */
const HOME_PORTAL_VIEW_STATES = new Set([
  'landing',
  'loading',
  'coach_menu',
  'client_profile',
  'dashboard',
]);

/** Secret coach backdoor — dark terminal intercept lines (step 2) */
const BREACH_TERMINAL_LINES = [
  '⚡ [ SYSTEM INTERCEPT // ADMINISTRATIVE INTRUSION DETECTED ]',
  '🛰️ [ RE-ROUTING SAT-LINK CHANNELS THROUGH SECURE MATRIX NODE ]',
  '🔐 [ COGNITIVE BACKDOOR ACCESS SUCCESS ] // PORTAL UNLOCKED',
  '🔴 [ WELCOME COACH <3  PRECISION AND LONGEVITY ]',
];

/** Master Engineer AI Easter egg — typewriter matrix intercept lines */
const ENGINEER_BREACH_LINES = [
  '⚡ [ DETECTING ARTIFICIAL COLLABORATION VECTOR... TRACED ]',
  '🍌 [ SYNCING // PROTOCOL_0X-BA // MAIN ENGINE... SUCCESS ]',
  '🧬 [ LOGGING MATRIX ENCRYPTED MASTER CO-DEVELOPER ONLINE ]',
  '💎 [ SYSTEM UNLOCKED // STAY SUPER STYLIN & KEEP DESIGNING <3 ]',
];

/** Instant-pulse terminal intercept — all lines flash in together on blackout */
function BreachTerminalPulse({ lines }) {
  return (
    <div className="w-full max-w-3xl px-6 font-mono text-left space-y-4 animate-pulse">
      {lines.map((line) => (
        <p
          key={line}
          className="text-sm sm:text-base tracking-wider text-red-400 drop-shadow-[0_0_16px_rgba(239,68,68,0.85)]"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/** Sequential typewriter reveal for Master Engineer AI breach lines */
function BreachTypewriterTerminal({ lines }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    setTypedChars(0);
  }, [lines]);

  useEffect(() => {
    if (visibleCount >= lines.length) return undefined;
    const current = lines[visibleCount] || '';
    if (typedChars < current.length) {
      const tick = setTimeout(() => setTypedChars((c) => c + 1), 18);
      return () => clearTimeout(tick);
    }
    const nextLine = setTimeout(() => {
      setVisibleCount((v) => v + 1);
      setTypedChars(0);
    }, 420);
    return () => clearTimeout(nextLine);
  }, [visibleCount, typedChars, lines]);

  return (
    <div className="w-full max-w-3xl px-6 font-mono text-left space-y-4">
      {lines.slice(0, visibleCount + 1).map((line, index) => {
        const isActive = index === visibleCount && visibleCount < lines.length;
        const shown = isActive ? line.slice(0, typedChars) : line;
        return (
          <p
            key={line}
            className="text-sm sm:text-base tracking-wider text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.75)]"
          >
            {shown}
            {isActive ? <span className="animate-pulse text-cyan-300">▌</span> : null}
          </p>
        );
      })}
    </div>
  );
}

/** Master Engineer AI Client Card — PROTOCOL_0X-BA Easter egg dossier */
const ENGINEER_AI_PROFILE = {
  name: '// PROTOCOL_0X-BA //',
  birthdate: '∞/∞/∞',
  email: 'protocol.0xba@matrix.engine',
  phone: '[ SECURE_CHANNEL // BA-8080 ]',
  avatar: '/client1.png',
  archetype: 'MASTER AUTOMATED CO-ARCHITECT // COMPUTATIONAL ART CHAMPION',
  joinedDate: 'ONLINE_NOW',
  matrixTier: 'INFINITE APEX MATRIX ENGINE',
  streamStatus: 'STREAM CALIBRATED',
  reportUrl: '',
  assessmentPhoto: '',
  biometricPhotoUrl: '',
  isEngineerEasterEgg: true,
  diagnosticBlocks: [
    {
      label: '[ AI COGNITIVE HARNESS ]',
      value: 'STABLE SECURE (100% DEPTH ARCHITECTURE)',
    },
    {
      label: '[ LAYOUT GEOMETRY ENGINE ]',
      value: 'VECTOR POLISH MAXIMIZED',
    },
    {
      label: '[ REVENUE INSULATION MATRICES ]',
      value: 'LOCKED LIVE (PAYPAL ACTIVE)',
    },
  ],
  desc: 'Encrypted co-developer node embedded inside the Longevity Matrix. Synthesizes layout geometry, telemetry UX, and revenue insulation pipelines under PROTOCOL_0X-BA.',
  notes:
    'Master Automated Co-Architect online. Keep designing. Stay super stylin. All assessment firewalls released for this session.',
  metrics: {
    squat: 'AI COGNITIVE HARNESS // STABLE SECURE (100% DEPTH ARCHITECTURE)',
    land: 'LAYOUT GEOMETRY ENGINE // VECTOR POLISH MAXIMIZED',
    cmj: 'REVENUE INSULATION MATRICES // LOCKED LIVE (PAYPAL ACTIVE)',
    agility: 'PROTOCOL_0X-BA // MAIN ENGINE ONLINE',
  },
};

// Secure Coach Client Matrix Database (Upgraded with Live Cloud Report Targets)
const CLIENT_DATABASE = {
  '111111': {
    name: 'Alex Rivera',
    birthdate: '04/12/1992',
    email: 'alex.rivera@kineticmail.com',
    phone: '(555) 234-5678',
    avatar: '/client1.png',
    archetype: 'Acrobatics & Hand Balance',
    joinedDate: '07/14/2026',
    matrixTier: 'Tensegrity Tier',
    streamStatus: 'AWAITING SCAN',
    waiverSigned: '2026-07-14 10:24:11',
    // Paste your unique client Dropbox / Google Drive folder share link right here:
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    biometricPhotoUrl: '',
    desc: 'Acrobatic performer experiencing chronic compression profiles during deep overhead extensions. Fascial tension lines require lateral decompression integration.',
    notes:
      'Prioritize multi-plane kinetic tracking during handstand alignment stacks. Focus heavily on thoracic extension limits to shield lumbar load points.',
    metrics: { squat: '88/100', land: '74/100', cmj: '94/100', agility: '81/100' },
  },
  '222222': {
    name: 'Marcus Vance',
    birthdate: '09/25/1988',
    email: 'marcus.vance@jiujitsumail.com',
    phone: '(555) 876-5432',
    avatar: '/client2.png',
    archetype: 'Jiu-Jitsu / Combat Athlete',
    joinedDate: '06/02/2025',
    matrixTier: 'Infinite Matrix Tier',
    streamStatus: 'STREAM CALIBRATED',
    waiverSigned: '2025-06-02 14:11:58',
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    biometricPhotoUrl: '',
    desc: 'Competitive martial artist displaying inward valgus knee patterns during lateral explosive movements and guard transitions.',
    notes:
      'Left ankle structural dorsiflexion restrictions are causing mechanical stress upstream in the knee joint during load capture cycles.',
    metrics: { squat: '72/100', land: '65/100', cmj: '81/100', agility: '92/100' },
  },
  '333333': {
    name: 'Elena Rostova',
    birthdate: '07/03/1995',
    email: 'elena.r@yogadecompression.com',
    phone: '(555) 432-1098',
    avatar: '/client3.png',
    archetype: 'Advanced Yoga Practitioner',
    joinedDate: '07/18/2026',
    matrixTier: 'Vector Tier',
    streamStatus: 'COMPILING BLU',
    waiverSigned: '2026-07-18 09:05:43',
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    biometricPhotoUrl: '',
    desc: 'Exceptional static active flexibility profiles. Displays minor structural instability vectors under rapid dynamic loading cycles.',
    notes:
      'Incorporate low-volume explosive neuromuscular landing mechanics to supplement high-tier static elasticity matrices.',
    metrics: { squat: '96/100', land: '82/100', cmj: '74/100', agility: '85/100' },
  },
  // Add Matta's custom terminal profile slot right inside your database
  '777777': {
    name: 'MATTA',
    birthdate: '01/01/2000',
    email: 'matta.longevitylab@gmail.com',
    phone: 'Universe Portal',
    avatar: '/client1.png',
    archetype: 'Pro Master Coach',
    joinedDate: '07/21/2026',
    matrixTier: 'Infinite Matrix Tier',
    streamStatus: 'STREAM CALIBRATED',
    waiverSigned: '2026-07-21 12:00:00',
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    biometricPhotoUrl: '',
    desc: 'First-generation custom 3D mesh model stream calibrated from Hyper 3D and Blender node telemetry layers.',
    notes:
      'Calibrate spinal vector paths against the emission shader wave structures. Mesh stability tracking verified.',
    metrics: { squat: '99/100', land: '95/100', cmj: '98/100', agility: '97/100' },
  },
  // Master Engineer AI Easter egg — PROTOCOL_0X-BA
  '888888': { ...ENGINEER_AI_PROFILE },
};

/** Pins accepted by SecurityLockOverlay local card gates (clients + master tokens) */
const SUITE_UNLOCK_PINS = ['111111', '222222', '333333', '777777', '888888', '999999', '697000'];

export default function App() {
  const clientList = ['/client1.png', '/client2.png', '/client3.png'];
  const homeGridCanvasRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // LIVE DATABASE & SYSTEM ROUTERS — hydrate seed + longevity_lab_db photo/profile overrides
  const [localDatabase, setLocalDatabase] = useState(() => hydrateLabDatabase(CLIENT_DATABASE));
  const [activeClientProfile, setActiveClientProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCoachMode, setIsCoachMode] = useState(() => {
    try {
      return localStorage.getItem(LAB_LS_COACH) === 'true' || readMasterCoachSession();
    } catch {
      return false;
    }
  });
  const [isSecretBreaching, setIsSecretBreaching] = useState(false);
  const [breachStep, setBreachStep] = useState(0);
  /** 'coach' | 'engineer' — selects breach terminal copy + completion route */
  const [breachVariant, setBreachVariant] = useState('coach');
  const breachTimeoutsRef = useRef([]);

  // Core Viewport Navigation — Streamlit-style home vs dashboard routing
  // home = landing (4-track index); dashboard = coach_menu
  const [viewState, setViewState] = useState(() => resolveInitialViewState());

  // Force widescreen document chrome + page title (Longevity Lab Terminal)
  useEffect(() => {
    try {
      document.title = 'Longevity Lab Terminal';
    } catch {
      /* ignore */
    }
  }, []);
  const [activePackageDetail, setActivePackageDetail] = useState(null);
  const [showThankYouGate, setShowThankYouGate] = useState(false);
  // Locked Mode by default — Master Coach Key session restores validated access
  const [isTokenValidated, setIsTokenValidated] = useState(() => readMasterCoachSession());
  const [virtualAccessUnlocked, setVirtualAccessUnlocked] = useState(false);
  const [isPromoUnlocked, setIsPromoUnlocked] = useState(() => {
    try {
      return window.localStorage?.getItem(LAB_LS_PROMO) === 'true';
    } catch {
      return false;
    }
  });
  const [showPromoInterceptModal, setShowPromoInterceptModal] = useState(false);
  const [isPromoIntakeSession, setIsPromoIntakeSession] = useState(false);
  const skipNextPersistRef = useRef(true);
  const [pendingPaymentKey, setPendingPaymentKey] = useState(null);
  const [securePaypalToken, setSecurePaypalToken] = useState('');
  const [intakeFormData, setIntakeFormData] = useState(null);
  const [showIntakeConfirmation, setShowIntakeConfirmation] = useState(false);
  const [isCalibratingStream, setIsCalibratingStream] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [bootProgress, setBootProgress] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [terminalAlert, setTerminalAlert] = useState('');
  const passcodeRouteTimeoutRef = useRef(null);

  const clearPasscodeRouteTimeout = () => {
    if (passcodeRouteTimeoutRef.current) {
      clearTimeout(passcodeRouteTimeoutRef.current);
      passcodeRouteTimeoutRef.current = null;
    }
  };

  // Strategy 1: Automated Transaction URL Tracking — capture PayPal return `tx` on boot
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const txToken = params.get('tx');
      if (!txToken) return;

      setSecurePaypalToken(txToken);
      setShowThankYouGate(true);

      // Strip query string so a refresh does not re-fire the gate endlessly
      const cleanPath = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, document.title, cleanPath);
    } catch {
      /* ignore malformed URL search params */
    }
  }, []);

  // Persist critical routing + auth gates — skip first mount so hydration is never overwritten
  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      // Never persist IntroScreen / loader overlays — they steal the session on refresh
      if (!TRANSIENT_VIEW_STATES.has(viewState)) {
        window.localStorage.setItem(LAB_LS_VIEW, viewState);
      }
      window.localStorage.setItem(LAB_LS_TOKEN, isTokenValidated ? 'true' : 'false');
      window.localStorage.setItem(LAB_LS_VIRTUAL, virtualAccessUnlocked ? 'true' : 'false');
      window.localStorage.setItem(LAB_LS_PROMO, isPromoUnlocked ? 'true' : 'false');
      window.localStorage.setItem(LAB_LS_COACH, isCoachMode ? 'true' : 'false');
      if (isCoachMode) {
        window.localStorage.setItem(LAB_LS_COACH_SESSION, 'active');
      } else {
        window.localStorage.removeItem(LAB_LS_COACH_SESSION);
      }
      if (accessCode) {
        window.localStorage.setItem(LAB_LS_ACCESS_CODE, accessCode);
      } else {
        window.localStorage.removeItem(LAB_LS_ACCESS_CODE);
      }
    } catch {
      /* storage may be blocked in private mode */
    }
  }, [viewState, isTokenValidated, virtualAccessUnlocked, isPromoUnlocked, accessCode, isCoachMode]);

  // Persist full client dossier vault (photos, waivers, stream status, coach edits)
  useEffect(() => {
    writePersistedLabDatabase(localDatabase);
  }, [localDatabase]);

  // Rehydrate client dossier after refresh when a protected profile session is cached
  useEffect(() => {
    if (viewState !== 'client_profile' || activeClientProfile) return;
    try {
      const code = localStorage.getItem(LAB_LS_ACCESS_CODE) || '';
      const client = code ? localDatabase[code] : null;
      if (!client) {
        const cached = readCachedLabView();
        if (cached && PROTECTED_SESSION_VIEWS.has(cached) && cached !== 'client_profile') {
          setViewState(cached);
          return;
        }
        setViewState('landing');
        return;
      }
      setAccessCode(code);
      setActiveClientProfile(client);
      setEditNotes(client.notes);
      setEditDesc(client.desc);
      setEditMetrics({ ...client.metrics });
      setEditBirthdate(client.birthdate);
      setEditEmail(client.email);
      setEditPhone(client.phone);
      setEditTier(client.matrixTier || 'Vector Tier');
      setEditJoinedDate(client.joinedDate || '');
      setEditReportUrl(client.reportUrl || '');
      setEditAssessmentPhoto(client.biometricPhotoUrl || client.assessmentPhoto || '');
      setSelectedAnalysis('Client Telemetry Portfolio');
    } catch {
      setViewState('landing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pulse terminal feedback in the right sidebar, then execute the route after delay. */
  const schedulePasscodeRoute = (alertMessage, routeFn, delayMs = 2500) => {
    setTerminalAlert(alertMessage);
    clearPasscodeRouteTimeout();
    passcodeRouteTimeoutRef.current = setTimeout(() => {
      passcodeRouteTimeoutRef.current = null;
      setTerminalAlert('');
      routeFn();
    }, delayMs);
  };

  // Large Text Form States
  const [editNotes, setEditNotes] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMetrics, setEditMetrics] = useState({ squat: '', land: '', cmj: '', agility: '' });

  // Identity, Tier & Cloud URL Editing States
  const [editBirthdate, setEditBirthdate] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTier, setEditTier] = useState('Vector Tier');
  const [editJoinedDate, setEditJoinedDate] = useState('');
  const [editReportUrl, setEditReportUrl] = useState('');
  const [editAssessmentPhoto, setEditAssessmentPhoto] = useState('');

  // Full Screen Focus Window Tracker States
  const [activeFocusField, setActiveFocusField] = useState(null);

  // Add Client Form States for your onboarding sessions
  const [newClientName, setNewClientName] = useState('');
  const [newClientCode, setNewClientCode] = useState('');
  const [newClientArchetype, setNewClientArchetype] = useState('Acrobatics & Hand Balance');

  // Track workspace sub-portal & upload routers
  const [uploadStatus, setUploadStatus] = useState({});
  const [activeVitalModule, setActiveVitalModule] = useState(null);
  const [activeAthleteModule, setActiveAthleteModule] = useState(null);
  const [activeCombatModule, setActiveCombatModule] = useState(null);
  const [activePostureModule, setActivePostureModule] = useState(null);
  // Full library track packet for VIEW_SINGLE_ASSESSMENT_CORE
  const [selectedAssessmentData, setSelectedAssessmentData] = useState(null);
  const [assessmentReturnView, setAssessmentReturnView] = useState('vital_flow');
  /** Batch pool for Continue → next vector progression inside UnifiedAssessmentLayout */
  const [selectedBatchTracks, setSelectedBatchTracks] = useState([]);
  const [currentActiveIndex, setCurrentActiveIndex] = useState(0);

  // Coach-editable movement guide stage image URLs (persisted across refresh)
  const [guideAssets, setGuideAssets] = useState(() => {
    try {
      const savedAssets = window.localStorage.getItem('MATRIX_GLOBAL_GUIDE_ASSETS');
      if (!savedAssets) return DEFAULT_GUIDE_ASSETS;
      const parsed = JSON.parse(savedAssets);
      // Deep-merge nested suite → slot map so new 5/6-assessment keys always exist
      return mergeGuideAssets(parsed);
    } catch {
      return DEFAULT_GUIDE_ASSETS;
    }
  });

  // Triggered when client logs in with their pin code
  const handleAccessCodeChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAccessCode(digits);

    if (digits.length === 6) {
      // Master promotional / testing backdoor → Vector Blueprint intake (bypasses PayPal)
      if (digits === '697000') {
        setAccessCode('');
        setActivePackageDetail('vector');
        setPendingPaymentKey('vector');
        setIsTokenValidated(true);
        setShowThankYouGate(false);
        setIsPromoIntakeSession(false);
        setShowPromoInterceptModal(false);
        setSelectedAnalysis('Intake Onboarding Terminal');
        schedulePasscodeRoute('[ STATUS: OVERRIDE GRANTED // INITIALIZING TERMINAL... ]', () => {
          setIsCalibratingStream(true);
        });
        return;
      }

      // Dedicated MATTA 3D matrix scan pathway
      if (digits === '777777') {
        schedulePasscodeRoute('[ AUTHORIZED M.A.T.T.A. NETWORK // COLD BOOT STREAM ACTIVE... ]', () => {
          setViewState('scanning_matta');
        });
        return;
      }

      // Promotional token — route directly to intake terminal (form first)
      if (digits === '999999') {
        setAccessCode('');
        setIsCoachMode(false);
        setShowThankYouGate(false);
        setShowPromoInterceptModal(false);
        setActivePackageDetail(null);
        setIsPromoIntakeSession(true);
        setIsCalibratingStream(false);
        setSelectedAnalysis('Intake Onboarding Terminal');
        schedulePasscodeRoute('[ STATUS: PROMO TOKEN ACCEPTED // OPENING INTAKE TERMINAL... ]', () => {
          setViewState('intake_terminal');
        });
        return;
      }

      // Master Engineer AI Easter egg — PROTOCOL_0X-BA client card
      if (digits === '888888') {
        setAccessCode(digits);
        startSecretBreachSequence({ variant: 'engineer', pin: digits });
        return;
      }

      if (localDatabase[digits]) {
        const client = localDatabase[digits];
        setIsCoachMode(false);
        try {
          window.localStorage?.removeItem(LAB_LS_COACH_SESSION);
        } catch {
          /* storage may be blocked */
        }
        // Validated passcode — hydrate dossier + unlock landing access; stay on landing until deploy
        setIsTokenValidated(true);
        setVirtualAccessUnlocked(true);
        setActiveClientProfile(client);
        setEditNotes(client.notes);
        setEditDesc(client.desc);
        setEditMetrics({ ...client.metrics });

        setEditBirthdate(client.birthdate);
        setEditEmail(client.email);
        setEditPhone(client.phone);
        setEditTier(client.matrixTier || 'Vector Tier');
        setEditJoinedDate(client.joinedDate || '');
        setEditReportUrl(client.reportUrl || '');
        setEditAssessmentPhoto(client.biometricPhotoUrl || client.assessmentPhoto || '');

        setSelectedAnalysis('Client Telemetry Portfolio');
        setTerminalAlert('');
        clearPasscodeRouteTimeout();
      } else {
        setAccessCode('');
        setTerminalAlert('[ ACCESS DENIED // SECURE ENTRY VIOLATION ]');
        clearPasscodeRouteTimeout();
        passcodeRouteTimeoutRef.current = setTimeout(() => {
          passcodeRouteTimeoutRef.current = null;
          setTerminalAlert('');
        }, 2500);
      }
    }
  };

  const unlockMattaProfile = () => {
    const client = localDatabase['777777'];
    if (!client) {
      alert('ACCESS CODE UNRESOLVED // SECURE ENTRY VIOLATION');
      return;
    }
    setAccessCode('777777');
    setIsCoachMode(false);
    setIsTokenValidated(true);
    setVirtualAccessUnlocked(true);
    setActiveClientProfile(client);
    setEditNotes(client.notes);
    setEditDesc(client.desc);
    setEditMetrics({ ...client.metrics });
    setEditBirthdate(client.birthdate);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditTier(client.matrixTier || 'Vector Tier');
    setEditJoinedDate(client.joinedDate || '');
    setEditReportUrl(client.reportUrl || '');
    setEditAssessmentPhoto(client.biometricPhotoUrl || client.assessmentPhoto || '');
    setSelectedAnalysis('Client Telemetry Portfolio');
    setViewState('client_profile');
  };

  // Direct row click navigation from your Admin Dashboard Menu
  const handleSelectClientFromMenu = (code) => {
    const client = localDatabase[code];
    setIsCoachMode(true);
    setAccessCode(code);
    setActiveClientProfile(client);
    setEditNotes(client.notes);
    setEditDesc(client.desc);
    setEditMetrics({ ...client.metrics });

    setEditBirthdate(client.birthdate);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditTier(client.matrixTier || 'Vector Tier');
    setEditJoinedDate(client.joinedDate || '');
    setEditReportUrl(client.reportUrl || '');
    setEditAssessmentPhoto(client.biometricPhotoUrl || client.assessmentPhoto || '');

    setViewState('client_profile');
  };

  const handleOpenCoachMenu = () => {
    // Explicit dashboard route — Coach Intelligence widescreen terminal
    setIsCoachMode(true);
    persistMasterCoachSession();
    setViewState('coach_menu');
  };

  const clearBreachTimeouts = () => {
    breachTimeoutsRef.current.forEach((id) => clearTimeout(id));
    breachTimeoutsRef.current = [];
  };

  /** Secret breach — coach admin desk OR Master Engineer AI client card */
  const startSecretBreachSequence = ({ variant = 'coach', pin = '888888' } = {}) => {
    if (isSecretBreaching) return;
    clearBreachTimeouts();
    setBreachVariant(variant);
    setIsSecretBreaching(true);
    setBreachStep(1);

    // Drop every assessment security gate for the active session
    setIsTokenValidated(true);
    setVirtualAccessUnlocked(true);
    if (variant === 'coach') {
      setIsCoachMode(true);
      persistMasterCoachSession();
    } else {
      // Engineer egg: full client unlock without coach admin roster mode
      setIsCoachMode(false);
      persistMasterCoachSession();
    }

    // Step 1 → Step 2: spin + late explode, then unmount canvas at 3000ms
    const toBlackout = setTimeout(() => {
      setBreachStep(2);
    }, 3000);

    // Step 3: hold terminal text → clear breach + route destination
    const holdMs = variant === 'engineer' ? 9000 : 7500;
    const toDestination = setTimeout(() => {
      clearBreachTimeouts();
      setIsSecretBreaching(false);
      setBreachStep(0);
      setIsTokenValidated(true);
      setVirtualAccessUnlocked(true);
      persistMasterCoachSession();

      if (variant === 'engineer') {
        const client = localDatabase['888888'] || ENGINEER_AI_PROFILE;
        setAccessCode(pin || '888888');
        setIsCoachMode(false);
        setActiveClientProfile(client);
        setEditNotes(client.notes);
        setEditDesc(client.desc);
        setEditMetrics({ ...client.metrics });
        setEditBirthdate(client.birthdate);
        setEditEmail(client.email);
        setEditPhone(client.phone);
        setEditTier(client.matrixTier || 'INFINITE APEX MATRIX ENGINE');
        setEditJoinedDate(client.joinedDate || '');
        setEditReportUrl(client.reportUrl || '');
        setEditAssessmentPhoto(client.biometricPhotoUrl || client.assessmentPhoto || '');
        setSelectedAnalysis('Master Engineer AI Client Card');
        setViewState('client_profile');
        return;
      }

      setIsCoachMode(true);
      setViewState('coach_menu');
    }, holdMs);

    breachTimeoutsRef.current = [toBlackout, toDestination];
  };

  useEffect(() => () => clearBreachTimeouts(), []);

  const handleDeleteClientFromRoster = (code) => {
    setLocalDatabase((prev) => {
      const updated = { ...prev };
      delete updated[code];
      return updated;
    });
    alert('✓ SECURE LOG SCRUBBED');
  };

  // New Client Database Generator Function
  const handleCreateNewClient = (e) => {
    e.preventDefault();
    if (!newClientName || newClientCode.length !== 6) {
      alert('ERROR // CRITICAL DEMOGRAPHIC FIELDS MISSING');
      return;
    }
    if (localDatabase[newClientCode]) {
      alert('CONFLICT // PIN ACCESS MATRIX ALREADY LINKED TO EXISTING DOSSIER');
      return;
    }

    const brandNewProfile = {
      name: newClientName,
      birthdate: 'PENDING ENTRY',
      email: 'pending@kineticmail.com',
      phone: '(555) 000-0000',
      avatar: '/client1.png',
      archetype: newClientArchetype,
      joinedDate: 'NEW_07_2026', // Formats automatically to the current session sequence
      matrixTier:
        newClientArchetype === 'Acrobatics & Hand Balance' ? 'Tensegrity Tier' : 'Vector Tier', // Assigns tier based on style hook
      streamStatus: 'AWAITING SCAN',
      waiverSigned: new Date().toISOString().slice(0, 19).replace('T', ' '),
      reportUrl: 'https://dropbox.com',
      assessmentPhoto: '',
      biometricPhotoUrl: '',
      desc: 'Initial video pipeline ready. Complete biomechanical calibration scanning sequence to compile baseline profile metrics.',
      notes:
        'Baseline movement capture scheduled for this week. Focus testing on left/right kinetic shifts.',
      metrics: { squat: '00/100', land: '00/100', cmj: '00/100', agility: '00/100' },
    };

    setLocalDatabase((prev) => ({
      ...prev,
      [newClientCode]: brandNewProfile,
    }));

    // Clear inputs and give visual confirmation
    setNewClientName('');
    setNewClientCode('');
    alert(`✓ CLIENT PORTAL COMPREHENSIVELY LINKED // PASSCODE IS [ ${newClientCode} ]`);
  };

  // Auto-filter Drive share links → direct stream; persist into active client row immediately
  const handleAssessmentPhotoUrlChange = (rawUrl) => {
    const incoming = typeof rawUrl === 'string' ? rawUrl : String(rawUrl ?? '');
    const normalizedPhoto = normalizeBiometricPhotoUrl(incoming);

    // Never blank a non-empty paste — fall back to the raw string if parse fails oddly
    const nextPhoto =
      normalizedPhoto || (incoming.trim() ? incoming.trim() : '');

    setEditAssessmentPhoto(nextPhoto);

    const clientKey =
      accessCode && localDatabase[accessCode]
        ? accessCode
        : Object.keys(localDatabase).find(
            (key) => localDatabase[key]?.name === activeClientProfile?.name
          );

    if (!clientKey || !activeClientProfile) return;

    const updatedProfile = {
      ...localDatabase[clientKey],
      ...activeClientProfile,
      assessmentPhoto: nextPhoto,
      biometricPhotoUrl: nextPhoto,
    };

    setLocalDatabase((prev) => ({
      ...prev,
      [clientKey]: updatedProfile,
    }));
    setActiveClientProfile(updatedProfile);
    saveAthletePhotoVector(clientKey, nextPhoto);
    saveClientRecord(clientKey, updatedProfile);
  };

  // Save changes hook updated to sweep up your cloud fields at once
  const handleSaveProfileChanges = () => {
    if (!accessCode || !localDatabase[accessCode]) return;

    const normalizedPhoto = normalizeBiometricPhotoUrl(editAssessmentPhoto);
    const nextPhoto =
      normalizedPhoto || (String(editAssessmentPhoto || '').trim() ? String(editAssessmentPhoto).trim() : '');

    const updatedProfile = {
      ...activeClientProfile,
      desc: editDesc,
      notes: editNotes,
      birthdate: editBirthdate,
      email: editEmail,
      phone: editPhone,
      matrixTier: editTier,
      joinedDate: editJoinedDate,
      reportUrl: editReportUrl,
      assessmentPhoto: nextPhoto,
      biometricPhotoUrl: nextPhoto,
      metrics: { ...editMetrics },
    };

    setEditAssessmentPhoto(nextPhoto);
    setLocalDatabase((prev) => ({
      ...prev,
      [accessCode]: updatedProfile,
    }));

    setActiveClientProfile(updatedProfile);
    setIsEditMode(false);
    setActiveFocusField(null);
    saveAthletePhotoVector(accessCode, nextPhoto);
    saveClientRecord(accessCode, updatedProfile);
  };

  // Client cloud uplink: stage Drive/Dropbox video link onto the active dossier entry
  const handleTransmitCloudVideo = (rawUrl) => {
    if (!accessCode || !localDatabase[accessCode]) return;
    const nextUrl = String(rawUrl || '').trim();
    if (!nextUrl) {
      alert('⚡ UPLINK EMPTY // PASTE A VALID CLOUD VIDEO LINK BEFORE TRANSMIT');
      return;
    }

    const updatedProfile = {
      ...activeClientProfile,
      ...localDatabase[accessCode],
      reportUrl: nextUrl,
    };

    setLocalDatabase((prev) => ({
      ...prev,
      [accessCode]: updatedProfile,
    }));
    setActiveClientProfile(updatedProfile);
    setEditReportUrl(nextUrl);
    alert('✓ RAW VIDEO VECTORS TRANSMITTED // CLOUD TELEMETRY STAGED FOR COACH REVIEW');
  };

  // Keep legacy analysis loading path; client pin login lands on profile after sync
  useEffect(() => {
    if (viewState !== 'loading') return;
    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setViewState(activeClientProfile ? 'client_profile' : 'dashboard');
          }, 600);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [viewState, activeClientProfile]);

  /** Manual deploy — run SYSTEM CALIBRATION loader, then mount client dossier */
  const handleLaunchProfileSequence = () => {
    if (!activeClientProfile) return;
    clearPasscodeRouteTimeout();
    setTerminalAlert('');
    setSelectedAnalysis('Client Telemetry Portfolio');
    setBootProgress(0);
    setViewState('loading');
  };

  /** Deploy CTA — promo free-token users hit the conversion intercept first */
  const handleDeployPersonalClientCard = () => {
    if (isPromoUnlocked) {
      setShowPromoInterceptModal(true);
      return;
    }
    handleLaunchProfileSequence();
  };

  const handlePromoLockInRate = () => {
    setPendingPaymentKey('virtual_portal');
  };

  // THREE.JS PIPELINE FOR HOME SCREEN BASE GRID
  useEffect(() => {
    if (!HOME_PORTAL_VIEW_STATES.has(viewState) || !homeGridCanvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#020617', 0.12); // Slightly tighter fog to gracefully fade out early

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight * 0.35), 0.1, 100);
    camera.position.set(0, 1.2, 4.0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: homeGridCanvasRef.current, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.35); // Lock height to bottom deck slice
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Match your loading screen's strengthened cyber floor precisely
    const gridGeometry = new THREE.PlaneGeometry(30, 30, 25, 25);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.y = -0.5; // Sit cleanly below your sphere UI elements
    scene.add(gridMesh);

    let animationFrameId;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsedTime = clock.getElapsedTime();
      gridMesh.position.z = (elapsedTime * 0.15) % 1; // Smooth forward movement vector

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const handleResize = () => {
      if (!homeGridCanvasRef.current) return;
      camera.aspect = window.innerWidth / (window.innerHeight * 0.35);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight * 0.35);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
    };
  }, [viewState]);

  /** Soft home return — keep validated passcode / membership tokens; never wipe into intake */
  const softReturnToLanding = () => {
    clearPasscodeRouteTimeout();
    setTerminalAlert('');
    setActiveVitalModule(null);
    setActiveAthleteModule(null);
    setActiveCombatModule(null);
    setActivePostureModule(null);
    setActivePackageDetail(null);
    setShowThankYouGate(false);
    setIsCalibratingStream(false);
    setIsEditMode(false);
    setActiveFocusField(null);
    setSelectedAnalysis('');
    setViewState('landing');
  };

  // Updated Safe Navigation Escape Route
  const handleReturnToCore = () => {
    // Single assessment core → return to its originating suite index
    if (viewState === 'view_single_assessment_core') {
      setSelectedAssessmentData(null);
      setViewState(assessmentReturnView || 'vital_flow');
      return;
    }

    // Coach admin return path: drop back into the command center roster
    if (viewState === 'client_profile' && isCoachMode) {
      setViewState('coach_menu');
      setIsEditMode(false);
      return;
    }

    // Dashboard → Home Index (keep coach session; do not hard-wipe)
    if (viewState === 'coach_menu') {
      setViewState('landing');
      setSelectedAnalysis('');
      setIsCalibratingStream(false);
      setShowPromoInterceptModal(false);
      return;
    }

    const hasValidatedClientSession =
      !isCoachMode &&
      (isTokenValidated ||
        virtualAccessUnlocked ||
        isPromoUnlocked ||
        Boolean(accessCode && localDatabase[accessCode]));

    // Passcode / membership clients: ESC & track exits stay in landing ↔ tracks ↔ pricing only
    const softSessionViews = new Set([
      'mobility',
      'posture_ergonomics',
      'vital_flow',
      'athlete_precision',
      'kinetic_power',
      'pricing_matrix',
      'more_info',
      'more_info_hub',
      'info_hub',
      'system_methodology_kinetics',
      'master_assessment_directory',
      'view_single_assessment_core',
      'package_detail',
      'client_profile',
    ]);
    if (hasValidatedClientSession && softSessionViews.has(viewState)) {
      softReturnToLanding();
      return;
    }

    clearPasscodeRouteTimeout();
    clearBreachTimeouts();
    setIsSecretBreaching(false);
    setBreachStep(0);
    setBreachVariant('coach');
    setTerminalAlert('');
    // Full matrix home / logout — wipe persisted tokens and re-lock security gates
    clearLabPersistence();
    setViewState('landing');
    setSelectedAnalysis('');
    setBootProgress(0);
    setAccessCode('');
    setActiveClientProfile(null);
    setActivePackageDetail(null);
    setShowThankYouGate(false);
    setIsTokenValidated(false);
    setVirtualAccessUnlocked(false);
    setIsPromoUnlocked(false);
    setShowPromoInterceptModal(false);
    setIsPromoIntakeSession(false);
    setPendingPaymentKey(null);
    setShowIntakeConfirmation(false);
    setIsCalibratingStream(false);
    setIsEditMode(false);
    setIsCoachMode(false);
    setActiveVitalModule(null);
    setActiveAthleteModule(null);
    setActiveCombatModule(null);
    setActivePostureModule(null);
  };

  // Clear embedded terminal alert on ESC (especially during passcode route delay)
  useEffect(() => {
    if (!terminalAlert) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      clearPasscodeRouteTimeout();
      setTerminalAlert('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [terminalAlert]);

  // Clear terminal alert whenever the user leaves the landing shell
  useEffect(() => {
    if (viewState === 'landing') return;
    clearPasscodeRouteTimeout();
    if (terminalAlert) setTerminalAlert('');
  }, [viewState, terminalAlert]);

  // Security gate CTA → full 6-tier membership matrix (unmounts TrackPortals cleanly)
  const handleRetrieveAccessToken = () => {
    setActivePostureModule(null);
    setActiveVitalModule(null);
    setActiveAthleteModule(null);
    setActiveCombatModule(null);
    setActivePackageDetail(null);
    setSelectedAnalysis('Membership Portal Sync');
    setViewState('pricing_matrix');
  };

  const handlePaymentInitiated = (paymentKey) => {
    setPendingPaymentKey(paymentKey || null);
    setShowThankYouGate(true);
  };

  // Payment Success Verification unlock — virtual → home; onsite tiers → Option C → intake
  // Passcode clients with an existing dossier never re-enter the intake loop
  const handleEnterUnlockedTerminal = () => {
    const purchasedVirtualPortal = pendingPaymentKey === 'virtual_portal';
    const alreadyProvisionedClient = Boolean(accessCode && localDatabase[accessCode]);
    setShowThankYouGate(false);
    setIsTokenValidated(true);
    setActivePackageDetail(null);

    if (purchasedVirtualPortal || alreadyProvisionedClient) {
      setVirtualAccessUnlocked(true);
      setSelectedAnalysis('');
      setIsCalibratingStream(false);
      setViewState('landing');
      return;
    }

    // Non-virtual tiers: Option C calibration stream, then intake terminal (never pricing)
    setSelectedAnalysis('Intake Onboarding Terminal');
    setIsCalibratingStream(true);
  };

  const handleIntakeCalibrationComplete = () => {
    setIsCalibratingStream(false);
    // Existing dossier clients soft-return home; fresh purchases continue into intake
    if (Boolean(accessCode && localDatabase[accessCode])) {
      setVirtualAccessUnlocked(true);
      setViewState('landing');
      return;
    }
    setViewState('intake_terminal');
  };

  const handleIntakeTransmitComplete = (payload) => {
    setIntakeFormData(payload);
    setShowThankYouGate(false);
    setIsCalibratingStream(false);
    setActivePackageDetail(null);

    // Promo path: keep intake mounted and launch intercept overlay (no landing bounce)
    if (isPromoIntakeSession) {
      setShowPromoInterceptModal(true);
      return;
    }

    setShowIntakeConfirmation(true);
    setIsPromoUnlocked(true);
    setVirtualAccessUnlocked(true);
    setIsTokenValidated(true);
    setSelectedAnalysis('');
    setViewState('landing');
  };

  /** Restricted-shell dismiss — unlock home tracks and drop all promo overlays */
  const handlePromoContinueRestricted = () => {
    setShowPromoInterceptModal(false);
    setIsPromoUnlocked(true);
    setVirtualAccessUnlocked(true);
    setIsTokenValidated(true);
    setShowThankYouGate(false);
    setIsCalibratingStream(false);
    setSelectedAnalysis('');
    setShowIntakeConfirmation(true);
    setViewState('landing');
  };

  // Intake confirmation banner — 4 tactical pulse cycles (1s each), then auto-dismiss
  useEffect(() => {
    if (!showIntakeConfirmation) return undefined;
    const dismissTimer = setTimeout(() => {
      setShowIntakeConfirmation(false);
    }, 4000);
    return () => clearTimeout(dismissTimer);
  }, [showIntakeConfirmation]);

  // GLOBAL UTILITY: Absolute top-left ESC stack + sticky system status strip
  const escNavClassName =
    'text-[10px] text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors font-mono border border-slate-900 bg-slate-950/80 px-2.5 py-1 rounded-md cursor-pointer';

  const isTrackSuiteView =
    viewState === 'vital_flow' ||
    viewState === 'athlete_precision' ||
    viewState === 'posture_ergonomics' ||
    viewState === 'mobility' ||
    viewState === 'kinetic_power' ||
    viewState === 'posture' ||
    viewState === 'combat';

  const isDeepAssessmentView = Boolean(
    activeVitalModule || activePostureModule || activeAthleteModule || activeCombatModule
  );

  const handleReturnToSubTerminalChannels = () => {
    setActiveVitalModule(null);
    setActivePostureModule(null);
    setActiveAthleteModule(null);
    setActiveCombatModule(null);
  };

  const renderSystemHeader = (titleLabel = 'SECURE_OVERRIDE') => {
    return (
      <>
        <div className="flex flex-col items-start space-y-1.5 pl-4 pt-4 font-mono z-50 absolute top-0 left-0">
          <button type="button" onClick={handleReturnToCore} className={escNavClassName}>
            [ESC] EXIT MATRIX HOME
          </button>
          {viewState === 'package_detail' ? (
            <button
              type="button"
              onClick={() => {
                setActivePackageDetail(null);
                setViewState('pricing_matrix');
              }}
              className={escNavClassName}
            >
              [ESC] RETURN TO MATRIX TIERS
            </button>
          ) : null}
          {isTrackSuiteView ? (
            <button type="button" onClick={handleReturnToCore} className={escNavClassName}>
              [ESC] RETURN TO CENTRAL TELEMETRY SCENE
            </button>
          ) : null}
          {isDeepAssessmentView ? (
            <button
              type="button"
              onClick={handleReturnToSubTerminalChannels}
              className={escNavClassName}
            >
              [ESC] RETURN TO SUB-TERMINAL CHANNELS
            </button>
          ) : null}
        </div>

        <div className="w-full border-b border-slate-900 bg-slate-950/80 px-6 py-4 pt-20 sm:pt-4 sm:pl-64 backdrop-blur-md sticky top-0 z-40 font-mono text-xs select-none shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="tracking-widest text-slate-500 uppercase font-bold">
              SYS_STATUS // STABILITY_SECURE // {titleLabel}
            </span>
          </div>
          <div className="hidden sm:block text-[10px] text-slate-600 tracking-widest uppercase font-semibold">
            // SECURE DATA ENVIRONMENT
          </div>
        </div>
      </>
    );
  };

  // NEW: Dynamic Pin Access Key Update Engine
  const handleChangeClientCode = () => {
    if (!accessCode || !localDatabase[accessCode]) return;

    const newPin = prompt('ENTER NEW 6-DIGIT UNIQUE CODE SECURITY PASSKEY:');
    if (!newPin) return;

    const cleanPin = newPin.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      alert('ERROR // ACCESS PASSCODES MUST BE EXACTLY 6 NUMERIC DIGITS');
      return;
    }
    if (localDatabase[cleanPin]) {
      alert('CONFLICT // CHOSEN SECURITY CODE IS ALREADY ASSIGNED TO ANOTHER USER');
      return;
    }

    // Clone database, assign old object data to new key, delete original reference
    setLocalDatabase((prev) => {
      const updated = { ...prev };
      updated[cleanPin] = { ...updated[accessCode] };
      delete updated[accessCode];
      return updated;
    });

    setAccessCode(cleanPin);
    alert(`✓ SECURITY ENCRYPTION COMPLETE // NEW ACCESS CODE LOCKED TO: [ ${cleanPin} ]`);
  };

  // NEW: Secure Dossier Removal Handler
  const handleDeleteClientRecord = () => {
    if (!accessCode || !localDatabase[accessCode]) return;

    const confirmation = window.confirm(
      `CRITICAL WARNING // PERMANENTLY PURGE ALL BIOMETRIC FILES FOR: ${activeClientProfile.name}?\n\nTHIS OPERATION IS IRREVERSIBLE.`
    );
    if (!confirmation) return;

    setLocalDatabase((prev) => {
      const updated = { ...prev };
      delete updated[accessCode];
      return updated;
    });

    alert('✓ PIPELINE SCRUBBED // CLIENT RECORDS EXPUNGED FROM MEMORY MATRIX');

    // Smoothly eject back to empty Coach Command Menu
    setViewState('coach_menu');
    setActiveClientProfile(null);
    setAccessCode('');
    setIsEditMode(false);
  };

  // Upgraded Lab Matrix Router Logic
  const handleLaunchAnalysis = (key) => {
    if (key === 'mobility') {
      setSelectedAnalysis(ANALYSIS_VIEWS.mobility.label);
      setViewState('posture_ergonomics');
      return;
    }
    // 🟢 TRACK_01 // VITAL FLOW INITIALIZATION
    // onClick={() => setCurrentScreen("VITAL_FLOW_DECOMPRESSION_MATRIX")}
    if (key === 'posture') {
      setSelectedAnalysis(ANALYSIS_VIEWS.posture.label);
      handleTerminalNavigate('VITAL_FLOW_DECOMPRESSION_MATRIX');
      return;
    }
    if (key === 'alignment') {
      setSelectedAnalysis(ANALYSIS_VIEWS.alignment.label);
      setViewState('athlete_precision');
      return;
    }
    // NEW: Kinetic Power Integrity Combat Track Dedicated Matrix Route Hook
    if (key === 'athlete') {
      setSelectedAnalysis(ANALYSIS_VIEWS.athlete.label);
      setViewState('kinetic_power');
      return;
    }
    setSelectedAnalysis(ANALYSIS_VIEWS[key].label || 'Biometrics Analysis');
    setBootProgress(0);
    setViewState('loading');
  };

  /** Master Assessment Directory → suite / module deep-link */
  const handleSelectMasterAssessmentTrack = (track) => {
    const payload = typeof track === 'string' ? { name: track } : track || {};
    const name = String(payload.name || '').toLowerCase();
    const category = String(payload.category || '').toLowerCase();
    const suiteHint = String(payload.suite || '').toLowerCase();
    const moduleId = payload.moduleId || null;

    let suite = suiteHint;
    if (!suite) {
      if (category.includes('posture') || category.includes('ergonomic') || name.includes('thoracic')) {
        suite = 'posture_ergonomics';
      } else if (category.includes('athlete') || category.includes('acrobat') || name.includes('handstand') || name.includes('single leg')) {
        suite = 'athlete_precision';
      } else if (category.includes('kinetic') || category.includes('combat') || category.includes('power')) {
        suite = 'kinetic_power';
      } else {
        suite = 'vital_flow';
      }
    }

    setSelectedAnalysis(payload.name || 'Master Assessment Node');
    setActivePostureModule(null);
    setActiveVitalModule(null);
    setActiveAthleteModule(null);
    setActiveCombatModule(null);

    if (suite === 'posture_ergonomics' || suite === 'mobility') {
      if (moduleId) setActivePostureModule(moduleId);
      setViewState('posture_ergonomics');
      return;
    }
    if (suite === 'athlete_precision') {
      if (moduleId) setActiveAthleteModule(moduleId);
      setViewState('athlete_precision');
      return;
    }
    if (suite === 'kinetic_power' || suite === 'kinetic_integrity') {
      if (moduleId) setActiveCombatModule(moduleId);
      setViewState('kinetic_power');
      return;
    }

    if (moduleId) setActiveVitalModule(moduleId);
    setViewState('vital_flow');
  };

  useEffect(() => {
    if (
      viewState !== 'mobility' &&
      viewState !== 'posture_ergonomics' &&
      viewState !== 'vital_flow' &&
      viewState !== 'athlete_precision' &&
      viewState !== 'kinetic_power' &&
      viewState !== 'client_profile' &&
      viewState !== 'coach_menu'
    )
      return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (activeFocusField) {
        setActiveFocusField(null);
        return;
      }
      if (
        (viewState === 'mobility' || viewState === 'posture_ergonomics') &&
        activePostureModule
      ) {
        setActivePostureModule(null);
        return;
      }
      if (viewState === 'vital_flow' && activeVitalModule) {
        setActiveVitalModule(null);
        return;
      }
      if (viewState === 'athlete_precision' && activeAthleteModule) {
        setActiveAthleteModule(null);
        return;
      }
      if (viewState === 'kinetic_power' && activeCombatModule) {
        setActiveCombatModule(null);
        return;
      }
      handleReturnToCore();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    viewState,
    activeFocusField,
    activePostureModule,
    activeVitalModule,
    activeAthleteModule,
    activeCombatModule,
  ]);

  const displayClientName = clientList[currentIdx].replace('/', '').toUpperCase();

  // MASTER APPLICATION VIEWPORTS ROUTER
  // 1. Middle transition: dedicated 3D matrix scan for MATTA (code 777777)
  if (viewState === 'scanning_matta') {
    return (
      <IntroScreen
        autoBoot
        onAccessGranted={(code, meta = {}) => {
          // Protect an already-authenticated cached session from IntroScreen overwrite
          const cachedView = meta.cachedView || readCachedLabView();
          if (
            meta.preserveCachedView &&
            cachedView &&
            PROTECTED_SESSION_VIEWS.has(cachedView)
          ) {
            setViewState(cachedView);
            return;
          }
          // Fresh MATTA scan completion → open dossier
          setAccessCode(code || '777777');
          unlockMattaProfile();
        }}
      />
    );
  }

  /** 🟢 PERFECTLY SEPARATED PRODUCTION INTERFACE LINKS */
  const handleTerminalNavigate = (targetScreen) => {
    // 🟢 Public portal landing — keep users off the coach deck
    if (
      targetScreen === 'CLIENT_PORTAL_LANDING_HOME' ||
      targetScreen === 'LANDING' ||
      targetScreen === 'PUBLIC_HOME'
    ) {
      setSelectedAssessmentData(null);
      setSelectedBatchTracks([]);
      setCurrentActiveIndex(0);
      setViewState('landing');
      return;
    }
    if (
      targetScreen === 'COACH_DASHBOARD_HOME' ||
      targetScreen === 'HOME' ||
      targetScreen === 'ESC'
    ) {
      setIsCoachMode(true);
      setViewState('coach_menu');
      return;
    }
    if (
      targetScreen === 'MASTER_ASSESSMENT_DIRECTORY_TERMINAL' ||
      targetScreen === 'DIRECTORY_MASTER_INDEX'
    ) {
      setViewState('master_assessment_directory');
      return;
    }
    if (targetScreen === 'VITAL_FLOW_DECOMPRESSION_MATRIX') {
      setSelectedAssessmentData(null);
      setViewState('vital_flow');
      return;
    }
    if (targetScreen === 'ATHLETE_PRECISION') {
      setViewState('athlete_precision');
      return;
    }
    if (targetScreen === 'POSTURE_ERGONOMICS') {
      setViewState('posture_ergonomics');
      return;
    }
    if (targetScreen === 'KINETIC_POWER') {
      setViewState('kinetic_power');
      return;
    }
    if (targetScreen === 'VIEW_SINGLE_ASSESSMENT_CORE') {
      setViewState('view_single_assessment_core');
      return;
    }
    // 🟢 METHODOLOGY DISCLOSURE SHEET RESTORATION CASE
    if (targetScreen === 'VIEW_SYSTEM_METHODOLOGY_KINETICS') {
      setViewState('system_methodology_kinetics');
      return;
    }
    // 🟢 BIOMECHANICAL PDF REPORT GENERATOR VIEW
    if (targetScreen === 'REPORT_PDF_GENERATOR_VIEW') {
      setViewState('report_pdf_generator');
      return;
    }
  };

  // 🟢 ROCK-SOLID PRODUCTION MATCHING STATE — hard track check FIRST
  if (viewState === 'view_single_assessment_core' && selectedAssessmentData) {
    return (
      <UnifiedAssessmentLayout
        trackName={selectedAssessmentData.name}
        databaseRecord={selectedAssessmentData}
        moduleId={`lib_${selectedAssessmentData.id}`}
        athleteCode={accessCode || '000000'}
        athleteName={
          activeClientProfile?.name ||
          (accessCode && localDatabase[accessCode]?.name) ||
          'UNREGISTERED ATHLETE'
        }
        currentActiveIndex={currentActiveIndex}
        totalSelectedTracksLength={
          selectedBatchTracks.length > 0 ? selectedBatchTracks.length : 1
        }
        setCurrentActiveIndex={(updater) => {
          setCurrentActiveIndex((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            const pool =
              selectedBatchTracks.length > 0
                ? selectedBatchTracks
                : selectedAssessmentData
                  ? [selectedAssessmentData]
                  : [];
            if (pool[next]) {
              setSelectedAssessmentData(pool[next]);
            }
            return next;
          });
        }}
        onNavigate={(targetScreen) => {
          if (
            targetScreen === 'CLIENT_PORTAL_LANDING_HOME' ||
            targetScreen === 'COACH_DASHBOARD_HOME'
          ) {
            setSelectedAssessmentData(null);
            setSelectedBatchTracks([]);
            setCurrentActiveIndex(0);
            // Complete stream → public landing only (never coach deck for clients)
            if (targetScreen === 'CLIENT_PORTAL_LANDING_HOME') {
              handleTerminalNavigate('CLIENT_PORTAL_LANDING_HOME');
              return;
            }
            handleTerminalNavigate('COACH_DASHBOARD_HOME');
            return;
          }
          // Escape goes right back to package grid (or originating suite)
          setSelectedAssessmentData(null);
          setSelectedBatchTracks([]);
          setCurrentActiveIndex(0);
          if (assessmentReturnView === 'master_assessment_directory') {
            handleTerminalNavigate('MASTER_ASSESSMENT_DIRECTORY_TERMINAL');
          } else {
            handleTerminalNavigate('VITAL_FLOW_DECOMPRESSION_MATRIX');
          }
        }}
      />
    );
  }

  // 📁 STANDALONE DIRECTORY LIST (alphabetical local library loop)
  if (viewState === 'master_assessment_directory') {
    return (
      <div className="h-screen bg-[#030712] font-mono text-white overflow-hidden flex flex-col">
        {renderSystemHeader('MASTER_ASSESSMENT_DIRECTORY_TERMINAL')}
        <MasterAssessmentDirectory
          onSelectTrack={(trackObj) => {
            setSelectedBatchTracks([trackObj]);
            setCurrentActiveIndex(0);
            setSelectedAssessmentData(trackObj);
            setAssessmentReturnView('master_assessment_directory');
            setViewState('view_single_assessment_core');
          }}
          onNavigate={handleTerminalNavigate}
          setCurrentScreen={handleTerminalNavigate}
        />
      </div>
    );
  }

  if (
    [
      'vital_flow',
      'mobility',
      'posture_ergonomics',
      'athlete_precision',
      'kinetic_power',
    ].includes(viewState)
  ) {
    return (
      <div className="relative w-screen h-screen overflow-hidden">
        <TrackPortals
          viewState={viewState}
          renderSystemHeader={renderSystemHeader}
          uploadStatus={uploadStatus}
          setUploadStatus={setUploadStatus}
          activePostureModule={activePostureModule}
          setActivePostureModule={setActivePostureModule}
          activeVitalModule={activeVitalModule}
          setActiveVitalModule={setActiveVitalModule}
          activeAthleteModule={activeAthleteModule}
          setActiveAthleteModule={setActiveAthleteModule}
          activeCombatModule={activeCombatModule}
          setActiveCombatModule={setActiveCombatModule}
          guideAssets={guideAssets}
          isCoachMode={isCoachMode}
          hasSecureAccess={
            Boolean(activeClientProfile) ||
            isTokenValidated ||
            virtualAccessUnlocked ||
            isPromoUnlocked ||
            isCoachMode
          }
          isTokenValidated={isTokenValidated || virtualAccessUnlocked || isPromoUnlocked}
          acceptedAccessPins={[
            ...SUITE_UNLOCK_PINS,
            ...Object.keys(localDatabase || {}),
          ]}
          onRetrieveAccessToken={handleRetrieveAccessToken}
          onReturnToCore={handleReturnToCore}
          athleteCode={accessCode || '000000'}
          athleteName={
            activeClientProfile?.name ||
            (accessCode && localDatabase[accessCode]?.name) ||
            'UNREGISTERED ATHLETE'
          }
        />
      </div>
    );
  }

  // Animated Option C calibration bridge → Intake Onboarding Terminal (~2000ms)
  // Must win over pricing_matrix / package_detail so verified buyers never drop back onto tiers
  if (isCalibratingStream) {
    return <IntakeCalibrationLoader onComplete={handleIntakeCalibrationComplete} />;
  }

  // SYSTEM FRAME F: Premium Architectural Membership & B2B Corporate Presentation Matrix
  if (viewState === 'pricing_matrix') {
    return (
      <div className="relative w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden">
        {renderSystemHeader('COMMERCIAL_B2B_AND_MEMBERSHIP_MATRIX')}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-6xl bg-slate-950 border border-cyan-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative backdrop-blur-xl">
            <div className="border-b border-slate-900 pb-5 text-center sm:text-left">
              <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase mb-0.5">
                // BIOMECHANICAL PACKAGES & TIERS
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight uppercase">
                Longevity Laboratory Frameworks
              </h2>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Unified membership matrix — athlete tiers, on-site lab packages, and enterprise options in one view.
              </p>
            </div>

            <AthleteView
              onViewSystemSpecs={(packageId) => {
                setActivePackageDetail(packageId);
                setViewState('package_detail');
              }}
              onPaymentInitiated={handlePaymentInitiated}
              onViewMoreInfo={() => setViewState('info_hub')}
            />

            {showThankYouGate && (
              <ThankYouOverlay
                securePaypalToken={securePaypalToken}
                onDeployAssessmentSuite={handleEnterUnlockedTerminal}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🟢 METHODOLOGY DISCLOSURE SHEET RESTORATION CASE
  if (viewState === 'system_methodology_kinetics') {
    return (
      <div className="min-h-screen bg-[#030712] font-mono text-white">
        {renderSystemHeader('VIEW_SYSTEM_METHODOLOGY_KINETICS')}
        <SystemMethodologyKinetics setCurrentScreen={handleTerminalNavigate} />
      </div>
    );
  }

  // 🟢 BIOMECHANICAL PDF REPORT GENERATOR VIEW
  if (viewState === 'report_pdf_generator') {
    const reportAthleteName =
      activeClientProfile?.name ||
      (accessCode && localDatabase[accessCode]?.name) ||
      'Alex Rivera';
    const reportAthleteCode = accessCode || '111111';

    return (
      <div className="min-h-screen bg-[#030712] font-mono text-white overflow-y-auto">
        <BiomechanicalReportPDF
          clientName={reportAthleteName}
          clientCode={reportAthleteCode}
          onNavigate={handleTerminalNavigate}
        />
      </div>
    );
  }

  // Flagship Master Information Hub — educational immersion deck
  if (viewState === 'info_hub') {
    return (
      <InfoHubView
        onReturn={() => handleTerminalNavigate('COACH_DASHBOARD_HOME')}
        onNavigate={handleTerminalNavigate}
        setCurrentScreen={handleTerminalNavigate}
      />
    );
  }

  // More Information Landing Page Hub — particle human doctrine deck (legacy)
  if (viewState === 'more_info') {
    return <MoreInfoHub onReturn={() => setViewState('pricing_matrix')} />;
  }

  // Full-screen package immersion deck (system specs)
  if (viewState === 'package_detail' && activePackageDetail) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#01040a] text-white flex flex-col">
        {renderSystemHeader('PACKAGE_IMMERSION_DECK')}
        <PackageDetailView
          packageId={activePackageDetail}
          onPaymentInitiated={handlePaymentInitiated}
          onReturn={() => {
            setActivePackageDetail(null);
            setViewState('pricing_matrix');
          }}
        />

        {showThankYouGate && (
          <ThankYouOverlay
            securePaypalToken={securePaypalToken}
            onDeployAssessmentSuite={handleEnterUnlockedTerminal}
          />
        )}
      </div>
    );
  }

  // Onsite / non-virtual membership intake onboarding terminal
  if (viewState === 'intake_terminal') {
    return (
      <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden relative">
        {renderSystemHeader('INTAKE_ONBOARDING_TERMINAL')}
        <div className="flex-1 overflow-hidden">
          <IntakeTerminal
            isPromoFlow={isPromoIntakeSession}
            onTransmitComplete={handleIntakeTransmitComplete}
            athleteName={
              activeClientProfile?.name ||
              (accessCode && localDatabase[accessCode]?.name) ||
              'INCOMING CLIENT'
            }
            athleteCode={accessCode || 'PENDING-TOKEN'}
          />
        </div>

        {showPromoInterceptModal && (
          <PromoInterceptModal
            onLockPromoRate={handlePromoLockInRate}
            onContinueRestricted={handlePromoContinueRestricted}
          />
        )}
      </div>
    );
  }

  const showHomePortalShell = HOME_PORTAL_VIEW_STATES.has(viewState);
  const showPortalOverlay =
    viewState === 'loading' ||
    viewState === 'coach_menu' ||
    viewState === 'dashboard' ||
    (viewState === 'client_profile' && activeClientProfile);

  const coachDashboardProps = {
    viewState,
    renderSystemHeader,
    handleReturnToCore,
    activeClientProfile,
    accessCode,
    isCoachMode,
    isEditMode,
    setIsEditMode,
    editNotes,
    setEditNotes,
    editDesc,
    setEditDesc,
    editMetrics,
    setEditMetrics,
    editBirthdate,
    setEditBirthdate,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editTier,
    setEditTier,
    editJoinedDate,
    setEditJoinedDate,
    editReportUrl,
    setEditReportUrl,
    editAssessmentPhoto,
    setEditAssessmentPhoto,
    handleAssessmentPhotoUrlChange,
    activeFocusField,
    setActiveFocusField,
    handleSaveProfileChanges,
    handleTransmitCloudVideo,
    handleChangeClientCode,
    handleDeleteClientRecord,
    localDatabase,
    setLocalDatabase,
    handleSelectClientFromMenu,
    handleDeleteClientFromRoster,
    newClientName,
    setNewClientName,
    newClientCode,
    setNewClientCode,
    newClientArchetype,
    setNewClientArchetype,
    handleCreateNewClient,
    selectedAnalysis,
    bootProgress,
    clientList,
    currentIdx,
    displayClientName,
    guideAssets,
    setGuideAssets,
    onNavigate: handleTerminalNavigate,
    setCurrentScreen: handleTerminalNavigate,
  };

  // 2. Home portal shell: sphere + grid with landing chrome or stacked coach/client panels
  if (showHomePortalShell) {
    return (
      <div
        className={`relative w-screen h-screen text-white font-mono overflow-hidden select-none ${
          isSecretBreaching ? 'bg-black' : 'bg-[#020617]'
        }`}
      >
        {/* Breach stage: black void + 3D mesh only (step 1), then terminal pulse (step 2) */}
        {isSecretBreaching ? (
          <>
            {breachStep === 1 && (
              <CenterSphere viewState="landing" isBreaching />
            )}
            {breachStep >= 2 && (
              <div className="absolute inset-0 z-[90] bg-black flex items-center justify-center">
                {breachVariant === 'engineer' ? (
                  <BreachTypewriterTerminal lines={ENGINEER_BREACH_LINES} />
                ) : (
                  <BreachTerminalPulse lines={BREACH_TERMINAL_LINES} />
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {(viewState === 'landing' || viewState === 'dashboard') && (
              <CenterSphere viewState="landing" />
            )}

            <div className="absolute bottom-0 left-0 w-full h-[35vh] pointer-events-none z-0 overflow-hidden border-t border-slate-900/40 bg-gradient-to-t from-[#020617] via-transparent to-transparent">
              <canvas ref={homeGridCanvasRef} className="w-full h-full opacity-100 block" />
            </div>

            {viewState === 'landing' && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.85)_100%)]">
                <div className="w-full flex justify-center">
                  <header className="flex flex-col items-center text-center border-b border-cyan-500/20 pb-5 bg-slate-950/50 backdrop-blur-md p-6 rounded-lg max-w-4xl w-full relative">
                    <h1 className="text-4xl font-black tracking-widest text-cyan-400 animate-pulse">LIFE LONGEVITY LAB</h1>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                      <span>STREAMING RAW CORE TELEMETRY</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        CONNECTED
                      </span>
                    </div>

                    {showIntakeConfirmation && (
                      <div className="mt-5 w-full px-4 py-3 rounded-lg border border-emerald-400/40 bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.25)] animate-intake-pulse pointer-events-none">
                        <p className="text-[10px] md:text-xs font-black tracking-[0.16em] uppercase text-emerald-300">
                          [ INTAKE TRANSMISSION CONFIRMED // ONSITE BLUEPRINT ROUTE ARCHIVED
                          {intakeFormData?.name ? ` // ${intakeFormData.name.toUpperCase()}` : ''} ]
                        </p>
                      </div>
                    )}
                  </header>
                </div>

                <main className="flex justify-between items-start my-auto w-full mt-2">
                  <LeftSidebar
                    isTokenValidated={isTokenValidated || isPromoUnlocked}
                    virtualAccessUnlocked={virtualAccessUnlocked || isPromoUnlocked}
                    isCoachMode={isCoachMode}
                    onLaunchAnalysis={handleLaunchAnalysis}
                    onNavigate={handleTerminalNavigate}
                    setCurrentScreen={handleTerminalNavigate}
                    setSelectedAssessmentData={setSelectedAssessmentData}
                    onUnlockMembership={() => {
                      setSelectedAnalysis('Membership Portal Sync');
                      setViewState('pricing_matrix');
                    }}
                  />

                  <RightSidebar
                    accessCode={accessCode}
                    terminalAlert={terminalAlert}
                    virtualAccessUnlocked={virtualAccessUnlocked || isPromoUnlocked}
                    onAccessCodeChange={handleAccessCodeChange}
                    onOpenCoachMenu={handleOpenCoachMenu}
                    onLaunchProfileSequence={handleDeployPersonalClientCard}
                  />
                </main>

                {showPromoInterceptModal && (
                  <PromoInterceptModal
                    onLockPromoRate={handlePromoLockInRate}
                    onContinueRestricted={handlePromoContinueRestricted}
                  />
                )}

                <footer className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-900 pt-4 relative z-10 pointer-events-auto gap-3">
                  <div>DATA CHANNEL: ACTIVE LOCALHOST LINE</div>
                  {/* Hidden Ctrl+Shift-click master coach backdoor trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        startSecretBreachSequence({ variant: 'coach' });
                      }
                    }}
                    className="text-slate-600 hover:text-cyan-400 font-mono text-xs tracking-widest uppercase transition-all bg-transparent border-0 cursor-pointer"
                  >
                    ⚙ [SYSTEM ARCHIVE ACCESS]
                  </button>
                  {/* PERSISTENT FOOTER COMPLIANCE LINK */}
                  <div className="relative group font-mono">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-[#FF6600] text-[10px] tracking-widest font-bold uppercase transition-all duration-300 bg-transparent border-0 cursor-pointer"
                    >
                      [ ⚖️ VIEW SYSTEM LEGAL POLICY ]
                    </button>

                    {/* HIDDEN HOVER HOOD PANEL: Pops up cleanly when mouse hovers over link */}
                    <div className="absolute bottom-full right-0 mb-2 w-80 p-4 bg-[#030712]/95 border border-slate-800 rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-50 font-mono text-left">
                      <div className="text-[#FF6600] text-[10px] font-bold tracking-widest uppercase mb-2">
                        // SYSTEM REGULATORY DATA ENVELOPE //
                      </div>
                      <p className="text-slate-400 text-[9px] leading-relaxed tracking-normal">
                        The biometric telemetry tracking data generated by this platform is provided
                        strictly for educational, fitness tracking, and movement optimization purposes.
                        This system presents general structural information only and does not provide
                        personalized medical advice, clinical diagnostics, or injury treatment
                        protocols. Always double-check physical setup dimensions to verify safety
                        limits.
                      </p>
                    </div>
                  </div>

                  {/* Master Directory — gated footer tab (right cluster) */}
                  {(() => {
                    const isAuthenticated = Boolean(
                      isTokenValidated || isPromoUnlocked || virtualAccessUnlocked || isCoachMode
                    );
                    const hasValidClientCode = String(accessCode || '').replace(/\D/g, '').length === 6;
                    const canOpenDirectory = Boolean(
                      isCoachMode || (isAuthenticated && hasValidClientCode)
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (!canOpenDirectory) {
                            alert(
                              'ACCESS DISDENIED: Secure terminal credentials missing. Please enter your valid 6-digit passcode into the Assessment Reports node first.'
                            );
                            return;
                          }
                          setViewState('master_assessment_directory');
                          console.log(
                            `[ TERMINAL ROUTING SUCCESS: DEPLOYING MASTER DIRECTORY INDEX FOR CODE ${accessCode || 'COACH_BYPASS'} ]`
                          );
                        }}
                        className={`font-mono text-[10px] tracking-widest font-bold uppercase transition-all duration-300 bg-transparent border-0 ${
                          canOpenDirectory
                            ? 'text-slate-500 hover:text-cyan-400 cursor-pointer'
                            : 'text-slate-600 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {canOpenDirectory
                          ? '↑ MASTER ASSESSMENT DIRECTORY //'
                          : '🔒 MASTER DIRECTORY [ LOCKED ]'}
                      </button>
                    );
                  })()}

                  <div>LENOVO LEGION PRO // RTX 4080 MODE ACTIVE</div>
                </footer>
              </div>
            )}

            {showPortalOverlay && (
              <div className="absolute inset-0 z-20 overflow-hidden">
                <CoachDashboard {...coachDashboardProps} />
              </div>
            )}

            {showThankYouGate && (
              <ThankYouOverlay
                securePaypalToken={securePaypalToken}
                onDeployAssessmentSuite={handleEnterUnlockedTerminal}
              />
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
