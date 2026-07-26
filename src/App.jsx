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
import { ANALYSIS_VIEWS } from './constants/analysisViews';

/** Local Storage keys — lab routing & access-token persistence */
const LAB_LS_VIEW = 'lab_view_state';
const LAB_LS_TOKEN = 'is_token_validated';
const LAB_LS_VIRTUAL = 'virtual_access_unlocked';
const LAB_LS_ACCESS_CODE = 'lab_access_code';
const LAB_LS_COACH = 'is_coach_mode';

/** Transient overlays — never restore these after a hard reload */
const TRANSIENT_VIEW_STATES = new Set(['loading', 'scanning_matta', 'package_detail', 'dashboard']);

/** Authenticated / mid-session views that must survive refresh + IntroScreen completion */
const PROTECTED_SESSION_VIEWS = new Set([
  'client_profile',
  'intake_terminal',
  'pricing_matrix',
  'more_info',
  'mobility',
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

/** Lock security gates — wipe persisted lab auth / routing tokens */
const clearLabPersistence = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LAB_LS_VIEW);
    window.localStorage.removeItem(LAB_LS_TOKEN);
    window.localStorage.removeItem(LAB_LS_VIRTUAL);
    window.localStorage.removeItem(LAB_LS_ACCESS_CODE);
    window.localStorage.setItem(LAB_LS_COACH, 'false');
    window.localStorage.removeItem('lab_token_validated');
    window.localStorage.removeItem('lab_virtual_access_unlocked');
  } catch {
    /* storage may be blocked in private mode */
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

// Secure Coach Client Matrix Database (Upgraded with Live Cloud Report Targets)
const CLIENT_DATABASE = {
  '1111': {
    name: 'Alex Rivera',
    birthdate: '04/12/1992',
    email: 'alex.rivera@kineticmail.com',
    phone: '(555) 234-5678',
    avatar: '/client1.png',
    archetype: 'Acrobatics & Hand Balance',
    joinedDate: '07/14/2026',
    matrixTier: 'Tensegrity Tier',
    // Paste your unique client Dropbox / Google Drive folder share link right here:
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    desc: 'Acrobatic performer experiencing chronic compression profiles during deep overhead extensions. Fascial tension lines require lateral decompression integration.',
    notes:
      'Prioritize multi-plane kinetic tracking during handstand alignment stacks. Focus heavily on thoracic extension limits to shield lumbar load points.',
    metrics: { squat: '88/100', land: '74/100', cmj: '94/100', agility: '81/100' },
  },
  '2222': {
    name: 'Marcus Vance',
    birthdate: '09/25/1988',
    email: 'marcus.vance@jiujitsumail.com',
    phone: '(555) 876-5432',
    avatar: '/client2.png',
    archetype: 'Jiu-Jitsu / Combat Athlete',
    joinedDate: '06/02/2026',
    matrixTier: 'Infinite Matrix Tier',
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    desc: 'Competitive martial artist displaying inward valgus knee patterns during lateral explosive movements and guard transitions.',
    notes:
      'Left ankle structural dorsiflexion restrictions are causing mechanical stress upstream in the knee joint during load capture cycles.',
    metrics: { squat: '72/100', land: '65/100', cmj: '81/100', agility: '92/100' },
  },
  '3333': {
    name: 'Elena Rostova',
    birthdate: '07/03/1995',
    email: 'elena.r@yogadecompression.com',
    phone: '(555) 432-1098',
    avatar: '/client3.png',
    archetype: 'Advanced Yoga Practitioner',
    joinedDate: '07/18/2026',
    matrixTier: 'Vector Tier',
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    desc: 'Exceptional static active flexibility profiles. Displays minor structural instability vectors under rapid dynamic loading cycles.',
    notes:
      'Incorporate low-volume explosive neuromuscular landing mechanics to supplement high-tier static elasticity matrices.',
    metrics: { squat: '96/100', land: '82/100', cmj: '74/100', agility: '85/100' },
  },
  // Add Matta's custom terminal profile slot right inside your database
  '7777': {
    name: 'MATTA',
    birthdate: '01/01/2000',
    email: 'matta.matrix@hyper3d.com',
    phone: '(555) 777-7777',
    avatar: '/client1.png',
    archetype: '3D Hyper-Voxel Archetype',
    joinedDate: '07/21/2026',
    matrixTier: 'Infinite Matrix Tier',
    reportUrl: 'https://dropbox.com',
    assessmentPhoto: '',
    desc: 'First-generation custom 3D mesh model stream calibrated from Hyper 3D and Blender node telemetry layers.',
    notes:
      'Calibrate spinal vector paths against the emission shader wave structures. Mesh stability tracking verified.',
    metrics: { squat: '99/100', land: '95/100', cmj: '98/100', agility: '97/100' },
  },
};

export default function App() {
  const clientList = ['/client1.png', '/client2.png', '/client3.png'];
  const homeGridCanvasRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // LIVE DATABASE & SYSTEM ROUTERS
  const [localDatabase, setLocalDatabase] = useState(CLIENT_DATABASE);
  const [activeClientProfile, setActiveClientProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCoachMode, setIsCoachMode] = useState(() => {
    try {
      return localStorage.getItem(LAB_LS_COACH) === 'true';
    } catch {
      return false;
    }
  });
  const [isSecretBreaching, setIsSecretBreaching] = useState(false);
  const [breachStep, setBreachStep] = useState(0);
  const breachTimeoutsRef = useRef([]);

  // Core Viewport Navigation State Routers — lazy init reads localStorage before first paint
  const [viewState, setViewState] = useState(() => {
    try {
      const resolved = readCachedLabView() || 'landing';
      // Never remount IntroScreen / loaders from a stale transient cache
      if (TRANSIENT_VIEW_STATES.has(resolved)) return 'landing';
      return resolved;
    } catch {
      return 'landing';
    }
  });
  const [activePackageDetail, setActivePackageDetail] = useState(null);
  const [showThankYouGate, setShowThankYouGate] = useState(false);
  const [isTokenValidated, setIsTokenValidated] = useState(() => {
    try {
      const raw =
        localStorage.getItem(LAB_LS_TOKEN) || localStorage.getItem('lab_token_validated') || '';
      return raw === 'true' || raw === '"true"';
    } catch {
      return false;
    }
  });
  const [virtualAccessUnlocked, setVirtualAccessUnlocked] = useState(() => {
    try {
      const raw =
        localStorage.getItem(LAB_LS_VIRTUAL) ||
        localStorage.getItem('lab_virtual_access_unlocked') ||
        '';
      return raw === 'true' || raw === '"true"';
    } catch {
      return false;
    }
  });
  const skipNextPersistRef = useRef(true);
  const [pendingPaymentKey, setPendingPaymentKey] = useState(null);
  const [intakeFormData, setIntakeFormData] = useState(null);
  const [showIntakeConfirmation, setShowIntakeConfirmation] = useState(false);
  const [showIntakeCalibration, setShowIntakeCalibration] = useState(false);
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
      window.localStorage.setItem(LAB_LS_TOKEN, String(isTokenValidated));
      window.localStorage.setItem(LAB_LS_VIRTUAL, String(virtualAccessUnlocked));
      window.localStorage.setItem(LAB_LS_COACH, isCoachMode.toString());
      if (accessCode) {
        window.localStorage.setItem(LAB_LS_ACCESS_CODE, accessCode);
      }
    } catch {
      /* storage may be blocked in private mode */
    }
  }, [viewState, isTokenValidated, virtualAccessUnlocked, accessCode, isCoachMode]);

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
      setEditAssessmentPhoto(client.assessmentPhoto || '');
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

  // Triggered when client logs in with their pin code
  const handleAccessCodeChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setAccessCode(digits);

    if (digits.length === 4) {
      // Master promotional / testing backdoor → Vector Blueprint intake (bypasses PayPal)
      if (digits === '6970') {
        setAccessCode('');
        setActivePackageDetail('vector');
        setPendingPaymentKey('vector');
        setIsTokenValidated(true);
        setShowThankYouGate(false);
        setSelectedAnalysis('Intake Onboarding Terminal');
        schedulePasscodeRoute('[ STATUS: OVERRIDE GRANTED // INITIALIZING TERMINAL... ]', () => {
          setShowIntakeCalibration(true);
        });
        return;
      }

      // Dedicated MATTA 3D matrix scan pathway
      if (digits === '7777') {
        schedulePasscodeRoute('[ AUTHORIZED M.A.T.T.A. NETWORK // COLD BOOT STREAM ACTIVE... ]', () => {
          setViewState('scanning_matta');
        });
        return;
      }

      if (localDatabase[digits]) {
        const client = localDatabase[digits];
        setIsCoachMode(false);
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
        setEditAssessmentPhoto(client.assessmentPhoto || '');

        setSelectedAnalysis('Client Telemetry Portfolio');
        setBootProgress(0);
        schedulePasscodeRoute('[ ACCESS AUTHORIZED // RETRIEVING BIOMETRIC DOSSIER... ]', () => {
          setViewState('loading');
        });
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
    const client = localDatabase['7777'];
    if (!client) {
      alert('ACCESS CODE UNRESOLVED // SECURE ENTRY VIOLATION');
      return;
    }
    setAccessCode('7777');
    setIsCoachMode(false);
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
    setEditAssessmentPhoto(client.assessmentPhoto || '');
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
    setEditAssessmentPhoto(client.assessmentPhoto || '');

    setViewState('client_profile');
  };

  const handleOpenCoachMenu = () => {
    setIsCoachMode(true);
    setViewState('coach_menu');
  };

  const clearBreachTimeouts = () => {
    breachTimeoutsRef.current.forEach((id) => clearTimeout(id));
    breachTimeoutsRef.current = [];
  };

  /** Shift+click secret backdoor — 3s red explode → 2s terminal pulse → coach desk (5s flat) */
  const startSecretBreachSequence = () => {
    if (isSecretBreaching) return;
    clearBreachTimeouts();
    setIsSecretBreaching(true);
    setBreachStep(1);

    // Step 1 → Step 2: spin + late explode, then unmount canvas at 3000ms
    const toBlackout = setTimeout(() => {
      setBreachStep(2);
    }, 3000);

    // Step 3: hold welcome text 2000ms → clear breach + mount coach desk at 5000ms
    const toCoachDesk = setTimeout(() => {
      clearBreachTimeouts();
      setIsSecretBreaching(false);
      setBreachStep(0);
      setIsCoachMode(true);
      try {
        window.localStorage.setItem(LAB_LS_COACH, 'true');
      } catch {
        /* storage may be blocked */
      }
      setViewState('coach_menu');
    }, 5000);

    breachTimeoutsRef.current = [toBlackout, toCoachDesk];
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
    if (!newClientName || newClientCode.length !== 4) {
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
      reportUrl: 'https://dropbox.com',
      assessmentPhoto: '',
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

  // Save changes hook updated to sweep up your cloud fields at once
  const handleSaveProfileChanges = () => {
    if (!accessCode || !localDatabase[accessCode]) return;

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
      assessmentPhoto: editAssessmentPhoto || '',
      metrics: { ...editMetrics },
    };

    setLocalDatabase((prev) => ({
      ...prev,
      [accessCode]: updatedProfile,
    }));

    setActiveClientProfile(updatedProfile);
    setIsEditMode(false);
    setActiveFocusField(null);
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

  // Updated Safe Navigation Escape Route
  const handleReturnToCore = () => {
    // Coach admin return path: drop back into the command center roster
    if (viewState === 'client_profile' && isCoachMode) {
      setViewState('coach_menu');
      setIsEditMode(false);
      return;
    }
    clearPasscodeRouteTimeout();
    clearBreachTimeouts();
    setIsSecretBreaching(false);
    setBreachStep(0);
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
    setPendingPaymentKey(null);
    setShowIntakeConfirmation(false);
    setShowIntakeCalibration(false);
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

  // Payment Success Verification unlock — virtual → landing; onsite tiers → calibration → intake
  const handleEnterUnlockedTerminal = () => {
    const purchasedVirtualPortal = pendingPaymentKey === 'virtual_portal';
    setShowThankYouGate(false);
    setIsTokenValidated(true);

    if (purchasedVirtualPortal) {
      setVirtualAccessUnlocked(true);
      setActivePackageDetail(null);
      setSelectedAnalysis('');
      setViewState('landing');
      return;
    }

    setActivePackageDetail(null);
    setSelectedAnalysis('Intake Onboarding Terminal');
    setShowIntakeCalibration(true);
  };

  const handleIntakeCalibrationComplete = () => {
    setShowIntakeCalibration(false);
    setViewState('intake_terminal');
  };

  const handleIntakeTransmitComplete = (payload) => {
    setIntakeFormData(payload);
    setShowIntakeConfirmation(true);
    setSelectedAnalysis('');
    setViewState('landing');
  };

  // GLOBAL UTILITY: High-Tech Left-Aligned Uniform System Status & Exit Header Strip
  const renderSystemHeader = (titleLabel = 'SECURE_OVERRIDE') => {
    return (
      <div className="w-full border-b border-slate-900 bg-slate-950/80 px-6 py-4 backdrop-blur-md sticky top-0 z-50 font-mono text-xs select-none shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Stacked Control Hub */}
        <div className="flex flex-col gap-2.5 items-start">
          {/* Glowing Matrix Telemetry Pulse */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="tracking-widest text-slate-500 uppercase font-bold">
              SYS_STATUS // STABILITY_SECURE // {titleLabel}
            </span>
          </div>

          {/* New Left-Aligned Unified Terminal Dismiss Toggle Key */}
          <button
            onClick={handleReturnToCore}
            className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-950 font-bold tracking-wider transition-all uppercase cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
          >
            ← [ESC] Exit Matrix Home
          </button>
        </div>

        {/* Right Corner Area - Intentionally Left Clean & Minimal */}
        <div className="hidden sm:block text-[10px] text-slate-600 tracking-widest uppercase font-semibold">
          // SECURE DATA ENVIRONMENT
        </div>
      </div>
    );
  };

  // NEW: Dynamic Pin Access Key Update Engine
  const handleChangeClientCode = () => {
    if (!accessCode || !localDatabase[accessCode]) return;

    const newPin = prompt('ENTER NEW 4-DIGIT UNIQUE CODE SECURITY PASSKEY:');
    if (!newPin) return;

    const cleanPin = newPin.replace(/\D/g, '').slice(0, 4);
    if (cleanPin.length !== 4) {
      alert('ERROR // ACCESS PASSCODES MUST BE EXACTLY 4 NUMERIC DIGITS');
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
      setViewState('mobility');
      return;
    }
    if (key === 'posture') {
      setSelectedAnalysis(ANALYSIS_VIEWS.posture.label);
      setViewState('vital_flow');
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

  useEffect(() => {
    if (
      viewState !== 'mobility' &&
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
      if (viewState === 'mobility' && activePostureModule) {
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
  // 1. Middle transition: dedicated 3D matrix scan for MATTA (code 7777)
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
          setAccessCode(code || '7777');
          unlockMattaProfile();
        }}
      />
    );
  }

  if (['mobility', 'vital_flow', 'athlete_precision', 'kinetic_power'].includes(viewState)) {
    return (
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
        hasSecureAccess={Boolean(activeClientProfile) || isTokenValidated || virtualAccessUnlocked}
        isTokenValidated={isTokenValidated || virtualAccessUnlocked}
        onRetrieveAccessToken={handleRetrieveAccessToken}
      />
    );
  }

  // SYSTEM FRAME F: Premium Architectural Membership & B2B Corporate Presentation Matrix
  if (viewState === 'pricing_matrix') {
    return (
      <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden relative">
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
              onViewMoreInfo={() => setViewState('more_info')}
            />

            {showThankYouGate && (
              <ThankYouOverlay onDeployAssessmentSuite={handleEnterUnlockedTerminal} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // More Information Landing Page Hub — particle human doctrine deck
  if (viewState === 'more_info') {
    return <MoreInfoHub onReturn={() => setViewState('pricing_matrix')} />;
  }

  // Full-screen package immersion deck (system specs)
  if (viewState === 'package_detail' && activePackageDetail) {
    return (
      <div className="relative w-screen h-screen overflow-hidden">
        <PackageDetailView
          packageId={activePackageDetail}
          onPaymentInitiated={handlePaymentInitiated}
          onReturn={() => {
            setActivePackageDetail(null);
            setViewState('pricing_matrix');
          }}
        />

        {showThankYouGate && (
          <ThankYouOverlay onDeployAssessmentSuite={handleEnterUnlockedTerminal} />
        )}
      </div>
    );
  }

  // Animated Option C calibration bridge → Intake Onboarding Terminal
  if (showIntakeCalibration) {
    return <IntakeCalibrationLoader onComplete={handleIntakeCalibrationComplete} />;
  }

  // Onsite / non-virtual membership intake onboarding terminal
  if (viewState === 'intake_terminal') {
    return (
      <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden relative">
        {renderSystemHeader('INTAKE_ONBOARDING_TERMINAL')}
        <div className="flex-1 overflow-hidden">
          <IntakeTerminal onTransmitComplete={handleIntakeTransmitComplete} />
        </div>
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
    activeFocusField,
    setActiveFocusField,
    handleSaveProfileChanges,
    handleChangeClientCode,
    handleDeleteClientRecord,
    localDatabase,
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
                <BreachTerminalPulse lines={BREACH_TERMINAL_LINES} />
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
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        CONNECTED
                      </span>
                    </div>

                    {showIntakeConfirmation && (
                      <div className="mt-5 w-full px-4 py-3 rounded-lg border border-emerald-400/40 bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.25)] animate-pulse pointer-events-auto">
                        <p className="text-[10px] md:text-xs font-black tracking-[0.16em] uppercase text-emerald-300">
                          [ INTAKE TRANSMISSION CONFIRMED // ONSITE BLUEPRINT ROUTE ARCHIVED
                          {intakeFormData?.name ? ` // ${intakeFormData.name.toUpperCase()}` : ''} ]
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowIntakeConfirmation(false)}
                          className="mt-2 text-[9px] text-emerald-500/70 hover:text-emerald-300 font-bold tracking-widest uppercase bg-transparent border-0 cursor-pointer"
                        >
                          [ DISMISS ]
                        </button>
                      </div>
                    )}
                  </header>
                </div>

                <main className="flex justify-between items-start my-auto w-full mt-2">
                  <LeftSidebar
                    virtualAccessUnlocked={virtualAccessUnlocked}
                    onLaunchAnalysis={handleLaunchAnalysis}
                    onUnlockMembership={() => {
                      setSelectedAnalysis('Membership Portal Sync');
                      setViewState('pricing_matrix');
                    }}
                  />

                  <RightSidebar
                    accessCode={accessCode}
                    terminalAlert={terminalAlert}
                    onAccessCodeChange={handleAccessCodeChange}
                    onOpenCoachMenu={handleOpenCoachMenu}
                  />
                </main>

                <footer className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-900 pt-4 relative z-10 pointer-events-auto">
                  <div>DATA CHANNEL: ACTIVE LOCALHOST LINE</div>
                  {/* Hidden shift-click master coach backdoor trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e.shiftKey) {
                        e.preventDefault();
                        startSecretBreachSequence();
                      }
                    }}
                    className="text-slate-600 hover:text-cyan-400 font-mono text-xs tracking-widest uppercase transition-all bg-transparent border-0 cursor-pointer"
                  >
                    ⚙ [SYSTEM ARCHIVE ACCESS]
                  </button>
                  <div>LENOVO LEGION PRO // RTX 4080 MODE ACTIVE</div>
                </footer>
              </div>
            )}

            {showPortalOverlay && (
              <div className="absolute inset-0 z-20 overflow-hidden">
                <CoachDashboard {...coachDashboardProps} />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
