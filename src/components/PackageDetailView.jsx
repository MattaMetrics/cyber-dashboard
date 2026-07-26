import React, { useEffect, useState } from 'react';
import { PAYPAL_MATRIX } from '../constants/paypalMatrix';

export const PACKAGE_DETAILS = {
  vector: {
    id: 'vector',
    name: 'Vector Blueprint',
    priceLabel: '$149 / Session',
    priceAmount: '$149',
    priceSuffix: '/ Session',
    paymentKey: 'vector',
    title: '// KINETIC SEQUENCING BASICS',
    paragraphs: [
      'Our Vector Blueprint breaks movement down joint-by-joint — isolating where force leaks, compensations hide, and recovery stalls. View structural leaks in real time so you stop training guesswork and start sequencing with lab-grade clarity calculating angles, velocity, and posture millions of times per second',
      'Whether you are an executive reversing desk-bound stiffness, an athlete insulating your joints against injury, or a martial artist maximizing rotational snap, this baseline session exposes your structural blind spots. Your analysis unlocks a hyper-targeted, 4-week neurological roadmap—built for your exact vectors to eliminate pain and balance your movement.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ 10-MINUTE BIOMETRIC CAPTURE ]',
        detail: 'High-velocity video telemetry tracking 300+ structural metrics per second.',
      },
      {
        label: '[ NEON SKELETAL OVERLAYS ]',
        detail: 'Live, frame-by-frame joint angle and multi-plane symmetry mapping.',
      },
      {
        label: '[ ASYMMETRY EXPANSION DECK ]',
        detail: 'Instant mathematical calculation of left-vs-right kinetic discrepancies.',
      },
      {
        label: '[ 4-WEEK ROADMAP MATRIX ]',
        detail: 'A custom, non-templated mobility and activation protocol built for your vectors.',
      },
      {
        label: '[ SECURE PORTAL DEPLOYMENT ]',
        detail: 'Lifetime access to your visual telemetry reports via a unique client pin-code.',
      },
    ],
  },
  tensegrity: {
    id: 'tensegrity',
    name: 'Tensegrity Evaluation',
    priceLabel: '$299 / Evaluation',
    priceAmount: '$299',
    priceSuffix: '/ Evaluation',
    paymentKey: 'tensegrity',
    title: '// THE FASCIAL MATRIX LAWS',
    paragraphs: [
      'Tensegrity is global balance across your fascial web. Treating a single sore joint fails because the body redistributes load elsewhere—meaning local symptoms return while the true tension pattern stays intact.',
      'Our high-art 3D biometric body render maps true dynamic skeletal angles across planes of motion, exposing how your entire structural framework behaves under real-world movement stress. By bridging an intensive in-person biometric scan with continuous virtual tracking, the Tensegrity Evaluation ensures your corrections target the foundational matrix, not just the temporary complaint. This is our highly recommended system for active adults, movement artists, and athletes demanding total kinematic clarity, ongoing alignment support, and verifiable progress.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ PHASE-1 IN-PERSON SCAN ]',
        detail: 'Complete on-site telemetry mapping utilizing high-velocity computer vision.',
      },
      {
        label: '[ HIGH-ART 3D RENDER ]',
        detail: 'Full skeletal multi-plane body architecture visualization delivered straight to your portal.',
      },
      {
        label: '[ REMOTE ACCELERATION CYCLE ]',
        detail: 'Direct video check-ins during Weeks 2 & 3 to refine and grade your custom movement corrections.',
      },
      {
        label: '[ RADIAN COMPENSATORY TRACKING ]',
        detail: 'Isolation of systemic imbalances showing exactly which joints are overloading to hide weakness.',
      },
      {
        label: '[ RE-ASSESSMENT BLUEPRINT ]',
        detail: 'A complete Month-End verification scan to mathematically measure your trajectory and prove joint rebalancing.',
      },
    ],
  },
  youth: {
    id: 'youth',
    name: 'Kinetic Youth Team Blueprint',
    priceLabel: '$1,000 / Team Event',
    priceAmount: '$1,000',
    priceSuffix: '/ Team Event',
    paymentKey: 'youth_team',
    title: '// PREVENTATIVE LONGEVITY PATHWAYS',
    accentClass: 'text-amber-400',
    accentMutedClass: 'text-amber-400/80',
    paragraphs: [
      'Youth athletes adapt fastest during growth cycles—and those same windows lock in injury patterns for life if left unchecked. Early kinematic screening eliminates permanent risk before it calcifies into chronic limitation.',
      'Our high-velocity mobile telemetry lab deploys directly to your facility, systematically scanning your full roster without interrupting your practice schedule. By converting raw human movement into actionable kinetic insights, we give your program an elite-level structural shield. Parents receive clear, individualized defensive blueprints to protect their child’s athletic future. Coaches secure tactical Master Roster Reports—delivering vital structural intelligence for training programming, mechanical load management, and long-term athlete longevity across the full team.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ ROSTER-WIDE MOBILE SCANS ]',
        detail: 'High-throughput on-site filming capturing up to 20 individual athletes per event.',
      },
      {
        label: '[ GROW-CYCLE BIOMETRICS ]',
        detail: 'Instant calculations mapping growth-spurt joint imbalances and limb-length discrepancies.',
      },
      {
        label: '[ DETECT KINETIC RED FLAGS ]',
        detail:
          'Proactive calculation of landing force distribution and dangerous inward knee collapse (valgus tracking).',
      },
      {
        label: '[ PARENT PREVENTATIVE CODES ]',
        detail:
          'Specialized individual PDF download blueprints packed with age-appropriate corrective mobility cues.',
      },
      {
        label: '[ MASTER ROSTER TELEMETRY ]',
        detail:
          'A comprehensive organizational dashboard identifying which players are tracking at critical injury risk.',
      },
    ],
  },
  matrix: {
    id: 'matrix',
    name: 'Infinite Matrix Support',
    priceLabel: '$399 / Month',
    priceAmount: '$399',
    priceSuffix: '/ Month',
    paymentKey: 'infinite_matrix',
    title: '// CUSTOM CONTINUITY',
    accentClass: 'text-blue-400',
    accentMutedClass: 'text-blue-400/80',
    paragraphs: [
      'Infinite Matrix Support rebuilds structure through sustained diagnostic loops—weekly kinematic analysis, adaptive coaching cycles, and therapist-ready documentation that evolve with your body. True neurological change and tissue remodeling do not occur in isolated sessions; they require consistent tracking and iterative calibration. Recovery, performance, and high-art 3D profile updates stay synchronized until your structural matrix permanently upgrades.',
      'By keeping your movement mechanics under our continuous biomechanical lens, we eliminate old, toxic compensatory patterns before they can entrench themselves into your posture. This subscription pipeline serves as your ultimate ongoing digital shield—providing active adults, high-level fighters, and dedicated movers with constant, data-driven course corrections to lock in lasting musculoskeletal resilience.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ MACRO DIAGNOSTIC LOOPS ]',
        detail:
          '3 comprehensive, multi-angle in-person biometric screenings deployed over your membership timeline.',
      },
      {
        label: '[ WEEKLY VIRTUAL STREAMING ]',
        detail:
          'Remote video calibration windows to analyze and score your corrective movement mechanics in real time.',
      },
      {
        label: '[ DYNAMIC LAB ADJUSTMENTS ]',
        detail:
          'Fully personalized, data-derived monthly coaching roadmap updates delivered straight to your portal.',
      },
      {
        label: '[ CLINICAL INTERFACE SPECS ]',
        detail:
          'Comprehensive, therapist-ready postural blueprint data documentation optimized for your medical or sports-medicine network.',
      },
      {
        label: '[ TELEMETRY ACCOUNTABILITY ]',
        detail:
          'Ongoing, live updates to your personal 3D blue wireframe digital profile to mathematically verify your global alignment trajectory.',
      },
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite Residency',
    priceLabel: '$499 / 60 Days',
    priceAmount: '$499',
    priceSuffix: '/ 60 Days',
    paymentKey: 'elite_residency',
    title: '// PREMIUM TRACK',
    accentClass: 'text-purple-400',
    accentMutedClass: 'text-purple-400/80',
    paragraphs: [
      'The Elite Matrix Residency is an intensive, 8-week immersion designed to permanently overwrite deeply entrenched compensatory movement patterns. Where standard evaluations pinpoint local stressors, the Residency executes a continuous 60-day diagnostic loop. By keeping your biometric stream completely live across your daily routines, we adjust your movement vectors in real-time as your tissue and nervous system adapt.',
      'This premium track provides absolute structural focus. Through high-frequency in-person scans combined with structured digital video case logs, every step of your recovery or performance timeline is mathematically tracked and validated. VIP lab priority and co-authored clinical frameworks deliver the deepest, most comprehensive structural transformation path available in the lab matrix.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ 60-DAY STRUCTURAL MATRIX ]',
        detail: 'A fully immersive, multi-stage trajectory engineered for permanent tissue remodeling.',
      },
      {
        label: '[ HIGH-FREQUENCY SCANS ]',
        detail:
          '4 comprehensive, multi-angle in-person tracking sessions deployed at exact bi-weekly milestones.',
      },
      {
        label: '[ SECURE DIGITAL CASE LOGS ]',
        detail: 'Seamless remote video pipelines to upload and grade your daily corrective technique.',
      },
      {
        label: '[ DAILY VECTOR VARIATIONS ]',
        detail:
          'Micro-adjustments to your daily mobility and movement maps based on ongoing telemetry feedback.',
      },
      {
        label: '[ CLINICAL RESIDENCY DECK ]',
        detail:
          'A comprehensive, co-authored structural dossier optimized for your physical therapy or orthopedic network.',
      },
    ],
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Mobile B2B',
    priceLabel: '$1,000 / Flat Value',
    priceAmount: '$1,000',
    priceSuffix: '/ Flat Value',
    paymentKey: 'corporate_b2b',
    title: '// WORKSPACE COMPRESSION & DECOMPRESSION',
    accentClass: 'text-emerald-400',
    accentMutedClass: 'text-emerald-400/80',
    paragraphs: [
      'Corporate Mobile B2B deploys high-throughput ergonomic scanning on-site—mapping desk compression patterns across key employees before they become a chronic company liability. Sedentary workspace environments quietly degrade spinal health, draining daily employee focus, elevating absenteeism, and tanking late-afternoon productivity.',
      'Our mobile telemetry lab integrates seamlessly into your corporate headquarters, delivering absolute operational efficiency with zero workplace disruption. Interactive stress-line maps and rapid desk restorative circuits convert workplace posture failure into measurable team-wide decompression. Protect your human capital, optimize cognitive performance, and provide a premium health perk that keeps your team firing on all cylinders.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ HIGH-THROUGHPUT RUN TIMES ]',
        detail:
          'Rapid, on-site telemetry captures up to 10 key employee profiles in a single, high-efficiency morning block.',
      },
      {
        label: '[ SPINE CRADLE MAPPING ]',
        detail:
          'Advanced computer-vision tracking to isolate cervical forward shear, mid-back lockup, and unequal pelvic loading.',
      },
      {
        label: '[ ERGONOMIC MATRIX DECK ]',
        detail:
          'Individualized digital action blueprints sent securely to each employee to immediately recalibrate their desk setup.',
      },
      {
        label: '[ 3-MINUTE RESTORATIVE DRILLS ]',
        detail:
          'Micro-activation circuits engineered to undo spinal compression right at their workstation without sweating.',
      },
      {
        label: '[ COMPANY ASSET INSULATION ]',
        detail:
          'Proactive wellness intervention that minimizes health insurance liabilities and reduces ergonomic workplace fatigue.',
      },
    ],
  },
  virtual_portal: {
    id: 'virtual_portal',
    name: 'Virtual Matrix Portal',
    priceLabel: '$79 / Remote Run',
    priceAmount: '$79',
    priceSuffix: '/ Remote Run',
    paymentKey: 'virtual_portal',
    title: '// GLOBAL REMOTE TELEMETRY INTERFACE',
    accentClass: 'text-cyan-400',
    accentMutedClass: 'text-cyan-400/80',
    paragraphs: [
      'The Virtual Matrix Portal completely removes geographic constraints, allowing you to stream your personal biomechanics into our secure laboratory environment from anywhere on earth. By bypassing the need for an in-person visit, you gain direct access to advanced computer-vision tracking that processes millions of spatial data points per second. This is a digital journey in precision self-knowledge.',
      'Whether you are an elite athlete seeking a hidden mechanical edge over the competition, or a dedicated mover intent on unlocking full structural longevity, this remote pipeline decodes your exact movement vectors. Simply record your movement sequences following our strict positioning guidelines, upload them to your private deck, and receive a fully visualized skeletal tracking blueprint paired with your custom 4-week restoration plan. Our advanced tracking extracts millions of skeletal coordinates per second.',
    ],
    phaseDeckTitle: '[ SYSTEM PHASE DECK // ]',
    phases: [
      {
        label: '[ ABSOLUTE DATA ISOLATION ]',
        detail:
          'Your video files are fully encrypted, processed locally, and completely hidden from public networks to protect your privacy.',
      },
      {
        label: '[ COMPASS TELEMETRY OVERLAYS ]',
        detail:
          'High-contrast, glowing blue skeletal overlays mapping frame-by-frame joint angles and symmetry markers.',
      },
      {
        label: '[ THE COMPETITIVE EDGE ]',
        detail:
          'Instantly uncover hidden kinetic energy leaks and structural limitations without stepping foot in a physical facility.',
      },
      {
        label: '[ VECTOR PATHWAY EXPANSION ]',
        detail:
          'A personalized, data-derived 4-week mobility and activation plan delivered straight to your secure terminal.',
      },
    ],
  },
};

