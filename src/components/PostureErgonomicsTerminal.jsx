import React from 'react';
import { DEFAULT_STANDING_HOLOGRAM_PANEL } from '../constants/guideAssets';
import SecurityLockOverlay from './SecurityLockOverlay';
import TelemetryPipelineUplink from './TelemetryPipelineUplink';

const POSTURE_ERGONOMICS_CARDS = [
  {
    id: 'pe_cervical',
    tag: '// ASSESSMENT_3-1 //',
    title: 'SEATED DESK NECK MOBILITY',
    blocks: [
      {
        label: '[ BIOMECHANICAL REALITY ]',
        text:
          'Maps exact forward head distances, cervical spine angles, and shoulder rounding vectors directly at your workstation layout. We project an invisible geometric grid over your profile, calculating the precise centimeter displacement of your ear lobe relative to your shoulder axis.',
      },
      {
        label: '[ THE UNFAIR ADVANTAGE ]',
        text:
          'For every inch your head drifts forward, it adds an extra 10 pounds of pressure on your spine. We isolate this leverage trap so you can optimize monitor, desk, and chair heights for effortless alignment.',
      },
      {
        label: '[ THE SALES PITCH ]',
        text:
          "That nagging afternoon headache isn't stress—it's an unmapped postural deficit. Map your desk alignment grid and reclaim pain-free upper-back energy for the rest of your day.",
      },
    ],
  },
  {
    id: 'pe_axis',
    tag: '// ASSESSMENT_3-2 //',
    title: 'POSTURE AXIS TRACKING',
    blocks: [
      {
        label: '[ BIOMECHANICAL REALITY ]',
        text:
          'Indexes plumb-line deviation from ear through shoulder, hip, and ankle stacks in your habitual standing and seated postures. Charts anterior/posterior axis drift that desk compression quietly engraves into your skeleton.',
      },
      {
        label: '[ THE UNFAIR ADVANTAGE ]',
        text:
          'Separates true structural lean from temporary fatigue sway, giving you a calibrated axis map before chronic mid-back and hip compensation sets in.',
      },
      {
        label: '[ THE SALES PITCH ]',
        text:
          'Your posture axis is the silent architecture of focus and stamina. Correct the stack and your body stops burning energy just to stay upright.',
      },
    ],
  },
  {
    id: 'pe_hold',
    tag: '// ASSESSMENT_3-3 //',
    title: 'SINGLE-LEG HOLD STABILITY',
    blocks: [
      {
        label: '[ BIOMECHANICAL REALITY ]',
        text:
          'Exposes hidden left-to-right micro-instabilities and stabilizer sway frequencies under persistent load. Traces Center of Mass drift frame-by-frame to quantify ankle and glute-medius twitch rates after long sitting cycles.',
      },
      {
        label: '[ THE UNFAIR ADVANTAGE ]',
        text:
          'Catches high-frequency, 2-millimeter micro-wobbles instantly — flagging desk-driven hip and ankle weakness before it alters daily walking mechanics.',
      },
      {
        label: '[ THE SALES PITCH ]',
        text:
          'Balance is your biological insurance policy against joint degeneration. This test is a digital truth serum for a nervous system flattened by the chair.',
      },
    ],
  },
  {
    id: 'pe_lumbar',
    tag: '// ASSESSMENT_3-4 //',
    title: 'LUMBAR SPINE & PELVIC MOVEMENT',
    blocks: [
      {
        label: '[ BIOMECHANICAL REALITY ]',
        text:
          'Isolates lower spine compression markers, measuring pelvic tilt angles and deep lumbar flattening under prolonged sedentary loading cycles. Reveals if desk habit is causing shortened stride or uneven hip hiking when you stand.',
      },
      {
        label: '[ THE UNFAIR ADVANTAGE ]',
        text:
          'Identifies hidden skeletal shifts and compression lines, showing exactly how sitting is reshaping your skeleton so your body works for you—not against you.',
      },
      {
        label: '[ THE SALES PITCH ]',
        text:
          'Desk work glues the pelvis into a rigid cage. Unlock lumbar–pelvic motion and free the stride, breath, and low-back resilience your workday stole.',
      },
    ],
  },
  {
    id: 'pe_shoulder',
    tag: '// ASSESSMENT_3-5 //',
    title: 'SHOULDER ROTATION DISSOCIATION',
    blocks: [
      {
        label: '[ BIOMECHANICAL REALITY ]',
        text:
          'Quantifies upper-trunk and shoulder girdle dissociation — how cleanly the rib cage and scapulae rotate independent of the pelvis under seated axial lockout and reach vectors.',
      },
      {
        label: '[ THE UNFAIR ADVANTAGE ]',
        text:
          'Exposes rib-cage rigidity and scapular winging that strangle breathing mechanics and force compensatory lumbar twist during every reach toward the keyboard or mouse.',
      },
      {
        label: '[ THE SALES PITCH ]',
        text:
          'Unlock shoulder rotation dissociation and you free respiration, reach range, and pain-free overhead clearance in one corporate-ready vector.',
      },
    ],
  },
];

export default function PostureErgonomicsTerminal({
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
      {renderSystemHeader?.('POSTURE_ERGONOMICS_COMPRESSION_MATRIX')}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center relative z-40">
        <div className="w-full max-w-7xl mx-auto bg-slate-950/85 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-6 font-mono text-xs animate-fade-in mt-6 z-40">
          <div className="border-b border-slate-900 pb-4 mb-2">
            <p className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-1">
              // POSTURE & ERGONOMICS // CLINICAL EVALUATION SUB-TERMINAL
            </p>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Corporate Desk Compression Defense Suite
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto pt-6 font-mono">
            <div className="lg:col-span-4 flex justify-center sticky top-6">
              <div className="w-full bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex items-center justify-center">
                <img
                  src={DEFAULT_STANDING_HOLOGRAM_PANEL || 'https://i.imgur.com/TL3ptqN.png'}
                  alt="Standing holographic telemetry anchor"
                  className="w-full h-auto object-contain rounded-xl max-h-[750px] opacity-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                {POSTURE_ERGONOMICS_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden p-5 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col justify-between group hover:border-emerald-500/30 transition-colors min-h-[280px] text-left"
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
                        <p className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                          {card.tag}
                        </p>
                        <h3 className="text-lg font-black text-white tracking-wider uppercase leading-snug">
                          {card.title}
                        </h3>
                      </div>

                      {card.blocks.map((block) => {
                        const isClosingCopy =
                          block.label.includes('THE HOOK') || block.label.includes('THE SALES PITCH');
                        return (
                          <div key={block.label} className={isClosingCopy ? 'pt-1' : 'space-y-1'}>
                            {!isClosingCopy && (
                              <p className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
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
                      className="w-full text-center bg-slate-900 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold font-mono tracking-widest uppercase text-[11px] py-2.5 px-4 rounded-lg mt-5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
                    >
                      [ INITIALIZE ASSESSMENT SUITE ]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TelemetryPipelineUplink paypalUrl="https://www.paypal.com/ncp/payment/2XQD57AVKMP3G" />

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
