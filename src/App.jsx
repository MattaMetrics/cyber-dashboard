import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ClipboardList,
  FileText,
  CheckSquare,
  Sparkles,
  Activity,
  Anchor,
} from 'lucide-react';
import IntroScreen from './IntroScreen';

// Secure Coach Client Matrix Database (Upgraded with Video Telemetry Paths)
const CLIENT_DATABASE = {
  '1111': {
    name: 'Alex Rivera',
    birthdate: '04/12/1992',
    email: 'alex.rivera@kineticmail.com',
    phone: '(555) 234-5678',
    avatar: '/client1.png',
    videoUrl: 'https://w3schools.com', // Placeholder sample loop file path
    archetype: 'Acrobatics & Hand Balance',
    joinedDate: '07/14/2026',
    matrixTier: 'Tensegrity Tier',
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
    videoUrl: 'https://w3schools.com', // Placeholder sample loop file path
    archetype: 'Jiu-Jitsu / Combat Athlete',
    joinedDate: '06/02/2026',
    matrixTier: 'Infinite Matrix Tier',
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
    videoUrl: 'https://w3schools.com', // Placeholder sample loop file path
    archetype: 'Advanced Yoga Practitioner',
    joinedDate: '07/18/2026',
    matrixTier: 'Vector Tier',
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
    desc: 'First-generation custom 3D mesh model stream calibrated from Hyper 3D and Blender node telemetry layers.',
    notes:
      'Calibrate spinal vector paths against the emission shader wave structures. Mesh stability tracking verified.',
    metrics: { squat: '99/100', land: '95/100', cmj: '98/100', agility: '97/100' },
  },
};

// Upgraded High-Tech Lab Movement Tracks & Hover Descriptions
const ANALYSIS_VIEWS = {
  mobility: {
    label: 'POSTURE & ERGONOMICS',
    hoverDesc: 'Corporate & Desk Worker Track — Combating Screen Compression',
  },
  alignment: {
    label: 'ATHLETE PRECISION',
    hoverDesc: 'Youth Athlete Track — Symmetry & Multi-Plane Kinematics',
  },
  posture: {
    label: 'VITAL FLOW',
    hoverDesc: 'Acrobatics, Yoga, & Over-40 Active Longevity Blueprints',
  },
  athlete: {
    label: 'KINETIC POWER INTEGRITY',
    hoverDesc: 'MMA & Jiu-Jitsu Combat Track — Joint Torque & Impact Stability',
  },
};

const MORPH_DURATION = 3.5;
const MESH_FADE_DURATION = 1.0;
const PARTICLE_COUNT = 10000;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function generateSilhouetteTargets(count) {
  const targets = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const segment = Math.floor(i / (count / 5));
    let x = 0,
      y = 0,
      z = 0;

    if (segment === 0) {
      x = (Math.random() - 0.5) * 0.25;
      y = -1.2 + Math.random() * 2.4;
      z = (Math.random() - 0.5) * 0.15;
    } else if (segment === 1) {
      x = -0.1 - Math.random() * 0.75;
      y = -1.4 + Math.random() * 2.2;
      z = (Math.random() - 0.5) * 0.15;
    } else if (segment === 2) {
      x = 0.1 + Math.random() * 0.75;
      y = -1.4 + Math.random() * 2.2;
      z = (Math.random() - 0.5) * 0.15;
    } else if (segment === 3) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.35;
      x = Math.cos(theta) * r;
      y = 1.1 + Math.random() * 0.5;
      z = Math.sin(theta) * r;
    } else {
      x = (Math.random() - 0.5) * 0.65;
      y = -0.3 + (Math.random() - 0.5) * 0.3;
      z = (Math.random() - 0.5) * 0.2;
    }

    targets[i * 3] = x;
    targets[i * 3 + 1] = y + 0.3;
    targets[i * 3 + 2] = z;
  }
  return targets;
}

function ParticleMorphDust({ targets, particleCount, startTimeRef }) {
  const pointsRef = useRef();
  const swirlRef = useRef();

  const { positions } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const swirl = new Float32Array(particleCount * 4);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.2 + 0.3;
      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = -1.75 + Math.random() * 0.25;
      pos[i * 3 + 2] = Math.sin(theta) * radius;

      swirl[i * 4] = Math.random() * Math.PI * 2;
      swirl[i * 4 + 1] = 0.25 + Math.random() * 2.5;
      swirl[i * 4 + 2] = -1.85 + Math.random() * 0.3;
      swirl[i * 4 + 3] = 0.6 + Math.random() * 2.2;
    }

    swirlRef.current = swirl;
    return { positions: pos };
  }, [particleCount]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points || !swirlRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const rawT = Math.min(elapsed / MORPH_DURATION, 1);
    const morphT = easeInOutCubic(rawT);
    const swirlStrength = 1 - morphT;
    const time = state.clock.elapsedTime;
    const positionAttr = points.geometry.attributes.position;
    const swirl = swirlRef.current;

    for (let i = 0; i < particleCount; i++) {
      const angleOffset = swirl[i * 4];
      const radiusBase = swirl[i * 4 + 1];
      const yBase = swirl[i * 4 + 2];
      const speed = swirl[i * 4 + 3];
      const angle = angleOffset + time * speed;

      const vortexX = Math.cos(angle) * radiusBase * (0.35 + swirlStrength * 0.65);
      const vortexY =
        yBase +
        swirlStrength *
          (0.4 + Math.sin(time * 2.2 + i * 0.015) * 0.35 + Math.min(elapsed, 2.5) * 0.55);
      const vortexZ = Math.sin(angle) * radiusBase * (0.35 + swirlStrength * 0.65);

      positionAttr.setXYZ(
        i,
        THREE.MathUtils.lerp(vortexX, targets[i * 3], morphT),
        THREE.MathUtils.lerp(vortexY, targets[i * 3 + 1], morphT),
        THREE.MathUtils.lerp(vortexZ, targets[i * 3 + 2], morphT)
      );
    }

    positionAttr.needsUpdate = true;

    if (elapsed > MORPH_DURATION) {
      const fadeOut = Math.max(0, 1 - (elapsed - MORPH_DURATION) / MESH_FADE_DURATION);
      points.material.opacity = fadeOut;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#00f2fe"
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function AssessmentMorphScene({ clientImagePath }) {
  const clientTexture = useTexture(clientImagePath);
  const startTimeRef = useRef(null);
  const imageMeshRef = useRef();

  const targets = useMemo(() => generateSilhouetteTargets(PARTICLE_COUNT), []);

  useEffect(() => {
    startTimeRef.current = null;
  }, [clientImagePath]);

  useFrame((state) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    if (imageMeshRef.current) {
      imageMeshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    }
    const meshOpacity =
      elapsed > MORPH_DURATION ? Math.min(0.9, (elapsed - MORPH_DURATION) / MESH_FADE_DURATION) : 0;
    if (imageMeshRef.current?.material) {
      imageMeshRef.current.material.opacity = meshOpacity;
    }
  });

  return (
    <group>
      <ParticleMorphDust targets={targets} particleCount={PARTICLE_COUNT} startTimeRef={startTimeRef} />
      <mesh ref={imageMeshRef} position={[0, 0.4, 0]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial
          map={clientTexture}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.NormalBlending}
          depthWrite
        />
      </mesh>
    </group>
  );
}

function CustomHologramMesh() {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, -0.2, 0]}>
      <sphereGeometry args={[2.0, 12, 12]} />
      <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.65} />
    </mesh>
  );
}

useTexture.preload('/client1.png');
useTexture.preload('/client2.png');
useTexture.preload('/client3.png');

