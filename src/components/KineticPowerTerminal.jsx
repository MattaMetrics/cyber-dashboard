import React from 'react';
import { DEFAULT_STANDING_HOLOGRAM_PANEL } from '../constants/guideAssets';
import SecurityLockOverlay from './SecurityLockOverlay';
import TelemetryPipelineUplink from './TelemetryPipelineUplink';

const KINETIC_POWER_CARDS = [
  {
    id: 'kp_spinal',
    tag: '// ASSESSMENT_4-1 //',
    title: 'MULTI-PLANE SPINAL ARTICULATION',
    subtitle: 'BACK MOBILITY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Tracks segmental vertebral extension and flexion curves across standing and prone capture packs. Calculates true thoracic-to-lumbar contribution ratios that feed rotational strike torque.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Separates frozen spinal segments from hyper-mobile zones so your lower back stops overcompensating for a locked mid-spine under clinch and kick load.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Age is measured in spinal elasticity, not years. Unlock the cage and reclaim rotational power for every cross, kick, and level change.',
      },
    ],
  },
  {
    id: 'kp_neck',
    tag: '// ASSESSMENT_4-2 //',
    title: 'NECK MOBILITY MATRIX',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Maps cervical flexion, extension, and rotational arc vectors against cranial-to-shoulder leverage lines under combat-ready torso drive. Indexes millimeter-level ear-to-shoulder displacement for impact absorption.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Isolates forward-head traps and asymmetrical rotation locks before they cascade into whiplash risk, clinch vulnerability, or late-round neck fatigue.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Your neck is the shock absorber for the entire kinetic chain. Chart its true mobility envelope and build an invisible helmet of protection.',
      },
    ],
  },
  {
    id: 'kp_overhead',
    tag: '// ASSESSMENT_4-3 //',
    title: 'DEEP SQUAT WITH OVERHEAD BAR',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Measures multi-segmental kinetic synchronization with an overhead bar lockout — tracking absolute alignment between hands, thoracic spine, hips, and ankles through deep squat depth.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Catches ankle restrictions and shoulder tightness that steal guard height, sprawl quality, and explosive base recovery after a shot.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'When fighters grow stiff under camp load, their kinetic chain leaks. Recalibrate overhead depth and rebuild a symmetrical power foundation.',
      },
    ],
  },
  {
    id: 'kp_stance',
    tag: '// ASSESSMENT_4-4 //',
    title: 'FIGHT STANCE STABILITY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Checks left vs. right knee loading angles to see if a fighter overloads their lead or rear tracking leg. Tracks Center of Mass drift over a sustained stance window, plotting pelvic shift vectors for structural fatigue.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Flags exactly where you subtly shift weight off a tired hip or knee — exposing the muscle groups that fail in championship rounds.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'No weak muscle can hide when the clock is ticking. Map your survival stance and protect yourself from leg kicks and late-round takedowns.',
      },
    ],
  },
  {
    id: 'kp_shoulder',
    tag: '// ASSESSMENT_4-5 //',
    title: 'SHOULDER GIRDLE TELEMETRY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Maps scapular upward rotation, glenohumeral clearance arcs, and bilateral girdle symmetry under controlled elevation, reach, and terminal strike snap vectors.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Flags early scapular winging and restricted overhead pathways before they become rotator-cuff irritation or power-draining elbow protection patterns.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Stable shoulders are the launch rails for every cross, hook, and clinch frame. Telemetry the girdle and protect your kinetic ceiling.',
      },
    ],
  },
  {
    id: 'kp_strike',
    tag: '// ASSESSMENT_4-6 //',
    title: 'STRIKING PUNCH / KICK VECTOR ANALYSIS',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Tracks sequential energy transfer across the full strike loop: [Foot Plant] → [Hip Rotation] → [Trunk Extension] → [Terminal Velocity]. Captures punch and kick velocity vectors at high frame density without intrusive sensors.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Catches power-draining structural dips and premature elbow or knee protection that prove the brain is subconsciously throttling your strike.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'A knockout starts in the ground. Map your punch and kick velocity vectors and transform a fast strike into a fight-ending weapon.',
      },
    ],
  },
];

const PIPELINE_STAGES = [
  '1. Foot Plant // Force Entry',
  '2. Hip Rotation // Power Multiplier',
  '3. Trunk Extension // Core Stability',
  '4. Shoulder Snap // Terminal Velocity',
];

