import React, { useEffect } from 'react';

/** Inline orange accent for locked benefit phrases — matches [#FF6600] manifesto markers */
function OrangeLock({ children }) {
  return <span className="text-[#FF6600] font-semibold">[{children}]</span>;
}

const TRACK_INDEX = [
  {
    id: 'track_01',
    title: '// TRACK_01 // VITAL FLOW',
    body:
      'Our flagship all-around body blueprint diagnostic built for every individual. Access lab-grade telemetry across your global kinetic network to isolate hidden vulnerabilities before they manifest as chronic pain. Completely adaptable with seamless virtual or in-person tracking to fit your lifestyle.',
    benefit: (
      <>
        Stop guessing with your physical longevity. Initialize your diagnostic path to unlock complete{' '}
        <OrangeLock>biological truth</OrangeLock> and reclaim effortless alignment.
      </>
    ),
  },
  {
    id: 'track_02',
    title: '// TRACK_02 // ATHLETE PRECISION ENGINES',
    body:
      'Elite performance tracking designed to keep you commanding an advanced athletic landscape. This engine deploys millions of matrix measurements per second to hand you the secret data required to play harder, scale faster, and perform longer.',
    benefit: (
      <>
        Secure your definitive structural advantage. Eliminate physical{' '}
        <OrangeLock>energy leaks</OrangeLock> to optimize force outputs and lock in an injury-free, mobile
        future.
      </>
    ),
  },
  {
    id: 'track_03',
    title: '// TRACK_03 // CORPORATE DESK COMPRESSION DEFENSE',
    body:
      'A highly focused workplace wellness interface engineered to maintain workforce vitality, erase desk-bound pain, and sustain peak professional output. This module deploys completely non-intrusive structural tracking directly at your active workstation layout without disrupting the daily flow of your operations.',
    benefit: (
      <>
        Reclaim your physical baseline. Isolate and neutralize localized{' '}
        <OrangeLock>lumbar flattening</OrangeLock> and cervical strain patterns to protect your workday
        endurance.
      </>
    ),
  },
  {
    id: 'track_04',
    title: '// TRACK_04 // KINETIC POWER INTEGRITY PROFILE',
    body:
      'Our powerhouse martial arts and extreme sports engine built to map explosive force generation from the ground up. By processing millions of matrix coordinates per second, the system tracks velocity vectors and torque transfer across your entire striking framework to identify hidden mechanical energy leaks.',
    benefit: (
      <>
        Weaponize your biometrics. Secure your definitive physical blueprint and claim the{' '}
        <OrangeLock>structural advantage</OrangeLock> required for a devastating, injury-free combat future.
      </>
    ),
  },
];

/**
 * Flagship Master Information Hub — Longevity Laboratory Global Master Index.
 */
