import React from 'react';
import { ExternalLink, FileJson } from 'lucide-react';
import ReportViewModeToggle from './ReportViewModeToggle';
import { AIKYNETIX_WEB_URL } from '../utils/aikynetixReportUrl';

function SnapshotSection({ title, children }) {
  if (!children) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-[10px] font-black tracking-wider text-slate-400 uppercase font-mono mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function MetricGrid({ entries = [] }) {
  if (!entries.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {entries.map(([key, val]) => (
        <div key={key} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase font-mono">
            {key.replace(/_/g, ' ')}
          </div>
          <div className="text-lg font-black text-slate-900 font-mono mt-1">
            {String(val ?? '—')}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AikynetixOriginalReportView({
  clientName = 'Client',
  clientCode = '',
  aikynetixUrl = AIKYNETIX_WEB_URL,
  sourceLabel = '',
  pipelineSnapshot = null,
  viewMode = 'original_aikynetix',
  onViewModeChange,
  showComparisonToggle = false,
  onNavigate,
  escapeTarget = 'COACH_DASHBOARD_HOME',
}) {
  const header = pipelineSnapshot?.header || {};
  const scores = pipelineSnapshot?.scores || {};
  const rules = Array.isArray(pipelineSnapshot?.rule_results) ? pipelineSnapshot.rule_results : [];
  const hasSnapshot = Boolean(pipelineSnapshot && Object.keys(pipelineSnapshot).length > 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900 print:p-4 print:pr-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 font-mono">
              AIKYNETIX{' '}
              <span className="text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]">
                ORIGINAL
              </span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
              {clientName} · #{clientCode}
              {pipelineSnapshot?.assessmentId ? ` · ${pipelineSnapshot.assessmentId}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {showComparisonToggle && onViewModeChange ? (
              <ReportViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
            ) : null}
            <a
              href={aikynetixUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold font-mono text-slate-600 hover:bg-slate-50"
            >
              <ExternalLink size={14} className="text-amber-500" /> OPEN IN NEW TAB
            </a>
            {onNavigate ? (
              <button
                type="button"
                onClick={() => onNavigate(escapeTarget)}
                className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-400 hover:bg-slate-50 shadow-sm text-xs font-mono"
              >
                [ ESC ]
              </button>
            ) : null}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm min-h-[70vh] flex flex-col print:hidden">
          <div className="mb-2 flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span className="truncate max-w-xl">
              Secure Tunnel: {sourceLabel || aikynetixUrl}
            </span>
            <span className="text-emerald-500 shrink-0">● Live Synchronization Active</span>
          </div>

          <iframe
            title="Original Aikynetix Audit Panel"
            src={aikynetixUrl}
            className="w-full flex-1 min-h-[55vh] rounded-xl border border-slate-200 bg-slate-100"
            allow="autoplay; encrypted-media; camera; microphone; clipboard-read; clipboard-write"
          />

          <p className="text-[10px] text-slate-500 font-mono mt-3 uppercase tracking-wider">
            If the frame stays blank, Aikynetix may block embedding — use Open In New Tab or review
            the intercept snapshot below.
          </p>
        </div>

        {hasSnapshot ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              <FileJson size={14} className="text-amber-500" />
              Intercept Snapshot // Captured Pipeline JSON
            </div>

            <SnapshotSection title="Assessment Header">
              <MetricGrid
                entries={Object.entries({
                  test: header.test_name || pipelineSnapshot.testId,
                  grade: header.grade,
                  overall_score: header.overall_score,
                  performance_level: header.performance_level,
                }).filter(([, v]) => v != null && v !== '')}
              />
            </SnapshotSection>

            {Object.keys(scores).length > 0 ? (
              <SnapshotSection title="Score Matrix">
                <MetricGrid entries={Object.entries(scores)} />
              </SnapshotSection>
            ) : null}

            {rules.length > 0 ? (
              <SnapshotSection title="Rule Results">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {rules.map((rule, index) => (
                    <div
                      key={`${rule.metric}-${index}`}
                      className="flex flex-wrap justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
                    >
                      <span className="text-slate-600 uppercase">
                        {String(rule.metric || 'METRIC').replace(/_/g, ' ')}
                      </span>
                      <span className="font-black text-slate-900">
                        {rule.raw_score ?? '—'}{' '}
                        <span className="text-cyan-600 font-bold">{rule.band || rule.status || ''}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </SnapshotSection>
            ) : null}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-mono text-amber-900">
            No intercept snapshot on file yet. Run an assessment through the pipeline to capture
            original Aikynetix telemetry for side-by-side review.
          </div>
        )}
      </div>
    </div>
  );
}
