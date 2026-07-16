import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const ANALYSIS_VIEWS = {
  alignment: 'Alignment Analysis',
  posture: 'Posture Analysis',
  mobility: 'Mobility Analysis',
  athlete: 'Athlete Analysis',
};

const MODEL_PATH = '/models/athletic.glb';
const MORPH_DURATION = 3.5;
const MESH_FADE_DURATION = 1.0;
const PARTICLE_COUNT = 10000;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function prepareAthleticModel(scene) {
  const model = scene.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = 2.4 / Math.max(size.x, size.y, size.z);

  model.position.set(-center.x * scale, -center.y * scale + 1.0, -center.z * scale);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  model.traverse((child) => {
    if (child.isSkinnedMesh) {
      child.skeleton.pose();
    }
  });

  return model;
}

function sampleVertexTargets(model, count) {
  const candidates = [];
  const vertex = new THREE.Vector3();

  model.traverse((child) => {
    if (!(child.isMesh || child.isSkinnedMesh) || !child.geometry?.attributes?.position) {
      return;
    }

    const positions = child.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      if (child.isSkinnedMesh) {
        child.applyBoneTransform(i, vertex);
      }
      vertex.applyMatrix4(child.matrixWorld);
      candidates.push(vertex.x, vertex.y, vertex.z);
    }
  });

  const targets = new Float32Array(count * 3);
  if (candidates.length === 0) {
    return targets;
  }

  const vertexTotal = candidates.length / 3;
  for (let i = 0; i < count; i++) {
    const sourceIndex = Math.floor((i / count) * vertexTotal) % vertexTotal;
    targets[i * 3] = candidates[sourceIndex * 3];
    targets[i * 3 + 1] = candidates[sourceIndex * 3 + 1];
    targets[i * 3 + 2] = candidates[sourceIndex * 3 + 2];
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
        swirlStrength * (0.4 + Math.sin(time * 2.2 + i * 0.015) * 0.35 + Math.min(elapsed, 2.5) * 0.55);
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

function AssessmentMorphScene() {
  const { scene, animations } = useGLTF(MODEL_PATH);
  const startTimeRef = useRef(null);
  const mixerRef = useRef();

  const prepared = useMemo(() => {
    const model = prepareAthleticModel(scene);
    const targets = sampleVertexTargets(model, PARTICLE_COUNT);

    const wireframe = cloneSkinned(model);
    wireframe.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x00f2fe,
          wireframe: true,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
      }
    });

    model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x0a1628,
          emissive: 0x004466,
          emissiveIntensity: 0.5,
          metalness: 0.65,
          roughness: 0.3,
          transparent: true,
          opacity: 0,
        });
      }
    });

    return { model, wireframe, targets };
  }, [scene]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(prepared.model);
    if (animations.length > 0) {
      const action = mixer.clipAction(animations[0]);
      action.setLoop(THREE.LoopRepeat);
      action.play();
    }
    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
    };
  }, [prepared.model, animations]);

  useFrame((state, delta) => {
    mixerRef.current?.update(delta);

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const meshOpacity =
      elapsed > MORPH_DURATION ? Math.min(1, (elapsed - MORPH_DURATION) / MESH_FADE_DURATION) : 0;

    prepared.model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = meshOpacity * 0.85;
      }
    });

    prepared.wireframe.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = meshOpacity * 0.7;
      }
    });
  });

  return (
    <group>
      <ParticleMorphDust
        targets={prepared.targets}
        particleCount={PARTICLE_COUNT}
        startTimeRef={startTimeRef}
      />
      <primitive object={prepared.model} />
      <primitive object={prepared.wireframe} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

function CustomHologramMesh({ size = 2.5 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color="#00f2fe" wireframe={true} transparent opacity={0.65} />
    </mesh>
  );
}

function HeaderHologramGem() {
  return (
    <div className="h-14 w-14 shrink-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 2.2], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={2.5} />
        <CustomHologramMesh size={0.55} />
      </Canvas>
    </div>
  );
}

function AnalysisSubView({ title, viewKey, onReturn }) {
  return (
    <div className="relative flex-1 min-h-0 h-full pointer-events-auto overflow-hidden rounded-xl border border-cyan-500/20 shadow-[inset_0_0_60px_rgba(0,242,254,0.04)]">
      <button
        type="button"
        onClick={onReturn}
        className="absolute top-4 left-4 z-30 px-6 py-2.5 border border-cyan-500/50 bg-slate-950/90 backdrop-blur-md text-cyan-400 font-bold uppercase tracking-widest text-xs rounded-lg cursor-pointer transition-all hover:bg-cyan-500/25 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:scale-105 active:scale-95 pointer-events-auto"
      >
        ← RETURN TO CORE DASHBOARD
      </button>

      <h2 className="absolute top-4 left-1/2 -translate-x-1/2 z-30 text-sm md:text-base font-black tracking-widest text-cyan-400/80 pointer-events-none">
        {title}
      </h2>

      <Canvas
        key={viewKey}
        className="!absolute inset-0"
        camera={{ position: [0, 1.2, 4.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.55} />
        <pointLight position={[3, 4, 2]} intensity={1.4} color="#00f2fe" />
        <pointLight position={[-3, 2, -2]} intensity={0.6} color="#0ea5e9" />

        <Suspense fallback={null}>
          <AssessmentMorphScene />
        </Suspense>

        <OrbitControls enablePan enableZoom minDistance={2.5} maxDistance={11} target={[0, 0.9, 0]} />
        <Grid
          position={[0, -0.05, 0]}
          args={[24, 24]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1e293b"
          sectionSize={2}
          sectionColor="#0891b2"
          sectionThickness={1}
          fadeDistance={22}
        />
      </Canvas>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-white font-mono overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.85)_100%)]">
        <div className="w-full flex justify-center">
          <header className="flex items-center justify-center gap-5 border-b border-cyan-500/20 pb-5 bg-slate-950/50 backdrop-blur-md p-6 rounded-lg max-w-4xl w-full relative">
            <HeaderHologramGem />
            <div className="flex flex-col items-center text-center">
              <h1 className="text-3xl font-black tracking-widest text-cyan-400 animate-pulse">
                LIFE LONGEVITY BLUEPRINT REPORT
              </h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>STATUS: STREAMING RAW CORE TELEMETRY</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  CORE CONNECTED
                </span>
              </div>
            </div>
            <HeaderHologramGem />
          </header>
        </div>

        <main className="flex justify-between items-stretch my-auto w-full mt-2 min-h-[420px]">
          <div className="flex flex-col gap-3 w-64 pointer-events-auto bg-slate-950/70 border border-slate-800 p-4 rounded-xl backdrop-blur-md shadow-2xl text-left self-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-900 pb-1 mb-1 text-left">
              PRIMARY CORE INDEX
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('alignment')}
              className="border-l-2 border-cyan-500 pl-2 p-2 rounded-r-lg pointer-events-auto cursor-pointer transition-all hover:bg-slate-900/80 hover:border-cyan-500/50 text-left w-full"
            >
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alignment Analysis</div>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-0.5">
                98.4<span className="text-[10px] font-normal text-slate-500"> % BAL</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('posture')}
              className="border-l-2 border-slate-700 pl-2 p-2 rounded-r-lg mt-1 pointer-events-auto cursor-pointer transition-all hover:bg-slate-900/80 hover:border-cyan-500/50 text-left w-full"
            >
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Posture Analysis</div>
              <div className="text-xl font-black text-slate-200 tracking-tight mt-0.5">
                A+<span className="text-[10px] font-normal text-slate-500"> OPTIMAL</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('mobility')}
              className="border-l-2 border-slate-700 pl-2 p-2 rounded-r-lg mt-1 pointer-events-auto cursor-pointer transition-all hover:bg-slate-900/80 hover:border-cyan-500/50 text-left w-full"
            >
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobility Analysis</div>
              <div className="text-xl font-black text-slate-200 tracking-tight mt-0.5">
                92.6<span className="text-[10px] font-normal text-slate-500"> EFF</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('athlete')}
              className="border-l-2 border-emerald-500 pl-2 p-2 rounded-r-lg mt-1 pointer-events-auto cursor-pointer transition-all hover:bg-slate-900/80 hover:border-cyan-500/50 text-left w-full"
            >
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Athlete Analysis</div>
              <div className="text-sm font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block mt-1 tracking-wider">
                MATCH VERIFIED
              </div>
            </button>
          </div>

          {currentView === 'dashboard' ? (
            <div className="flex-1" />
          ) : (
            <AnalysisSubView
              key={currentView}
              viewKey={currentView}
              title={ANALYSIS_VIEWS[currentView]}
              onReturn={() => setCurrentView('dashboard')}
            />
          )}

          <div
            className={`flex flex-col gap-3 w-64 pointer-events-auto bg-slate-950/70 border border-slate-800 p-4 rounded-xl backdrop-blur-md shadow-2xl text-right self-center transition-opacity duration-500 ${currentView === 'dashboard' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-900 pb-1 mb-1 text-right">
              METRIC DIAGNOSTICS
            </div>

            <div className="border-r-2 border-cyan-500 pr-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alignment Score</div>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-0.5">
                98.4<span className="text-[10px] font-normal text-slate-500"> % BAL</span>
              </div>
            </div>

            <div className="border-r-2 border-slate-700 pr-2 mt-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Posture Profile</div>
              <div className="text-xl font-black text-slate-200 tracking-tight mt-0.5">
                A+<span className="text-[10px] font-normal text-slate-500"> OPTIMAL</span>
              </div>
            </div>

            <div className="border-r-2 border-slate-700 pr-2 mt-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobility Matrix</div>
              <div className="text-xl font-black text-slate-200 tracking-tight mt-0.5">
                92.6<span className="text-[10px] font-normal text-slate-500"> EFF</span>
              </div>
            </div>

            <div className="border-r-2 border-emerald-500 pr-2 mt-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Athletics Index</div>
              <div className="text-sm font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block mt-1 tracking-wider">
                MATCH VERIFIED
              </div>
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