function renderThreeColumnCompanionGrid({
  accent = 'text-cyan-400',
  focusBorder = 'focus:border-cyan-500/60',
  emailPlaceholder = 'e.g. fighter.name@combatmail.com',
  vectors = [
    { code: '01 // PLUMB', label: 'EAR TO SHOULDER' },
    { code: '02 // ROUND', label: 'THORACIC EXTENSION' },
    { code: '03 // SHEAR', label: 'FORWARD METRICS' },
  ],
  instructions = 'Stand naturally or sit in your habitual computer workspace stance. Look straight ahead for 3 seconds, then drop your chin to your chest, return to center, and look completely upward.',
  camera =
    'Position your phone camera exactly at shoulder height, standing 5-6 feet away directly facing your profile side vector (90-degree lateral profile view).',
} = {}) {
  return (
    // THE RESTRUCTURED THREE-COLUMN COMPANION GRID
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
      {/* COLUMN 1: LEFT VERTICAL DEMO GRAPHICS CONTAINER (3 Slices) */}
      <div className="md:col-span-3 flex flex-col gap-4">
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">// MOVEMENT_STAGES</div>

        {/* Visual Example Slice 1 */}
        <div className="flex-1 min-h-[110px] bg-slate-950 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-3 group border-dashed hover:border-cyan-500/40 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
          <span className={`text-[10px] ${accent} font-black tracking-wider uppercase mb-1`}>01 // INITIAL BASE</span>
          <p className="text-[8px] font-sans text-slate-500 text-center uppercase tracking-wide leading-normal">
            Placeholder: Drop your first bodyless skeleton asset here
          </p>
        </div>

        {/* Visual Example Slice 2 */}
        <div className="flex-1 min-h-[110px] bg-slate-950 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-3 group border-dashed hover:border-cyan-500/40 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
          <span className={`text-[10px] ${accent} font-black tracking-wider uppercase mb-1`}>02 // DYNAMIC APEX</span>
          <p className="text-[8px] font-sans text-slate-500 text-center uppercase tracking-wide leading-normal">
            Placeholder: Drop your peak joint angle vector asset here
          </p>
        </div>

        {/* Visual Example Slice 3 */}
        <div className="flex-1 min-h-[110px] bg-slate-950 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-3 group border-dashed hover:border-cyan-500/40 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
          <span className={`text-[10px] ${accent} font-black tracking-wider uppercase mb-1`}>
            03 // TERMINAL STABILITY
          </span>
          <p className="text-[8px] font-sans text-slate-500 text-center uppercase tracking-wide leading-normal">
            Placeholder: Drop your load deceleration holding asset here
          </p>
        </div>
      </div>

      {/* COLUMN 2: CENTER WORKSPACE CONSOLE (Inputs & Tri-Vector Telemetry) */}
      <div className="md:col-span-5 p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className={`text-[10px] ${accent} font-bold uppercase tracking-widest`}>// FORWARD VIDEO CLOUD LINK</div>
            <input
              type="text"
              placeholder="Paste iCloud, Drive, or YouTube Link..."
              className={`w-full bg-slate-950 border border-slate-800 ${focusBorder} rounded-lg px-3 py-2 text-xs text-slate-300 outline-none transition-colors`}
            />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className={`text-[10px] ${accent} font-bold uppercase tracking-widest`}>
              // REGISTERED CLIENT EMAIL ADDRESS
            </div>
            <input
              type="email"
              placeholder={emailPlaceholder}
              className={`w-full bg-slate-950 border border-slate-800 ${focusBorder} rounded-lg px-3 py-2 text-xs text-slate-300 outline-none font-sans`}
            />
          </div>
        </div>

        {/* CORRECTED COMBAT / MODULE TRI-VECTOR LABELS */}
        <div className="grid grid-cols-3 gap-2.5 font-mono text-[9px] text-slate-500 font-bold">
          {vectors.map((vector) => (
            <div
              key={vector.code}
              className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg text-center flex flex-col items-center justify-center min-h-[90px]"
            >
              <div className={`${accent} font-bold tracking-wider mb-1`}>{vector.code}</div>
              <div className="text-[8px] font-medium font-sans uppercase">{vector.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 3: RIGHT SYSTEM DIRECTIONS PANEL (Instructions & Camera Alignment) */}
      <div className="md:col-span-4 flex flex-col gap-4 justify-between">
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 flex-1">
          <div className={`text-[10px] ${accent} font-bold uppercase tracking-widest mb-1.5`}>
            🔎 Movement Execution Instructions
          </div>
          <p className="text-xs font-sans text-slate-300 leading-relaxed font-normal tracking-wide">{instructions}</p>
        </div>
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 flex-1">
          <div className={`text-[10px] ${accent} font-bold uppercase tracking-widest mb-1.5`}>
            📷 Camera Angle & Telemetry Alignment
          </div>
          <p className="text-xs font-sans text-slate-300 leading-relaxed font-normal tracking-wide">{camera}</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const clientList = ['/client1.png', '/client2.png', '/client3.png'];
  const homeGridCanvasRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // LIVE DATABASE, SYSTEMS ROUTERS & PERMISSION CONTROLS
  const [localDatabase, setLocalDatabase] = useState(CLIENT_DATABASE);
  const [activeClientProfile, setActiveClientProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCoachMode, setIsCoachMode] = useState(false);

  // Core Viewport Navigation State Routers
  const [viewState, setViewState] = useState('landing'); // Controls: landing, loading, mobility, client_profile, coach_menu, pricing_matrix
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [bootProgress, setBootProgress] = useState(0);
  const [accessCode, setAccessCode] = useState('');

  // Large Text Form States
  const [editNotes, setEditNotes] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMetrics, setEditMetrics] = useState({ squat: '', land: '', cmj: '', agility: '' });

  // Identity & Tier Editing States
  const [editBirthdate, setEditBirthdate] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTier, setEditTier] = useState('Vector Tier');

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

  // CORE PRICE TERMINAL MATRIX ROUTER HOOKS
  const [priceTab, setPriceTab] = useState('corporate'); // Defaults directly to Corporate pitches!

  const handleSelectPriceTab = (tab) => {
    setPriceTab(tab);
  };

  // Triggered when CLIENT logs in with their pin code from the homepage
  const handleAccessCodeChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setAccessCode(digits);

    if (digits.length === 4) {
      // Dedicated MATTA 3D matrix scan pathway
      if (digits === '7777') {
        setViewState('scanning_matta');
        return;
      }

      if (localDatabase[digits]) {
        const client = localDatabase[digits];
        setIsCoachMode(false); // SECURE LOCK: Clients have zero modification authorization
        setActiveClientProfile(client);
        setEditNotes(client.notes);
        setEditDesc(client.desc);
        setEditMetrics({ ...client.metrics });

        setSelectedAnalysis('Client Telemetry Portfolio');
        setBootProgress(0);
        setViewState('loading');
      } else {
        alert('ACCESS CODE UNRESOLVED // SECURE ENTRY VIOLATION');
        setAccessCode('');
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
    setSelectedAnalysis('Client Telemetry Portfolio');
    setViewState('client_profile');
  };

  // Triggered when COACH clicks a row inside the Admin Command Center Menu
  const handleSelectClientFromMenu = (code) => {
    const client = localDatabase[code];
    setIsCoachMode(true); // AUTHORIZED: Coach access enables administrative modifiers
    setAccessCode(code);
    setActiveClientProfile(client);
    setEditNotes(client.notes);
    setEditDesc(client.desc);
    setEditMetrics({ ...client.metrics });

    setEditBirthdate(client.birthdate);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditTier(client.matrixTier || 'Vector Tier');

    setViewState('client_profile');
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

  // Save changes hook updated to sweep up all panels at once
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
    if (viewState !== 'landing' || !homeGridCanvasRef.current) return; // Only run on true main homepage

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
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
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
    setViewState('landing');
    setSelectedAnalysis('');
    setBootProgress(0);
    setAccessCode('');
    setActiveClientProfile(null);
    setIsEditMode(false);
    setIsCoachMode(false);
    setActiveVitalModule(null);
    setActiveAthleteModule(null);
    setActiveCombatModule(null);
    setActivePostureModule(null);
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
        onAccessGranted={() => {
          // Once the progress bar hits 100%, route directly into the client page
          setAccessCode('7777');
          unlockMattaProfile();
        }}
      />
    );
  }

  // SYSTEM FRAME A: Unified Posture & Ergonomics Workspace
  if (viewState === 'mobility') {
    const postureModules = [
      {
        id: 'pe_cervical',
        title: 'Test 1: Cervical & Desk-Posture Grid',
        direction: 'Forward Head Translation & Spine Angles // Side View Capture',
        metrics: 'Neck Mobility & Extension Constraints',
        duration: '3 Minutes',
        icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
        desc: 'Maps exact forward skull carriage distances and shoulder rounding vectors directly caused by long hours at a computer terminal screen.',
      },
      {
        id: 'pe_lumbar',
        title: 'Test 2: Lumbar Spine & Pelvic Recruitment',
        direction: 'Lumbar Curve & Pelvic Tilt Bias // Side View Capture',
        metrics: 'Posterior/Anterior Pelvic Loading Lines',
        duration: '3 Minutes',
        icon: <Activity className="w-5 h-5 text-emerald-400" />,
        desc: 'Maps lumbar hyper-extension and pelvic angle drop patterns under controlled tilt recruitment to isolate lower-spine compression bias.',
      },
      {
        id: 'pe_thoracic',
        title: 'Test 3: Trunk & Thoracic Rotation Matrix',
        direction: 'Ribcage Transverse Flexibility // Frontal View Capture',
        metrics: 'Spinal Twisting Decompression Lines',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-amber-400" />,
        desc: 'Measures core rotation limits and trunk stiffness lines built up during workplace shifts, isolating trapped structural paths.',
      },
    ];

    // Intercept card click mechanics to switch into deep corporate portal views
    const handlePostureModuleAction = (id) => {
      if (id === 'pe_cervical') {
        setActivePostureModule('pe_cervical');
        return;
      }
      if (id === 'pe_lumbar') {
        setActivePostureModule('pe_lumbar');
        return;
      }
      if (id === 'pe_thoracic') {
        setActivePostureModule('pe_thoracic');
        return;
      }
      document.getElementById(id).click();
    };

    const handlePostureFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // POSTURE SUB-PORTAL 1: Cervical & Desk-Posture Grid
    // =========================================================================
    if (activePostureModule === 'pe_cervical') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('POSTURE_ERGONOMICS // CERVICAL_GRID_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActivePostureModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    CERVICAL & DESK-POSTURE GRID
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// SPINE_COMPRESSION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // INITIAL BASE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop your first bodyless skeleton asset here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // DYNAMIC APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop your peak joint angle vector asset here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // TERMINAL STABILITY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop your load deceleration holding asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Stand naturally or sit in your habitual computer workspace stance. Look straight ahead for 3
                      seconds, then drop your chin completely down to your chest, return slowly to center, and look
                      fully upward toward the ceiling vector.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">FORWARD HEAD JUT</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">PLUMB LINE MATRIX</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera exactly at shoulder height, standing 5 to 6 feet away directly facing
                      your side profile path (90-degree lateral profile view). Frame the base of the skull down to
                      mid-torso lines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // POSTURE SUB-PORTAL 2: Lumbar Spine & Pelvic Loading
    // =========================================================================
    if (activePostureModule === 'pe_lumbar') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('POSTURE_ERGONOMICS // LUMBAR_PELVIC_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActivePostureModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-emerald-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    LUMBAR SPINE & PELVIC RECRUITMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-emerald-400 font-bold uppercase">// PELVIC_TILT_BIAS</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-emerald-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // NEUTRAL STANDING
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop lumbar curve baseline graphic here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-emerald-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // FLEXION VECTOR
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop posterior pelvic rotation tracking asset here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-emerald-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-emerald-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // EXTENSION OVERLOAD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop anterior shear angle summary metric here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Place your hands on your hip crest lines. Gently tuck your tailbone completely underneath you to
                      flatten your lower back (posterior tilt), hold for 2 seconds, then reverse the pattern by
                      exaggerating your lower spinal curve outward (anterior tilt).
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-emerald-400">LUMBAR HYPER-EXT</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-emerald-400">PELVIC ANGLE DROP</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set your capture device precisely at pelvic crest line height, standing 6 feet away directly
                      matching your lateral profile axis (90-degree side view). Keep loose shirts tucked away to avoid
                      obscuring spinal marker telemetry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // POSTURE SUB-PORTAL 3: Trunk & Thoracic Rotation Matrix
    // =========================================================================
    if (activePostureModule === 'pe_thoracic') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('POSTURE_ERGONOMICS // THORACIC_ROTATION')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-orange-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActivePostureModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-orange-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TRUNK & THORACIC ROTATION MATRIX
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-orange-400 font-bold uppercase">// CORE_DECOMPRESSION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-orange-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-orange-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // SEATED AXIAL ALIGNMENT
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop seated neutral spine rotation axis here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-orange-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-orange-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // LEFT DEFLECTION APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop left shoulder transverse plane angle vector here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-orange-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-orange-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // RIGHT DEFLECTION APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop right shoulder transverse plane angle vector here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Sit tall on a bench or chair with a straight rod across your upper shoulders. Keeping your hips
                      completely forward and fixed, rotate your upper torso fully to the left side and hold for 2
                      seconds, then rotate fully to the right side and hold for 2 seconds.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-orange-400">THORACIC MOBILITY RANGE</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-orange-400">PELVIC ASYMMETRY ROTATION</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera exactly at chest height, standing 6 to 7 feet away directly facing the
                      front center profile path (full frontal view capture). Both shoulders must stay visible throughout
                      the twisting motion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // MAIN SUITE LISTING: Render Standardized Posture & Ergonomics Grid
    // =========================================================================
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('POSTURE_ERGONOMICS_COMPRESSION_MATRIX')}

        {/* Scrollable Container Box Matching Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-5xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Standardized Branded Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // POSTURE & ERGONOMICS
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide border-l-2 border-cyan-500/40 pl-4">
                "Corporate & Desk Worker Track — Combating Screen Compression." This premium assessment path shifts
                focus to foundational durability, exposing hidden spinal degradation, neck posture strain, and
                workplace structural fatigue.
              </p>
            </div>

            {/* Double-Column Grid Container Mapping Hook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {postureModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handlePostureModuleAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                      ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                      ${
                        current?.state === 'complete'
                          ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handlePostureFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* High-Tech Infinite Loop Overlay Tracker */}
                    {current?.state === 'scanning' && (
                      <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 text-center font-mono">
                        <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                          ∞
                        </div>
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                          RUNNING KINETIC TELEMETRY SCAN...
                        </p>
                      </div>
                    )}

                    {/* Card Media Information Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-cyan-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      {/* Card Identity Header */}
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight font-mono">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-cyan-500/90 font-bold uppercase tracking-widest mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-medium">{item.metrics}</span>

                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME F: Unified Vital Flow Longevity Suite Workspace
  if (viewState === 'vital_flow') {
    const vitalModules = [
      {
        id: 'vf_squat',
        title: 'Deep Squat & Mobility Matrix',
        direction: 'Bilateral Wide Stance // Frontal View Capture',
        metrics: '46 Mobility Data Points',
        duration: '4 Minutes',
        icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
        desc: 'Analyzes dynamic lateral tracking paths, deep knee alignment profiles, and pelvic drop depth vectors under loading cycles.',
      },
      {
        id: 'vf_ext',
        title: 'Mobility Back Extension Assessment',
        direction: 'Kinetic Power & Structural Extension // Side Profile View',
        metrics: 'Spinal Articulation Coefficients',
        duration: '3 Minutes',
        icon: <Activity className="w-5 h-5 text-amber-400" />,
        desc: 'Maps segmented thoracic expansion arcs against lumbar shear limits to ensure overhead extensions are shielded.',
      },
      {
        id: 'vf_hold',
        title: 'Single-Leg Hold Stability Secure Assessment',
        direction: 'Static Unilateral Postural Sway // Frontal View',
        metrics: 'Postural Sway Radius Matrix',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-emerald-400" />,
        desc: 'Exposes hidden left-to-right micro-instabilities and stabilizer sway frequencies under persistent loading patterns.',
      },
    ];

    const handleModuleCardAction = (id) => {
      if (id === 'vf_squat') {
        setActiveVitalModule('vf_squat');
        return;
      }
      if (id === 'vf_ext') {
        setActiveVitalModule('vf_ext');
        return;
      }
      if (id === 'vf_hold') {
        setActiveVitalModule('vf_hold');
        return;
      }
      document.getElementById(id)?.click();
    };

    const handleVitalFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // SUB-ROUTER CONDITIONAL: Render Test One Sub-Portal
    // =========================================================================
    if (activeVitalModule === 'vf_squat') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('VITAL_FLOW // DEEP_SQUAT_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              {/* PORTAL TITLE DECK HEADLINE */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveVitalModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-blue-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    DEEP SQUAT & MOBILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">// MOBILITY_ANALYSIS</span>
              </div>

              {/* CLEAN DUAL-COLUMN HIGH-ART RECORDING SYSTEM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: MASSIVE HOLOGRAPHIC BIOMETRIC EXAMPLES */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // STANDING SETUP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop first bodyless skeleton model profile here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // ECCENTRIC TRANSITION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop hip-crease alignment vector graphics here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // MAXIMUM DEPTH HOLD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop deep apex telemetry outline asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: UPSCALE SYSTEM TELEMETRY INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  {/* EXPANDED INSTRUCTIONS CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Stand with your feet shoulder-width apart, arms extended straight out in front of your chest.
                      Descend smoothly into your maximum controlled deep squat, pulling your hips low while keeping your
                      heels firmly anchored to the floor. Hold the absolute bottom position for 3 full seconds before
                      returning to the start line.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-blue-400">ANKLE DORSIFLEXION</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-blue-400">HIP DEPTH SHIFT</span>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CAMERA ALIGNMENT CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera device exactly at knee height, standing 7 to 8 feet away directly facing
                      your side profile (90-degree lateral view capture). Ensure your entire body, from your feet to peak
                      extended hand line, remains tracked within the screen workspace throughout the entire pattern.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // VITAL FLOW MODULE: Mobility Back Extension Assessment
    // =========================================================================
    if (activeVitalModule === 'vf_ext') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('VITAL_FLOW // SPINE_EXTENSION_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveVitalModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    MOBILITY BACK EXTENSION ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// THORACIC_ALIGNMENT</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // PRONE EXTENSION SETUP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop prone resting alignment skeleton here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // SEGMENTAL SPINE DRIVE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dynamic lumbar thoracic extension arcs here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // MAXIMUM POSTERIOR HOLD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop apex chest-lift clearance tracking file here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Lie completely prone face down on your training mat. Place your hands flat directly underneath your
                      shoulders. Keeping your pelvis and legs firmly glued down to the floor, press through your hands to
                      extend your upper torso upward. Arrive at a comfortable peak range, holding for 3 full seconds.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">THORACIC SEGMENT EXTN</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">PELVIC ANCHOR BREAK</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set your camera device directly on the floor or a low platform at mat level. Position it 7 to 8 feet
                      away, perfectly square to your side profile (90-degree lateral profile capture). Ensure your entire
                      length from head to toes stays framed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // VITAL FLOW MODULE: Single Leg Hold Stability Assessment
    // =========================================================================
    if (activeVitalModule === 'vf_hold') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('VITAL_FLOW // UNILATERAL_BALANCE_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveVitalModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SINGLE LEG HOLD STABILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                  // CORE_STABILIZER_MATRIX
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // UNILATERAL SETUP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop static single leg ankle loading map here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // CENTER MASS SWAY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop torso sway lateral displacement graph here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // BASE ANCHOR STABILITY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop proprietary anchor pronation summary file here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Lift one foot cleanly off the floor, keeping your standing support leg completely straight with
                      your hands placed firmly on your hip crest lines. Maintain this frozen posture perfectly still for
                      20 continuous seconds, tracking balance micro-corrections.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">TORSO ANGLE OSCILLATION</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">FOOT CONTROLLER SWAY</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera device exactly at waist height, standing 6 feet away directly facing the
                      front path vector (full frontal view capture). Frame both hip points and feet clearly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ORIGINAL MATRIX SUITE LISTING CONTENT DISPLAY (Wrap beneath sub-router)
    // =========================================================================
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('VITAL_FLOW_DECOMPRESSION_MATRIX')}

        {/* Scrollable Container Box Matching the Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-5xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Standardized Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // VITAL FLOW
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide">
                "Flexibility without stability is a recipe for joint wear-and-tear." Select an assessment pathway below
                to view setup grids and start your movement calibration.
              </p>
            </div>

            {/* Clean Grid Framework Matching the Image Exactly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vitalModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleModuleCardAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                      ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                      ${
                        current?.state === 'complete'
                          ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.02)]'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handleVitalFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* High-Tech Infinite Loop Overlay Tracker */}
                    {current?.state === 'scanning' && (
                      <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 text-center">
                        <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                          ∞
                        </div>
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                          RUNNING KINETIC TELEMETRY SCAN...
                        </p>
                      </div>
                    )}

                    {/* Card Top Row */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-cyan-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      {/* Card Identity Header */}
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium font-mono">{item.metrics}</span>

                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform font-mono">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold font-mono">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME G: Dedicated Athlete Precision Workspace
  if (viewState === 'athlete_precision') {
    const athleteModules = [
      {
        id: 'ap_overhead',
        title: 'Test 1: Overhead Bilateral Squat',
        direction: 'Bilateral Overhead Extension // Frontal View Capture',
        metrics: 'Knee Valgus Angle & Depth Symmetry',
        duration: '4 Minutes',
        icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
        desc: 'Tracks dynamic frontal knee tracking paths and rotational valgus collapse limits. Pinpoints unweighted hip-to-ankle alignment shifts under core extension.',
      },
      {
        id: 'ap_single',
        title: 'Test 2: Dynamic Single-Leg Squat',
        direction: 'Unilateral Lower Body Load // Frontal View Capture',
        metrics: 'Limb Symmetry Index (LSI) Telemetry',
        duration: '5 Minutes',
        icon: <Activity className="w-5 h-5 text-indigo-400" />,
        desc: 'Compares left-leg stabilizer tracking values directly against right-leg parameters to isolate hidden muscular asymmetries and quad dominance ratios.',
      },
      {
        id: 'ap_hold',
        title: 'Test 3: Single Leg Hold Stability',
        direction: 'Unilateral Static Balance // Frontal View Capture',
        metrics: 'Core Stabilizer & Foot Sway Telemetry',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-cyan-400" />,
        desc: 'Tracks torso oscillation and foot-controller sway under a frozen single-leg lockout hold to isolate balance micro-corrections and ankle loading bias.',
      },
    ];

    // Intercept card click mechanics to switch into deep athlete precision portals
    const handleAthleteModuleAction = (id) => {
      if (id === 'ap_overhead') {
        setActiveAthleteModule('ap_overhead');
        return;
      }
      if (id === 'ap_single') {
        setActiveAthleteModule('ap_single');
        return;
      }
      if (id === 'ap_hold') {
        setActiveAthleteModule('ap_hold');
        return;
      }
      // Fallback file input click loop for the remaining cards
      document.getElementById(id).click();
    };

    const handleAthleteFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // SUB-ROUTER CONDITIONAL: Render Athlete Test One Sub-Portal (Overhead Squat)
    // =========================================================================
    if (activeAthleteModule === 'ap_overhead') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // OVERHEAD_SQUAT_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              {/* PORTAL TITLE DECK HEADLINE */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveAthleteModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    OVERHEAD BILATERAL SQUAT ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// SYMMETRY_ANALYSIS</span>
              </div>

              {/* CLEAN DUAL-COLUMN HIGH-ART RECORDING SYSTEM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: MASSIVE HOLOGRAPHIC BIOMETRIC EXAMPLES */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // OVERHEAD LOCKOUT
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dowel/bar track skeleton model here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // BILATERAL DRIVE DEPTH
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop frontal knee-tracking lateral shift matrix here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // BILATERAL AXIS STICK
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop shoulder torso angle symmetry metrics here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: UPSCALE SYSTEM TELEMETRY INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  {/* EXPANDED INSTRUCTIONS CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Raise your arms directly overhead, holding a PVC pipe, dowel rod, or light straight line bar vector
                      with elbows locked out crisp. Keep your chest up high and squat downward as low as your anatomy
                      allows. Press your weight evenly through both feet, holding the absolute base threshold stable for
                      2 seconds before pushing upright.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">THORACIC EXTENSION</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">VALGUS KNEE DEVIA</span>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CAMERA ALIGNMENT CARD */}
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set your recording device perfectly at mid-torso height, positioned 8 feet out directly facing your
                      front center profile (full frontal view capture). Your hands, shoulders, knees, and feet must stay
                      completely tracked inside the capture envelope at all times.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Dynamic Single-Leg Squat Assessment
    // =========================================================================
    if (activeAthleteModule === 'ap_single') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // SINGLE_LEG_SQUAT_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveAthleteModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-blue-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    DYNAMIC SINGLE-LEG SQUAT ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-blue-400 font-bold uppercase">// BILATERAL_SYMMETRY</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // SINGLE LEG BALANCE UNLOAD
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop unilateral stance baseline skeletal frame here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // ECCENTRIC VALGUS APEX
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dynamic knee tracking deviation vector files here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-blue-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // HIP STABILITY DROP CONSOLE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop pelvis tilt asymmetry tracking metrics here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Balance firmly on your target tracking leg, raising your opposite foot cleanly off the floor
                      surface. Extend your arms out forward for balance, descend smoothly to your maximum comfortable
                      single-leg depth, and push straight back up to complete the rep vector.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-blue-400">VALGUS KNEE TRACK</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-blue-400">LATERAL HIP SHIFT</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set up your video recording device exactly at knee height, standing 7 to 8 feet away directly facing
                      the front center profile line (full frontal view capture). Keep your entire frame from base to
                      shoulders tracked.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // ATHLETE PRECISION MODULE: Single Leg Hold Stability Assessment
    // =========================================================================
    if (activeAthleteModule === 'ap_hold') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('ATHLETE_PRECISION // SINGLE_LEG_HOLD_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveAthleteModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    SINGLE LEG HOLD STABILITY ASSESSMENT
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
                  // CORE_STABILIZER_MATRIX
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // UNILATERAL LOCKOUT TIMELINE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop static single leg ankle loading map here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // CENTER VECTOR DRIFT ANALYSIS
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop torso sway lateral displacement graph here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // FOOT APEX DEVIATION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop proprietary anchor pronation summary file here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Lift one foot cleanly off the floor, keeping your standing support leg straight with your hands
                      placed firmly on your hip crest lines. Maintain this frozen posture perfectly still for 20
                      continuous seconds, tracking balance micro-corrections.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">TORSO ANGLE OSCILL</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">FOOT CONTROLLER SWAY</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your device camera exactly at waist height, standing 6 feet away directly facing the front
                      path vector (full frontal view capture). Frame both hip points and feet clearly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('ATHLETE_PRECISION_DURABILITY_MATRIX')}

        {/* Scrollable Container Box Matching Your Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-4xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Standardized Branded Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // ATHLETE PRECISION
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide border-l-2 border-cyan-500/40 pl-4">
                "This assessment shifts the focus from raw power to foundational durability, exposing hidden asymmetries."
                This targeted tracking matrix identifies micro-asymmetries and neuromuscular imbalances before they evolve
                into long-term mechanical degradation.
              </p>
            </div>

            {/* Clean Grid Framework Matching the Vital Flow & Posture Standard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {athleteModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAthleteModuleAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                      ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                      ${
                        current?.state === 'complete'
                          ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handleAthleteFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* High-Tech Infinite Loop Loader Overlay */}
                    {current?.state === 'scanning' && (
                      <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 text-center font-mono">
                        <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                          ∞
                        </div>
                        <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                          RUNNING KINETIC TELEMETRY SCAN...
                        </p>
                      </div>
                    )}

                    {/* Card Media Information Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-cyan-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      {/* Card Track Title Specs */}
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight font-mono">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-cyan-500/90 font-bold uppercase tracking-widest mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-medium">{item.metrics}</span>

                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME H: Unified Kinetic Power Integrity Combat Track Workspace
  if (viewState === 'kinetic_power') {
    const combatModules = [
      {
        id: 'kp_boxing',
        title: 'Test 1: Shadow Boxing Cross or Hook',
        direction: 'General Mobility Assessment // Frontal View Capture',
        metrics: 'Kinetic Energy Leak & Rotation Ratios',
        duration: '3 Minutes',
        icon: <Sparkles className="w-5 h-5 text-rose-400" />,
        desc: 'Maps the transfer of kinetic force from the ground up. Tracking rotation angles reveals exactly where striking energy is lost before reaching the target.',
      },
      {
        id: 'kp_bound',
        title: 'Test 2: Lateral Single-Leg Bound and Hold',
        direction: 'Jump / Landing Assessment (Sideways Bound) // Frontal View',
        metrics: 'Dynamic Ankle & Knee Torque Stabilization',
        duration: '4 Minutes',
        icon: <Activity className="w-5 h-5 text-amber-400" />,
        desc: 'Measures how quickly joint angles stabilize after absorbing sharp lateral force vectors, testing directly for structural ligament protection.',
      },
      {
        id: 'kp_stance',
        title: 'Test 3: Low Combat Stance Hold',
        direction: 'Squat Solution Module // Frontal View Capture',
        metrics: 'Weight-Distribution Shift Percentages',
        duration: '3 Minutes',
        icon: <Anchor className="w-5 h-5 text-cyan-400" />,
        desc: 'Checks left vs. right knee loading angles to see if a fighter overloads their lead or rear tracking leg while maintaining their center-of-mass balance.',
      },
    ];

    // Intercept card click mechanics to switch into deep combat portal views
    const handleCombatModuleAction = (id) => {
      if (id === 'kp_boxing') {
        setActiveCombatModule('kp_boxing');
        return;
      }
      if (id === 'kp_bound') {
        setActiveCombatModule('kp_bound');
        return;
      }
      if (id === 'kp_stance') {
        setActiveCombatModule('kp_stance');
        return;
      }
      document.getElementById(id).click();
    };

    const handleCombatFileChange = (id, event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadStatus((prev) => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));
      setTimeout(() => {
        setUploadStatus((prev) => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
      }, 4000);
    };

    // =========================================================================
    // COMBAT TEST SUB-PORTAL 1: Shadow Boxing Cross or Hook Assessment
    // =========================================================================
    if (activeCombatModule === 'kp_boxing') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('KINETIC_POWER // STRIKING_MOBILITY_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-rose-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveCombatModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-rose-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 1: SHADOW BOXING CROSS OR HOOK
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-rose-400 font-bold uppercase">// ENERGY_TRANSFER</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-rose-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-rose-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // STANCE DRIVE LINE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop rear-foot heel rotation vector file here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-rose-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-rose-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // HIP ROTATIONAL SNAP
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop kinetic energy pelvis slinging outline here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-rose-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-rose-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // PEAK IMPACT EXTENSION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop torso alignment lumbar guard asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Square up into your fighting stance. Fire 3 maximum-velocity rear-hand cross punches or heavy lead
                      hooks into shadow boxing space. Exaggerate your heel-pivoting drive and hip snap, freezing the peak
                      extension line perfectly stable for 1 full second on the final repetition.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-rose-400">ROTATIONAL FORCE LEAKS</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-rose-400">LUMBAR SHEAR PROTECTION</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Set up your device camera exactly at chest height, standing 7 to 8 feet away directly facing your
                      front center-line vector (full frontal view capture). Your entire frame from your tracking feet up
                      to the punch arc path must stay tracked.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // COMBAT TEST SUB-PORTAL 2: Lateral Single-Leg Bound and Hold
    // =========================================================================
    if (activeCombatModule === 'kp_bound') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('KINETIC_POWER // LATERAL_DECELERATION_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveCombatModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-amber-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 2: LATERAL SINGLE-LEG BOUND AND HOLD
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-amber-400 font-bold uppercase">// LIGAMENT_PROTECTION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-amber-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-amber-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // SIDEWAYS LAUNCH DRIVE
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop explosive lateral drive force graphic here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-amber-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-amber-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // TORQUE STABILIZATION
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop dynamic knee deceleration vector file here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-amber-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-amber-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // STATUE BASE ANCHOR
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop terminal ankle angle stability metric asset here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Bound sideways explosively into the tracking frame, landing firmly on your outside tracking leg.
                      Drop deeply into your hips to absorb the incoming force vectors and stick the landing like a
                      statue. Hold that frozen single-leg base completely stable for 3 full seconds without resetting.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-amber-400">DYNAMIC KNEE TORQUE</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-amber-400">DECELERATION ANKLE ANCHOR</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your camera device exactly at knee height, standing 8 feet away directly facing your
                      jumping trajectory path (full frontal view capture). Make sure the full width of your lateral
                      bound track stays within the workspace boundary.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // COMBAT TEST SUB-PORTAL 3: Low Combat Stance Hold Assessment
    // =========================================================================
    if (activeCombatModule === 'kp_stance') {
      return (
        <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
          {renderSystemHeader('KINETIC_POWER // LOW_STANCE_MATRIX')}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="w-full max-w-6xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 relative">
              <div className="flex justify-between items-center border-b border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveCombatModule(null)}
                    className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-bold tracking-wider"
                  >
                    ← BACK TO MATRIX
                  </button>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                    TEST 3: LOW COMBAT STANCE HOLD
                  </h3>
                </div>
                <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">// WEIGHT_DISTRIBUTION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                {/* LEFT HALF: VISUAL STAGE PLACEHOLDERS */}
                <div className="flex flex-col gap-5">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    // MOVEMENT_STAGES_VISUAL_GUIDE
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 01 // STANCE DEPTH ENTRY
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop grappling base alignment silhouette here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 02 // LEAD VS REAR BIAS LOADING
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop left vs right knee loading balance mesh here
                    </p>
                  </div>

                  <div className="flex-1 min-h-[140px] bg-slate-900/20 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-5 group border-dashed hover:border-cyan-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                    <span className="text-xs text-cyan-400 font-black tracking-wider uppercase mb-1.5">
                      STAGE 03 // CENTER MASS SUSTAIN
                    </span>
                    <p className="text-[10px] font-sans text-slate-500 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                      Placeholder: Drop pelvis center-of-mass tracking vectors here
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: INSTRUCTIONS */}
                <div className="flex flex-col gap-6 justify-between">
                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>🔎 MOVEMENT EXECUTION INSTRUCTIONS</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Sink down deep into your maximum functional low combat stance or grappling base. Hold that exact
                      center-of-mass depth perfectly stable for 10 full seconds without creeping or rising up,
                      maintaining a crisp high defensive guard line throughout the entire duration.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 font-bold pt-2 uppercase">
                      <div>
                        TARGET 1: <span className="text-cyan-400">LEAD/REAR KNEE ANGLES</span>
                      </div>
                      <div>
                        TARGET 2: <span className="text-cyan-400">CENTER DEPTH TRACKING</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-900/60 pb-2">
                      <span>📷 CAMERA ANGLE & TELEMETRY ALIGNMENT</span>
                    </div>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      Position your phone camera device exactly at pelvic crest height, centered 7 to 8 feet away
                      directly facing the front center-line layout (full frontal view capture). Frame both feet and
                      knees clearly within the active scanning plane.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // MAIN SUITE LISTING: Render Standardized Kinetic Power Integrity Grid
    // =========================================================================
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('KINETIC_POWER_INTEGRITY_COMBAT_MATRIX')}

        {/* Scrollable Container Box Matching Your Look Style */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-4xl bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Standardized Branded Header Section */}
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                LONGEVITY BLUEPRINT ASSESSMENT SUITE // KINETIC POWER INTEGRITY
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 font-sans leading-relaxed font-normal tracking-wide border-l-2 border-rose-500/40 pl-4">
                "This assessment focuses on absolute joint torque bracing and elite impact stabilization metrics."
                Engineered explicitly for combat sport athletes to track fascial force transmission and protect
                structural cartilage.
              </p>
            </div>

            {/* Clean Grid Framework Matching the Look Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {combatModules.map((item) => {
                const current = uploadStatus[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCombatModuleAction(item.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between min-h-[220px]
                        ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                        ${
                          current?.state === 'complete'
                            ? 'bg-slate-900/40 border-emerald-500/30 cursor-default shadow-md'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'
                        }
                      `}
                  >
                    <input
                      type="file"
                      id={item.id}
                      onChange={(e) => handleCombatFileChange(item.id, e)}
                      accept="video/*"
                      className="hidden"
                    />

                    {/* Card Media Information Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-slate-900 border border-slate-800/60 rounded-lg text-rose-400">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                          {item.duration}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight font-mono">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-rose-400/90 font-bold uppercase tracking-widest mt-1 mb-2 font-mono">
                        // {item.direction}
                      </p>
                      <p className="text-xs font-sans text-slate-400 font-normal leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Standardized Bottom Action Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-medium">{item.metrics}</span>
                      {!current && (
                        <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                          Start Assessment →
                        </span>
                      )}
                      {current?.state === 'complete' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ SECURED // PENDING COACH KEY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME F: Premium Architectural Membership & B2B Corporate Presentation Matrix
  if (viewState === 'pricing_matrix') {
    return (
      <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden">
        {/* Universal Top Terminal Strip */}
        {renderSystemHeader('COMMERCIAL_B2B_AND_MEMBERSHIP_MATRIX')}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-5xl bg-slate-950 border border-cyan-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative backdrop-blur-xl">
            {/* Header Text Block */}
            <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-900 pb-5 gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase mb-0.5">
                  // BIOMECHANICAL PACKAGES & TIERS
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight uppercase">
                  Longevity Laboratory Frameworks
                </h2>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Select a matrix orientation below to view employee workspace initiatives or independent athletic
                  tracks.
                </p>
              </div>

              {/* High-Tech B2B / Consumer Tab Toggle Switcher */}
              <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[10px] uppercase font-bold shrink-0 mx-auto md:mx-0">
                <button
                  onClick={() => handleSelectPriceTab('corporate')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    priceTab === 'corporate'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💼 Corporate B2B Labs
                </button>
                <button
                  onClick={() => handleSelectPriceTab('athlete')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    priceTab === 'athlete'
                      ? 'bg-indigo-600 text-white font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Athlete Programs
                </button>
              </div>
            </div>

            {/* DYNAMIC CARD CONDITION 1: CORPORATE B2B LAB PRESENTATION */}
            {/* DYNAMIC CARD CONDITION 1: CORPORATE B2B LAB PRESENTATION (Upgraded High-Visibility Typography) */}
            {priceTab === 'corporate' && (
              <div className="space-y-6 animate-fade-in font-mono text-slate-200">
                {/* Main Package Showcase Banner Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 bg-slate-900/30 border border-cyan-500/20 rounded-xl overflow-hidden shadow-xl">
                  {/* Left Descriptive Core (Typography Scale Amplified to text-sm/text-base) */}
                  <div className="p-6 lg:col-span-2 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-900">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] px-2.5 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                        On-Site Lab Initiative
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 bg-slate-950 text-emerald-400 font-bold border border-slate-900 rounded-full tracking-wider uppercase">
                        5-25 Employees
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-mono">
                      // Posture & Ergonomics Wellness Package
                    </h3>
                    <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                      "You aren't losing productivity to a lack of motivation—you're losing it to spinal fatigue. Our
                      10-minute mobile AI Posture Lab scans your team on-site, uncovers hidden ergonomic stress lines, and
                      delivers instant physical relief to protect your workflow."
                    </p>
                    <p className="text-xs md:text-sm font-sans text-slate-400 italic font-normal pt-2 border-t border-slate-900/60 leading-relaxed">
                      "Your desk shouldn't rewrite your body's structural alignment. Our computer-vision telemetry mapping
                      reveals exactly why your lower back throbs by 3:00 PM—and hands you the precise 180-second movement
                      hack to reverse it."
                    </p>
                  </div>

                  {/* Financial Investment Core with New CTA Trigger (Price Moved to Bottom, Font Enlarged) */}
                  <div className="p-6 bg-slate-950/50 flex flex-col justify-between items-center text-center min-h-[220px] font-mono">
                    <div className="w-full">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">
                        // DEPLOYMENT SUMMARY
                      </span>
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wide bg-slate-900 border border-slate-900/80 px-2 py-2 rounded-lg mt-3 font-sans">
                        On-Site Testing with Individual Longevity Blueprints
                      </div>
                    </div>

                    <div className="w-full mt-4 pt-3 border-t border-slate-900/80">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wide">
                        Up to 10 Employees // FLAT VALUE
                      </span>
                      <div className="text-3xl md:text-4xl font-black text-cyan-400 tracking-tighter mt-1">$1,000</div>

                      {/* Brand New Secure Conversion Action Button */}
                      <button
                        onClick={() =>
                          alert(
                            '🔒 COMMERCIAL SECURE GATEWAY // INITIALIZING CORPORATE B2B PROCUREMENT ORDER PIPELINE'
                          )
                        }
                        className="w-full text-center py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-lg text-[10px] tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer mt-3"
                      >
                        🔒 Secure Offer Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Technical Problem Data vs Solution Output Grid (Font Size Bumped Up) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm font-medium">
                  {/* Left Column: The Problem Data (Biomechanical Failures) */}
                  <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-4 shadow-xl">
                    <div className="text-rose-400 font-bold tracking-widest text-[11px] uppercase border-b border-slate-900/80 pb-2 flex items-center gap-1.5 font-mono">
                      ⚠️ THE PROBLEM DATA // DESK-BOUND COMPRESSION
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">
                        1. Cervical Compression Profile
                      </h4>
                      <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
                        Prolonged screen tracking forces a forward head migration, loading up to{' '}
                        <span className="text-rose-400 font-bold font-mono">42 lbs of extra shearing pressure</span> onto
                        the upper spine, causing persistent neck strain.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">
                        2. Locked Thoracic Extension
                      </h4>
                      <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
                        Extended keyboard positioning locks the mid-back, forcing the lower lumbar spine to
                        over-compensate and arch excessively during basic human movements.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">
                        3. Dormant Lateral Glute Activation
                      </h4>
                      <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
                        Long hours spent sitting in ergonomic chairs signals the deep hip stabilizers to{' '}
                        <span className="text-rose-400 font-bold font-mono">"turn off,"</span> triggering a chronic pelvic
                        drop that manifests as deep lower back throbbing by mid-afternoon.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: The Solution Output (Deliverables) */}
                  <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-4 shadow-xl">
                    <div className="text-emerald-400 font-bold tracking-widest text-[11px] uppercase border-b border-slate-900/80 pb-2 flex items-center gap-1.5 font-mono">
                      ✓ THE SOLUTION OUTPUT // VERIFIED DELIVERABLES
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">
                        1. Personal Digital Ergonomics Map
                      </h4>
                      <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
                        Every employee receives a private, interactive telemetry blueprint report with analysis, coaching
                        tips, screen and chair adjustments that they can make could be critical for long term.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">2. Immediate Pain-Mapping</h4>
                      <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
                        We isolate the exact millimeter discrepancies causing their recurring daily shoulder tension, hip
                        tightness, or energy crashes.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">
                        3. The 3-Minute Desk Restorative Circuit
                      </h4>
                      <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
                        A customized, low-barrier daily movement blueprint that fits seamlessly into a busy workday to
                        instantly reset spinal pressure lines.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Segment Clear Space Spacer */}
                <div className="pt-2" />
              </div>
            )}

            {/* DYNAMIC CARD CONDITION 2: INDEPENDENT ATHLETE TIERS */}
            {priceTab === 'athlete' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono animate-fade-in">
                {/* Vector Tier */}
                <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-indigo-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                        Single Entry
                      </span>
                      <h3 className="text-md font-black text-slate-200 uppercase mt-2">Vector Tier</h3>
                      <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                        $149 <span className="text-[10px] font-normal text-slate-500">/ Session</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
                      Ideal for single-focused biomechanical testing or workspace corporate checks. Focuses on isolated
                      range of motion constraints.
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
                      <li className="flex items-center gap-2 text-slate-400">✓ 1x Target Pipeline Upload</li>
                      <li className="flex items-center gap-2 text-slate-400">✓ Desk Posture & ROM Scan</li>
                      <li className="flex items-center gap-2 text-slate-400">✓ Client Profile Access Token</li>
                    </ul>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400 bg-slate-950 border border-slate-900 p-2 text-center rounded-lg mt-5 uppercase tracking-widest">
                    Vector Pipeline Gated
                  </div>
                </div>

                {/* Tensegrity Tier */}
                <div className="p-5 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between relative overflow-hidden group shadow-lg shadow-cyan-950/5">
                  <div className="absolute top-0 right-0 bg-cyan-400 text-slate-950 text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-bl">
                    Recommended
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                        Full Evaluation
                      </span>
                      <h3 className="text-md font-black text-slate-200 uppercase mt-2">Tensegrity Tier</h3>
                      <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                        $299 <span className="text-[10px] font-normal text-slate-500">/ Evaluation</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
                      A complete full-body structural breakdown mapping multi-plane kinetic shifts, rotational torque
                      asymmetries, and explosive stability.
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
                      <li className="flex items-center gap-2 text-cyan-400">✓ All 4 Performance Uploads</li>
                      <li className="flex items-center gap-2 text-cyan-400">✓ Full Fascial Balance Chart</li>
                      <li className="flex items-center gap-2 text-cyan-400">✓ Downloadable Blueprint Doc</li>
                    </ul>
                  </div>
                  <div className="text-[10px] font-bold text-slate-950 bg-cyan-400 p-2 text-center rounded-lg mt-5 uppercase tracking-widest">
                    Calibrate Full Blueprint
                  </div>
                </div>

                {/* Infinite Matrix Tier */}
                <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-amber-500/30 transition-colors">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-amber-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                        Ongoing Support
                      </span>
                      <h3 className="text-md font-black text-slate-200 uppercase mt-2">Infinite Matrix</h3>
                      <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                        $199 <span className="text-[10px] font-normal text-slate-500">/ Month</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
                      Continuous dynamic access designed for martial artists, acrobats, and practitioners scaling
                      systemic patterns under high load profiles.
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
                      <li className="flex items-center gap-2 text-amber-400">✓ Unlimited Pipeline Upgrades</li>
                      <li className="flex items-center gap-2 text-amber-400">✓ Direct Roster Case Logs</li>
                      <li className="flex items-center gap-2 text-amber-400">✓ Dynamic 3D Model Tracking</li>
                    </ul>
                  </div>
                  <div className="text-[10px] font-bold text-amber-400 bg-slate-950 border border-slate-900 p-2 text-center rounded-lg mt-5 uppercase tracking-widest">
                    Initialize Matrix Stream
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME B: Premium Biometric Client Profile Portal Hub
  if (viewState === 'client_profile' && activeClientProfile) {
    return (
      <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden relative">
        {renderSystemHeader(`CLIENT_DOSSIER // ${activeClientProfile.name.toUpperCase()}`)}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          {/* Your main active card panel framework remains perfectly safe inside here */}
          <div className="w-full max-w-7xl bg-slate-950/80 border border-cyan-500/20 rounded-2xl backdrop-blur-xl p-6 md:p-8 shadow-2xl relative">

            {/* Dossier Header Info Block */}
            <div className="border-b border-slate-900 pb-4 mb-6">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-0.5">// ACTIVE PROFILE ARCHIVE</div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">{activeClientProfile.name}</h2>
            </div>

            {/* Grid Separation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Demographics, Core Identity & Tier Modifiers */}
              <div className="space-y-4">
                <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-950 border border-cyan-500/20 flex items-center justify-center shadow-lg mb-4 text-cyan-400 relative overflow-hidden group">
                    <User className="w-10 h-10 group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-cyan-400/5 mix-blend-overlay" />
                  </div>

                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-0.5 bg-slate-950 rounded-full border border-slate-800 mb-3">
                    {activeClientProfile.archetype}
                  </div>

                  <div className="w-full mt-1 border-t border-slate-900/60 pt-3 text-center">
                    <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider mb-1">CURRENT MATRIX SUBSCRIPTION</span>
                    {isEditMode ? (
                      <select
                        value={editTier}
                        onChange={(e) => setEditTier(e.target.value)}
                        className="bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-400 font-mono text-xs rounded px-2 py-1.5 outline-none tracking-wide text-center cursor-pointer transition-colors max-w-full font-bold uppercase shadow-inner"
                      >
                        <option value="Vector Tier">Vector Tier</option>
                        <option value="Tensegrity Tier">Tensegrity Tier</option>
                        <option value="Infinite Matrix Tier">Infinite Matrix Tier</option>
                      </select>
                    ) : (
                      <span className={`text-sm font-black tracking-wide uppercase font-mono block mt-0.5
                        ${activeClientProfile.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400' : ''}
                        ${activeClientProfile.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                        ${activeClientProfile.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                      `}>
                        {activeClientProfile.matrixTier || "Vector Tier"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Secure Digital Contact Cards (Hides personal info dynamically for clients) */}
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 text-xs font-medium text-slate-300 font-mono">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-950 pb-1.5">
                    // IDENTITY SPECIFICATIONS
                  </div>

                  {isCoachMode ? (
                    /* Coach Mode: Reveals full contact records for editing and review */
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />{' '}
                          <span className="text-[9px] font-bold tracking-wider uppercase">Date of Birth</span>
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editBirthdate}
                            onChange={(e) => setEditBirthdate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm font-mono outline-none"
                            placeholder="MM/DD/YYYY"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-slate-200 pl-5">
                            {activeClientProfile.birthdate}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />{' '}
                          <span className="text-[9px] font-bold tracking-wider uppercase">Email Contact</span>
                        </div>
                        {isEditMode ? (
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm font-mono outline-none truncate"
                            placeholder="name@email.com"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-slate-200 pl-5 truncate max-w-full">
                            {activeClientProfile.email}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-3.5 h-3.5" />{' '}
                          <span className="text-[9px] font-bold tracking-wider uppercase">Phone Terminal</span>
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm font-mono outline-none"
                            placeholder="(555) 000-0000"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.phone}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Client Mode: Hides private data, displaying high-art telemetry confirmation instead */
                    <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-xl space-y-2 text-slate-400 font-mono text-[11px] leading-relaxed animate-fade-in">
                      <div>
                        <span className="text-cyan-400 font-bold">STATUS:</span> ACTIVE MATRIX SYNCHRONIZATION
                      </div>
                      <div>
                        <span className="text-cyan-400 font-bold">SECURITY:</span> PIPELINE ENCRYPTED
                      </div>
                      <div>
                        <span className="text-cyan-400 font-bold">DECOMPRESSION:</span> RATIOS LOADED
                      </div>
                    </div>
                  )}

                  {/* Embedded Access PIN Passcode Row */}
                  <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-slate-400">
                    <span className="font-bold text-[10px] tracking-wider text-slate-500 uppercase">SYS_ACCESS_PIN:</span>
                    <span className="text-sm font-black text-cyan-400 tracking-widest font-mono bg-slate-950 px-2 py-0.5 border border-slate-900 rounded">
                      {accessCode}
                    </span>
                  </div>
                </div>
              </div>
              {/* Middle Column: Architectural Movement Notes, Case Logs & Focus Writing Pads */}
              <div className="space-y-4 flex flex-col justify-start">
                {/* Movement Vector Log Card / Text Area Trigger */}
                <div
                  onClick={() => isEditMode && setActiveFocusField('desc')}
                  className={`p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-200
                    ${isEditMode ? 'hover:bg-slate-900 hover:border-cyan-500/50 cursor-zoom-in group shadow-lg shadow-cyan-950/20' : ''}
                  `}
                >
                  <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Biomechanical Archetype Vector
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] text-cyan-500 font-black animate-pulse tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                        ⛶ CLICK TO EXPAND
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-6">
                    {isEditMode ? editDesc || 'No narrative logged yet.' : activeClientProfile.desc}
                  </p>
                </div>

                {/* Coach Strategic Directive Log Card / Text Area Trigger */}
                <div
                  onClick={() => isEditMode && setActiveFocusField('notes')}
                  className={`p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-200
                    ${isEditMode ? 'hover:bg-slate-900 hover:border-indigo-500/50 cursor-zoom-in group shadow-lg shadow-indigo-950/20' : ''}
                  `}
                >
                  <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4" /> Kinetic Directives & Case Log
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] text-indigo-500 font-black animate-pulse tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                        ⛶ CLICK TO EXPAND
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-6">
                    {isEditMode ? editNotes || 'No directives logged yet.' : activeClientProfile.notes}
                  </p>
                </div>
              </div>

              {/* Right Column: High-Art Studio 3D Preview Deck */}
              <div className="flex flex-col justify-between items-center h-full min-h-[460px] relative">
                <div className="w-full h-full bg-slate-950/70 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-xl flex flex-col shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2.5">
                    <div>
                      <p className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">// TENSEGRITY LAYER</p>
                      <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase">CORE VECTOR DECK</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono block text-slate-500 uppercase tracking-widest">ACTIVE ARCHIVE</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {activeClientProfile.name.split(' ')[0].toUpperCase()}_SYS
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full bg-[#030d1e]/40 border border-cyan-950/60 rounded-lg overflow-hidden relative inner-shadow min-h-[300px]">
                    <Canvas camera={{ position: [0, 1.5, 9], fov: 45 }}>
                      <ambientLight intensity={2.5} />
                      <Suspense fallback={null}>
                        <CustomHologramMesh />
                      </Suspense>
                      <OrbitControls enablePan={true} enableZoom={true} minDistance={2} maxDistance={9} />
                      <Grid
                        position={[0, -1.8, 0]}
                        args={[]}
                        cellSize={0.5}
                        cellThickness={1}
                        cellColor="#1e293b"
                        sectionSize={2}
                        sectionColor="#334155"
                        fadeDistance={25}
                      />
                    </Canvas>
                  </div>
                </div>
              </div>

            </div>

            {/* Calibration Ratings Row (Gated with Client-Side Download Engines) */}
            <div className="pt-5 border-t border-slate-900 mt-5">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
                <span>// VERIFIED CALIBRATION RATINGS</span>

                {isCoachMode ? (
                  /* Coach Mode Actions Terminal Panel */
                  <div className="flex flex-wrap gap-2 animate-fade-in">
                    <button
                      onClick={() => {
                        const reportText = `==================================================\nLONGEVITY BLUEPRINT OBJECTIVE BIOMETRIC REPORT\n==================================================\nATHLETE DOSSIER: ${activeClientProfile.name.toUpperCase()}\nARCHETYPE:       ${activeClientProfile.archetype.toUpperCase()}\nPASSCODE KEY:    [ ${accessCode} ]\nRECORDED DOB:    ${activeClientProfile.birthdate}\nCONTACT LINE:    ${activeClientProfile.email}\n--------------------------------------------------\n BIOMECHANICAL ARCHETYPE VECTOR LOG:\n${editDesc}\n KINETIC DIRECTIVES & CASE COACH NOTES:\n${editNotes}\n-------------------------------------------------- VERIFIED METRIC CALIBRATION RATINGS:\n- Deep Squat Mobility Matrix:    ${editMetrics.squat}\n- Single-Leg Land Stability:     ${editMetrics.land}\n- Kinetic Power Extension (CMJ): ${editMetrics.cmj}\n- Multi-Plane Deceleration (505): ${editMetrics.agility}\n==================================================\nSECURE BLUEPRINT GENERATION // SYSTEMS ENGINE v4.8\n==================================================`;
                        const element = document.createElement('a');
                        const file = new Blob([reportText], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${activeClientProfile.name.replace(/\s+/g, '_')}_Biometric_Blueprint.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="px-3 py-1.5 bg-slate-950 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      📥 Export Data
                    </button>
                    <button
                      onClick={handleChangeClientCode}
                      className="px-3 py-1.5 bg-slate-950 text-indigo-400 border border-indigo-500/40 hover:border-indigo-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      🔑 Change Code
                    </button>
                    <button
                      onClick={() => (isEditMode ? handleSaveProfileChanges() : setIsEditMode(true))}
                      className={`px-3 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer border ${
                        isEditMode
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-cyan-400 border-cyan-500/40'
                      }`}
                    >
                      {isEditMode ? '✓ Save Changes' : '⚙ Modify Record'}
                    </button>
                    <button
                      onClick={handleDeleteClientRecord}
                      className="px-3 py-1.5 bg-slate-950/40 text-rose-500 border border-rose-900/50 hover:border-rose-500 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer"
                    >
                      🗑️ Delete Client
                    </button>
                  </div>
                ) : (
                  /* Client View: Renders an active report downloader right next to the status flag */
                  <div className="flex flex-wrap items-center gap-3 font-mono animate-fade-in">
                    <button
                      onClick={() => {
                        const reportText = `==================================================\nOFFICIAL LONGEVITY BLUEPRINT MOVEMENT SPECIFICATION\n==================================================\nCLIENT DOSSIER:  ${activeClientProfile.name.toUpperCase()}\nMOVEMENT MATRIX: ${activeClientProfile.archetype.toUpperCase()}\nACCESS PIN KEY:  [ ${accessCode} ]\n--------------------------------------------------\nYOUR BIOMECHANICAL VECTOR LOG:\n${activeClientProfile.desc}\n\nYOUR COACH SYSTEM CONFIGURATIONS & DIRECTIVES:\n${activeClientProfile.notes}\n--------------------------------------------------\nYOUR QUANTITATIVE OBJECTIVE PERFORMANCE RATINGS:\n- Deep Squat Mobility Matrix:    ${activeClientProfile.metrics.squat}\n- Single-Leg Land Stability:     ${activeClientProfile.metrics.land}\n- Kinetic Power Extension (CMJ): ${activeClientProfile.metrics.cmj}\n- Multi-Plane Deceleration (505): ${activeClientProfile.metrics.agility}\n==================================================\nSECURE BLUEPRINT SUITE // CHROME DOWNLOAD CAPTURE\n==================================================`;
                        const element = document.createElement('a');
                        const file = new Blob([reportText], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${activeClientProfile.name.replace(/\s+/g, '_')}_Blueprint_Specs.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-bold rounded text-[10px] tracking-widest uppercase transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                    >
                      📥 Download Report
                    </button>
                    <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase bg-slate-950 px-3 py-1.5 border border-emerald-900/40 rounded shadow-md">
                      ✓ SECURE CLIENT READ-ONLY PATHWAY ENFORCED
                    </div>
                  </div>
                )}
              </div>
              {/* Calibration Ratings Grid (Gated with isCoachMode Protection) */}
                {isCoachMode && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono mt-4 animate-fade-in">
                    {Object.entries(editMetrics).map(([key, value], idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center"
                      >
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1.5">
                          {key === 'squat'
                            ? 'Deep Squat'
                            : key === 'land'
                              ? 'Land Hold'
                              : key === 'cmj'
                                ? 'Kinetic CMJ'
                                : 'Agility 505'}
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setEditMetrics((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-20 bg-slate-900 border border-cyan-500/30 text-center text-base font-black text-cyan-400 outline-none"
                          />
                        ) : (
                          <div className="text-xl md:text-2xl font-black text-cyan-400 tracking-tight">{value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* High-Art Secure Document Status Footer Bar */}
            <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>OFFICIAL BIOMETRIC BLUEPRINT SECURED // VALID ACCESS PATH</span>
              </div>
              <div>STATION RECOVERY ENGINE: v4.8_STABLE</div>
            </div>

          </div>
        </div>

        {/* Dynamic Focus Pad Overlay Area Component */}
        {activeFocusField && (
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in font-mono">
            <div
              className={`w-full max-w-5xl h-[90vh] bg-slate-950 border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                activeFocusField === 'desc' ? 'border-cyan-500/40' : 'border-indigo-500/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">// HIGH-CAPACITY TEXT FOCUS WRITER</span>
                    <h3
                      className={`text-lg font-black uppercase mt-0.5 ${
                        activeFocusField === 'desc' ? 'text-cyan-400' : 'text-indigo-400'
                      }`}
                    >
                      {activeFocusField === 'desc'
                        ? 'Biomechanical Archetype Editor'
                        : 'Kinetic Directives Case Logger'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveFocusField(null)}
                    className="px-3.5 py-1.5 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 text-xs bg-slate-900 font-bold tracking-widest uppercase cursor-pointer active:scale-95"
                  >
                    ✕ Close Pad [ESC]
                  </button>
                </div>
                <textarea
                  autoFocus
                  readOnly={!isCoachMode}
                  value={activeFocusField === 'desc' ? editDesc : editNotes}
                  onChange={(e) =>
                    isCoachMode &&
                    (activeFocusField === 'desc' ? setEditDesc(e.target.value) : setEditNotes(e.target.value))
                  }
                  className={`w-full h-[62vh] bg-[#030712] border border-slate-900 rounded-xl p-6 text-base text-slate-200 font-sans focus:outline-none resize-none ${
                    activeFocusField === 'desc' ? 'focus:border-cyan-500/60' : 'focus:border-indigo-500/60'
                  }`}
                />
              </div>
              <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
                <div className="text-[11px] text-slate-600">MATRIX CELL: {activeFocusField.toUpperCase()}_LOG_BUFFER</div>
                <button
                  onClick={() => setActiveFocusField(null)}
                  className={`px-5 py-2.5 rounded-lg text-slate-950 font-bold text-xs tracking-widest uppercase cursor-pointer active:scale-95 ${
                    activeFocusField === 'desc' ? 'bg-cyan-400' : 'bg-indigo-400'
                  }`}
                >
                  ✓ Close & Minimize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SYSTEM FRAME C: Master Coach Roster & Onboarding Console Menu
  if (viewState === 'coach_menu') {
    return (
      <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden select-none">
        {renderSystemHeader('COACH_TERMINAL')}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-5xl bg-slate-950 border border-cyan-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative backdrop-blur-xl">
          {/* Master Control Board Title Section */}
          <div className="pb-2">
            <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase">
              // CONTROL TERMINAL ARCHIVES
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight uppercase">
              Coach Intelligence Dashboard
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Onboard a New Client Form (Large Text Inputs) */}
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-slate-950 pb-2 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Onboard New Athlete Matrix
              </div>
              <form onSubmit={handleCreateNewClient} className="space-y-4 font-mono text-sm">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-200 outline-none font-sans text-base transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Assign 4-Digit Passcode
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4444"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-400 focus:text-cyan-400 tracking-[0.25em] text-center font-black text-lg outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Movement Specialization Archetype
                  </label>
                  <select
                    value={newClientArchetype}
                    onChange={(e) => setNewClientArchetype(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-200 outline-none text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    <option value="Acrobatics & Hand Balance">Acrobatics & Hand Balance</option>
                    <option value="Jiu-Jitsu / Combat Athlete">Jiu-Jitsu / Combat Athlete</option>
                    <option value="Advanced Yoga Practitioner">Advanced Yoga Practitioner</option>
                    <option value="MMA / Muay Thai Striking">MMA / Muay Thai Striking</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full text-center py-2.5 bg-cyan-500 text-slate-950 font-bold border border-cyan-400 rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-[0.98] mt-2"
                >
                  ➕ Initialize Client Portal
                </button>
              </form>
            </div>

            {/* Right Column: Master Active Client List Matrix Roster */}
            <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4">
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest border-b border-slate-950 pb-2">
                // SECURE SYSTEM DATABASE ARCHIVES
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {Object.entries(localDatabase).map(([code, client]) => (
                  <div
                    key={code}
                    onClick={() => handleSelectClientFromMenu(code)}
                    className="p-4 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-cyan-500/30 rounded-xl transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                          {client.name}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide mt-0.5 truncate">
                          {client.archetype}
                        </div>
                      </div>
                    </div>

                    {/* New Matrix Tier, Enrolled Date & Private Deletion Controls */}
                    <div className="flex items-center gap-6 text-right font-mono shrink-0 ml-4">
                      <div className="hidden sm:block">
                        <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">ENROLLED</span>
                        <span className="text-xs text-slate-400 font-medium">{client.joinedDate || 'PENDING'}</span>
                      </div>

                      <div className="min-w-[120px]">
                        <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">MATRIX LEVEL</span>
                        <span
                          className={`text-xs font-black tracking-wide uppercase
                          ${client.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]' : ''}
                          ${client.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                          ${client.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                        `}
                        >
                          {client.matrixTier || 'Vector Tier'}
                        </span>
                      </div>

                      {/* Private Coach Destructive Scrub Trigger (Bypasses clicking row portal) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `CRITICAL SYSTEM WARNING // PERMANENTLY SCRUB ${client.name.toUpperCase()} FROM LOG ARCHIVES?\n\nTHIS OPERATION CANNOT BE UNDONE.`
                            )
                          ) {
                            setLocalDatabase((prev) => {
                              const updated = { ...prev };
                              delete updated[code];
                              return updated;
                            });
                            alert('✓ SECURE LOG SCRUBBED');
                          }
                        }}
                        className="p-2 bg-slate-900/60 border border-slate-900 hover:border-rose-900 text-slate-600 hover:text-rose-500 rounded-lg transition-all cursor-pointer active:scale-90 font-sans text-xs font-bold"
                        title="Scrub Client Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME B: Telemetry Sync Calibration Bar Loader
  if (viewState === 'loading') {
    return (
      <div className="w-full h-screen bg-[#02050d] text-white flex flex-col items-center justify-center font-mono p-6 select-none relative overflow-hidden">
        <div className="w-[440px] bg-slate-950/80 border border-cyan-500/20 p-8 rounded-xl shadow-[0_0_60px_rgba(6,182,212,0.05)] backdrop-blur-md">
          <div className="flex items-center justify-between mb-6 border-b border-cyan-950/60 pb-4">
            <span className="text-[12px] tracking-widest text-cyan-400 uppercase font-bold">SYSTEM CALIBRATION</span>
            <span className="text-[10px] text-slate-500 font-bold">LN_V4.8</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm tracking-wider text-slate-300 mb-2">
                <span className="uppercase">COMPILING {selectedAnalysis}...</span>
                <span className="text-cyan-400 font-bold">{Math.min(bootProgress, 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 border border-cyan-950 rounded-full overflow-hidden p-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  style={{ width: `${Math.min(bootProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME C: High-Art Studio Preview Deck View
  if (viewState === 'dashboard') {
    return (
      <div className="w-full h-screen bg-[#020813] text-white flex flex-col font-sans select-none overflow-hidden">
        {renderSystemHeader('ASSESSMENT_DECK')}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            {/* Upgraded Larger Viewport Container Card */}
            <div className="w-[640px] h-[680px] bg-slate-950/70 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
                <div>
                  <p className="text-[11px] tracking-widest text-cyan-400 font-mono uppercase">Biomechanical Target</p>
                  <h2 className="text-lg font-bold tracking-wider text-slate-200 uppercase">{selectedAnalysis}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono block text-slate-500 uppercase tracking-widest">Active Matrix</span>
                  <span className="text-[12px] font-mono text-cyan-400 font-bold">{displayClientName}</span>
                </div>
              </div>

              <div className="flex-1 w-full bg-[#030d1e]/90 border border-cyan-950/60 rounded-xl overflow-hidden relative inner-shadow">
                <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Suspense fallback={null}>
                    <AssessmentMorphScene clientImagePath={clientList[currentIdx]} />
                  </Suspense>
                  <Grid
                    renderOrder={-1}
                    position={[0, -1.35, 0]}
                    args={[10.5, 10.5]}
                    cellSize={0.25}
                    cellThickness={0.7}
                    cellColor="#082f49"
                    sectionSize={1.25}
                    sectionThickness={1.2}
                    sectionColor="#0e7490"
                    fadeDistance={6}
                  />
                  <OrbitControls enableZoom maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 4} />
                </Canvas>
              </div>

              <div className="mt-4 flex flex-col gap-2 pointer-events-auto">
                <div className="flex gap-2 w-full pointer-events-auto">
                  <a href="/report.pdf" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-slate-900 border border-cyan-400/60 text-cyan-300 text-[12px] font-mono font-bold tracking-wider rounded-lg uppercase shadow-[0_0_12px_rgba(0,242,254,0.35)] transition-all duration-200 hover:border-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60 hover:shadow-[0_0_22px_rgba(0,242,254,0.65)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Open Report
                    </button>
                  </a>
                  <button
                    onClick={handleReturnToCore}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-[12px] font-mono font-bold tracking-wider rounded-lg uppercase"
                  >
                    ↩ Return To Core
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Default state: Always boot up straight to the Life Longevity Lab Home Page
  return (
      <div className="relative w-screen h-screen bg-[#020617] text-white font-mono overflow-hidden select-none">
        <div className="absolute inset-0 w-full h-full z-0">
          <Canvas camera={{ position: [0, 1.5, 9], fov: 45 }}>
            <ambientLight intensity={2.5} />
            <Suspense fallback={null}>
              <CustomHologramMesh />
            </Suspense>
            <OrbitControls enablePan enableZoom minDistance={2} maxDistance={9} />
            <Grid
              position={[0, -1.8, 0]}
              args={[]}
              cellSize={0.5}
              cellThickness={1}
              cellColor="#1e293b"
              sectionSize={2}
              sectionColor="#334155"
              fadeDistance={25}
            />
          </Canvas>
        </div>

        {/* GROUND ANCHOR CYBER GRID LAYER */}
        <div className="absolute bottom-0 left-0 w-full h-[35vh] pointer-events-none z-0 overflow-hidden border-t border-slate-900/40 bg-gradient-to-t from-[#020617] via-transparent to-transparent">
          <canvas ref={homeGridCanvasRef} className="w-full h-full opacity-80 block" />
        </div>

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
            </header>
          </div>

          <main className="flex justify-between items-start my-auto w-full mt-2">
            {/* Left Operational Box: Upgraded Custom Lab Tracks with Hover Telemetry */}
            <div className="flex flex-col gap-4 w-80 pointer-events-auto bg-slate-950/80 border border-cyan-500/20 p-5 rounded-xl backdrop-blur-md shadow-2xl transition-all">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-950/40 pb-2 mb-1 text-left font-mono">
                // SYSTEM OPERATIONAL MATRIX
              </div>

              {Object.keys(ANALYSIS_VIEWS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleLaunchAnalysis(key)}
                  className="w-full text-left px-4 py-3 bg-slate-900/40 hover:bg-slate-900/90 border border-slate-900 hover:border-cyan-400/60 rounded-xl transition-all duration-200 group active:scale-[0.98] cursor-pointer flex flex-col gap-1 shadow-inner relative overflow-hidden"
                >
                  {/* Subtle Background Glow Vector on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 group-hover:from-cyan-500/5 transition-all duration-300" />

                  {/* Master Track Title Header */}
                  <p className="text-sm font-black text-slate-300 group-hover:text-cyan-400 font-mono tracking-wider transition-colors uppercase">
                    › {ANALYSIS_VIEWS[key].label}
                  </p>

                  {/* Animated Secondary Hover Description Strip */}
                  <p className="text-[10px] font-sans text-slate-500 group-hover:text-slate-300 transition-colors tracking-wide leading-normal font-normal pl-3 border-l border-slate-800 group-hover:border-cyan-500/40 duration-300 whitespace-normal">
                    {ANALYSIS_VIEWS[key].hoverDesc}
                  </p>
                </button>
              ))}

              {/* Upgraded Commercial Entry Point Access Trigger Button */}
              <div className="mt-2 pt-2 border-t border-slate-900">
                <button
                  onClick={() => {
                    setSelectedAnalysis('Membership Portal Sync');
                    setViewState('pricing_matrix');
                  }}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-lg text-[11px] tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
                >
                  ⚡ [ UNLOCK MATRIX MEMBERSHIP ]
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-64 pointer-events-auto bg-slate-950/70 border border-slate-800 p-4 rounded-xl backdrop-blur-md shadow-2xl text-right">
              <button
                type="button"
                onClick={() => setViewState('coach_menu')}
                className="w-full text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-950/40 pb-1 mb-2 text-right hover:text-cyan-300 transition-colors cursor-pointer"
              >
                ASSESSMENT REPORTS
              </button>
              <div className="border-r-2 border-cyan-500 pr-2">
                <div className="text-[12px] font-bold text-slate-300 uppercase tracking-wide">Enter Your Code</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={accessCode}
                  onChange={handleAccessCodeChange}
                  placeholder="····"
                  aria-label="Enter access code"
                  className="mt-0.5 w-3/4 ml-auto bg-slate-900/80 border border-cyan-500/40 rounded-md px-2 py-1 text-2xl font-black text-cyan-400 tracking-[0.35em] text-center outline-none focus:border-cyan-400 placeholder:text-cyan-900 caret-cyan-400"
                />
              </div>
              <div className="border-r-2 border-slate-700 pr-2 mt-1">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Posture Profile</div>
                <div className="text-2xl font-black text-slate-200 tracking-tight mt-0.5">
                  A+<span className="text-[11px] font-normal text-slate-500"> OPTIMAL</span>
                </div>
              </div>
            </div>
          </main>

          <footer className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-900 pt-4 relative z-10 pointer-events-auto">
            <div>DATA CHANNEL: ACTIVE LOCALHOST LINE</div>
            {/* Secure Admin Control Board Portal Pathway Trigger Key */}
            <button
              onClick={() => setViewState('coach_menu')}
              className="text-slate-600 hover:text-cyan-400 font-mono text-xs tracking-widest uppercase transition-all bg-transparent border-0 cursor-pointer"
            >
              ⚙ [SYSTEM ARCHIVE ACCESS]
            </button>
            <div>LENOVO LEGION PRO // RTX 4080 MODE ACTIVE</div>
          </footer>
        </div>
      </div>
  );
}
