import React from 'react';
import { DEFAULT_STANDING_HOLOGRAM_PANEL } from '../constants/guideAssets';

/**
 * Client-facing kinetic blueprint art box —
 * personalized biometricPhotoUrl with standing hologram master fallback.
 */
export default function ClientBiometricArtBox({ clientData }) {
  // Absolute master fallback — standing telemetry wireframe graphic
  const GLOBAL_DEFAULT_TEMPLATE_URL =
    DEFAULT_STANDING_HOLOGRAM_PANEL || 'https://i.imgur.com/TL3ptqN.png';

  // Coach panel image URL, or template if the dossier row is empty
  const activeArtSource = clientData?.biometricPhotoUrl || GLOBAL_DEFAULT_TEMPLATE_URL;

  return (
    <div className="w-full h-full min-h-[400px] border border-slate-800/40 rounded bg-slate-950/20 backdrop-blur-sm p-4 flex flex-col justify-between relative overflow-hidden">
      {/* SECTION HEADER LABELS */}
      <div className="text-slate-500 text-[9px] font-mono tracking-widest mb-3 uppercase">
        // DECODED KINETIC BLUEPRINT ART //
      </div>

      {/* THE IMAGE FIELD: Automatically shifts from global template to personalized asset */}
      <div className="flex-1 flex justify-center items-center overflow-hidden">
        <img
          key={activeArtSource}
          src={activeArtSource}
          alt="Biomechanical Network Vector"
          className="w-full h-auto object-contain max-h-[60vh] transition-all duration-500 ease-in-out"
          onError={(e) => {
            // Hard safety catch: broken URL locks back onto the standard layout template
            if (e.currentTarget.src !== GLOBAL_DEFAULT_TEMPLATE_URL) {
              e.currentTarget.src = GLOBAL_DEFAULT_TEMPLATE_URL;
            }
          }}
        />
      </div>

      {/* SUB-TEXT ACCENT LABEL */}
      <div className="text-center mt-4 text-[#00FFFF] font-mono text-[10px] tracking-widest uppercase">
        body longevity blueprint
      </div>
    </div>
  );
}
