import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function IntroScreen({ onAccessGranted, autoBoot = false }) {
  const [pin, setPin] = useState(autoBoot ? '7777' : '');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isBooting, setIsBooting] = useState(false);
  const canvasRef = useRef(null);

  // THREE.JS VIEWPORT PIPELINE FOR REAL MODEL RENDERING
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Setup Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#020617', 0.08);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.5, 4.0); // Slightly lowered to frame model perfectly
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Cosmic Node Grid Base Floor (Strengthened line visibility)
    const gridGeometry = new THREE.PlaneGeometry(30, 30, 30, 30);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.45, // Increased from 0.15 to 0.45 for a much stronger floor presence!
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    gridMesh.rotation.x = -Math.PI / 2;
    scene.add(gridMesh);

    // 3. Import and Parse True 3D GLB Model File
    let loadedModelInstance = null;
    const gltfLoader = new GLTFLoader();

    // The browser automatically maps the public root directly to your E drive folder path
    gltfLoader.load(
      '/matta.glb',
      (gltf) => {
        loadedModelInstance = gltf.scene;

        // Auto-centering and normalization algorithms
        const box = new THREE.Box3().setFromObject(loadedModelInstance);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Keeps her at your ideal size that fits perfectly behind the UI panel
        const targetHeight = 1.9;
        const scaleFactor = targetHeight / maxDim;

        loadedModelInstance.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const center = box.getCenter(new THREE.Vector3());
        loadedModelInstance.position.x = -center.x * scaleFactor;
        loadedModelInstance.position.y = -box.min.y * scaleFactor;
        loadedModelInstance.position.z = -center.z * scaleFactor;

        // FORCE HOLOGRAPHIC CYBER WIREFRAME ON ALL SURFACES
        loadedModelInstance.traverse((child) => {
          if (child.isMesh) {
            // Create a brand new luminous material to bypass raw blender texture errors
            child.material = new THREE.MeshBasicMaterial({
              color: 0x00d2ff, // Electric cyber blue line vectors
              wireframe: true, // Restores your clean geometric gridlines
              transparent: true,
              opacity: 0.65, // Let the background elements breathe through
              blending: THREE.AdditiveBlending, // Makes the wireframe glow when overlapping
            });
          }
        });

        scene.add(loadedModelInstance);
      },
      undefined,
      (error) => console.error('Error loading matta.glb mapping lines:', error)
    );

    // 4. Studio Lighting Matrix
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 3, 15);
    pointLight1.position.set(2, 3, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4f46e5, 2, 15);
    pointLight2.position.set(-2, 1, -2);
    scene.add(pointLight2);

    // 5. Infinite Frame Loop Animation
    let animationFrameId;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsedTime = clock.getElapsedTime();

      // Infinite slow orbital rotation applied straight to your model
      if (loadedModelInstance) {
        loadedModelInstance.rotation.y = elapsedTime * 0.4;
      }

      // Moving grid floor effect simulating walking vectors
      gridMesh.position.z = (elapsedTime * 0.2) % 1;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // 6. Handle Screen Window Resize Scaling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
    };
  }, []);

  // MASTER MATRIX PIN VERIFIER LOOP
  const handlePinSubmit = (val) => {
    if (val === '7777') {
      setIsBooting(true);
      let currentProgress = 0;

      const interval = setInterval(() => {
        currentProgress += 2;
        setLoadingProgress(currentProgress);

        if (currentProgress >= 100) {
          clearInterval(interval);
          onAccessGranted('7777');
        }
      }, 150); // Changed from 60 to 150 to make the 3D scan cinematic and longer!
    }
  };

  // Auto-start MATTA scan when arriving from the home code box with 7777
  useEffect(() => {
    if (autoBoot) {
      handlePinSubmit('7777');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBoot]);

  return (
    <div className="w-screen h-screen bg-[#020617] text-white font-mono relative overflow-hidden flex flex-col justify-between p-6">
      {/* BACKGROUND 3D RENDER ENGINE CANVAS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 block cursor-grab active:cursor-grabbing"
      />

      {/* TOP HEADLINER DECK BAR */}
      <div className="w-full flex justify-between items-start z-10 select-none">
        <div>
          <h1 className="text-sm font-black tracking-widest text-slate-100">HYPER_3D // MESH_LOADER_PORTAL</h1>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">
            // GLB PIPELINE COMPILED
          </p>
        </div>
        <span className="text-[9px] text-slate-500 font-bold tracking-widest">// SECURE_STABILITY_LOCK</span>
      </div>

      {/* CENTER GLASS PASSPHRASE TERMINAL SCREEN */}
      <div className="w-full flex-1 flex flex-col items-center justify-center z-10">
        {!isBooting ? (
          <div className="w-full max-w-sm bg-slate-950/80 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md shadow-2xl text-center space-y-5">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                INITIALIZE PROFILE STREAM
              </h2>
              <p className="text-[10px] font-sans text-slate-500">
                Input authorized biometric passcode identifier
              </p>
            </div>

            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const inputVal = e.target.value.replace(/\D/g, '');
                setPin(inputVal);
                if (inputVal.length === 4) handlePinSubmit(inputVal);
              }}
              placeholder="••••"
              className="w-full text-center text-xl font-black bg-slate-900 border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 text-blue-400 outline-none transition-colors tracking-[0.75em] placeholder-slate-700"
            />

            <div className="text-[8px] tracking-wider text-slate-600 font-bold uppercase font-mono">
              Demo Code Trigger Hint: Enter <span className="text-blue-500 font-black">7777</span> to scan
              MATTA
            </div>
          </div>
        ) : (
          /* SCANNING DIALOG LOADING SEQUENCER PANEL */
          <div className="w-full max-w-md bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-[10px] text-cyan-400 font-bold tracking-wider uppercase">
              {/* Updated custom blueprint subtitle row */}
              <span>⚡ SYNTHESIZING YOUR CUSTOM BLUEPRINT REPORT...</span>
              <span>{loadingProgress}%</span>
            </div>

            {/* COMPACT CHRONO RECHARGE BAR */}
            <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-75 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 text-[8px] font-sans text-slate-500 uppercase gap-1 border-t border-slate-900/60 pt-3">
              <div>
                TARGET ARCHETYPE: <span className="text-slate-300 font-mono">MATTA_MESH_V1</span>
              </div>
              <div className="text-right">
                WAVE_EMISSION: <span className="text-slate-300 font-mono">NODE_ACTIVE</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METRIC BANNER */}
      <div className="w-full text-center text-[9px] text-slate-600 font-bold tracking-widest z-10 select-none">
        AIKYNETIX FRAMEWORK INTEGRATION ENGINE // MODEL TIER v4.0.0
      </div>
    </div>
  );
}

export default IntroScreen;
