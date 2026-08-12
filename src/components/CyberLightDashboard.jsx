import React, { useEffect, useState } from 'react';
import {
  Upload,
  Cpu,
  Shield,
  Zap,
  Target,
  Layers,
  Printer,
  Save,
  RefreshCw,
  Pencil,
  X,
} from 'lucide-react';
import { buildCyberDashboardPayload } from '../utils/longevityReportData';

const ICON_MAP = { Target, Zap, Shield, Cpu };

function NarrativeBlocks({ layout, archetypeVector, caseLog }) {
  if (!archetypeVector && !caseLog) return null;

  if (layout === 'combined') {
    return (
      <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-3">
          Clinical Narrative // Archetype & Case Log
        </h2>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap space-y-3">
          {archetypeVector ? <p>{archetypeVector}</p> : null}
          {caseLog ? <p className="border-t border-slate-100 pt-3 text-slate-600">{caseLog}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {archetypeVector ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-sky-600 uppercase font-mono mb-3">
            Biomechanical Archetype Vector
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{archetypeVector}</p>
        </div>
      ) : null}
      {caseLog ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-sky-600 uppercase font-mono mb-3">
            Kinetic Directives & Case Log
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{caseLog}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function CyberLightDashboard({
  clientName = 'Alex Rivera',
  clientCode = '111111',
  profilePhotoUrl = '',
  diagnostics,
  trainingProfile,
  verificationBars,
  coreMetrics,
  archetypeVector = '',
  caseLog = '',
  narrativeLayout = 'separate',
  editable = false,
  dossierSnapshot = null,
  onSaveReport,
  onNavigate,
  escapeTarget = 'COACH_DASHBOARD_HOME',
}) {
  const fallback = buildCyberDashboardPayload(
    {
      name: clientName,
      desc: archetypeVector,
      notes: caseLog,
      biometricPhotoUrl: profilePhotoUrl,
    },
    clientCode
  );

  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [draft, setDraft] = useState({
    profilePhotoUrl: profilePhotoUrl || fallback.profilePhotoUrl,
    diagnostics: diagnostics || fallback.diagnostics,
    trainingProfile: trainingProfile || fallback.trainingProfile,
    verificationBars: verificationBars || fallback.verificationBars,
    coreMetrics: coreMetrics || fallback.coreMetrics,
    archetypeVector: archetypeVector || fallback.archetypeVector,
    caseLog: caseLog || fallback.caseLog,
    narrativeLayout: narrativeLayout || fallback.narrativeLayout,
  });

  useEffect(() => {
    setDraft({
      profilePhotoUrl: profilePhotoUrl || fallback.profilePhotoUrl,
      diagnostics: diagnostics || fallback.diagnostics,
      trainingProfile: trainingProfile || fallback.trainingProfile,
      verificationBars: verificationBars || fallback.verificationBars,
      coreMetrics: coreMetrics || fallback.coreMetrics,
      archetypeVector: archetypeVector || fallback.archetypeVector,
      caseLog: caseLog || fallback.caseLog,
      narrativeLayout: narrativeLayout || fallback.narrativeLayout,
    });
    setPreviewImage(null);
  }, [
    profilePhotoUrl,
    diagnostics,
    trainingProfile,
    verificationBars,
    coreMetrics,
    archetypeVector,
    caseLog,
    narrativeLayout,
    clientName,
    clientCode,
  ]);

  const active = isEditing ? draft : {
    profilePhotoUrl: profilePhotoUrl || draft.profilePhotoUrl,
    diagnostics: diagnostics || draft.diagnostics,
    trainingProfile: trainingProfile || draft.trainingProfile,
    verificationBars: verificationBars || draft.verificationBars,
    coreMetrics: coreMetrics || draft.coreMetrics,
    archetypeVector: archetypeVector || draft.archetypeVector,
    caseLog: caseLog || draft.caseLog,
    narrativeLayout: narrativeLayout || draft.narrativeLayout,
  };

  const displayImage = previewImage || active.profilePhotoUrl || null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({ ...prev, profilePhotoUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSyncFromDossier = () => {
    if (!dossierSnapshot) return;
    const synced = buildCyberDashboardPayload(
      {
        name: clientName,
        desc: dossierSnapshot.archetypeVector,
        notes: dossierSnapshot.caseLog,
        biometricPhotoUrl: dossierSnapshot.profilePhotoUrl,
        longevityReport: { narrativeLayout: dossierSnapshot.narrativeLayout },
      },
      clientCode
    );
    setDraft((prev) => ({
      ...prev,
      ...synced,
      profilePhotoUrl: dossierSnapshot.profilePhotoUrl || prev.profilePhotoUrl,
      archetypeVector: dossierSnapshot.archetypeVector ?? prev.archetypeVector,
      caseLog: dossierSnapshot.caseLog ?? prev.caseLog,
      narrativeLayout: dossierSnapshot.narrativeLayout || prev.narrativeLayout,
    }));
    setPreviewImage(null);
  };

  const handleSave = () => {
    onSaveReport?.({
      profilePhotoUrl: draft.profilePhotoUrl,
      diagnostics: draft.diagnostics,
      trainingProfile: draft.trainingProfile,
      verificationBars: draft.verificationBars,
      coreMetrics: draft.coreMetrics,
      archetypeVector: draft.archetypeVector,
      caseLog: draft.caseLog,
      narrativeLayout: draft.narrativeLayout,
    });
    setPreviewImage(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900 selection:bg-sky-500 selection:text-white print:p-4">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap justify-end gap-3 print:hidden">
        {editable && (
          <>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-white border border-sky-200 hover:border-sky-400 text-sky-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
              >
                <Pencil size={16} />
                Edit Report
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSyncFromDossier}
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
                >
                  <RefreshCw size={16} />
                  Sync from Dossier
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
                >
                  <Save size={16} />
                  Save Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewImage(null);
                  }}
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
                >
                  <X size={16} />
                  Cancel
                </button>
              </>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
        >
          <Printer size={16} />
          Export PDF
        </button>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(escapeTarget)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
          >
            [ ESC ]
          </button>
        )}
      </div>

      {editable && isEditing && (
        <div className="max-w-6xl mx-auto mb-8 bg-white border border-sky-100 rounded-2xl p-6 shadow-sm print:hidden space-y-4">
          <h3 className="text-[10px] font-black tracking-[0.15em] text-sky-600 uppercase font-mono">
            Coach Report Editor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Narrative Layout
              </span>
              <select
                value={draft.narrativeLayout}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, narrativeLayout: e.target.value }))
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="separate">Separate — Archetype + Case Log</option>
                <option value="combined">Combined — Single narrative block</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Training Profile Tag
              </span>
              <input
                type="text"
                value={draft.trainingProfile}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, trainingProfile: e.target.value }))
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Profile Photo URL
            </span>
            <input
              type="text"
              value={draft.profilePhotoUrl?.startsWith('data:') ? '' : draft.profilePhotoUrl}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, profilePhotoUrl: e.target.value }))
              }
              placeholder="Paste image URL or upload below..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Biomechanical Archetype Vector
            </span>
            <textarea
              value={draft.archetypeVector}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, archetypeVector: e.target.value }))
              }
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Kinetic Directives & Case Log
            </span>
            <textarea
              value={draft.caseLog}
              onChange={(e) => setDraft((prev) => ({ ...prev, caseLog: e.target.value }))}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              <span className="text-[10px] font-black tracking-[0.2em] text-sky-600 uppercase font-mono">
                System Intercept Loaded
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1 font-mono">
              LONGEVITY LAB <span className="text-sky-500 font-light">//</span> EVAL.01
            </h1>
          </div>
          <div className="mt-4 md:mt-0 font-mono text-xs bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-6">
            <div>
              OPERATIVE: <span className="text-slate-900 font-bold uppercase">{clientName}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              SUITE ACCESS:{' '}
              <span className="text-sky-600 font-bold tracking-wider">#{clientCode}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col min-h-[380px] relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                CAPTURE MATRIX // 2D FRAME
              </span>
              <Layers size={14} className="text-sky-500" />
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800 group-hover:border-sky-500/50 transition-all duration-300">
              {displayImage ? (
                <div className="w-full h-full relative min-h-[280px]">
                  <img
                    src={displayImage}
                    alt="Biomechanical analysis"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 border border-sky-400/30 pointer-events-none mix-blend-screen bg-gradient-to-b from-sky-500/5 to-transparent" />
                  <div className="absolute top-1/4 left-1/2 w-16 h-16 border-2 border-dashed border-sky-400/60 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_8px_#0ea5e9]" />
                  <div className="absolute top-2/3 left-2/3 w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_8px_#0ea5e9]" />
                  <div className="absolute bottom-4 left-4 font-mono text-[9px] text-sky-400 bg-slate-950/80 px-2 py-0.5 rounded border border-sky-500/20">
                    GRID_LOCK_ACTIVE
                  </div>
                </div>
              ) : editable && isEditing ? (
                <label className="cursor-pointer text-center p-6 flex flex-col items-center group/upload">
                  <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-sky-400 mb-3 group-hover/upload:shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all">
                    <Upload size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 block mb-1">
                    Upload Biomechanical Photo
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    PNG or JPG • Vector Tracking Layer Auto-Applies
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="text-center p-6">
                  <Layers className="mx-auto mb-2 text-sky-500/50" size={28} />
                  <span className="text-xs font-bold text-slate-400 block mb-1">
                    Awaiting Biomechanical Frame
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    Coach will link profile photo to this matrix
                  </span>
                </div>
              )}
              {displayImage && editable && isEditing && (
                <label className="absolute top-3 right-3 cursor-pointer bg-slate-950/90 border border-sky-500/40 text-sky-400 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Cpu size={16} />
                </div>
                <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase font-mono">
                  AI Coach Diagnostics
                </h3>
              </div>
              <ul className="space-y-4 text-xs font-medium text-slate-700">
                {active.diagnostics.map((item, index) => (
                  <li key={`diag-${index}`} className="flex gap-3">
                    <span className="text-sky-500 font-mono font-bold mt-0.5">↳</span>
                    <p>
                      <strong className="text-slate-900 font-bold">{item.title}:</strong>{' '}
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Prescribed Training Profile:</span>
              <span className="font-mono font-bold bg-sky-500 text-white px-2.5 py-1 rounded shadow-sm text-[10px] uppercase tracking-wider">
                {active.trainingProfile}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-4">
            Target Verification Bars
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {active.verificationBars.map((bar) => (
              <div
                key={bar.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative group hover:border-sky-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                    {bar.id} // {bar.label}
                  </span>
                  <span className="text-[9px] font-mono font-black text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded tracking-wide">
                    {bar.zone}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight group-hover:text-sky-600 transition-colors">
                  {bar.val}
                </div>
                <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden mt-3 border border-slate-200/50">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                    style={{ width: `${bar.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-4">
            Core Metrics Registry
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {active.coreMetrics.map((item, index) => {
              const Icon = ICON_MAP[item.icon] || Target;
              return (
                <div
                  key={`metric-${index}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[130px]"
                >
                  <div className="flex items-center justify-between text-[9px] font-black tracking-wider text-slate-400 font-mono">
                    <span>{item.label}</span>
                    <Icon size={12} className="text-slate-300" />
                  </div>
                  <div className="my-1.5 text-2xl font-mono font-black text-slate-900 tracking-tight drop-shadow-[0_0_6px_rgba(56,189,248,0.2)]">
                    {item.val}
                  </div>
                  <div className={`text-[10px] font-semibold ${item.descColor || 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <NarrativeBlocks
          layout={active.narrativeLayout}
          archetypeVector={active.archetypeVector}
          caseLog={active.caseLog}
        />
      </div>
    </div>
  );
}
