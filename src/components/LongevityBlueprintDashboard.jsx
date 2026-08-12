import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cpu, Edit3, FileText, X, Save, RefreshCw, Download } from 'lucide-react';
import {
  buildModelDataPhases,
  humanizeSpecKey,
  rebuildPhasesForTestKey,
} from '../utils/deepCyberPhaseParser';
import {
  getTestConfigByKey,
  listTestConfigKeys,
  splitMainTitle,
} from '../data/testConfigDictionary';
import VideoFramePanel from './VideoFramePanel';
import ReportViewModeToggle from './ReportViewModeToggle';
import DynamicBlueprintChart from './DynamicBlueprintChart';
import HorizontalPhaseSelector from './HorizontalPhaseSelector';

const DEFAULT_FRAME_MAX = 128;

function modelDataPhasesToLegacyList(modelDataPhases = {}) {
  return Object.entries(modelDataPhases).map(([key, block]) => ({
    title: `PHASE // ${block.name}`,
    metrics: Object.entries(block.specs || {}).map(([specKey, val]) => ({
      label: humanizeSpecKey(specKey),
      val,
      target: 'NOMINAL',
    })),
    alignments: (block.gauges || []).map((g) => `${g.label}: ${g.val}`),
    videoUrl: block.videoUrl,
    totalFrames: block.totalFrames,
    phaseId: key,
  }));
}

