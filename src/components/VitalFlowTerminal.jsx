import React from 'react';
import { DEFAULT_STANDING_HOLOGRAM_PANEL } from '../constants/guideAssets';
import SecurityLockOverlay from './SecurityLockOverlay';
import TelemetryPipelineUplink from './TelemetryPipelineUplink';

const VITAL_FLOW_CARDS = [
  {
    id: 'vf_neck',
    tag: '// ASSESSMENT_1-1 //',
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
          'Isolates forward-head compression traps and asymmetrical rotation locks before they cascade into chronic upper-trap overload and afternoon headache cycles.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Your neck is the shock absorber for the entire kinetic chain. Chart its true mobility envelope and reclaim pain-free range under load.',
      },
    ],
  },
  {
    id: 'vf_spinal',
    tag: '// ASSESSMENT_1-2 //',
    title: 'SPINAL MOVEMENT',
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
    id: 'vf_thoracic',
    tag: '// ASSESSMENT_1-3 //',
    title: 'TRUNK & THORACIC ROTATION',
    subtitle: 'UPPER TRUNK',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Quantifies upper-trunk dissociation — how cleanly the rib cage rotates independent of the pelvis. Indexes left/right transverse deflection apexes under seated axial lockout.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Exposes rib-cage rigidity that strangles breathing mechanics and forces compensatory lumbar twist during every reach and turn.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Unlock the mid-back cage and you free respiration, shoulder swing, and athletic rotational power in one vector.',
      },
    ],
  },
  {
    id: 'vf_squat',
    tag: '// ASSESSMENT_1-4 //',
    title: 'DEEP SQUAT & KINETIC DEPTH',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Analyzes dynamic lateral tracking paths, deep knee alignment profiles, and pelvic drop depth vectors under loading cycles — charting kneecap and hip millimeter trajectories against gravity.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Exposes hidden structural micro-collapses at the bottom of your movement before they manifest as chronic pain.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          "You don't have bad knees; you have unmapped muscles that are not firing. Secure the Body Blueprint to rebuild bulletproof depth.",
      },
    ],
  },
  {
    id: 'vf_hold',
    tag: '// ASSESSMENT_1-5 //',
    title: 'SINGLE-LEG HOLD STABILITY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Exposes hidden left-to-right micro-instabilities and stabilizer sway frequencies under persistent load. Traces Center of Mass drift frame-by-frame to quantify ankle and glute-medius twitch rates.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Catches high-frequency, 2-millimeter micro-wobbles instantly — flagging deep weakness before it alters daily walking mechanics.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Balance is your biological insurance policy against joint degeneration. This test is a digital truth serum for your nervous system.',
      },
    ],
  },
  {
    id: 'vf_shoulder',
    tag: '// ASSESSMENT_1-6 //',
    title: 'SHOULDER FLEXION TELEMETRY',
    blocks: [
      {
        label: '[ THE REALITY ]',
        text:
          'Maps scapular upward rotation, glenohumeral clearance arcs, and bilateral symmetry under controlled elevation and reach vectors.',
      },
      {
        label: '[ THE ADVANTAGE ]',
        text:
          'Flags early restricted overhead pathways before they become rotator-cuff irritation or desk-driven shoulder pinch.',
      },
      {
        label: '[ THE HOOK ]',
        text:
          'Stable shoulders are the launch rails for every press, throw, and carry. Telemetry the girdle and protect your kinetic ceiling.',
      },
    ],
  },
];

export default function VitalFlowTerminal({
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
      {renderSystemHeader?.('VITAL_FLOW_DECOMPRESSION_MATRIX')}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center relative z-40">
        <div className="w-full max-w-7xl mx-auto bg-slate-950/85 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 font-mono text-xs animate-fade-in mt-6 z-40">
          {/* Full-bleed suite breadcrumb — spans both command columns */}
          <div className="border-b border-slate-900 pb-4 mb-2">
            <p className="text-sm font-bold tracking-widest text-cyan-400 uppercase mb-1">
              // VITAL FLOW // CLINICAL EVALUATION SUB-TERMINAL
            </p>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Longevity Blueprint // 6-Assessment Suite
            </h2>
          </div>

          {/* Split-screen laboratory command center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto pt-6 font-mono">
            {/* Left Visual Anchor */}
            <div className="lg:col-span-4 flex justify-center sticky top-6">
              <div className="w-full bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex items-center justify-center">
                <img
                  src={DEFAULT_STANDING_HOLOGRAM_PANEL}
                  alt="Standing holographic telemetry anchor"
                  className="w-full h-auto object-contain rounded-xl max-h-[750px] opacity-90 drop-shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                />
              </div>
            </div>

            {/* Right Control Grid — 6-assessment package deck */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                {VITAL_FLOW_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-cyan-500/30 transition-colors min-h-[280px] text-left"
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
                        <p className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
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
                              <p className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
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
                      className="w-full text-center bg-slate-900 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-bold font-mono tracking-widest uppercase text-[11px] py-2.5 px-4 rounded-lg mt-5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer"
                    >
                      [ INITIALIZE ASSESSMENT SUITE ]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TelemetryPipelineUplink paypalUrl="https://www.paypal.com/ncp/payment/S57K4AP9GTWF8" />
        </div>
      </div>
    </div>
  );
}
