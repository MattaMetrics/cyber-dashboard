import React from 'react';

const GROUP_LABEL =
  'text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 px-0.5';

const BTN_BASE =
  'w-full text-center font-mono text-sm font-bold uppercase tracking-wide py-3 rounded-lg border-2 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none';

const BTN_NAV = `${BTN_BASE} border-cyan-500 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,0.28)] hover:brightness-110`;

const BTN_LAB = `${BTN_BASE} border-purple-500 bg-purple-500/5 text-purple-400 hover:bg-purple-500/15 hover:text-purple-300 hover:shadow-[0_0_22px_rgba(168,85,247,0.32)] hover:brightness-110`;

const BTN_DELIVER = `${BTN_BASE} border-emerald-500 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 hover:shadow-[0_0_22px_rgba(16,185,129,0.32)] hover:brightness-110`;

/**
 * Three-tier tactical command rail — shared by Coach Dashboard & Upload Lab sidebar.
 */
export default function TacticalWorkflowButtonStack({
  onMasterDirectory,
  onOpenReportViewer,
  onUploadLab,
  onFetchYolo,
  onCompilePdf,
  isFetchingYolo = false,
  isCompilingPdf = false,
  uploadLabActive = false,
  yoloTelemetryPanel = null,
}) {
  return (
    <div className="font-mono space-y-4 pt-1">
      {/* Group 1 — Navigation */}
      <div className="space-y-2">
        <p className={GROUP_LABEL}>// Group 01 — Navigation Uplink</p>
        <button type="button" onClick={onMasterDirectory} className={BTN_NAV}>
          ⚙️ [ Run Master Assessment Directory View // ]
        </button>
        <button type="button" onClick={onOpenReportViewer} className={BTN_NAV}>
          👁 [ Open Blueprint Report Viewer // ]
        </button>
      </div>

      {/* Group 2 — Lab Workspace */}
      <div className="space-y-2">
        <p className={GROUP_LABEL}>// Group 02 — Lab Workspace</p>
        <button
          type="button"
          onClick={onUploadLab}
          className={`${BTN_LAB}${uploadLabActive ? ' bg-purple-500/20 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.22)]' : ''}`}
        >
          📐 [ Longevity Blueprint Assessments // Upload Lab ]
        </button>
        <button
          type="button"
          onClick={onFetchYolo}
          disabled={isFetchingYolo}
          className={BTN_LAB}
        >
          {isFetchingYolo
            ? '⏳ [ Fetching YOLO Lab Data // ]'
            : '🧬 [ Fetch Latest YOLO Lab Data // ]'}
        </button>
        {yoloTelemetryPanel}
      </div>

      {/* Group 3 — Deliverables */}
      <div className="space-y-2">
        <p className={GROUP_LABEL}>// Group 03 — Deliverables</p>
        <button
          type="button"
          onClick={onCompilePdf}
          disabled={isCompilingPdf}
          className={BTN_DELIVER}
        >
          {isCompilingPdf
            ? '⏳ [ Compiling PDF Stream // ]'
            : '📋 [ Compile Biomechanical PDF Report // ]'}
        </button>
      </div>
    </div>
  );
}
