import React from 'react';
import { ATHLETE_PRECISION_HOLOGRAM_PANEL } from '../constants/guideAssets';
import SecurityLockOverlay from './SecurityLockOverlay';
import TelemetryPipelineUplink from './TelemetryPipelineUplink';
import TitleWithCyberSphere from './TitleWithCyberSphere';

const ATHLETE_PRECISION_CARDS = [
  {
    id: 'ap_neck',
    tag: '// ASSESSMENT_2-1 //',
    title: 'NECK MOBILITY MATRIX',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Maps cervical flexion, extension, and rotational arc vectors against cranial-to-shoulder leverage lines. Projects a precision geometric grid over your profile to index millimeter-level ear-to-shoulder displacement under active neck drive.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Isolates forward-head compression traps and asymmetrical rotation locks before they cascade into chronic upper-trap overload and contact-sport head trauma risk.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Your neck is the shock absorber for the entire kinetic chain. Chart its true mobility envelope and reclaim pain-free range under load.',
      },
    ],
  },
  {
    id: 'ap_single',
    tag: '// ASSESSMENT_2-2 //',
    title: 'DYNAMIC SINGLE-LEG SQUAT',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          "Explicitly screens for dynamic frontal-plane knee valgus (inward knee buckling) and pelvic drop vectors during single-leg loading. Processes at 240 FPS to catch the exact millisecond a young athlete's knee tracking deviates even 2 millimeters inward from their foot axis.",
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Exposes the leading indicator for catastrophic, non-contact ACL tears. Human eyes miss this micro-collapse; the AI catches it instantly.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          "An ACL tear can steal a scholarship. We don't wait for the injury to happen. We fix the hip weakness before it turns into a season-ending tragedy.",
      },
    ],
  },
  {
    id: 'ap_spinal',
    tag: '// ASSESSMENT_2-3 //',
    title: 'MULTI-PLANE SPINAL ARTICULATION',
    subtitle: 'BACK MOBILITY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Tracks segmental vertebral extension and flexion curves across standing and prone capture packs. Calculates true thoracic-to-lumbar contribution ratios without intrusive sensors.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Separates frozen spinal segments from hyper-mobile zones so your lower back stops overcompensating for a locked mid-spine.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Age is measured in spinal elasticity, not years. Pinpoint locked vertebrae and reverse decades of sedentary structural wear.',
      },
    ],
  },
  {
    id: 'ap_shoulder',
    tag: '// ASSESSMENT_2-4 //',
    title: 'SHOULDER GIRDLE TELEMETRY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Maps scapular upward rotation, glenohumeral clearance arcs, and bilateral girdle symmetry under controlled elevation and reach vectors.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Flags early scapular winging and restricted overhead pathways before they become rotator-cuff irritation or desk-driven shoulder pinch.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Stable shoulders are the launch rails for every press, throw, and carry. Telemetry the girdle and protect your kinetic ceiling.',
      },
    ],
  },
  {
    id: 'ap_overhead',
    tag: '// ASSESSMENT_2-5 //',
    title: 'OVERHEAD BILATERAL SQUAT',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Measures multi-segmental kinetic synchronization, tracking absolute alignment between overhead hands, thoracic spine, hips, and ankles. Runs coordinate-matching matrix calculations across the entire kinetic chain to map a rapidly shifting Center of Mass (CoM).',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Catches ankle restrictions and shoulder tightness, preventing youth sports fatigue and chronic growth-plate strain (like Osgood-Schlatter).',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'When kids grow fast, their brains lose track of their limbs. Recalibrate their system to ensure explosive power on a symmetrical foundation.',
      },
    ],
  },
];

export default function AthletePrecisionTerminal({
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
      {renderSystemHeader?.('ATHLETE_PRECISION_DURABILITY_MATRIX')}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center relative z-40">
        <div className="w-full max-w-7xl mx-auto bg-slate-950/85 backdrop-blur-xl border border-amber-500/20 rounded-xl p-6 font-mono text-xs animate-fade-in mt-6 z-40">
          {/* Full-bleed suite breadcrumb — spans both command columns */}
          <div className="border-b border-slate-900 pb-4 mb-2">
            <p className="text-sm font-bold tracking-widest text-amber-400 uppercase mb-1">
              // ATHLETE PRECISION // CLINICAL EVALUATION SUB-TERMINAL
            </p>
            <TitleWithCyberSphere size="md">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                Youth Symmetry & Multi-Plane Durability Suite
              </h2>
            </TitleWithCyberSphere>
          </div>

          {/* Split-screen laboratory command center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto pt-6 font-mono">
            {/* Left Visual Anchor */}
            <div className="lg:col-span-4 flex justify-center sticky top-6">
              <div className="w-full bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex items-center justify-center">
                <img
                  src={ATHLETE_PRECISION_HOLOGRAM_PANEL}
                  alt="Standing holographic telemetry anchor"
                  className="w-full h-auto object-contain rounded-xl max-h-[750px] opacity-90 drop-shadow-[0_0_15px_rgba(245,158,11,0.12)]"
                />
              </div>
            </div>

            {/* Right Control Grid — 5-assessment package deck */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                {ATHLETE_PRECISION_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-amber-500/30 transition-colors min-h-[280px] text-left"
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
                        <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                          {card.tag}
                        </p>
                        <TitleWithCyberSphere size="xs">
                          <div>
                            <h3 className="text-lg font-black text-white tracking-wider uppercase leading-snug">
                              {card.title}
                            </h3>
                            {card.subtitle ? (
                              <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                                {card.subtitle}
                              </p>
                            ) : null}
                          </div>
                        </TitleWithCyberSphere>
                      </div>

                      {card.blocks.map((block) => {
                        const isClosingCopy =
                          block.label.includes('THE HOOK') || block.label.includes('THE SALES PITCH');
                        return (
                          <div key={block.label} className={isClosingCopy ? 'pt-1' : 'space-y-1'}>
                            {!isClosingCopy && (
                              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
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
                      className="w-full text-center bg-slate-900 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold font-mono tracking-widest uppercase text-[11px] py-2.5 px-4 rounded-lg mt-5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer"
                    >
                      [ INITIALIZE ASSESSMENT SUITE ]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TelemetryPipelineUplink paypalUrl="https://www.paypal.com/ncp/payment/NNMTPHBWZYK54" />

          <div className="font-mono text-slate-400 text-center uppercase tracking-widest text-[11px] pt-8 border-t border-slate-900/60 mt-6">
            // [ SYSTEM MESSAGE ] – Contact us to build your custom precision assessment package to fit your needs.
            Route communications securely to:{' '}
            <a
              href="mailto:MATTA.longevity.lab@gmail.com"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors cursor-pointer"
            >
              MATTA.longevity.lab@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