export default function InfoHubView({ onReturn, onNavigate, setCurrentScreen }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (setCurrentScreen) setCurrentScreen('COACH_DASHBOARD_HOME');
        else onReturn?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReturn, setCurrentScreen]);

  const handleTrackLaunch = (trackId) => {
    if (trackId === 'track_02') {
      onNavigate?.('ATHLETE_PRECISION');
      return;
    }
    if (trackId === 'track_03') {
      onNavigate?.('POSTURE_ERGONOMICS');
      return;
    }
    if (trackId === 'track_04') {
      onNavigate?.('KINETIC_POWER');
      return;
    }
  };
  return (
    <div className="relative w-screen h-screen bg-[#01040a] text-white overflow-hidden animate-fade-in font-mono">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(255,102,0,0.04),transparent_40%)]" />

      <div className="relative z-10 flex flex-col h-full">
        <header className="w-full border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-xl px-4 md:px-6 py-4 shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentScreen("COACH_DASHBOARD_HOME")}
              className="self-start px-3 py-1.5 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-950 font-bold tracking-wider transition-all uppercase cursor-pointer active:scale-95 text-xs"
            >
              [ESC] RETURN TO DASHBOARD HOME
            </button>
            <div className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              [SYSTEM STATUS: ONLINE]
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-5 border-t border-slate-800/80 pt-5 text-center">
            <h1 className="text-base md:text-2xl font-black tracking-widest uppercase text-slate-100 drop-shadow-[0_0_16px_rgba(34,211,238,0.25)]">
              <span className="text-cyan-400">//</span> LONGEVITY LABORATORY GLOBAL MASTER INDEX{' '}
              <span className="text-cyan-400">//</span>
            </h1>
            <p className="mt-2 text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-indigo-300/80 font-bold">
              [ CALIBRATION STATE: SYSTEM MULTI-THREADED ]
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12">
          <div className="max-w-6xl mx-auto mt-8 space-y-8">
            {/* Track index cards — ~80-char readable columns */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {TRACK_INDEX.map((track) => (
                <button
                  type="button"
                  key={track.id}
                  onClick={() => {
                    // 🟢 TRACK_01 // VITAL FLOW INITIALIZATION
                    if (track.id === 'track_01') {
                      onNavigate?.('VITAL_FLOW_DECOMPRESSION_MATRIX');
                      return;
                    }
                    handleTrackLaunch(track.id);
                  }}
                  className="p-5 md:p-6 bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 rounded-xl space-y-3 transition-colors text-left cursor-pointer active:scale-[0.99]"
                >
                  <h2 className="text-xs md:text-sm font-black tracking-widest uppercase text-cyan-400 border-b border-slate-800 pb-3">
                    {track.title}
                  </h2>
                  <p className="text-slate-300 text-sm font-sans leading-relaxed font-normal max-w-[42rem]">
                    {track.body}
                  </p>
                  <p className="text-[11px] md:text-xs font-sans leading-relaxed text-slate-400 pt-1 border-t border-slate-900/80">
                    <span className="font-mono font-bold tracking-widest uppercase text-indigo-300/90">
                      [BENEFIT LOCK]:{' '}
                    </span>
                    {track.benefit}
                  </p>
                </button>
              ))}
            </section>

            <div className="border-t border-slate-800/80" />

            {/* Platform Code Mission & Telemetry Manifesto */}
            <section className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-left">
              <span className="text-[10px] text-cyan-400 tracking-widest uppercase block mb-2 font-black">
                // PLATFORM CODE MISSION & TELEMETRY MANIFESTO //
              </span>
              <p className="text-[9px] text-slate-500 tracking-widest uppercase mb-5 font-bold">
                [ FRAMEWORK BOUNDARY: 80-CHARACTER MAX LINE WRAP FOR CARD READABILITY ]
              </p>
              <div className="space-y-4 text-slate-300 text-sm md:text-[15px] font-sans leading-relaxed font-normal max-w-[42rem]">
                <p>
                  The underlying neural networks execute millions of matrix calculations every single second to convert
                  plain video into lab-grade, multi-dimensional physics data.
                </p>
                <p>
                  By leveraging custom 3D Blender mesh engine telemetry and high-speed algorithms tracking up to 240
                  frames per second, we capture over 300 validated biometrics non-intrusively without requiring physical
                  sensors. This advanced <OrangeLock>Contextual Skeletal Inference</OrangeLock> engine is matched with{' '}
                  <OrangeLock>2 decades of in-person coaching</OrangeLock> experience across youth development, yoga
                  longevity systems, and elite combat athletics.
                </p>
                <p>
                  Every scan automatically adapts to individual anthropometry with{' '}
                  <OrangeLock>millimeter resolution</OrangeLock>, isolating trapped structural paths and hidden
                  left-to-right micro-instabilities frame by frame to safely restore, recalibrate, and upgrade your
                  physical avatar.
                </p>
              </div>
            </section>

            <div className="border-t border-slate-800/80" />

            {/* System Laws & Datastream Logic */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
              <article className="p-5 md:p-6 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3">
                <h2 className="text-xs md:text-sm font-black tracking-widest uppercase text-amber-400 border-b border-slate-800 pb-3">
                  // SYSTEM LAWS & DATASTREAM LOGIC //
                </h2>
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400/90">
                  // LAW: SYMPTOMS MIGRATE BUT TRUTH ENDURES
                </p>
                <p className="text-slate-300 text-sm font-sans leading-relaxed font-normal">
                  Chasing local pain fails because the complaint is often only the loudest node in a wider tension
                  pattern. Relieve one hotspot without balancing the global fascial web, and the load simply migrates.
                </p>
              </article>

              <article className="p-5 md:p-6 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3">
                <h2 className="text-xs md:text-sm font-black tracking-widest uppercase text-indigo-300 border-b border-slate-800 pb-3">
                  // PROTOCOL LAYER //
                </h2>
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400/90">
                  // PROTOCOL: PREDICT HIDDEN PATHWAYS
                </p>
                <p className="text-slate-300 text-sm font-sans leading-relaxed font-normal">
                  If a joint goes out of frame or is hidden behind your body during an explosive movement, deep learning
                  algorithms look at your surrounding limbs to accurately predict and map the hidden joint&apos;s path.
                </p>
              </article>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
