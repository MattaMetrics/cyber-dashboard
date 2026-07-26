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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-4">
        {/* CARD 1: VECTOR BLUEPRINT */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-indigo-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                In-Person Hybrid
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Vector Blueprint</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $149 <span className="text-[10px] font-normal text-slate-500">/ Session</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              A comprehensive in-person biometric movement assessment paired with muscle analytics, and training tips.
              Perfect for isolating chronic structural blindspots and launching your restorative game plan with precision
              knowledge
            </p>
            <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-slate-400">✓ Video Degrees Motion Overlay</li>
              <li className="flex items-center gap-2 text-slate-400">✓ Decoded Lab-Grade PDF Blueprint Report</li>
              <li className="flex items-center gap-2 text-slate-400">✓ 4-Week Custom Restorative Training Plan</li>
              <li className="flex items-center gap-2 text-slate-400">✓ Personalized Client Portal Access Token</li>
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

        {/* CARD 2: TENSEGRITY EVALUATION */}
        <div className="p-5 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between relative overflow-hidden group shadow-lg shadow-cyan-950/5">
          <div className="absolute top-0 right-0 bg-cyan-400 text-slate-950 text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-bl">
            Recommended
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Advanced Biometrics
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Tensegrity Evaluation</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $299 <span className="text-[10px] font-normal text-slate-500">/ Evaluation</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              A premium structural evaluation combining in-person diagnostic tracking with elite visual motion data. Perfect
              for athletes and active adults demanding deep kinetic clarity.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-cyan-400">✓ 1 Specialized Lab Protocol Choice</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Weeks 2 & 3 Virtual Video Analysis</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ High-Art 3D Biometric Body Render</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Multi-Plane Kinematic Degree Overlays</li>
              <li className="flex items-center gap-2 text-cyan-400">✓ Month-End Re-Assessment Blueprint</li>
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="tensegrity"
              onViewSystemSpecs={openSpecs}
              accentClass="text-cyan-400/80 hover:text-cyan-300"
            />
            <MembershipCta
              paymentKey="tensegrity"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-cyan-400 bg-slate-950 border border-cyan-500/30 hover:bg-cyan-950/50 hover:border-cyan-400/50"
            />
          </div>
        </div>

        {/* CARD 3: KINETIC YOUTH TEAM BLUEPRINT */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-amber-500/30 transition-colors">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-amber-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Youth Athlete Precision
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Kinetic Youth Team Blueprint</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $1,000 <span className="text-[10px] font-normal text-slate-500">/ Team Event</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              On-site athletic screening engineered for youth sports teams, dance studios, and martial arts academies.
              Capture alignments early to eliminate injury blindspots and optimize performance.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-amber-400">✓ Up to 20 Individual Athlete Screens</li>
              <li className="flex items-center gap-2 text-amber-400">✓ 3 Specialized Athlete Precision Assessments</li>
              <li className="flex items-center gap-2 text-amber-400">✓ On-Site High-Frame-Rate Video Captures</li>
              <li className="flex items-center gap-2 text-amber-400">✓ Individual Parent PDF Download Blueprints</li>
              <li className="flex items-center gap-2 text-amber-400">✓ Full Master Kinematic Roster Report for Coaches</li>
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

        {/* CARD 4: INFINITE MATRIX SUPPORT */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-blue-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Custom Continuity
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Infinite Matrix Support</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $399 <span className="text-[10px] font-normal text-slate-500">/ Month</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              Our flagship 8-to-12 week custom continuity membership. Seamlessly integrates physical recovery, athletic
              performance, and high-art diagnostics to permanently rebuild your body's structural matrix.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-blue-400">✓ 3 Full Comprehensive Biometric Assessments</li>
              <li className="flex items-center gap-2 text-blue-400">✓ Weekly Virtual Video Kinematic Analysis</li>
              <li className="flex items-center gap-2 text-blue-400">✓ Adaptive 4-Week PDF Coaching Adjustments</li>
              <li className="flex items-center gap-2 text-blue-400">✓ Therapist-Ready Postural Blueprint Documentation</li>
              <li className="flex items-center gap-2 text-blue-400">✓ Ongoing Dynamic 3D Blue Biometric Profile Updates</li>
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="matrix"
              onViewSystemSpecs={openSpecs}
              accentClass="text-blue-400/80 hover:text-cyan-300"
            />
            <MembershipCta
              paymentKey="infinite_matrix"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-blue-400 bg-slate-950 border border-blue-500/30 hover:bg-blue-950/50 hover:border-blue-400/50"
            />
          </div>
        </div>

        {/* CARD 5: ELITE RESIDENCY (8-Week Intensive) */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-purple-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Premium Track // 8-Week Intensive
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Elite Residency</h3>
              <div className="text-xl font-black text-cyan-400 tracking-tight mt-1.5">
                $499 <span className="text-[10px] font-normal text-slate-500">/ 60 Days</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              Deep-dive biomechanical reprogramming across an intensive 60-day tracking window. Built specifically for
              individuals requiring maximum skeletal reconstruction, daily movement tracking, and elite custom progression
              loops.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-purple-400">✓ 4 Full-Spectrum In-Person Biometric Scans</li>
              <li className="flex items-center gap-2 text-purple-400">✓ Weekly Virtual Telemetry Analysis & Upgrades</li>
              <li className="flex items-center gap-2 text-purple-400">✓ Direct 1-on-1 Biomechanist Case Log Feedback</li>
              <li className="flex items-center gap-2 text-purple-400">✓ Daily Adaptive Protocol & Macro Variation Matrices</li>
              <li className="flex items-center gap-2 text-purple-400">✓ VIP Priority Lab Booking & Re-Assessment Windows</li>
            </ul>
          </div>
          <div className="mt-5">
            <SpecsToggle
              packageId="elite"
              onViewSystemSpecs={openSpecs}
              accentClass="text-purple-400/80 hover:text-purple-300"
            />
            <MembershipCta
              paymentKey="elite_residency"
              processingKey={processingKey}
              onInitialize={handleInitializeMembership}
              className="text-purple-400 bg-slate-950 border border-slate-900 hover:bg-purple-950/50"
            />
          </div>
        </div>

        {/* CARD 6: CORPORATE MOBILE B2B */}
        <div className="p-5 bg-slate-900/40 border border-emerald-500/20 rounded-xl flex flex-col justify-between group hover:border-emerald-500/40 transition-colors shadow-lg shadow-emerald-950/5">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-emerald-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
                Corporate Workspace Lab
              </span>
              <h3 className="text-md font-black text-slate-200 uppercase mt-2">Corporate Mobile B2B</h3>
              <div className="text-xl font-black text-emerald-400 tracking-tight mt-1.5">
                $1,000 <span className="text-[10px] font-normal text-slate-500">/ Flat Value</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal min-h-[64px]">
              An elite on-site ergonomics and spinal decompression clinic for corporate teams. Uses high-throughput
              biometric scanning to map and eliminate computer-desk posture compression patterns.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-900">
              <li className="flex items-center gap-2 text-emerald-400">✓ Up to 10 Key Employee Telemetry Profiles</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ 10-Minute High-Throughput On-Site Scans</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ Interactive Workspace Stress-Line Maps</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ Personal Digital Ergonomic Action Blueprints</li>
              <li className="flex items-center gap-2 text-emerald-400">✓ 3-Minute Rapid Desk Restorative Circuits</li>
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
      <div className="mt-8 bg-slate-900/30 border border-dashed border-cyan-500/20 rounded-xl flex flex-col lg:flex-row items-center justify-between text-center lg:text-left p-4 lg:p-6 gap-4 font-mono group hover:border-cyan-500/40 transition-all shadow-lg shadow-cyan-950/5">
        <div className="flex flex-col items-center lg:items-start justify-center text-center lg:text-left w-full space-y-2 max-w-2xl">
          <div className="flex flex-col items-center lg:items-start justify-center text-center lg:text-left w-full gap-3">
            <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-cyan-400 font-bold border border-slate-800 rounded-full tracking-wider uppercase">
              Global Remote Access
            </span>
            <h3 className="text-md font-black text-slate-200 uppercase">
              <span className="text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                VIRTUAL
              </span>{' '}
              MATRIX PORTAL
            </h3>
          </div>
          <p className="text-slate-400 text-xs font-sans leading-relaxed font-normal text-center lg:text-left mx-auto lg:mx-0">
            No location constraints. Record your movement sequences anywhere in the world following our strict video
            positioning telemetry guidelines, upload them securely to your portal, and unlock a fully decoded
            biomechanical blueprint analysis with high-art skeletal tracking degree overlays paired with your custom
            4-week restoration plan.
          </p>
          <SpecsToggle
            packageId="virtual_portal"
            onViewSystemSpecs={openSpecs}
            accentClass="text-cyan-400/80 hover:text-cyan-300"
            className="text-center lg:text-left mb-0 mt-1"
          />
        </div>

        <div className="flex flex-col items-center lg:items-end justify-center min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6 shrink-0">
          <div className="text-xl font-black text-cyan-400 tracking-tight">
            $79 <span className="text-[10px] font-normal text-slate-500">/ Remote Run</span>
          </div>
          <MembershipCta
            paymentKey="virtual_portal"
            processingKey={processingKey}
            onInitialize={handleInitializeMembership}
            className="text-cyan-400 bg-slate-950 border border-slate-800 hover:border-cyan-400 mt-3 p-2.5"
          />
        </div>
      </div>
    </div>
  );
}
