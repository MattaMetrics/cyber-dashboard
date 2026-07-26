import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Interactive 3D point-cloud human (matta.glb) — slow cinematic Y-axis rotation.
 */
function ParticleHumanCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.2, 3.6);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const cyanLight = new THREE.PointLight(0x06b6d4, 3.2, 20);
    cyanLight.position.set(2.4, 3.2, 2.2);
    scene.add(cyanLight);
    const indigoLight = new THREE.PointLight(0x6366f1, 2, 20);
    indigoLight.position.set(-2.4, 1.4, -2);
    scene.add(indigoLight);

    let modelRoot = null;
    const loader = new GLTFLoader();

    const fitRenderer = () => {
      const parent = canvasRef.current?.parentElement;
      if (!parent || !canvasRef.current) return;
      const width = parent.clientWidth || window.innerWidth;
      const height = parent.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    loader.load(
      '/matta.glb',
      (gltf) => {
        const source = gltf.scene;
        const root = new THREE.Group();

        const box = new THREE.Box3().setFromObject(source);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scaleFactor = 2.35 / maxDim;
        source.scale.setScalar(scaleFactor);

        const center = box.getCenter(new THREE.Vector3());
        source.position.x = -center.x * scaleFactor;
        source.position.y = -box.min.y * scaleFactor - 0.2;
        source.position.z = -center.z * scaleFactor;

        source.traverse((child) => {
          if (!child.isMesh || !child.geometry) return;

          child.material = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            wireframe: true,
            transparent: true,
            opacity: 0.42,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          const positions = child.geometry.attributes.position;
          if (positions) {
            const count = positions.count;
            const stride = Math.max(1, Math.floor(count / 5200));
            const cloud = [];
            for (let i = 0; i < count; i += stride) {
              cloud.push(positions.getX(i), positions.getY(i), positions.getZ(i));
            }
            const cloudGeo = new THREE.BufferGeometry();
            cloudGeo.setAttribute('position', new THREE.Float32BufferAttribute(cloud, 3));
            const cloudMat = new THREE.PointsMaterial({
              color: 0x67e8f9,
              size: 0.02,
              transparent: true,
              opacity: 0.85,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              sizeAttenuation: true,
            });
            child.add(new THREE.Points(cloudGeo, cloudMat));
          }
        });

        root.add(source);
        scene.add(root);
        modelRoot = root;
        fitRenderer();
      },
      undefined,
      (error) => console.error('MoreInfoHub // matta.glb load failure:', error)
    );

    fitRenderer();

    const clock = new THREE.Clock();
    let frameId = 0;

    const renderLoop = () => {
      const t = clock.getElapsedTime();
      if (modelRoot) {
        // Gentle continuous Y-axis spin + soft float
        modelRoot.rotation.y = t * 0.22;
        modelRoot.position.y = Math.sin(t * 0.4) * 0.05;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    window.addEventListener('resize', fitRenderer);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', fitRenderer);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" />;
}

const INFO_COLUMNS = [
  {
    title: '// 01 // KINETIC SEQUENCING',
    accent: 'text-cyan-400',
    body: [
      'High-velocity biometric capture tracks 300+ structural metrics per second—joint angles, force vectors, and multi-plane symmetry mapped in real time.',
      'That density of data exposes root mechanical compensation leaks before they calcify into chronic restriction. Instead of guessing which link in the chain is failing, you see the exact sequencing break that steals power, stability, and recovery bandwidth.',
      'Kinetic sequencing converts raw movement into a calibrated blueprint: where force should travel, where it currently leaks, and how to restore efficient pathways across the entire kinetic chain.',
    ],
  },
  {
    title: '// 02 // THE TENSEGRITY MATRIX',
    accent: 'text-indigo-400',
    body: [
      'Your body is not a stack of isolated joints—it is a tensegrity system. Pulling and compressing forces redistribute continuously across the global fascial web.',
      'Chasing a local symptom fails because the complaint is often only the loudest node in a wider tension pattern. Relieve one hotspot and the load simply migrates elsewhere unless the full matrix is rebalanced.',
      'The Tensegrity Matrix lens maps how distant restrictions and overactive stabilizers conspire under real-world movement stress—so corrections target the architecture, not just the complaint.',
    ],
  },
  {
    title: '// 03 // CLINICAL PREVENTATIVE ASSETS',
    accent: 'text-emerald-400',
    body: [
      'Youth athletes adapt fastest during growth spurts—and those same windows lock in injury risk if imbalances go unchecked. Preventative screening builds a structural safety shield before patterns calcify.',
      'Corporate environments create a different threat vector: high-throughput desk compression that drains spinal resilience, focus, and late-day output. On-site decompression protocols reverse that load without disrupting operations.',
      'Across both pipelines, clinical preventative assets convert telemetry into actionable shields—parent-ready youth blueprints and enterprise ergonomic matrices that protect performance longevity at scale.',
    ],
  },
];

/**
 * More Information Landing Page Hub — frosted reading cards over particle human backdrop.
 */
export default function MoreInfoHub({ onReturn }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onReturn?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReturn]);

  return (
    <div className="relative w-screen h-screen bg-[#01040a] text-white overflow-hidden animate-fade-in">
      {/* Centered particle human — sits behind the frosted reading grid */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-full h-full max-w-5xl">
          <ParticleHumanCanvas />
        </div>
      </div>

      {/* Soft edge vignette — keeps center clear as a visual window */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(1,4,10,0.45)_70%,rgba(1,4,10,0.85)_100%)]" />

      <div className="relative z-10 flex flex-col h-full">
        <header className="w-full border-b border-slate-900/60 bg-slate-950/30 backdrop-blur-xl px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onReturn}
            className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white bg-slate-900/30 hover:bg-slate-950/60 font-mono font-bold tracking-wider transition-all uppercase cursor-pointer active:scale-95 text-xs"
          >
            [ESC] RETURN TO MATRIX TERMINAL
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6 max-w-7xl mx-auto pt-12 pb-24 font-mono">
            <div className="md:col-span-3 text-center mb-2">
              <span className="text-[10px] text-cyan-400/80 font-bold tracking-[0.28em] uppercase block mb-2">
                // LONGEVITY LABORATORY // INFORMATION HUB
              </span>
              <h1 className="text-xl md:text-3xl font-black text-center text-slate-100 tracking-widest uppercase drop-shadow-[0_0_18px_rgba(34,211,238,0.2)]">
                Know Thyself Blueprint Doctrine
              </h1>
            </div>

            {INFO_COLUMNS.map((column) => (
              <article
                key={column.title}
                className="relative rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-xl p-6 md:p-7 shadow-2xl"
              >
                <h2
                  className={`${column.accent} font-mono font-black tracking-widest uppercase text-sm md:text-base mb-5 border-b border-slate-800/70 pb-3`}
                >
                  {column.title}
                </h2>
                <div className="text-slate-200 text-base md:text-lg leading-relaxed space-y-4 font-sans font-normal">
                  {column.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
