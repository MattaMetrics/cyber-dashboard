function MetricCard({ label, value, children, className = '' }) {
  return (
    <div className={`hud-panel scan-line px-5 py-4 ${className}`}>
      <p className="metric-label">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <p className="metric-value">{value}</p>
        {children}
      </div>
    </div>
  )
}

function HeartPulse() {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/40" />
      <span className="relative inline-flex h-2.5 w-2.5 animate-pulse-heart rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8]" />
    </span>
  )
}

export default function Dashboard() {
  return (
    <div className="pointer-events-none relative z-10 flex h-full w-full flex-col p-6 md:p-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-500/60">
            Neural Performance Systems
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-widest text-cyan-100 md:text-3xl">
            ATHLETIC BIOMETRIC SCAN
          </h1>
        </div>
        <div className="hud-panel hidden px-4 py-2 md:block">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/90">
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live Feed Active
          </p>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col gap-4">
          <MetricCard label="Heart Rate" value="144 BPM">
            <HeartPulse />
          </MetricCard>
          <MetricCard label="Velocity" value="8.4 m/s" />
          <MetricCard label="Acceleration" value="1.2G" />
        </div>

        <div className="hidden w-48 lg:block">
          <div className="hud-panel p-4">
            <p className="metric-label">Skeletal Tracking</p>
            <div className="mt-3 space-y-2">
              {['HEAD', 'TORSO', 'L-LEG', 'R-LEG'].map((joint) => (
                <div key={joint} className="flex items-center justify-between font-mono text-[10px] text-cyan-400/80">
                  <span>{joint}</span>
                  <span className="text-emerald-400">LOCKED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="flex items-end justify-between">
        <div className="hud-panel animate-flicker px-6 py-3">
          <p className="metric-label">Biometric Identification</p>
          <p className="mt-1 font-display text-lg tracking-[0.2em] text-emerald-400">
            COMPLETE
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-600/50">
          Scan ID: ATH-7742-X
        </div>
      </footer>
    </div>
  )
}
