import React, { useEffect, useState } from 'react';
import { Zap, Printer, Save, RefreshCw, Pencil, X } from 'lucide-react';
import { buildLongevityReportFromClient, DEFAULT_PHASES } from '../utils/longevityReportData';

function NarrativeSection({ layout, archetypeVector, caseLog }) {
  if (!archetypeVector && !caseLog) return null;

  if (layout === 'combined') {
    return (
      <div className="mb-10 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
          Clinical Narrative // Archetype & Case Log
        </h3>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap space-y-3">
          {archetypeVector ? <p>{archetypeVector}</p> : null}
          {caseLog ? (
            <p className="border-t border-gray-100 pt-3 text-gray-600">{caseLog}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {archetypeVector ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
            Biomechanical Archetype Vector
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{archetypeVector}</p>
        </div>
      ) : null}
      {caseLog ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
            Kinetic Directives & Case Log
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{caseLog}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function CleanLongevityReport({
  clientName = 'Alex Rivera',
  clientCode = '111111',
  phases,
  summaryItems,
  profilePhotoUrl = '',
  archetypeVector = '',
  caseLog = '',
  narrativeLayout = 'separate',
  editable = false,
  dossierSnapshot = null,
  onSaveReport,
  onNavigate,
  escapeTarget = 'COACH_DASHBOARD_HOME',
}) {
  const fallback = buildLongevityReportFromClient(
    { name: clientName, desc: archetypeVector, notes: caseLog, metrics: {} },
    clientCode
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    phases: phases || fallback.phases,
    summaryItems: summaryItems || fallback.summaryItems,
    profilePhotoUrl: profilePhotoUrl || fallback.profilePhotoUrl,
    archetypeVector: archetypeVector || fallback.archetypeVector,
    caseLog: caseLog || fallback.caseLog,
    narrativeLayout: narrativeLayout || fallback.narrativeLayout,
  });

  useEffect(() => {
    setDraft({
      phases: phases || fallback.phases,
      summaryItems: summaryItems || fallback.summaryItems,
      profilePhotoUrl: profilePhotoUrl || fallback.profilePhotoUrl,
      archetypeVector: archetypeVector || fallback.archetypeVector,
      caseLog: caseLog || fallback.caseLog,
      narrativeLayout: narrativeLayout || fallback.narrativeLayout,
    });
  }, [
    phases,
    summaryItems,
    profilePhotoUrl,
    archetypeVector,
    caseLog,
    narrativeLayout,
    clientName,
    clientCode,
  ]);

  const reportPhases = isEditing ? draft.phases : phases || draft.phases;
  const reportSummary = isEditing ? draft.summaryItems : summaryItems || draft.summaryItems;
  const reportPhoto = isEditing ? draft.profilePhotoUrl : profilePhotoUrl || draft.profilePhotoUrl;
  const reportArchetype = isEditing ? draft.archetypeVector : archetypeVector || draft.archetypeVector;
  const reportCaseLog = isEditing ? draft.caseLog : caseLog || draft.caseLog;
  const reportLayout = isEditing ? draft.narrativeLayout : narrativeLayout || draft.narrativeLayout;

  const handlePrint = () => window.print();

  const handleSyncFromDossier = () => {
    if (!dossierSnapshot) return;
    setDraft((prev) => ({
      ...prev,
      profilePhotoUrl: dossierSnapshot.profilePhotoUrl || prev.profilePhotoUrl,
      archetypeVector: dossierSnapshot.archetypeVector ?? prev.archetypeVector,
      caseLog: dossierSnapshot.caseLog ?? prev.caseLog,
      narrativeLayout: dossierSnapshot.narrativeLayout || prev.narrativeLayout,
    }));
  };

  const handleSave = () => {
    onSaveReport?.({
      phases: draft.phases,
      summaryItems: draft.summaryItems,
      profilePhotoUrl: draft.profilePhotoUrl,
      archetypeVector: draft.archetypeVector,
      caseLog: draft.caseLog,
      narrativeLayout: draft.narrativeLayout,
    });
    setIsEditing(false);
  };

  const handleResetPhases = () => {
    setDraft((prev) => ({ ...prev, phases: DEFAULT_PHASES.map((p) => ({ ...p })) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-900 print:p-0">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap justify-end gap-3 print:hidden">
        {editable && (
          <>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                <Pencil size={16} />
                Edit Report
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSyncFromDossier}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  <RefreshCw size={16} />
                  Sync from Dossier
                </button>
                <button
                  type="button"
                  onClick={handleResetPhases}
                  className="inline-flex items-center gap-2 bg-white border border-amber-200 hover:border-amber-400 text-amber-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  Reset Phases
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  <Save size={16} />
                  Save Report
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
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
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Printer size={16} />
          Export PDF
        </button>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(escapeTarget)}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            [ ESC ]
          </button>
        )}
      </div>

      {editable && isEditing && (
        <div className="max-w-6xl mx-auto mb-8 bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm print:hidden space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
            Coach Report Editor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Narrative Layout
              </span>
              <select
                value={draft.narrativeLayout}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, narrativeLayout: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="separate">Separate — Archetype + Case Log</option>
                <option value="combined">Combined — Single narrative block</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Profile Photo URL (report header + phase 1)
              </span>
              <input
                type="text"
                value={draft.profilePhotoUrl}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, profilePhotoUrl: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Paste image URL..."
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Biomechanical Archetype Vector
            </span>
            <textarea
              value={draft.archetypeVector}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, archetypeVector: e.target.value }))
              }
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Kinetic Directives & Case Log
            </span>
            <textarea
              value={draft.caseLog}
              onChange={(e) => setDraft((prev) => ({ ...prev, caseLog: e.target.value }))}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-6">
          <div className="flex items-start gap-5">
            {reportPhoto ? (
              <div className="shrink-0">
                <img
                  src={reportPhoto}
                  alt={`${clientName} biometric profile`}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                />
                <p className="text-[9px] text-gray-400 uppercase tracking-wider text-center mt-1.5">
                  Profile Vector
                </p>
              </div>
            ) : null}
            <div>
              <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                Clinical Analytics Node
              </span>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 mt-1">
                LIFE LONGEVITY LAB
              </h1>
            </div>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div>
              RECIPIENT:{' '}
              <span className="text-gray-900 font-bold uppercase">{clientName}</span>
            </div>
            <div className="border-l border-gray-200 pl-4">
              ACCESS ID: <span className="text-gray-900 font-bold">{clientCode}</span>
            </div>
          </div>
        </div>

        <NarrativeSection
          layout={reportLayout}
          archetypeVector={reportArchetype}
          caseLog={reportCaseLog}
        />

        <div className="space-y-8">
          {reportPhases.map((phase, index) => (
            <div
              key={`${phase.title}-${index}`}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                    {phase.title}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{phase.duration}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {phase.metrics.map((metric, metricIndex) => (
                    <div
                      key={`${metric.label}-${metricIndex}`}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                          {metric.label}
                        </div>
                        <div className="text-lg font-black text-gray-900 mt-0.5">{metric.val}</div>
                      </div>
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">
                        {metric.target}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 rounded-xl h-64 relative overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner">
                {(phase.imageUrl || (index === 0 && reportPhoto)) ? (
                  <img
                    src={phase.imageUrl || reportPhoto}
                    alt={`${phase.title} vector frame`}
                    className="max-w-full max-h-full object-contain bg-white/5"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Zap className="mx-auto mb-2 text-indigo-400 opacity-60" size={28} />
                    <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase mb-1">
                      [ Dynamic Skeletal Layer ]
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-xs">
                      Render vector nodes over white or transparent backing panels here
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 border-l border-gray-100 pl-0 lg:pl-6 space-y-2.5">
                <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2">
                  Biomechanical Angles
                </h4>
                {phase.alignments.map((align, alignIndex) => (
                  <div
                    key={`${align}-${alignIndex}`}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{align}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
            Global Movement Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportSummary.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.label}-${index}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm"
                >
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                      {item.label}
                    </div>
                    <div className="text-sm font-black text-gray-900 mt-0.5">{item.val}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
