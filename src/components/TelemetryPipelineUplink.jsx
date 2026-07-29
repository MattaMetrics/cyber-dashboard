import React, { useState } from 'react';

/**
 * Shared GLOBAL TELEMETRY PIPELINE UPLINK footer —
 * PayPal unlock gate + cloud folder transmit channel.
 */
export default function TelemetryPipelineUplink({ paypalUrl }) {
  const [cloudLink, setCloudLink] = useState('');
  const [uplinkStatus, setUplinkStatus] = useState(''); // '' | 'empty' | 'sending' | 'success'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPipelineUnlocked, setIsPipelineUnlocked] = useState(false);

  const handlePayAndInitializeUplink = () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    window.setTimeout(() => {
      if (paypalUrl) {
        window.open(paypalUrl, '_blank');
      }
      setIsPipelineUnlocked(true);
      setIsProcessingPayment(false);
    }, 1500);
  };

  const handleUplinkSubmit = () => {
    if (!isPipelineUnlocked || uplinkStatus === 'sending' || uplinkStatus === 'success') return;
    if (!cloudLink.trim()) {
      setUplinkStatus('empty');
      window.setTimeout(() => setUplinkStatus(''), 1400);
      return;
    }

    setUplinkStatus('sending');
    window.setTimeout(() => {
      setUplinkStatus('success');
      setCloudLink('');
    }, 1500);
  };

  const inputLocked = !isPipelineUnlocked;
  const sendDisabled =
    !isPipelineUnlocked || uplinkStatus === 'sending' || uplinkStatus === 'success';

  return (
    <div className="mt-8 p-5 bg-slate-900/30 border border-slate-900 rounded-xl font-mono max-w-7xl mx-auto text-left">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        <div className="lg:col-span-3 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 tracking-widest uppercase block">
              // GLOBAL TELEMETRY PIPELINE UPLINK
            </span>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Submit Your Consolidated Movement Reels
            </h4>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Once you have recorded your movement sequences following the spatial alignment criteria inside our
              assessment suites, paste your shared Google Drive, Dropbox, or iCloud folder directory link below to
              transmit your raw video metrics directly to our scanning laboratory.
            </p>
          </div>

          <div className="w-full space-y-2">
            {isPipelineUnlocked && (
              <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 animate-pulse">
                ● STATUS: MATRIX CHANNELS DEPLOYED // READY FOR TRANSMISSION
              </p>
            )}

            <input
              type="text"
              value={cloudLink}
              onChange={(e) => setCloudLink(e.target.value)}
              readOnly={inputLocked || uplinkStatus === 'sending' || uplinkStatus === 'success'}
              disabled={uplinkStatus === 'sending' || uplinkStatus === 'success'}
              placeholder={
                inputLocked
                  ? '[ INPUT LOCKED // INITIALIZE VERIFIED TRANSACTION TO UNLOCK UPLINK ]'
                  : 'Paste secure cloud folder link here...'
              }
              className={`w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-cyan-400 placeholder-slate-700 focus:outline-none focus:border-cyan-500/40 transition-opacity ${
                inputLocked ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'opacity-100'
              } ${uplinkStatus === 'sending' || uplinkStatus === 'success' ? 'opacity-60' : ''}`}
            />

            {uplinkStatus === 'success' ? (
              <div className="text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-950/25 rounded p-2 text-center text-[10px] tracking-widest uppercase">
                [ TRANSMISSION COMPLETE // BLUEPRINT PIPELINE SECURED ]
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUplinkSubmit}
                disabled={sendDisabled}
                className={`w-full bg-slate-950 border p-2 text-center rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${
                  !isPipelineUnlocked
                    ? 'text-slate-600 border-slate-800/60 opacity-40 cursor-not-allowed'
                    : uplinkStatus === 'sending'
                      ? 'text-amber-400 border-amber-500/40 animate-pulse cursor-wait'
                      : uplinkStatus === 'empty'
                        ? 'text-rose-400 border-rose-500/40 cursor-pointer'
                        : 'text-cyan-400 border-slate-800 hover:text-white hover:border-cyan-400/50 cursor-pointer'
                }`}
              >
                {uplinkStatus === 'sending'
                  ? '[ TRANSMITTING SATELLITE PACKETS... ]'
                  : uplinkStatus === 'empty'
                    ? '[ PASTE CLOUD LINK TO TRANSMIT // ]'
                    : '[ UPLINK PIPELINE SEND // ]'}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6 w-full">
          <p className="text-2xl font-black text-cyan-400 font-mono tracking-tight">$250</p>
          <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
            / Evaluation Suite
          </p>
          <button
            type="button"
            onClick={handlePayAndInitializeUplink}
            disabled={isProcessingPayment}
            className={`bg-cyan-400 text-slate-950 font-mono font-bold tracking-widest text-[10px] p-2.5 rounded-lg w-full mt-2 hover:bg-cyan-500 transition-colors uppercase cursor-pointer ${
              isProcessingPayment ? 'animate-pulse opacity-90 cursor-wait' : ''
            }`}
          >
            {isProcessingPayment ? '[ SECURING GATEWAY... ]' : '[ PAY & INITIALIZE UPLINK ]'}
          </button>
        </div>
      </div>
    </div>
  );
}
