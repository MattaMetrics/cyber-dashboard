import React, { useMemo, useId } from 'react';

const CX = 50;
const CY = 50;
const POINTS = 8;

const SIZE_CLASSES = {
  xs: 'w-11 h-11',
  sm: 'w-16 h-16',
  md: 'w-24 h-24 md:w-28 md:h-28',
  lg: 'w-44 h-44 md:w-48 md:h-48',
};

function polar(r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function ringPoints(r, count, startDeg = -90) {
  return Array.from({ length: count }, (_, i) => polar(r, startDeg + (360 / count) * i));
}

function lineKey(a, b) {
  return `${a.x.toFixed(1)},${a.y.toFixed(1)}-${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

function uniqueLines(pairs) {
  const seen = new Set();
  return pairs.filter(([a, b]) => {
    const k1 = lineKey(a, b);
    const k2 = lineKey(b, a);
    if (seen.has(k1) || seen.has(k2)) return false;
    seen.add(k1);
    return true;
  });
}

function GlowNode({ x, y, r = 1.4, bright = false, glowFilterId }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2.2} fill="#00FFFF" opacity={bright ? 0.35 : 0.18} filter={`url(#${glowFilterId})`} />
      <circle cx={x} cy={y} r={r} fill="#E0FFFF" opacity={bright ? 1 : 0.9} />
      <circle cx={x} cy={y} r={r * 0.45} fill="#FFFFFF" />
    </g>
  );
}

export default function MethodologyCyberSphere({ size = 'lg', className = '' }) {
  const uid = useId().replace(/:/g, '');
  const glowFilterId = `methodologyGlow-${uid}`;
  const coreGlowId = `methodologyCoreGlow-${uid}`;

  const showPulse = size === 'lg' || size === 'md';
  const animateRing = size === 'lg' || size === 'md';

  const geometry = useMemo(() => {
    const outer = ringPoints(30, POINTS);
    const inner = ringPoints(20, POINTS, -90 + 22.5);
    const core = ringPoints(9, POINTS, -90 + 22.5);
    const squareA = [outer[0], outer[2], outer[4], outer[6], outer[0]];
    const squareB = [outer[1], outer[3], outer[5], outer[7], outer[1]];

    const mesh = uniqueLines([
      ...outer.map((p, i) => [p, outer[(i + 1) % POINTS]]),
      ...inner.map((p, i) => [p, inner[(i + 1) % POINTS]]),
      ...core.map((p, i) => [p, core[(i + 1) % POINTS]]),
      ...outer.map((p, i) => [p, outer[(i + 2) % POINTS]]),
      ...outer.map((p, i) => [p, outer[(i + 4) % POINTS]]),
      ...outer.map((p) => [p, { x: CX, y: CY }]),
      ...outer.map((p, i) => [p, inner[i]]),
      ...inner.map((p, i) => [p, core[i]]),
      ...squareA.slice(0, -1).map((p, i) => [p, squareA[i + 1]]),
      ...squareB.slice(0, -1).map((p, i) => [p, squareB[i + 1]]),
    ]);

    const ticks = Array.from({ length: 48 }, (_, i) => {
      const deg = -90 + i * 7.5;
      const innerPt = polar(41.5, deg);
      const outerPt = polar(44.5, deg);
      const major = i % 6 === 0;
      return { innerPt, outerPt, major };
    });

    const circuitDots = Array.from({ length: 24 }, (_, i) => {
      const deg = -90 + i * 15 + (i % 2) * 4;
      return polar(37 + (i % 3), deg);
    });

    const cardinalTriangles = [
      { tip: polar(47.5, -90), rot: 0 },
      { tip: polar(47.5, 90), rot: 180 },
      { tip: polar(47.5, 180), rot: -90 },
      { tip: polar(47.5, 0), rot: 90 },
    ];

    const centerSquare = [
      { x: CX - 4.5, y: CY - 4.5 },
      { x: CX + 4.5, y: CY - 4.5 },
      { x: CX + 4.5, y: CY + 4.5 },
      { x: CX - 4.5, y: CY + 4.5 },
    ];

    return { outer, inner, core, mesh, ticks, circuitDots, cardinalTriangles, centerSquare };
  }, []);

  return (
    <div className={`${SIZE_CLASSES[size] ?? SIZE_CLASSES.lg} flex items-center justify-center relative shrink-0 ${className}`}>
      {showPulse && (
        <div className="absolute inset-0 rounded-full border border-[#00FFFF]/10 animate-ping opacity-25" />
      )}
      <div
        className="absolute inset-2 rounded-full opacity-40 blur-xl"
        style={{ background: 'radial-gradient(circle, rgba(0,255,255,0.35) 0%, transparent 70%)' }}
      />

      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,255,0.55)) drop-shadow(0 0 14px rgba(0,255,255,0.25))' }}
      >
        <defs>
          <filter id={glowFilterId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={coreGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r="46" fill={`url(#${coreGlowId})`} />
        {geometry.circuitDots.map((pt, i) => (
          <rect
            key={`circuit-${i}`}
            x={pt.x - 0.35}
            y={pt.y - 0.35}
            width="0.7"
            height="0.7"
            fill="#00FFFF"
            opacity={0.15 + (i % 3) * 0.08}
            transform={`rotate(${i * 15} ${pt.x} ${pt.y})`}
          />
        ))}

        <g>
          {animateRing && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="90s"
              repeatCount="indefinite"
            />
          )}
          <circle cx={CX} cy={CY} r="44.5" stroke="#00FFFF" strokeWidth="0.25" fill="none" opacity="0.35" strokeDasharray="1.5 2.5" />
          {geometry.ticks.map(({ innerPt, outerPt, major }, i) => (
            <line
              key={`tick-${i}`}
              x1={innerPt.x}
              y1={innerPt.y}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="#00FFFF"
              strokeWidth={major ? 0.45 : 0.25}
              opacity={major ? 0.75 : 0.4}
            />
          ))}
        </g>

        <circle cx={CX} cy={CY} r="40" stroke="#00FFFF" strokeWidth="0.55" fill="none" opacity="0.85" filter={`url(#${glowFilterId})`} />
        <circle cx={CX} cy={CY} r="36" stroke="#00FFFF" strokeWidth="0.2" fill="none" opacity="0.45" strokeDasharray="0.8 1.6" />

        <g stroke="#00FFFF" strokeWidth="0.28" fill="none" opacity="0.55">
          {geometry.mesh.map(([a, b], i) => (
            <line key={`mesh-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          ))}
        </g>

        <polygon
          points={geometry.inner.map((p) => `${p.x},${p.y}`).join(' ')}
          stroke="#00FFFF"
          strokeWidth="0.45"
          fill="none"
          opacity="0.7"
          filter={`url(#${glowFilterId})`}
        />

        <polygon
          points={geometry.centerSquare.map((p) => `${p.x},${p.y}`).join(' ')}
          stroke="#00FFFF"
          strokeWidth="0.5"
          fill="rgba(0,255,255,0.06)"
          opacity="0.95"
          filter={`url(#${glowFilterId})`}
        />

        {geometry.cardinalTriangles.map(({ tip, rot }, i) => (
          <g key={`tri-${i}`} transform={`translate(${tip.x} ${tip.y}) rotate(${rot})`}>
            <polygon points="0,-2.8 -1.6,1.4 1.6,1.4" fill="#00FFFF" opacity="0.85" filter={`url(#${glowFilterId})`} />
          </g>
        ))}

        {geometry.outer.map((p, i) => (
          <GlowNode key={`outer-node-${i}`} x={p.x} y={p.y} r={1.5} bright glowFilterId={glowFilterId} />
        ))}
        {geometry.inner.map((p, i) => (
          <GlowNode key={`inner-node-${i}`} x={p.x} y={p.y} r={1.1} glowFilterId={glowFilterId} />
        ))}
        {geometry.core.map((p, i) => (
          <GlowNode key={`core-node-${i}`} x={p.x} y={p.y} r={0.85} glowFilterId={glowFilterId} />
        ))}
        {geometry.centerSquare.map((p, i) => (
          <GlowNode key={`sq-node-${i}`} x={p.x} y={p.y} r={0.75} bright={i % 2 === 0} glowFilterId={glowFilterId} />
        ))}
        <GlowNode x={CX} y={CY} r={1.2} bright glowFilterId={glowFilterId} />
      </svg>
    </div>
  );
}