export default function PackageDetailView({ packageId, onReturn, onPaymentInitiated }) {
  const detail = PACKAGE_DETAILS[packageId] || PACKAGE_DETAILS.vector;
  const accentClass = detail.accentClass || 'text-cyan-400';
  const accentMutedClass = detail.accentMutedClass || 'text-cyan-400/80';
  const paymentKey = detail.paymentKey || packageId;
  const [isSecuringGateway, setIsSecuringGateway] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onReturn();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReturn]);

  const handleInitializeMembership = () => {
    if (isSecuringGateway) return;
    const destinationUrl = PAYPAL_MATRIX[paymentKey];
    if (!destinationUrl) {
      alert('⚡ PAYMENT GATEWAY OFFLINE // LINK NOT CONFIGURED FOR THIS MATRIX TIER');
      return;
    }

    setIsSecuringGateway(true);
    setTimeout(() => {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      setIsSecuringGateway(false);
      if (typeof onPaymentInitiated === 'function') onPaymentInitiated(paymentKey);
    }, 1500);
  };

  const phaseList = detail.phases?.length > 0 && (
    <ul className="space-y-3.5 font-mono text-sm md:text-base">
      {detail.phases.map((phase) => (
        <li key={phase.label} className="flex gap-2 leading-relaxed">
          <span className={`${accentMutedClass} shrink-0`}>•</span>
          <span className="text-slate-300 font-sans font-normal">
            <span className={`${accentClass} font-mono font-bold tracking-wide`}>{phase.label}</span>
            <span className="text-slate-500"> – </span>
            {phase.detail}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-screen h-screen bg-[#01040a] text-white font-mono flex flex-col overflow-hidden animate-fade-in relative">
      <div className="w-full border-b border-slate-900 bg-slate-950/90 px-6 py-4 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <button
          type="button"
          onClick={onReturn}
          className="px-3 py-1.5 border border-slate-800 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-950 font-bold tracking-wider transition-all uppercase cursor-pointer active:scale-95 text-xs"
        >
          [ESC] RETURN TO MATRIX TIERS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12">
        <div className="w-full max-w-6xl mx-auto pt-10 font-mono text-slate-200 text-lg md:text-xl">
          <div className="space-y-2 border-b border-slate-900 pb-5 mb-8">
            <span className={`text-[10px] font-bold tracking-widest uppercase block ${accentClass}`}>
              // PACKAGE IMMERSION DECK
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-100 uppercase tracking-tight">
              {detail.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <h3
                className={`${accentClass} font-black tracking-widest uppercase text-base md:text-lg text-center w-full block`}
              >
                {detail.title}
              </h3>

              {detail.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="font-sans text-slate-300 text-base md:text-lg leading-relaxed font-normal w-full"
                >
                  {paragraph}
                </p>
              ))}

              {detail.phases?.length > 0 && (
                <div className="w-full">
                  <div
                    className={`${accentClass} font-black tracking-widest uppercase text-sm md:text-base text-center w-full block mt-8 mb-4`}
                  >
                    {detail.phaseDeckTitle || '[ SYSTEM PHASE DECK // ]'}
                  </div>
                  {phaseList}
                </div>
              )}
            </div>

            <div className="lg:col-span-1 border-l border-slate-800/80 pl-6 h-full justify-self-end flex flex-col items-center justify-center">
              <div className="text-xl font-black text-cyan-400 tracking-tight text-center mb-4">
                {detail.priceAmount}{' '}
                <span className="text-[10px] font-normal text-slate-500">{detail.priceSuffix}</span>
              </div>
              <button
                type="button"
                disabled={isSecuringGateway}
                onClick={handleInitializeMembership}
                className={`bg-cyan-400 text-slate-950 font-bold font-mono tracking-widest uppercase text-[10px] p-3 rounded-lg w-full max-w-[220px] hover:bg-cyan-300 transition-colors cursor-pointer active:scale-95 disabled:cursor-wait ${
                  isSecuringGateway ? 'animate-pulse' : ''
                }`}
              >
                {isSecuringGateway ? '[ SECURING GATEWAY... ]' : 'Initialize Membership'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
