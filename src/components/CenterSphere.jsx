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

/** Standing biometric hologram — client_profile close-up bust crop */
export function StandingHologramMesh({ yOffset = -2.7 } = {}) {
  const groupRef = useRef();
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    let cancelled = false;

    loader.load(
      '/standing_model.glb',
      (gltf) => {
        if (cancelled) return;

        const root = gltf.scene;

        root.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: HOLOGRAM_COLOR,
              wireframe: true,
              transparent: true,
              opacity: HOLOGRAM_OPACITY,
            });
          }
        });

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        // Aggressive bust scale — ~12% larger so head anchors near upper console border
        const targetHeight = 2.85 * 2.8;
        const scaleFactor = targetHeight / maxDim;
        root.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Drop legs & lower torso below the card clip; keep bust in upper-center frame
        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.x = -center.x;
        root.position.z = -center.z;
        root.position.y = -center.y + yOffset;

        setModel(root);
      },
      undefined,
      (error) => console.error('CenterSphere // standing_model.glb load failure:', error)
    );

    return () => {
      cancelled = true;
    };
  }, [yOffset]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * ROTATION_SPEED_Y;
  });

  return <group ref={groupRef}>{model ? <primitive object={model} /> : null}</group>;
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
