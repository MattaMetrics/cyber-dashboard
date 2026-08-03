import React, { useState } from 'react';
import { PAYPAL_MATRIX } from '../constants/paypalMatrix';

function SpecsToggle({ packageId, onViewSystemSpecs, accentClass, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onViewSystemSpecs(packageId)}
      className={`w-full text-left text-[9px] font-bold tracking-[0.18em] uppercase transition-colors cursor-pointer bg-transparent border-0 p-0 mb-3 ${accentClass} ${className}`}
    >
      [ VIEW SYSTEM SPECS // ]
    </button>
  );
}

function MembershipCta({ paymentKey, processingKey, onInitialize, className = '' }) {
  const isProcessing = processingKey === paymentKey;

  return (
    <button
      type="button"
      disabled={Boolean(processingKey)}
      onClick={() => onInitialize(paymentKey)}
      className={`text-[10px] font-bold p-2 text-center rounded-lg uppercase tracking-widest transition-all cursor-pointer w-full disabled:cursor-wait ${className} ${
        isProcessing ? 'animate-pulse' : ''
      }`}
    >
      {isProcessing ? '[ SECURING GATEWAY... ]' : 'Initialize Membership'}
    </button>
  );
}

export default function AthleteView({ onViewSystemSpecs, onPaymentInitiated, onViewMoreInfo }) {
  const [processingKey, setProcessingKey] = useState(null);

  const openSpecs = (packageId) => {
    if (typeof onViewSystemSpecs === 'function') onViewSystemSpecs(packageId);
  };

  const handleInitializeMembership = (paymentKey) => {
    if (processingKey) return;
    const destinationUrl = PAYPAL_MATRIX[paymentKey];
    if (!destinationUrl) {
      alert('⚡ PAYMENT GATEWAY OFFLINE // LINK NOT CONFIGURED FOR THIS MATRIX TIER');
      return;
    }

    setProcessingKey(paymentKey);
    setTimeout(() => {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      setProcessingKey(null);
      if (typeof onPaymentInitiated === 'function') onPaymentInitiated(paymentKey);
    }, 1500);
  };

  return (
    <div className="w-full space-y-0 font-mono animate-fade-in">
      <button
        type="button"
        onClick={() => onViewMoreInfo?.()}
        className="text-[11px] text-cyan-400/70 hover:text-cyan-400 font-mono tracking-widest uppercase cursor-pointer transition-colors block text-center mb-6 py-2 border border-dashed border-cyan-500/10 rounded-lg max-w-md mx-auto bg-transparent w-full"
      >
        [ VIEW SYSTEM METHODOLOGY & KINETIC RESEARCH // ]
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 font-mono animate-fade-in">
        {/* CARD 1: KINETIC SEQUENCING GATEWAY */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl min-h-[420px] md:min-h-[460px] lg:min-h-[400px] flex flex-col justify-between group transition-colors hover:border-indigo-500/30">
          <div className="space-y-2">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-indigo-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Core Blueprint Gateway
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Kinetic Sequencing</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $199 <span className="text-[10px] font-normal text-slate-500">/ Session</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              High-velocity telemetry tracking 300+ structural metrics per second. Exposes root biomechanical
              compensation leaks before they calcify into chronic restriction, showing the exact sequencing breaks
              stealing your stability.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-indigo-400">✓ 1-Hour In-Person Telemetry Assessment</li>
              <li className="flex items-center gap-2 text-indigo-400">✓ 4 Assessment Tests </li>
              <li className="flex items-center gap-2 text-indigo-400">✓ Decoded Longevity Lab Blueprint Report</li>
              <li className="flex items-center gap-2 text-indigo-400">✓ Video Degrees of Motion Overlays</li>
              <li className="flex items-center gap-2 text-indigo-400">✓ High-Art Structure Photo</li>
              <li className="flex items-center gap-2 text-indigo-400">✓ 4-Week Coaching, Restorative / Training Stategy Plan</li>
              <li className="flex items-center gap-2 text-indigo-400">✓ Secure Client Portal Access Token</li>
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="vector"
              onViewSystemSpecs={openSpecs}
              accentClass="text-indigo-400/80 hover:text-indigo-300"
            />
            <MembershipCta
              paymentKey="vector"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-indigo-400 bg-slate-950 border border-slate-900 hover:bg-indigo-950/50"
            />
          </div>
        </div>

        {/* CARD 2: THE INFINITE MATRIX (Recommended) */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl min-h-[420px] md:min-h-[460px] lg:min-h-[400px] flex flex-col justify-between group transition-colors relative overflow-hidden shadow-lg shadow-cyan-950/5 hover:border-cyan-500/20">
          <div className="absolute top-0 right-0 bg-cyan-400 text-slate-950 text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-bl">
            Recommended
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Master Your System
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">The Infinite Matrix</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $149 <span className="text-[10px] font-normal text-slate-500">/ Month</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              Map and rebalance your body&apos;s global fascial web. By treating your movement framework as a single,
              connected tensegrity matrix, we isolate and eliminate toxic tension patterns before load can migrate into
              chronic pain hotspots.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-cyan-400">✓ Continuous Biweekly Calibration Re-Scans</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Portal Acccess Personal Profile with updated PDF Reports</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Tailored Tracks: Longevity, Precision, or Life Logevity</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Video Degrees of Motion Overlays Each Month in Portal</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ High-Art Structural Mesh Render</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Choice of 4 Assessment Tests per Month</li>
              
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="matrix"
              onViewSystemSpecs={openSpecs}
              accentClass="text-cyan-400/80 hover:text-cyan-300"
            />
            <MembershipCta
              paymentKey="infinite_matrix"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-cyan-400 bg-slate-950 border border-cyan-500/30 hover:bg-cyan-950/50 hover:border-cyan-400/50"
            />
          </div>
        </div>

        {/* CARD 3: ENTERPRISE TENSEGRITY — YOUTH */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl min-h-[420px] md:min-h-[460px] lg:min-h-[400px] flex flex-col justify-between group transition-colors hover:border-amber-500/30">
          <div className="space-y-2">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-amber-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Enterprise Tensegrity: Youth
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Youth Team Framework</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $1,000 - $2,000 <span className="text-[10px] font-normal text-slate-500">/ Team Event</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              Track millimeter joint paths and Center of Mass balance trends during growth spurts. Utilizes deep learning
              Contextual Skeletal Inference to map hidden limbs, eliminating injury risks before patterns calcify.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-amber-400">✓ 3 Custom Goal-Specific Assessment</li>
              <li className="flex items-center gap-2 text-amber-400">✓ On-Site or Fully Virtual Testing Options</li>
              <li className="flex items-center gap-2 text-amber-400">✓ Point Vulnerability Map Video Overlays(Joint Tracking Angles)</li>
            
              <li className="flex items-center gap-2 text-amber-400">✓ Decoded Longevity Lab PDF Blueprint Reports</li>
              <li className="flex items-center gap-2 text-amber-400">✓ Custom 2D Art of Their Biomechanical Structure</li>
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="youth"
              onViewSystemSpecs={openSpecs}
              accentClass="text-amber-400/80 hover:text-amber-300"
            />
            <MembershipCta
              paymentKey="youth_team"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-amber-400 bg-slate-950 border border-slate-900 hover:bg-amber-950/50"
            />
          </div>
        </div>

        {/* CARD 4: ENTERPRISE TENSEGRITY — WORKSPACE */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl min-h-[420px] md:min-h-[460px] lg:min-h-[400px] flex flex-col justify-between group transition-colors shadow-lg shadow-emerald-950/5 hover:border-emerald-500/40">
          <div className="space-y-2">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-emerald-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Enterprise Tensegrity: Workspace
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Corporate Mobile B2B</h3>
              <div className="text-xl font-black text-emerald-400 tracking-tight mt-1.5">
                $1,000 - $3,000 <span className="text-[10px] font-normal text-slate-500">/ Flat Value</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              Map forward head displacement, cervical strain, and rounding vectors directly at workstations. Quantifies
              trunk tilt to reverse decades of sedentary wear and tear while insulating human capital asset durability.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-emerald-400">✓ Non-Intrusive Desk Assessments (15-30 Mins)</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ 4 Specialized Workspace Wellness Tests</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ Point Vulnerability Map with Strategic</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ Decoded Lab PDF Blueprint System Reports</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ High Art of Their Biomechanical Structure</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ Personalized Client Portal Access Token</li>
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="corporate"
              onViewSystemSpecs={openSpecs}
              accentClass="text-emerald-400/80 hover:text-emerald-300"
            />
            <MembershipCta
              paymentKey="corporate_b2b"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-emerald-400 bg-slate-950 border border-emerald-500/30 hover:bg-emerald-950/50 hover:border-emerald-400/50"
            />
          </div>
        </div>
      </div>

      {/* GLOBAL VIRTUAL PORTAL: HORIZONTAL LOWER FOOTER TIER */}
      <div className="mt-8 p-4 md:p-6 bg-slate-900/30 border border-dashed border-cyan-500/20 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-6 font-mono group hover:border-cyan-500/40 transition-all shadow-lg shadow-cyan-950/5">
        <div className="flex flex-col items-center lg:items-start justify-center text-center lg:text-left w-full space-y-3">
          <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
            Global Remote Access
          </span>
          <h3 className="text-md font-black text-slate-200 uppercase text-center lg:text-left">
            <span className="text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              VIRTUAL
            </span>{' '}
            MATRIX PORTAL
          </h3>
          <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal text-center lg:text-left mx-auto lg:mx-0 max-w-3xl w-full">
            No location constraints. Record your movement sequences anywhere in the world following our video
            positioning guidelines, and unlock a fully decoded biomechanical blueprint analysis. Includes a 1-assessment
            group pipeline with Video Degrees Motion Overlays and Custom 2D structural art, paired with your
            personalized 4-week restoration plan delivered straight to your inbox.
          </p>
          <SpecsToggle
            packageId="virtual_portal"
            onViewSystemSpecs={openSpecs}
            accentClass="text-cyan-400/80 hover:text-cyan-300"
            className="text-center lg:text-left mb-0 mt-1 w-full"
          />
        </div>

        <div className="flex flex-col items-center lg:items-end justify-center text-center lg:text-right w-full lg:w-auto lg:min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6 shrink-0">
          <div className="text-xl font-black text-cyan-400 tracking-tight">
            $99 <span className="text-[10px] font-normal text-slate-500">/ Remote Run</span>
          </div>
          <MembershipCta
            paymentKey="virtual_portal"
            processingKey={processingKey}
            onInitialize={handleInitializeMembership}
            className="text-cyan-400 bg-slate-950 border border-slate-800 hover:border-cyan-400 mt-3 p-2.5 w-full lg:w-auto min-w-[200px]"
          />
        </div>
      </div>
    </div>
  );
}
