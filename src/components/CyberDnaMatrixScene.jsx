import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Cyber DNA Matrix — helix + neon frame scene for the coach command column.
 * Ported from the standalone HTML helix demo; sized to its host panel (not fullscreen).
 */
export default function CyberDnaMatrixScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020208, 0.08);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x020208, 1);
    container.appendChild(renderer.domElement);

    // Frame removed — empty group keeps pulse scale refs valid without rendering
    const frameGroup = new THREE.Group();
    scene.add(frameGroup);

    // --- DNA strands & nodes ---
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    const numNodes = 70;
    const helixRadius = 1.0;
    const helixHeight = 6.5;
    const twists = 3.5;
    const pointsA = [];
    const pointsB = [];

    const nodeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const matCyanNode = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      blending: THREE.AdditiveBlending,
    });
    const matPurpleNode = new THREE.MeshBasicMaterial({
      color: 0xbd00ff,
      blending: THREE.AdditiveBlending,
    });
    const rungMat = new THREE.LineBasicMaterial({
      color: 0x00a0ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < numNodes; i++) {
      const ratio = i / numNodes;
      const y = (ratio - 0.5) * helixHeight;
      const angle = ratio * twists * Math.PI * 2;

      const xA = Math.sin(angle) * helixRadius;
      const zA = Math.cos(angle) * helixRadius;
      pointsA.push(new THREE.Vector3(xA, y, zA));

      const xB = Math.sin(angle + Math.PI) * helixRadius;
      const zB = Math.cos(angle + Math.PI) * helixRadius;
      pointsB.push(new THREE.Vector3(xB, y, zB));

      const nodeA = new THREE.Mesh(nodeGeo, matCyanNode);
      nodeA.position.set(xA, y, zA);
      dnaGroup.add(nodeA);

      const nodeB = new THREE.Mesh(nodeGeo, matPurpleNode);
      nodeB.position.set(xB, y, zB);
      dnaGroup.add(nodeB);

      if (i % 2 === 0) {
        const rungGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xA, y, zA),
          new THREE.Vector3(xB, y, zB),
        ]);
        dnaGroup.add(new THREE.Line(rungGeo, rungMat));
      }
    }

    const curveA = new THREE.CatmullRomCurve3(pointsA);
    const geoA = new THREE.BufferGeometry().setFromPoints(curveA.getPoints(200));
    dnaGroup.add(
      new THREE.Line(
        geoA,
        new THREE.LineBasicMaterial({ color: 0x00f0ff, blending: THREE.AdditiveBlending })
      )
    );

    const curveB = new THREE.CatmullRomCurve3(pointsB);
    const geoB = new THREE.BufferGeometry().setFromPoints(curveB.getPoints(200));
    dnaGroup.add(
      new THREE.Line(
        geoB,
        new THREE.LineBasicMaterial({ color: 0xff00a0, blending: THREE.AdditiveBlending })
      )
    );

    // --- Ambient particles ---
    const particleCount = 240;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorCyan = new THREE.Color(0x00f0ff);
    const colorPurple = new THREE.Color(0xff00a0);

    for (let i = 0; i < particleCount; i++) {
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(0, Math.PI);
      const distance = THREE.MathUtils.randFloat(3.0, 7.5);

      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.cos(phi);
      const z = distance * Math.sin(phi) * Math.sin(theta) - 2.0;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixedColor = Math.abs(x) > 2 ? colorCyan : colorPurple;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const backgroundParticles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(backgroundParticles);

    let rafId = 0;
    const clock = new THREE.Clock();

    // Keep helix / origin dead-center of the panel viewport
    dnaGroup.position.set(0, 0, 0);
    backgroundParticles.position.set(0, 0, 0);
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      camera.position.set(0, 0, 9);
      camera.lookAt(0, 0, 0);
    };

    // --- LOCKED AND CENTERED CAM LOOP ---
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous balanced rotation of the centered helix
      dnaGroup.rotation.y = elapsedTime * 0.45;

      // Environment background star drift
      backgroundParticles.rotation.y = -elapsedTime * 0.05;
      backgroundParticles.rotation.z = elapsedTime * 0.02;

      // LOCKED CAMERA: Centered precisely at origin looking straight forward
      camera.position.set(0, 0, 9);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] md:h-[480px] rounded-xl overflow-hidden border border-slate-900 bg-[#020208] select-none">
      <div className="absolute top-4 left-4 z-10 pointer-events-none text-[#00f0ff] text-[10px] tracking-[0.2em] uppercase leading-relaxed font-mono [text-shadow:0_0_10px_rgba(0,240,255,0.6)]">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff00a0] shadow-[0_0_8px_#ff00a0] animate-pulse" />
          CORE_INDEX_RUNNING
        </div>
        <div>RENDER: 3D_HELIX_GRID_v4.0</div>
        <div>FIELD: ELECTROMAGNETIC_CYAN_PURPLE</div>
      </div>
      <div ref={mountRef} className="absolute inset-0 z-[1]" />
    </div>
  );
}
