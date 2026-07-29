import React, { useState } from 'react';

/**
 * Assessment sub-page footer — video ingest → Formspree coach uplink pipeline.
 */
export default function IntegratedTerminalFooter({
  athleteCode = '000000',
  athleteName = 'UNREGISTERED ATHLETE',
  currentTrack = 'TELEMETRY',
  onPipelineSuccess,
}) {
  const [uploadState, setUploadState] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR

  // Prefer dedicated video endpoint, then shared Formspree intake endpoint from env
  const FORMSPREE_ENDPOINT =
    import.meta.env.VITE_FORMSPREE_VIDEO_ENDPOINT ||
    import.meta.env.VITE_FORMSPREE_ENDPOINT_ID ||
    'https://formspree.io';

  const handleVideoUploadPipeline = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState('UPLOADING');
    console.log('[ INITIALIZING VIDEO INGESTION PROTOCOL... ]');

    try {
      // STEP 1: Simulate or trigger cloud asset vault generation (returns link string)
      // *For your deployment, plug in Cloudinary / Drive API snippet here*
      const mockUploadedVideoUrl = `https://longevity.lab/${athleteCode}_${Date.now()}.mp4`;

      // STEP 2: Package telemetry variables and transmit straight to Formspree endpoint
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          subject: `🚨 [ NEW MOVEMENT DATASET UPLINK ]: ${athleteName} (${athleteCode})`,
          athlete_name: athleteName,
          access_passcode: athleteCode,
          assessment_track: currentTrack,
          raw_video_vector_link: mockUploadedVideoUrl,
          video_file_name: file.name,
          video_file_size: file.size,
          timestamp: new Date().toLocaleString(),
        }),
      });

      if (response.ok) {
        setUploadState('SUCCESS');
        console.log('[ FORMSPREE PIPELINE DELIVERY SUCCESSFUL ]');
        if (typeof onPipelineSuccess === 'function') {
          onPipelineSuccess({ file, mockUploadedVideoUrl });
        }
      } else {
        throw new Error('Formspree uplink validation failure');
      }
    } catch (error) {
      setUploadState('ERROR');
      console.error(`[ CRITICAL PIPELINE EXCEPTION ]: ${error.message}`);
    } finally {
      // Allow re-selecting the same file on a subsequent attempt
      event.target.value = '';
    }
  };

  return (
    <div className="w-full mt-12 pt-6 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 font-mono">
      <div className="text-slate-500 text-[10px] tracking-wider uppercase">
        {uploadState === 'IDLE' && '[ SYSTEM CORE // ASSESMENT SUITE LIVE ]'}
        {uploadState === 'UPLOADING' && '[ 🔵 UPLINKING VIDEO TELEMETRY STREAM... ]'}
        {uploadState === 'SUCCESS' && '[ 🟢 DATASET INGESTED // LINK SENT TO COACH ]'}
        {uploadState === 'ERROR' && '[ 🔴 PIPELINE TRANSMISSION FAULT ]'}
      </div>

      <div className="flex items-center space-x-4">
        {/* Hidden native file input triggered by styled label */}
        <label
          className={`border border-[#00FFFF] bg-[#00FFFF]/5 hover:bg-[#00FFFF]/20 text-[#00FFFF] text-[10px] tracking-widest font-bold uppercase px-6 py-3 rounded transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.1)] cursor-pointer ${
            uploadState === 'UPLOADING' ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          ▲ {uploadState === 'UPLOADING' ? 'Uploading...' : 'Upload Movement Video Vector'}
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUploadPipeline}
            className="hidden"
          />
        </label>
      </div>

      <div className="text-right">
        <span className="text-slate-500 text-[10px] tracking-wider uppercase block">
          Secure Network Link:
        </span>
        <a
          href={`mailto:matta@longevity.lab?subject=Portal%20Support%20Request%20-%20Code%20${encodeURIComponent(athleteCode)}`}
          className="text-[#FF6600] hover:text-[#FF8833] text-xs font-bold tracking-widest lowercase transition-all duration-300 hover:underline"
        >
          matta@longevity.lab
        </a>
      </div>
    </div>
  );
}
