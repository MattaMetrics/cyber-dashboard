import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  ClipboardList,
  FileText,
  CheckSquare,
} from 'lucide-react';
import BlueprintAssessments from './BlueprintAssessments';

// Secure Coach Client Matrix Database (Upgraded with Registration Dates & Matrix Tiers)
const CLIENT_DATABASE = {
  '1111': {
    name: 'Alex Rivera',
    birthdate: '04/12/1992',
    email: 'alex.rivera@kineticmail.com',
    phone: '(555) 234-5678',
    avatar: '/client1.png',
    archetype: 'Acrobatics & Hand Balance',
    joinedDate: '07/14/2026',
    matrixTier: 'Tensegrity Tier', // Full Body Blueprint
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
    matrixTier: 'Infinite Matrix Tier', // Ongoing Elite Coaching
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
    matrixTier: 'Vector Tier', // Single Assessment
    desc: 'Exceptional static active flexibility profiles. Displays minor structural instability vectors under rapid dynamic loading cycles.',
    notes:
      'Incorporate low-volume explosive neuromuscular landing mechanics to supplement high-tier static elasticity matrices.',
    metrics: { squat: '96/100', land: '82/100', cmj: '74/100', agility: '85/100' },
  },
};

const ANALYSIS_VIEWS = {
  mobility: 'Mobility Analysis',
  alignment: 'Alignment Analysis',
  posture: 'Posture Analysis',
  athlete: 'Athlete Analysis',
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

export default function App() {
  const clientList = ['/client1.png', '/client2.png', '/client3.png'];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewState, setViewState] = useState('landing');
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [bootProgress, setBootProgress] = useState(0);
  const [accessCode, setAccessCode] = useState('');

  // LIVE DATABASE & SYSTEM ROUTERS
  const [localDatabase, setLocalDatabase] = useState(CLIENT_DATABASE);
  const [activeClientProfile, setActiveClientProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Large Text Form States
  const [editNotes, setEditNotes] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMetrics, setEditMetrics] = useState({ squat: '', land: '', cmj: '', agility: '' });

  // NEW: Identity & Tier Editing States
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

  // Triggered when client logs in with their pin code
  const handleAccessCodeChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setAccessCode(digits);

    if (digits.length === 4) {
      if (localDatabase[digits]) {
        const client = localDatabase[digits];
        setActiveClientProfile(client);
        setEditNotes(client.notes);
        setEditDesc(client.desc);
        setEditMetrics({ ...client.metrics });

        // Load incoming values into form states cleanly
        setEditBirthdate(client.birthdate);
        setEditEmail(client.email);
        setEditPhone(client.phone);
        setEditTier(client.matrixTier || 'Vector Tier');

        setSelectedAnalysis('Client Telemetry Portfolio');
        setBootProgress(0);
        setViewState('loading');
      } else {
        alert('ACCESS CODE UNRESOLVED // SECURE ENTRY VIOLATION');
        setAccessCode('');
      }
    }
  };

  // Direct row click navigation from your Admin Dashboard Menu
  const handleSelectClientFromMenu = (code) => {
    const client = localDatabase[code];
    setAccessCode(code);
    setActiveClientProfile(client);
    setEditNotes(client.notes);
    setEditDesc(client.desc);
    setEditMetrics({ ...client.metrics });

    // Load incoming values into form states cleanly
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

  useEffect(() => {
    if (viewState !== 'loading') return;
    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (activeClientProfile) {
              setViewState('client_profile');
            } else {
              setViewState('dashboard');
            }
          }, 600);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [viewState, activeClientProfile]);

  // Updated Safe Navigation Escape Route
  const handleReturnToCore = () => {
    // If you came into a profile from the Coach Menu, exit back to Coach Menu!
    if (viewState === 'client_profile' && accessCode) {
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

  const handleLaunchAnalysis = (key) => {
    if (key === 'mobility') {
      setSelectedAnalysis(ANALYSIS_VIEWS.mobility);
      setViewState('mobility');
      return;
    }
    setActiveClientProfile(null);
    setSelectedAnalysis(ANALYSIS_VIEWS[key] || 'Biometrics Analysis');
    setBootProgress(0);
    setViewState('loading');
  };

  useEffect(() => {
    if (viewState !== 'mobility' && viewState !== 'client_profile' && viewState !== 'coach_menu') return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (activeFocusField) {
        setActiveFocusField(null);
        return;
      }
      handleReturnToCore();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewState, activeFocusField]);

  const displayClientName = clientList[currentIdx].replace('/', '').toUpperCase();

  // SYSTEM FRAME D: Premium Biometric Client Profile Portal Hub
  if (viewState === 'client_profile' && activeClientProfile) {
    return (
      <div className="w-screen min-h-screen bg-[#020617] text-white font-mono p-4 md:p-8 flex items-center justify-center overflow-y-auto select-none relative">
        {/* Main Strategic Card Panel Framework */}
        <div className="w-full max-w-5xl bg-slate-950/80 border border-cyan-500/20 rounded-2xl backdrop-blur-xl p-6 md:p-8 shadow-2xl relative z-0">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-900 pb-5 mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-widest uppercase mb-1">
                <Shield className="w-3.5 h-3.5" /> SECURE DATA PORTAL MATRIX // OVERVIEW
              </div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">
                {activeClientProfile.name}
              </h2>
            </div>
            <button
              onClick={handleReturnToCore}
              className="px-4 py-2 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white text-xs bg-slate-900/60 font-bold tracking-wider transition-all uppercase cursor-pointer active:scale-95 shrink-0"
            >
              ← [ESC] Exit Profile Terminal
            </button>
          </div>

          {/* Grid Separation Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Demographics, Core Identity & Tier Modifiers */}
            <div className="space-y-4">
              <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl flex flex-col items-center text-center">
                {/* Profile Placeholder Graphic Circle */}
                <div className="w-24 h-24 rounded-full bg-slate-950 border border-cyan-500/20 flex items-center justify-center shadow-lg mb-4 text-cyan-400 relative overflow-hidden group">
                  <User className="w-10 h-10 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-cyan-400/5 mix-blend-overlay" />
                </div>

                <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-0.5 bg-slate-950 rounded-full border border-slate-800 mb-3">
                  {activeClientProfile.archetype}
                </div>

                {/* Matrix Tier Dropdown Selector (Active inside Modify Mode) */}
                <div className="w-full mt-1 border-t border-slate-900/60 pt-3 text-center">
                  <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider mb-1">
                    CURRENT MATRIX SUBSCRIPTION
                  </span>
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
                    <span
                      className={`text-sm font-black tracking-wide uppercase font-mono block mt-0.5
                      ${activeClientProfile.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]' : ''}
                      ${activeClientProfile.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                      ${activeClientProfile.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                    `}
                    >
                      {activeClientProfile.matrixTier || 'Vector Tier'}
                    </span>
                  )}
                </div>
              </div>

              {/* Secure Digital Contact Cards with Form Field Inputs */}
              <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 text-xs font-medium text-slate-300">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-950 pb-1.5">
                  // IDENTITY SPECIFICATIONS
                </div>

                {/* Date of Birth Field Row */}
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
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm font-mono outline-none shadow-inner"
                      placeholder="MM/DD/YYYY"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.birthdate}</div>
                  )}
                </div>

                {/* Email Contact Field Row */}
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
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm font-mono outline-none truncate shadow-inner"
                      placeholder="name@email.com"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 pl-5 truncate max-w-full">
                      {activeClientProfile.email}
                    </div>
                  )}
                </div>

                {/* Phone Contact Field Row */}
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
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm font-mono outline-none shadow-inner"
                      placeholder="(555) 000-0000"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.phone}</div>
                  )}
                </div>

                {/* Embedded Access PIN Passcode Row */}
                <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-slate-400">
                  <span className="font-bold text-[10px] tracking-wider text-slate-500 uppercase">SYS_ACCESS_PIN:</span>
                  <span className="text-sm font-black text-cyan-400 tracking-widest font-mono bg-slate-950 px-2 py-0.5 border border-slate-900 rounded">
                    {accessCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Column: Architectural Movement Notes & Data Descriptions */}
            <div className="space-y-4 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-4">
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
                        ⛶ CLICK TO EXPAND WRITING PAD
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-4">
                    {isEditMode
                      ? editDesc || 'No narrative entered yet. Expand window to write...'
                      : activeClientProfile.desc}
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
                        ⛶ CLICK TO EXPAND WRITING PAD
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-4">
                    {isEditMode
                      ? editNotes || 'No directives logged yet. Expand window to write...'
                      : activeClientProfile.notes}
                  </p>
                </div>
              </div>

              {/* Bottom Row Parameter Tracker Readouts / Input Editors */}
              <div className="pt-5 border-t border-slate-900 mt-5">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <span>// VERIFIED CALIBRATION RATINGS</span>

                  {/* Comprehensive Coach Utilities Matrix */}
                  <div className="flex flex-wrap gap-2">
                    {/* Real Functional Data Export Engine */}
                    <button
                      onClick={async () => {
                        // 1. Gather all active client variables from memory
                        const reportText = `==================================================
LONGEVITY BLUEPRINT OBJECTIVE BIOMETRIC REPORT
==================================================
ATHLETE DOSSIER: ${activeClientProfile.name.toUpperCase()}
ARCHETYPE:       ${activeClientProfile.archetype.toUpperCase()}
PASSCODE KEY:    [ ${accessCode} ]
RECORDED DOB:    ${activeClientProfile.birthdate}
CONTACT LINE:    ${activeClientProfile.email}
--------------------------------------------------

[1] BIOMECHANICAL ARCHETYPE VECTOR LOG:
${editDesc}

[2] KINETIC DIRECTIVES & CASE COACH NOTES:
${editNotes}

--------------------------------------------------
[3] VERIFIED METRIC CALIBRATION RATINGS:
- Deep Squat Mobility Matrix:    ${editMetrics.squat}
- Single-Leg Land Stability:     ${editMetrics.land}
- Kinetic Power Extension (CMJ): ${editMetrics.cmj}
- Multi-Plane Deceleration (505): ${editMetrics.agility}

==================================================
SECURE BLUEPRINT GENERATION // SYSTEMS ENGINE v4.8
==================================================`;

                        const fileName = `${activeClientProfile.name.replace(/\s+/g, '_')}_Biometric_Blueprint.txt`;

                        try {
                          // 2. Save directly to Desktop\Temp Client Blueprints via local Vite export API
                          const response = await fetch('/api/export-blueprint', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileName, content: reportText }),
                          });
                          const result = await response.json();
                          if (!response.ok || !result.ok) {
                            throw new Error(result.error || 'Export failed');
                          }
                          alert(`✓ BLUEPRINT SECURED // SAVED TO:\n${result.path}`);
                        } catch (error) {
                          alert(`EXPORT ENGINE FAULT // ${error.message}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-950 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      📥 Export Data
                    </button>

                    <button
                      onClick={handleChangeClientCode}
                      className="px-3 py-1.5 bg-slate-950 text-indigo-400 border border-indigo-500/40 hover:border-indigo-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      🔑 Change Code
                    </button>

                    <button
                      onClick={() => (isEditMode ? handleSaveProfileChanges() : setIsEditMode(true))}
                      className={`px-3 py-1.5 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer active:scale-95
                        ${
                          isEditMode
                            ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-950 text-cyan-400 border border-cyan-400/40 hover:border-cyan-400'
                        }
                      `}
                    >
                      {isEditMode ? '✓ Save Changes' : '⚙ Modify Record'}
                    </button>

                    <button
                      onClick={handleDeleteClientRecord}
                      className="px-3 py-1.5 bg-slate-950/40 text-rose-500 border border-rose-900/50 hover:border-rose-500 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      🗑️ Delete Client
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  {Object.entries(editMetrics).map(([key, value], index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center"
                    >
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
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
                          className="w-20 bg-slate-900 border border-cyan-500/30 rounded px-2 py-1 text-center text-base font-black text-cyan-400 tracking-tight outline-none focus:border-cyan-400"
                          placeholder="00/100"
                        />
                      ) : (
                        <div className="text-xl md:text-2xl font-black text-cyan-400 tracking-tight">{value}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* High-Art Secure Document Status Footer Bar */}
          <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>OFFICIAL BIOMETRIC BLUEPRINT SECURED // VALID ACCESS PATH</span>
            </div>
            <div>STATION RECOVERY ENGINE: v4.8_STABLE</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC FULL-SIZE FOCUS WRITING PAD OVERLAY */}
        {/* ========================================================================= */}
        {activeFocusField && (
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">
            <div
              className={`w-full max-w-5xl h-[90vh] bg-slate-950 border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300
              ${activeFocusField === 'desc' ? 'border-cyan-500/40 shadow-cyan-950/20' : 'border-indigo-500/40 shadow-indigo-950/20'}
            `}
            >
              <div>
                {/* Modal Title Row */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase block">
                      // HIGH-CAPACITY TEXT FOCUS WRITER
                    </span>
                    <h3
                      className={`text-lg font-black tracking-wider uppercase mt-0.5
                      ${activeFocusField === 'desc' ? 'text-cyan-400' : 'text-indigo-400'}
                    `}
                    >
                      {activeFocusField === 'desc'
                        ? 'Biomechanical Archetype Editor'
                        : 'Kinetic Directives Case Logger'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveFocusField(null)}
                    className="px-3.5 py-1.5 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 hover:text-white text-xs bg-slate-900 transition-all font-bold tracking-widest uppercase cursor-pointer active:scale-95"
                  >
                    ✕ Close Pad [ESC]
                  </button>
                </div>

                {/* Giant Full-Screen Text Field Form */}
                <textarea
                  autoFocus
                  value={activeFocusField === 'desc' ? editDesc : editNotes}
                  onChange={(e) =>
                    activeFocusField === 'desc' ? setEditDesc(e.target.value) : setEditNotes(e.target.value)
                  }
                  placeholder="Initiate diagnostic narrative entry..."
                  className={`w-full h-[62vh] bg-[#030712] border border-slate-900 rounded-xl p-6 text-base md:text-lg text-slate-200 font-sans leading-relaxed tracking-wide focus:outline-none resize-none shadow-inner
                    ${activeFocusField === 'desc' ? 'focus:border-cyan-500/60' : 'focus:border-indigo-500/60'}
                  `}
                />
              </div>

              {/* Modal Save/Confirmation Action Footer */}
              <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
                <div className="text-[11px] text-slate-600 tracking-wider font-mono">
                  MATRIX CELL: {activeFocusField.toUpperCase()}_LOG_BUFFER
                </div>
                <button
                  onClick={() => setActiveFocusField(null)}
                  className={`px-5 py-2.5 rounded-lg text-slate-950 font-bold font-mono text-xs tracking-widest uppercase transition-all shadow-md active:scale-95 cursor-pointer
                    ${
                      activeFocusField === 'desc'
                        ? 'bg-cyan-400 hover:bg-cyan-300 border border-cyan-300 shadow-cyan-950/20'
                        : 'bg-indigo-400 hover:bg-indigo-300 border border-indigo-300 shadow-indigo-950/20'
                    }
                  `}
                >
                  ✓ Lock Entry text & Minimize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SYSTEM FRAME E: Master Coach Roster & Onboarding Console Menu
  if (viewState === 'coach_menu') {
    return (
      <div className="w-screen min-h-screen bg-[#01040a] text-white font-mono p-4 md:p-8 flex flex-col items-center justify-start overflow-y-auto select-none">
        <div className="w-full max-w-5xl bg-slate-950 border border-cyan-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 relative backdrop-blur-xl">
          {/* Dashboard Control Banner Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-widest uppercase mb-1">
                <Shield className="w-4 h-4" /> MASTER SYSTEMS MANAGEMENT // CONTROL TERMINAL
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight uppercase">
                Coach Intelligence Dashboard
              </h2>
            </div>
            <button
              onClick={handleReturnToCore}
              className="px-4 py-2.5 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white text-xs bg-slate-900/60 font-bold tracking-wider transition-all uppercase cursor-pointer active:scale-95"
            >
              ← [ESC] Exit Admin Panel
            </button>
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

                    {/* New Matrix Tier & Enrollment Column Blocks */}
                    <div className="flex items-center gap-6 text-right font-mono shrink-0 ml-4">
                      <div className="hidden sm:block">
                        <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">
                          ENROLLED
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {client.joinedDate || 'PENDING'}
                        </span>
                      </div>
                      <div className="min-w-[120px]">
                        <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">
                          MATRIX LEVEL
                        </span>
                        <span
                          className={`text-xs font-black tracking-wide uppercase
                          ${client.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]' : ''}
                          ${client.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                          ${client.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                        `}
                        >
                          {client.matrixTier || 'Vector Tier'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME: Mobility page containing longevity blueprint selections
  if (viewState === 'mobility') {
    return (
      <div className="w-screen min-h-screen bg-black text-white font-mono overflow-y-auto p-6 md:p-12 relative flex items-center justify-center">
        <div className="absolute top-6 left-6 z-10 pointer-events-auto flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs tracking-widest text-slate-500 uppercase">SYS_STATUS // STABILITY_SECURE</span>
          </div>
          <button
            onClick={handleReturnToCore}
            className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white text-xs bg-slate-950/80 transition-all uppercase tracking-wider shadow-lg cursor-pointer active:scale-95"
          >
            Exit Matrix [Home]
          </button>
        </div>

        <div className="w-full max-w-5xl mt-16 md:mt-0 relative z-0">
          <BlueprintAssessments />
        </div>
      </div>
    );
  }

  // SYSTEM FRAME A: Home Viewport with Spinning Crystal Mesh Matrix
  if (viewState === 'landing') {
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
            <div className="flex flex-col gap-4 w-72 pointer-events-auto bg-slate-950/80 border border-cyan-500/20 p-4 rounded-xl backdrop-blur-md shadow-2xl">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-950/40 pb-1 mb-2 text-left">
                LAUNCH OPERATIONAL MATRIX
              </div>
              {Object.keys(ANALYSIS_VIEWS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleLaunchAnalysis(key)}
                  className="w-full text-left px-3 py-2.5 bg-slate-900/60 border border-slate-800 hover:border-cyan-400 rounded-lg transition-all duration-200 group active:scale-95"
                >
                  <p className="text-[12px] font-bold text-slate-300 group-hover:text-cyan-400 uppercase tracking-wide">
                    › {ANALYSIS_VIEWS[key]}
                  </p>
                </button>
              ))}
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
  return (
    <div className="w-full h-screen bg-[#020813] text-white flex flex-col font-sans select-none overflow-hidden">
      <div className="border-b border-cyan-900/40 bg-slate-950/80 px-6 py-3 flex items-center justify-between backdrop-blur-md">
        <span className="text-sm tracking-[0.25em] text-cyan-400 font-bold uppercase">
          System Active: Longevity Biometrics
        </span>
        <span className="text-[11px] tracking-widest text-slate-500 font-mono">
          ACTIVE LAYERS // {displayClientName}
        </span>
      </div>

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