function NarrativeBlocks({ layout, archetypeVector, caseLog }) {
  if (!archetypeVector && !caseLog) return null;

  if (layout === 'combined') {
    return (
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
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
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {archetypeVector ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-cyan-600 uppercase font-mono mb-3">
            Biomechanical Archetype Vector
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{archetypeVector}</p>
        </div>
      ) : null}
      {caseLog ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[10px] font-black tracking-[0.15em] text-cyan-600 uppercase font-mono mb-3">
            Kinetic Directives & Case Log
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{caseLog}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function LongevityBlueprintDashboard({
  clientName = 'Alex Rivera',
  clientCode = '111111',
  modelDataPhases: modelDataPhasesProp,
  profilePhotoUrl = '',
  videoUrl = '',
  totalFrames = DEFAULT_FRAME_MAX,
  archetypeVector = '',
  caseLog = '',
  narrativeLayout = 'separate',
  editable = false,
  dossierSnapshot = null,
  onSaveReport,
  onNavigate,
  hasMovementVideo = false,
  onDownloadVideo,
  mainTitle = 'LIFE LONGEVITY LAB BLUEPRINT',
  testConfigKey = 'combat_stance',
  showTestSimulator = false,
  showComparisonToggle = false,
  viewMode = 'blueprint',
  onViewModeChange,
  controlledPhase = null,
  useExternalPhaseNav = false,
  printAllPhases = false,
  pipelineSnapshot = null,
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
  const [frameScroll, setFrameScroll] = useState(1);
  const [frameByPhase, setFrameByPhase] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [simulatedTestKey, setSimulatedTestKey] = useState(testConfigKey);
  const telemetrySourceRef = useRef([]);
  const [draftNarrative, setDraftNarrative] = useState({
    archetypeVector,
    caseLog,
    narrativeLayout,
  });

  const phaseKeys = useMemo(
    () => Object.keys(modelDataPhases).sort(),
    [modelDataPhases]
  );

  const selectorPhases = useMemo(
    () =>
      phaseKeys.map((id, index) => ({
        id,
        label: `${index + 1} / ${phaseKeys.length} • ${(
          modelDataPhases[id]?.name || id
        ).toUpperCase()}`,
      })),
    [phaseKeys, modelDataPhases]
  );

  useEffect(() => {
    setModelDataPhases(modelDataPhasesProp || fallbackPhases);
    setActivePhase('phase1');
    setFrameScroll(1);
    setFrameByPhase({});
    telemetrySourceRef.current = modelDataPhasesToLegacyList(
      modelDataPhasesProp || fallbackPhases
    );
  }, [modelDataPhasesProp, fallbackPhases]);

  useEffect(() => {
    setDraftNarrative({ archetypeVector, caseLog, narrativeLayout });
  }, [archetypeVector, caseLog, narrativeLayout]);

  useEffect(() => {
    setSimulatedTestKey(testConfigKey);
  }, [testConfigKey]);

  const activeTestKey = showTestSimulator ? simulatedTestKey : testConfigKey;
  const activeTestConfig = useMemo(
    () => getTestConfigByKey(activeTestKey),
    [activeTestKey]
  );
  const titleParts = useMemo(
    () => splitMainTitle(activeTestConfig.mainTitle || mainTitle),
    [activeTestConfig.mainTitle, mainTitle]
  );

  const handleSimulateTest = (key) => {
    setSimulatedTestKey(key);
    const rebuilt = rebuildPhasesForTestKey(
      key,
      telemetrySourceRef.current,
      profilePhotoUrl || dossierSnapshot?.profilePhotoUrl || ''
    );
    setModelDataPhases(
      buildModelDataPhases({
        phases: rebuilt,
        profilePhotoUrl: profilePhotoUrl || dossierSnapshot?.profilePhotoUrl || '',
      })
    );
    setActivePhase('phase1');
    setFrameScroll(1);
    setFrameByPhase({});
  };

  useEffect(() => {
    if (controlledPhase && phaseKeys.includes(controlledPhase)) {
      setActivePhase(controlledPhase);
    }
  }, [controlledPhase, phaseKeys]);

  useEffect(() => {
    if (!phaseKeys.includes(activePhase) && phaseKeys.length > 0) {
      setActivePhase(phaseKeys[0]);
    }
  }, [activePhase, phaseKeys]);

  useEffect(() => {
    const saved = frameByPhase[activePhase];
    setFrameScroll(typeof saved === 'number' ? saved : 1);
  }, [activePhase, frameByPhase]);

  const currentPhase = modelDataPhases[activePhase] || modelDataPhases[phaseKeys[0]];
  if (!currentPhase) return null;

  const activeVideoUrl =
    currentPhase.videoUrl || videoUrl || dossierSnapshot?.videoUrl || '';
  const activeTotalFrames =
    currentPhase.totalFrames || totalFrames || DEFAULT_FRAME_MAX;
  const printPosterUrl =
    profilePhotoUrl || currentPhase.imageUrl || dossierSnapshot?.profilePhotoUrl || '';

  const handleFrameChange = (value) => {
    const next = Number(value);
    setFrameScroll(next);
    setFrameByPhase((prev) => ({ ...prev, [activePhase]: next }));
  };

  const renderPhaseSupplements = (pKey, { forPrint = false, inColumn = false } = {}) => {
    const phase = modelDataPhases[pKey];
    if (!phase) return null;

    const phaseSummaries = Object.entries(phase.summaries || {});
    const phaseGauges = phase.gauges || [];

    return (
      <>
        <div className={inColumn ? '' : 'mt-6'}>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-4">
              Biomechanical Angle Thresholds ({phaseGauges.length} Nodes)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phaseGauges.map((node, index) => (
                <div
                  key={`${pKey}-${node.label}-${index}`}
                  className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">
                      {node.label}
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                      {node.val}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-black text-cyan-600 bg-cyan-50 border border-cyan-100 px-2 py-1 rounded tracking-wider uppercase">
                    {node.status || 'FOCUS'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!forPrint && phaseSummaries.length > 0 ? (
          <div className={`${inColumn ? 'mt-6' : 'mt-6 border-t border-slate-200 pt-6'}`}>
            <h2 className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase font-mono mb-4">
              Performance Matrices Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {phaseSummaries.map(([key, val]) => (
                <div
                  key={key}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[100px] flex flex-col justify-between"
                >
                  <div className="text-[9px] font-black tracking-wider text-slate-400 font-mono uppercase">
                    {humanizeSpecKey(key)} INDEX
                  </div>
                  <div className="my-1.5 text-xl font-mono font-black text-indigo-600 tracking-tight">
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </>
    );
  };

  const renderPhaseGridChildren = (pKey, { forPrint = false, embedSupplementsInRightColumn = false } = {}) => {
    const phase = modelDataPhases[pKey];
    if (!phase) return null;

    const phaseSpecs = Object.entries(phase.specs || {});
    const phaseVideoUrl = phase.videoUrl || videoUrl || dossierSnapshot?.videoUrl || '';
    const phaseTotalFrames = phase.totalFrames || totalFrames || DEFAULT_FRAME_MAX;
    const phaseFrame = forPrint ? frameByPhase[pKey] || 1 : frameScroll;
    const phasePoster =
      profilePhotoUrl || phase.imageUrl || dossierSnapshot?.profilePhotoUrl || '';

    return (
      <>
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-0 h-full">
          <VideoFramePanel
            videoUrl={phaseVideoUrl}
            phaseLabel={pKey.toUpperCase()}
            frameScroll={phaseFrame}
            totalFrames={phaseTotalFrames}
            onFrameChange={forPrint ? undefined : handleFrameChange}
            printPosterUrl={phasePoster}
          />
        </div>

        <div
          className={`lg:col-span-7 flex flex-col gap-6 min-h-0 flex-1 overflow-y-auto scroll-smooth pr-2 print:max-h-none print:overflow-visible`}
        >
          <DynamicBlueprintChart
            pipelineSnapshot={pipelineSnapshot}
            phaseName={phase.name}
            totalFrames={phaseTotalFrames}
            activeFrame={phaseFrame}
            onScrubFrame={forPrint ? undefined : handleFrameChange}
            chartId={pKey}
          />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                  <Cpu size={16} />
                </div>
                <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase font-mono">
                  Vector Node Registries ({phaseSpecs.length} Metrics)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {phaseSpecs.map(([key, val]) => (
                  <div
                    key={key}
                    className="bg-slate-50/70 border border-slate-100 rounded-xl p-4"
                  >
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">
                      {humanizeSpecKey(key)}
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 text-slate-400 rounded-xl p-4 font-mono text-[11px] leading-relaxed border border-slate-900">
              <span className="text-cyan-400 font-bold block mb-1">SYSTEM_DIAGNOSTIC_CUES //</span>
              {phase.diagnosticCue ||
                `Analyzing vector paths for ${phase.name}. All incoming telemetry nodes mapped with no overflow truncation.`}
            </div>
          </div>

          {embedSupplementsInRightColumn
            ? renderPhaseSupplements(pKey, { forPrint, inColumn: true })
            : null}
        </div>
      </>
    );
  };

  const renderPhaseContent = (pKey, { forPrint = false } = {}) => {
    const phase = modelDataPhases[pKey];
    if (!phase) return null;

    return (
      <div
        id={forPrint ? `report-section-${pKey}` : undefined}
        className={forPrint ? 'hidden print:block report-print-section' : ''}
      >
        {forPrint ? (
          <div className="hidden print:block report-print-section-label">
            {pKey.toUpperCase()} // {phase.name}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {renderPhaseGridChildren(pKey, { forPrint })}
        </div>

        {forPrint ? renderPhaseSupplements(pKey, { forPrint: true }) : null}
      </div>
    );
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
      videoUrl: activeVideoUrl,
      totalFrames: activeTotalFrames,
      mainTitle: activeTestConfig.mainTitle,
      testConfigKey: activeTestKey,
      profilePhotoUrl:
        modelDataPhases.phase1?.imageUrl || profilePhotoUrl || dossierSnapshot?.profilePhotoUrl,
      archetypeVector: draftNarrative.archetypeVector,
      caseLog: draftNarrative.caseLog,
      narrativeLayout: draftNarrative.narrativeLayout,
    });
    setIsEditing(false);
  };

  return (
    <div className="h-full w-full min-h-0 bg-slate-50 p-6 md:p-8 font-sans text-slate-900 flex flex-col overflow-hidden selection:bg-cyan-500 selection:text-white print:h-auto print:min-h-screen print:overflow-visible print:p-4 print:pr-8">
      <div className="max-w-6xl mx-auto flex flex-col flex-1 min-h-0 w-full overflow-hidden">
        {/* 1. Main Application Header */}
        <div className="flex-none">
        {showTestSimulator && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap gap-2 text-xs font-mono items-center print:hidden">
            <span className="font-bold text-amber-800">[ PIPELINE TEST SELECTOR ]</span>
            {listTestConfigKeys().map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSimulateTest(key)}
                className={`px-2 py-1 rounded border transition-colors ${
                  activeTestKey === key
                    ? 'bg-amber-800 text-white border-amber-900'
                    : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {getTestConfigByKey(key).phases[0]?.name
                  ? key.replace(/_/g, ' ').toUpperCase()
                  : key}
              </button>
            ))}
          </div>
        )}

        {/* TOP HEADER CONTROLS */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 font-mono">
              {titleParts.prefix}{' '}
              <span className="text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                {titleParts.suffix}
              </span>
            </h1>
            {activeTestConfig?.phases?.length ? (
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                {activeTestConfig.phases.length} phase layout · {activeTestKey.replace(/_/g, ' ')}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {showComparisonToggle && onViewModeChange ? (
              <ReportViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
            ) : null}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm text-slate-500">
              RECIPIENT:{' '}
              <span className="text-slate-900 font-bold uppercase">{clientName}</span>{' '}
              <span className="text-cyan-500 mx-2">|</span> SUITE:{' '}
              <span className="text-slate-900 font-bold">#{clientCode}</span>
            </div>
            {editable && (
              <>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 font-bold shadow-sm transition-colors"
                  >
                    <Edit3 size={14} className="text-cyan-500" /> EDIT REPORT
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncFromDossier}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-bold shadow-sm"
                    >
                      <RefreshCw size={14} /> SYNC
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-3 py-2 font-bold shadow-sm"
                    >
                      <Save size={14} /> SAVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-400 shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </>
            )}
            {hasMovementVideo && onDownloadVideo && (
              <button
                type="button"
                onClick={() => onDownloadVideo()}
                className="flex items-center gap-1.5 bg-white border border-cyan-200 text-cyan-700 rounded-xl px-3 py-2 font-bold shadow-sm hover:bg-cyan-50 transition-all print:hidden"
              >
                <Download size={14} /> DOWNLOAD VIDEO
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-cyan-500 text-white rounded-xl px-3 py-2 font-bold shadow-[0_4px_12px_rgba(6,182,212,0.25)] hover:bg-cyan-600 transition-all"
            >
              <FileText size={14} /> EXPORT PDF
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(escapeTarget)}
                className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-400 hover:bg-slate-50 shadow-sm transition-colors"
              >
                [ ESC ]
              </button>
            )}
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-xl font-black font-mono">
            {titleParts.prefix} {titleParts.suffix}
          </h1>
          <p className="text-xs font-mono mt-1">
            {clientName} · #{clientCode}
          </p>
        </div>

        {editable && isEditing && (
          <div className="mb-6 bg-white border border-cyan-100 rounded-2xl p-5 shadow-sm print:hidden space-y-3">
            <select
              value={draftNarrative.narrativeLayout}
              onChange={(e) =>
                setDraftNarrative((prev) => ({ ...prev, narrativeLayout: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="separate">Separate — Archetype + Case Log</option>
              <option value="combined">Combined narrative</option>
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
        </div>

        {/* 2. Dynamic horizontal phases bar */}
        {!useExternalPhaseNav ? (
          <div className="flex-none mt-2">
            <HorizontalPhaseSelector
              activePhase={activePhase}
              setActivePhase={setActivePhase}
              phases={selectorPhases}
            />
          </div>
        ) : (
          <div className="flex-none mt-2 mb-2 print:hidden">
            <p className="text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-wider">
              {activePhase.toUpperCase()} // {currentPhase.name}
            </p>
          </div>
        )}

        {/* 3. Main 2-column dashboard columns frame */}
        <div
          className={`flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 overflow-hidden min-h-0 ${
            printAllPhases ? 'print:hidden' : ''
          }`}
        >
          {renderPhaseGridChildren(activePhase, {
            forPrint: false,
            embedSupplementsInRightColumn: true,
          })}
        </div>

        {/* Print: all phase pages for client PDF export */}
        {printAllPhases
          ? phaseKeys.map((pKey) => renderPhaseContent(pKey, { forPrint: true }))
          : null}

        <div className="flex-none shrink-0 print:max-h-none print:overflow-visible">
          <NarrativeBlocks
            layout={isEditing ? draftNarrative.narrativeLayout : narrativeLayout}
            archetypeVector={isEditing ? draftNarrative.archetypeVector : archetypeVector}
            caseLog={isEditing ? draftNarrative.caseLog : caseLog}
          />
        </div>
      </div>
    </div>
  );
}