export default function KineticPowerTerminal({
  renderSystemHeader,
  onReturnToCore,
  onSelectAssessment,
  lockedCardId = null,
  isTokenValidated = false,
  isCoachMode = false,
  acceptedAccessPins = [],
  onDismissCardLock,
  onLocalTokenAccepted,
  onRetrieveAccessToken,
}) {
  const openAssessment = (id) => {
    onSelectAssessment?.(id);
  };

  return (
    <div className="w-screen h-screen bg-[#020617] text-white font-mono flex flex-col overflow-hidden">
      {renderSystemHeader?.('KINETIC_POWER_INTEGRITY_COMBAT_MATRIX')}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center relative z-40">
        <div className="w-full max-w-7xl mx-auto bg-slate-950/85 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-6 font-mono text-xs animate-fade-in mt-6 z-40">
          <div className="border-b border-slate-900 pb-4 mb-2">
            <p className="text-sm font-bold tracking-widest text-indigo-400 uppercase mb-1">
              // KINETIC POWER INTEGRITY // COMBAT BIOMECHANICS SUB-TERMINAL
            </p>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Strike Force Transmission & Impact Stability Suite
            </h2>
          </div>

          <div className="w-full rounded-xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-4 text-center shadow-[0_0_24px_rgba(99,102,241,0.08)] mt-4">
            <p className="text-[11px] md:text-xs font-black tracking-[0.18em] uppercase text-indigo-300 mb-3">
              // KINETIC SEQUENCING MATRIX Pipeline //
            </p>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-1.5 flex-wrap">
              {PIPELINE_STAGES.map((stage, index) => (
                <React.Fragment key={stage}>
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded border border-indigo-500/35 bg-slate-950/70 text-[10px] md:text-[11px] font-bold tracking-wider uppercase text-indigo-200 whitespace-nowrap">
                    [{stage}]
                  </span>
                  {index < PIPELINE_STAGES.length - 1 && (
                    <span className="text-indigo-500/70 text-xs font-black tracking-widest hidden lg:inline">
                      ----&gt;
                    </span>
                  )}
                  {index < PIPELINE_STAGES.length - 1 && (
                    <span className="text-indigo-500/70 text-xs font-black lg:hidden">↓</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto pt-6 font-mono">
            <div className="lg:col-span-4 flex justify-center sticky top-6">
              <div className="w-full bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex items-center justify-center">
                <img
                  src={DEFAULT_STANDING_HOLOGRAM_PANEL || 'https://i.imgur.com/TL3ptqN.png'}
                  alt="Standing holographic telemetry anchor"
                  className="w-full h-auto object-contain rounded-xl max-h-[750px] opacity-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                {KINETIC_POWER_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-indigo-500/30 transition-colors min-h-[260px] text-left"
                  >
                    {lockedCardId === card.id && (
                      <SecurityLockOverlay
                        isTokenValidated={isTokenValidated}
                        isCoachMode={isCoachMode}
                        acceptedAccessPins={acceptedAccessPins}
                        onClose={onDismissCardLock}
                        onLocalTokenAccepted={onLocalTokenAccepted}
                        onRetrieveAccessToken={onRetrieveAccessToken}
                      />
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1 border-b border-slate-900/80 pb-3">
                        <p className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                          {card.tag}
                        </p>
                        <h3 className="text-lg font-black text-white tracking-wider uppercase leading-snug">
                          {card.title}
                        </h3>
                        {card.subtitle ? (
                          <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                            {card.subtitle}
                          </p>
                        ) : null}
                      </div>

                      {card.blocks.map((block) => {
                        const isClosingCopy =
                          block.label.includes('THE HOOK') || block.label.includes('THE SALES PITCH');
                        return (
                          <div key={block.label} className={isClosingCopy ? 'pt-1' : 'space-y-1'}>
                            {!isClosingCopy && (
                              <p className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                                {block.label}
                              </p>
                            )}
                            <p className="text-slate-300 text-sm font-sans leading-relaxed tracking-wide">
                              {block.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAssessment(card.id);
                      }}
                      className="w-full text-center bg-slate-900 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500 hover:text-slate-950 font-bold font-mono tracking-widest uppercase text-[11px] py-2.5 px-4 rounded-lg mt-5 transition-all shadow-[0_0_10px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] cursor-pointer"
                    >
                      [ INITIALIZE ASSESSMENT SUITE ]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TelemetryPipelineUplink paypalUrl="https://www.paypal.com/ncp/payment/U8DTQJGR3AKC6" />

          <div className="font-mono text-slate-400 text-center uppercase tracking-widest text-[11px] pt-8 border-t border-slate-900/60 mt-6">
            // [ SYSTEM MESSAGE ] – Contact us to build your custom precision assessment package to fit your needs.
            Route communications securely to:{' '}
            <a
              href="mailto:MATTA.longevity.lab@gmail.com"
              className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
            >
              MATTA.longevity.lab@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
