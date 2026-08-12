import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Cpu, Layers, Printer, Save, RefreshCw, Pencil, X } from 'lucide-react';
import { buildModelDataPhases, humanizeSpecKey } from '../utils/deepCyberPhaseParser';

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

export default function DeepCyberDashboard({
  clientName = 'Alex Rivera',
  clientCode = '111111',
  modelDataPhases: modelDataPhasesProp,
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
  const fallbackPhases = useMemo(
    () => buildModelDataPhases({ profilePhotoUrl }),
    [profilePhotoUrl]
  );

  const [modelDataPhases, setModelDataPhases] = useState(
    modelDataPhasesProp || fallbackPhases
  );
  const [activePhase, setActivePhase] = useState('phase1');
  const [uploadedImages, setUploadedImages] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [draftNarrative, setDraftNarrative] = useState({
    archetypeVector,
    caseLog,
    narrativeLayout,
  });

  const phaseKeys = useMemo(
    () => Object.keys(modelDataPhases).sort(),
    [modelDataPhases]
  );

  useEffect(() => {
    setModelDataPhases(modelDataPhasesProp || fallbackPhases);
    setActivePhase('phase1');
    setUploadedImages({});
  }, [modelDataPhasesProp, fallbackPhases]);

  useEffect(() => {
    setDraftNarrative({ archetypeVector, caseLog, narrativeLayout });
  }, [archetypeVector, caseLog, narrativeLayout]);

  useEffect(() => {
    if (!phaseKeys.includes(activePhase) && phaseKeys.length > 0) {
      setActivePhase(phaseKeys[0]);
    }
  }, [activePhase, phaseKeys]);

  const currentData = modelDataPhases[activePhase] || modelDataPhases[phaseKeys[0]];

  const resolvePhaseImage = (phaseKey) => {
    if (uploadedImages[phaseKey]) return uploadedImages[phaseKey];
    const phase = modelDataPhases[phaseKey];
    if (phase?.imageUrl) return phase.imageUrl;
    if (phaseKey === 'phase1' && profilePhotoUrl) return profilePhotoUrl;
    return null;
  };

  const displayImage = resolvePhaseImage(activePhase);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUploadedImages((prev) => ({ ...prev, [activePhase]: objectUrl }));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setModelDataPhases((prev) => ({
          ...prev,
          [activePhase]: { ...prev[activePhase], imageUrl: reader.result },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSyncFromDossier = () => {
    if (!dossierSnapshot) return;
    setDraftNarrative({
      archetypeVector: dossierSnapshot.archetypeVector || archetypeVector,
      caseLog: dossierSnapshot.caseLog || caseLog,
      narrativeLayout: dossierSnapshot.narrativeLayout || narrativeLayout,
    });
    if (dossierSnapshot.profilePhotoUrl) {
      setModelDataPhases((prev) => ({
        ...prev,
        phase1: { ...prev.phase1, imageUrl: dossierSnapshot.profilePhotoUrl },
      }));
    }
  };

  const handleSave = () => {
    onSaveReport?.({
      modelDataPhases,
      profilePhotoUrl:
        modelDataPhases.phase1?.imageUrl || profilePhotoUrl || dossierSnapshot?.profilePhotoUrl,
      archetypeVector: draftNarrative.archetypeVector,
      caseLog: draftNarrative.caseLog,
      narrativeLayout: draftNarrative.narrativeLayout,
    });
    setIsEditing(false);
  };

  if (!currentData) return null;

  const specEntries = Object.entries(currentData.specs || {});
  const summaryEntries = Object.entries(currentData.summaries || {});

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900 selection:bg-sky-500 selection:text-white print:p-4">
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap justify-end gap-3 print:hidden">
        {editable && (
          <>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
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
                  onClick={() => setIsEditing(false)}
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
            Coach Narrative Editor
          </h3>
          <select
            value={draftNarrative.narrativeLayout}
            onChange={(e) =>
              setDraftNarrative((prev) => ({ ...prev, narrativeLayout: e.target.value }))
            }
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="separate">Separate — Archetype + Case Log</option>
            <option value="combined">Combined — Single narrative block</option>
          </select>
          <textarea
            value={draftNarrative.archetypeVector}
            onChange={(e) =>
              setDraftNarrative((prev) => ({ ...prev, archetypeVector: e.target.value }))
            }
            rows={3}
            placeholder="Biomechanical Archetype Vector"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            value={draftNarrative.caseLog}
            onChange={(e) =>
              setDraftNarrative((prev) => ({ ...prev, caseLog: e.target.value }))
            }
            rows={3}
            placeholder="Kinetic Directives & Case Log"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-mono">
              LONGEVITY LAB <span className="text-sky-500 font-light">//</span> RUNTIME DATA
            </h1>
          </div>
          <div className="mt-4 md:mt-0 font-mono text-xs bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div>
              RECIPIENT: <span className="text-slate-900 font-bold uppercase">{clientName}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              SUITE: <span className="text-sky-600 font-bold tracking-wider">#{clientCode}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {phaseKeys.map((pKey) => (
            <button
              key={pKey}
              type="button"
              onClick={() => setActivePhase(pKey)}
              className={`font-mono text-xs font-bold px-4 py-2.5 rounded-xl border transition-all ${
                activePhase === pKey
                  ? 'bg-slate-900 text-white border-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.15)]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {pKey.toUpperCase()} // {modelDataPhases[pKey]?.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col min-h-[380px] relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                {activePhase.toUpperCase()} MATRIX RENDER
              </span>
              <Layers size={14} className="text-sky-500" />
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800">
              {displayImage ? (
                <div className="w-full h-full relative min-h-[280px]">
                  <img
                    src={displayImage}
                    alt="Frame analysis"
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 border border-sky-400/30 pointer-events-none mix-blend-screen bg-gradient-to-b from-sky-500/5 to-transparent" />
                  <div className="absolute bottom-4 left-4 font-mono text-[9px] text-sky-400 bg-slate-950/80 px-2 py-0.5 rounded border border-sky-500/20">
                    {currentData.name}_LOCK_OK
                  </div>
                </div>
              ) : editable && isEditing ? (
                <label className="cursor-pointer text-center p-6 flex flex-col items-center group">
                  <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-sky-400 mb-3 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all">
                    <Upload size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 block mb-1">
                    Upload {currentData.name} Image
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs font-mono">
                  AWAITING FRAME UPLINK
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Cpu size={16} />
                </div>
                <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase font-mono">
                  Vector Node Registries ({specEntries.length} metrics)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {specEntries.map(([key, val]) => (
                  <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="text-[9px] font-black text-slate-400 tracking-wider font-mono uppercase">
                      {humanizeSpecKey(key)}
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1 text-sky-600 drop-shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 bg-slate-900 text-slate-400 rounded-xl p-4 font-mono text-[11px] leading-relaxed border border-slate-800">
              <span className="text-sky-400 font-bold block mb-1">SYSTEM_DIAGNOSTIC_CUES //</span>
              {currentData.diagnosticCue}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-4">
            Biomechanical Angle Thresholds ({currentData.gauges?.length || 0} nodes)
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(currentData.gauges || []).map((bar, idx) => (
              <div
                key={`${bar.label}-${idx}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                    {bar.label}
                  </span>
                  <span className="text-[9px] font-mono font-black text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                    {bar.status}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {bar.val}
                </div>
                <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden mt-3 border border-slate-200/50">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                    style={{ width: `${bar.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-4">
            Performance Matrices Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {summaryEntries.map(([key, val]) => (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[110px] flex flex-col justify-between"
              >
                <div className="text-[9px] font-black tracking-wider text-slate-400 font-mono uppercase">
                  {humanizeSpecKey(key)} INDEX
                </div>
                <div className="my-1.5 text-xl font-mono font-black text-slate-900 tracking-tight text-indigo-600">
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        <NarrativeBlocks
          layout={isEditing ? draftNarrative.narrativeLayout : narrativeLayout}
          archetypeVector={isEditing ? draftNarrative.archetypeVector : archetypeVector}
          caseLog={isEditing ? draftNarrative.caseLog : caseLog}
        />
      </div>
    </div>
  );
}
