import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useTexture } from '@react-three/drei';
import * as THREE from 'three';

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
    let x = 0;
    let y = 0;
    let z = 0;

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
        swirlStrength * (0.4 + Math.sin(time * 2.2 + i * 0.015) * 0.35 + Math.min(elapsed, 2.5) * 0.55);
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

export function AssessmentMorphScene({ clientImagePath }) {
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

useTexture.preload('/client1.png');
useTexture.preload('/client2.png');
useTexture.preload('/client3.png');
