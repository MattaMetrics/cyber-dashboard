import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const ANALYSIS_VIEWS = {
  alignment: 'Alignment Analysis',
  posture: 'Posture Analysis',
  mobility: 'Mobility Analysis',
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
    let x = 0, y = 0, z = 0;

    if (segment === 0) { // Spinal Core Alignment
      x = (Math.random() - 0.5) * 0.25;
      y = -1.2 + Math.random() * 2.4;
      z = (Math.random() - 0.5) * 0.15;
    } else if (segment === 1) { // Left Lateral Vectors
      x = -0.1 - Math.random() * 0.75;
      y = -1.4 + Math.random() * 2.2;
      z = (Math.random() - 0.5) * 0.15;
    } else if (segment === 2) { // Right Lateral Vectors
      x = 0.1 + Math.random() * 0.75;
      y = -1.4 + Math.random() * 2.2;
      z = (Math.random() - 0.5) * 0.15;
    } else if (segment === 3) { // Cranial Trackers
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.35;
      x = Math.cos(theta) * r;
      y = 1.1 + Math.random() * 0.5;
      z = Math.sin(theta) * r;
    } else { // Pelvic Ground
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
      const vortexY = yBase + swirlStrength * (0.4 + Math.sin(time * 2.2 + i * 0.015) * 0.35 + Math.min(elapsed, 2.5) * 0.55);
      const vortexZ = Math.sin(angle) * radiusBase * (0.35 + swirlStrength * 0.65);

      const targetX = targets[i * 3];
      const targetY = targets[i * 3 + 1];
      const targetZ = targets[i * 3 + 2];

      positionAttr.setXYZ(
        i,
        THREE.MathUtils.lerp(vortexX, targetX, morphT),
        THREE.MathUtils.lerp(vortexY, targetY, morphT),
        THREE.MathUtils.lerp(vortexZ, targetZ, morphT)
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
      <pointsMaterial size={0.04} color="#00f2fe" transparent opacity={1} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
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
    const meshOpacity = elapsed > MORPH_DURATION ? Math.min(0.9, (elapsed - MORPH_DURATION) / MESH_FADE_DURATION) : 0;
    if (imageMeshRef.current && imageMeshRef.current.material) {
      imageMeshRef.current.material.opacity = meshOpacity;
    }
  });

  return (
    <group>
      <ParticleMorphDust targets={targets} particleCount={PARTICLE_COUNT} startTimeRef={startTimeRef} />
      <mesh ref={imageMeshRef} position={[0, 0.4, 0]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial map={clientTexture} transparent={true} opacity={0} side={THREE.DoubleSide} blending={THREE.NormalBlending} depthWrite={true} />
      </mesh>
    </group>
  );
}

// Your Original Core Crystal Matrix Mesh (Scale 2.5)
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
      <sphereGeometry args={[2.5, 12, 12]} />
      <meshBasicMaterial color="#00f2fe" wireframe={true} transparent opacity={0.65} />
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

  useEffect(() => {
    if (viewState !== 'loading') return;
    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setViewState('dashboard'), 600);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [viewState]);

  const handleLaunchAnalysis = (key) => {
    setSelectedAnalysis(ANALYSIS_VIEWS[key] || 'Biometrics Analysis');
    setBootProgress(0);
    setViewState('loading');
  };

  const handleReturnToCore = () => {
    setViewState('landing');
    setSelectedAnalysis('');
    setBootProgress(0);
  };

  const displayClientName = clientList[currentIdx].replace('/', '').toUpperCase();

  // SYSTEM FRAME A: Home Viewport with Spinning Crystal Mesh Matrix
  if (viewState === 'landing') {
    return (
      <div className="relative w-screen h-screen bg-[#020617] text-white font-mono overflow-hidden select-none">
        <div className="absolute inset-0 w-full h-full z-0">
          <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }}>
            <ambientLight intensity={2.5} />
            <Suspense fallback={null}>
              <CustomHologramMesh />
            </Suspense>
            <OrbitControls enablePan={true} enableZoom={true} minDistance={2} maxDistance={10} />
            <Grid position={[0, -1.8, 0]} args={[]} cellSize={0.5} cellThickness={1} cellColor="#1e293b" sectionSize={2} sectionColor="#334155" fadeDistance={25} />
          </Canvas>
        </div>

        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.85)_100%)]">
          <div className="w-full flex justify-center">
            <header className="flex flex-col items-center text-center border-b border-cyan-500/20 pb-5 bg-slate-950/50 backdrop-blur-md p-6 rounded-lg max-w-4xl w-full relative">
              <h1 className="text-3xl font-black tracking-widest text-cyan-400 animate-pulse">LIFE LONGEVITY BLUEPRINT REPORT</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>STREAMING RAW CORE TELEMETRY</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>CONNECTED
                </span>
              </div>
            </header>
          </div>

          <main className="flex justify-between items-center my-auto w-full mt-2">
            {/* Left Operational Box: Now Houses Your High-Tech Launch Hooks */}
            <div className="flex flex-col gap-2 w-72 pointer-events-auto bg-slate-950/80 border border-cyan-500/20 p-4 rounded-xl backdrop-blur-md shadow-2xl">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-950/40 pb-1 mb-2 text-left">LAUNCH OPERATIONAL MATRIX</div>
              {Object.keys(ANALYSIS_VIEWS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleLaunchAnalysis(key)}
                  className="w-full text-left px-3 py-2.5 bg-slate-900/60 border border-slate-800 hover:border-cyan-400 rounded-lg transition-all duration-200 group active:scale-95"
                >
                  <p className="text-[11px] font-bold text-slate-300 group-hover:text-cyan-400 uppercase tracking-wide">› {ANALYSIS_VIEWS[key]}</p>
                </button>
              ))}
            </div>

            {/* Right Diagnostic Box: Visual Telemetry Anchors */}
            <div className="flex flex-col gap-3 w-64 pointer-events-auto bg-slate-950/70 border border-slate-800 p-4 rounded-xl backdrop-blur-md shadow-2xl text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-900 pb-1 mb-1 text-right">ASSESSMENT REPORTS</div>
              <div className="border-r-2 border-cyan-500 pr-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alignment Score</div>
                <div className="text-xl font-black text-cyan-400 tracking-tight mt-0.5">98.4<span className="text-[10px] font-normal text-slate-500"> % BAL</span></div>
              </div>
              <div className="border-r-2 border-slate-700 pr-2 mt-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Posture Profile</div>
                <div className="text-xl font-black text-slate-200 tracking-tight mt-0.5">A+<span className="text-[10px] font-normal text-slate-500"> OPTIMAL</span></div>
              </div>
            </div>
          </main>

          <footer className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-4">
            <div>DATA CHANNEL: ACTIVE LOCALHOST LINE</div>
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
            <span className="text-[11px] tracking-widest text-cyan-400 uppercase font-bold">SYSTEM CALIBRATION</span>
            <span className="text-[9px] text-slate-500 font-bold">LN_V4.8</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs tracking-wider text-slate-300 mb-2">
                <span className="uppercase">COMPILING {selectedAnalysis}...</span>
                <span className="text-cyan-400 font-bold">{Math.min(bootProgress, 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 border border-cyan-950 rounded-full overflow-hidden p-[2px]">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${Math.min(bootProgress, 100)}%` }} />
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
        <span className="text-xs tracking-[0.25em] text-cyan-400 font-bold uppercase">System Active: Longevity Biometrics</span>
        <span className="text-[10px] tracking-widest text-slate-500 font-mono">ACTIVE LAYERS // {displayClientName}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="w-[480px] h-[580px] bg-slate-950/70 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
              <div>
                <p className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">Biomechanical Target</p>
                <h2 className="text-md font-bold tracking-wider text-slate-200 uppercase">{selectedAnalysis}</h2>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono block text-slate-500 uppercase tracking-widest">Active Matrix</span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">{displayClientName}</span>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#030d1e]/90 border border-cyan-950/60 rounded-xl overflow-hidden relative inner-shadow">
              <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Suspense fallback={null}>
                  <AssessmentMorphScene clientImagePath={clientList[currentIdx]} />
                </Suspense>
                <Grid renderOrder={-1} position={[0, -1.35, 0]} args={[10.5, 10.5]} cellSize={0.25} cellThickness={0.7} cellColor="#082f49" sectionSize={1.25} sectionThickness={1.2} sectionColor="#0e7490" fadeDistance={6} />
                <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 4} />
              </Canvas>
            </div>

            <div className="mt-4 flex flex-col gap-2 pointer-events-auto">
              <div className="flex gap-2 w-full pointer-events-auto">
                <a href="/report.pdf" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 bg-slate-900 border border-cyan-400/60 text-cyan-300 text-[11px] font-mono font-bold tracking-wider rounded-lg uppercase shadow-[0_0_12px_rgba(0,242,254,0.35)] transition-all duration-200 hover:border-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60 hover:shadow-[0_0_22px_rgba(0,242,254,0.65)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Open Report
                  </button>
                </a>
                <button onClick={handleReturnToCore} className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono font-bold tracking-wider rounded-lg uppercase">↩ Return To Core</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
