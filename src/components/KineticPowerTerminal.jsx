import React from 'react';
import { KINETIC_POWER_HOLOGRAM_PANEL } from '../constants/guideAssets';
import { PACKAGE_PANEL_KEYS } from '../utils/packageHologramMedia';
import PackageHologramAnchor from './PackageHologramAnchor';
import SecurityLockOverlay from './SecurityLockOverlay';
import TelemetryPipelineUplink from './TelemetryPipelineUplink';
import TitleWithCyberSphere from './TitleWithCyberSphere';

export default function KineticPowerTerminal({
  cards = [],
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
        <div className="w-full max-w-7xl mx-auto bg-slate-950/85 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-6 font-mono text-xs animate-fade-in z-40">
          <div className="border-b border-slate-900 pb-4 mb-2">
            <p className="text-sm font-bold tracking-widest text-indigo-400 uppercase mb-1">
              // KINETIC POWER INTEGRITY // COMBAT BIOMECHANICS SUB-TERMINAL
            </p>
            <TitleWithCyberSphere size="md">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                Strike Force Transmission & Impact Stability Suite
              </h2>
            </TitleWithCyberSphere>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto pt-6 font-mono">
            <div className="lg:col-span-4 flex justify-center sticky top-6">
              <PackageHologramAnchor
                panelKey={PACKAGE_PANEL_KEYS.KINETIC_POWER}
                staticImageSrc={KINETIC_POWER_HOLOGRAM_PANEL}
                glowClassName="drop-shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                accentBorderClass="border-indigo-500/30"
                accentTextClass="text-indigo-300"
              />
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                {cards.map((card) => (
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
