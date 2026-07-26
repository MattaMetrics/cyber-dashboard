import React from 'react';

export default function CorporateView() {
  return (
    <div className="space-y-6 animate-fade-in font-mono text-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 bg-slate-900/30 border border-cyan-500/20 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 lg:col-span-2 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-900">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] px-2.5 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
              On-Site Lab Initiative
            </span>
            <span className="text-[10px] px-2.5 py-0.5 bg-slate-950 text-emerald-400 font-bold border border-slate-900 rounded-full tracking-wider uppercase">
              5-25 Employees
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-tight font-mono">
            // Posture & Ergonomics Wellness Package
          </h3>
          <p className="text-sm md:text-base font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
            "You aren't losing productivity to a lack of motivation—you're losing it to spinal fatigue. Our 10-minute
            mobile AI Posture Lab scans your team on-site, uncovers hidden ergonomic stress lines, and delivers instant
            physical relief to protect your workflow."
          </p>
          <p className="text-xs md:text-sm font-sans text-slate-400 italic font-normal pt-2 border-t border-slate-900/60 leading-relaxed">
            "Your desk shouldn't rewrite your body's structural alignment. Our computer-vision telemetry mapping reveals
            exactly why your lower back throbs by 3:00 PM—and hands you the precise 180-second movement hack to reverse
            it."
          </p>
        </div>

        <div className="p-6 bg-slate-950/50 flex flex-col justify-between items-center text-center min-h-[220px] font-mono">
          <div className="w-full">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">
              // DEPLOYMENT SUMMARY
            </span>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wide bg-slate-900 border border-slate-900/80 px-2 py-2 rounded-lg mt-3 font-sans">
              On-Site Testing with Individual Longevity Blueprints
            </div>
          </div>

          <div className="w-full mt-4 pt-3 border-t border-slate-900/80">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wide">
              Up to 10 Employees // FLAT VALUE
            </span>
            <div className="text-3xl md:text-4xl font-black text-cyan-400 tracking-tighter mt-1">$1,000</div>
            <button
              type="button"
              onClick={() =>
                alert('🔒 COMMERCIAL SECURE GATEWAY // INITIALIZING CORPORATE B2B PROCUREMENT ORDER PIPELINE')
              }
              className="w-full text-center py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-lg text-[10px] tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer mt-3"
            >
              🔒 Secure Offer Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm font-medium">
        <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-4 shadow-xl">
          <div className="text-rose-400 font-bold tracking-widest text-[11px] uppercase border-b border-slate-900/80 pb-2 flex items-center gap-1.5 font-mono">
            ⚠️ THE PROBLEM DATA // DESK-BOUND COMPRESSION
          </div>

          <div className="space-y-1.5">
            <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">1. Cervical Compression Profile</h4>
            <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
              Prolonged screen tracking forces a forward head migration, loading up to{' '}
              <span className="text-rose-400 font-bold font-mono">42 lbs of extra shearing pressure</span> onto the upper
              spine, causing persistent neck strain.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">2. Locked Thoracic Extension</h4>
            <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
              Extended keyboard positioning locks the mid-back, forcing the lower lumbar spine to over-compensate and
              arch excessively during basic human movements.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">3. Dormant Lateral Glute Activation</h4>
            <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
              Long hours spent sitting in ergonomic chairs signals the deep hip stabilizers to{' '}
              <span className="text-rose-400 font-bold font-mono">"turn off,"</span> triggering a chronic pelvic drop
              that manifests as deep lower back throbbing by mid-afternoon.
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-4 shadow-xl">
          <div className="text-emerald-400 font-bold tracking-widest text-[11px] uppercase border-b border-slate-900/80 pb-2 flex items-center gap-1.5 font-mono">
            ✓ THE SOLUTION OUTPUT // VERIFIED DELIVERABLES
          </div>

          <div className="space-y-1.5">
            <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">1. Personal Digital Ergonomics Map</h4>
            <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
              Every employee receives a private, interactive telemetry blueprint report with analysis, coaching tips,
              screen and chair adjustments that they can make could be critical for long term.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">2. Immediate Pain-Mapping</h4>
            <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
              We isolate the exact millimeter discrepancies causing their recurring daily shoulder tension, hip
              tightness, or energy crashes.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-slate-100 font-bold uppercase text-[12px] font-mono">3. The 3-Minute Desk Restorative Circuit</h4>
            <p className="font-sans text-slate-300 font-normal leading-relaxed text-sm md:text-base">
              A customized, low-barrier daily movement blueprint that fits seamlessly into a busy workday to instantly
              reset spinal pressure lines.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2" />
    </div>
  );
}
