import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const HOLOGRAM_COLOR = 0x06b6d4;
const BREACH_COLOR = 0xef4444;
const HOLOGRAM_OPACITY = 0.85;
const ROTATION_SPEED_Y = 0.15;
const ROTATION_SPEED_X = 0.05;
/** Fast-velocity spin during secret breach step 1 */
const BREACH_SPIN_MULTIPLIER = 12;
/** Explode scale window inside the 3000ms step-1 timeline */
const BREACH_EXPLODE_START = 2.5;
const BREACH_EXPLODE_END = 3.0;
const BREACH_EXPLODE_SCALE = 5;

/** Original crisp rotating wireframe geometric sphere — landing / home shell */
export function WireframeSphereMesh({ isBreaching = false } = {}) {
  const meshRef = useRef();
  const shellRef = useRef();
  const breachStartRef = useRef(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const speed = isBreaching ? BREACH_SPIN_MULTIPLIER : 1;

    meshRef.current.rotation.y = t * ROTATION_SPEED_Y * speed;
    meshRef.current.rotation.x = t * ROTATION_SPEED_X * speed;
    if (shellRef.current) {
      shellRef.current.rotation.copy(meshRef.current.rotation);
    }

    if (isBreaching) {
      if (breachStartRef.current === null) {
        breachStartRef.current = t;
      }
      const elapsed = t - breachStartRef.current;
      let scale = 1;
      if (elapsed >= BREACH_EXPLODE_START) {
        const progress = Math.min(
          1,
          (elapsed - BREACH_EXPLODE_START) / (BREACH_EXPLODE_END - BREACH_EXPLODE_START)
        );
        // Aggressive ease-in explosion toward camera
        const eased = progress * progress * progress;
        scale = 1 + eased * (BREACH_EXPLODE_SCALE - 1);
      }
      meshRef.current.scale.setScalar(scale);
      if (shellRef.current) shellRef.current.scale.setScalar(scale * 1.02);
    } else {
      breachStartRef.current = null;
      meshRef.current.scale.setScalar(1);
      if (shellRef.current) shellRef.current.scale.setScalar(1.02);
    }
  });

  return (
    <group position={[0, 0.35, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.75, 12, 12]} />
        <meshBasicMaterial
          color={isBreaching ? BREACH_COLOR : HOLOGRAM_COLOR}
          wireframe
          transparent
          opacity={isBreaching ? 1 : HOLOGRAM_OPACITY}
        />
      </mesh>
      {/* Slightly larger twin shell → reads as thicker neon wireframe during breach */}
      {isBreaching && (
        <mesh ref={shellRef} scale={1.02}>
          <sphereGeometry args={[1.75, 12, 12]} />
          <meshBasicMaterial
            color={BREACH_COLOR}
            wireframe
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/** Standing biometric hologram — custom human GLB with safe wireframe materials */
export function StandingHologramMesh({
  position = [0, -1.2, 0],
  scale = 1.4,
} = {}) {
  const groupRef = useRef();
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    let cancelled = false;

    loader.load(
      '/standing_model.glb',
      (gltf) => {
        if (cancelled) return;

        const root = gltf.scene.clone(true);

        root.traverse((child) => {
          if (child.isMesh) {
            // Safe material override that preserves spatial geometry
            child.material = new THREE.MeshBasicMaterial({
              color: 0x06b6d4,
              wireframe: true,
              transparent: true,
              opacity: 0.45,
            });
          }
        });

        // Center and stand upright right on the floor grid plane
        root.position.set(0, 0, 0);
        root.scale.set(1, 1, 1);
        setModel(root);
      },
      undefined,
      (error) => {
        console.error('Matrix Telemetry Load Error:', error);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Global Y-axis rotational animation
    groupRef.current.rotation.y = state.clock.getElapsedTime() * ROTATION_SPEED_Y;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {model ? <primitive object={model} /> : null}
    </group>
  );
}

/**
 * Switches active mesh by view:
 * - landing / default → geometric wireframe sphere
 * - client_profile → standing_model.glb hologram
 */
export function CustomHologramMesh({
  viewState = 'landing',
  currentView,
  isBreaching = false,
}) {
  const view = currentView || viewState;

  if (view === 'client_profile') {
    return <StandingHologramMesh />;
  }

  return <WireframeSphereMesh isBreaching={isBreaching} />;
}

export default function CenterSphere({
  viewState = 'landing',
  currentView,
  isBreaching = false,
}) {
  const view = currentView || viewState;

  return (
    <div className={`absolute inset-0 w-full h-full z-0 ${isBreaching ? 'bg-black' : ''}`}>
      <Canvas camera={{ position: [0, 1.5, 9], fov: 45 }}>
        {isBreaching && <color attach="background" args={['#000000']} />}
        <ambientLight intensity={isBreaching ? 3.5 : 2.5} />
        {isBreaching && <pointLight position={[0, 2, 5]} intensity={12} color="#ef4444" />}
        <Suspense fallback={null}>
          <CustomHologramMesh viewState={view} isBreaching={isBreaching} />
        </Suspense>
        {!isBreaching && (
          <OrbitControls enablePan enableZoom minDistance={2} maxDistance={9} />
        )}
      </Canvas>
    </div>
  );
}
