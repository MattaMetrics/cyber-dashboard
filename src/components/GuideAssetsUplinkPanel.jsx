import React, { useMemo, useRef, useState } from 'react';
import {
  exportGuideAssetsJSON,
  importGuideAssetsJSON,
  listGuideAssetSlots,
  normalizeGuideProtocolLeaf,
  parseGuideAssetPath,
  persistGuideAssets,
  persistGuideUplinkPanelExpanded,
  readGuideUplinkPanelExpanded,
  resolveGuideProtocolByPath,
} from '../constants/guideAssets';
import {
  getPackageDeckTheme,
  PACKAGE_FILTER_OPTIONS,
} from '../constants/packageDeckPool';

function filterButtonClass(filterId, active) {
  if (!active) {
    return 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700 hover:text-slate-300';
  }
  if (filterId === 'ALL') {
    return 'border-cyan-400/50 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.1)]';
  }
  const theme = getPackageDeckTheme(filterId);
  return `${theme.cardBorder} ${theme.cardBg} ${theme.label} shadow-[0_0_10px_rgba(0,0,0,0.15)]`;
}

/**
 * Coach Dashboard — edit panel URLs and protocol text per assessment slot (guideAssets.js).
 */
export default function GuideAssetsUplinkPanel({ guideAssets, setGuideAssets }) {
  const guideSlots = useMemo(() => listGuideAssetSlots(), []);
  const importInputRef = useRef(null);

  const [expanded, setExpanded] = useState(() => readGuideUplinkPanelExpanded());
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState('');

  const filteredSlots = useMemo(() => {
    if (packageFilter === 'ALL') return guideSlots;
    return guideSlots.filter(({ packageKey }) => packageKey === packageFilter);
  }, [guideSlots, packageFilter]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      persistGuideUplinkPanelExpanded(next);
      return next;
    });
  };

  const updateProtocolField = (path, field, value) => {
    const { suiteKey, slotKey } = parseGuideAssetPath(path);
    setGuideAssets((prev) => {
      const current = normalizeGuideProtocolLeaf(prev?.[suiteKey]?.[slotKey]);
      const next = {
        ...prev,
        [suiteKey]: {
          ...(prev[suiteKey] || {}),
          [slotKey]: {
            ...current,
            [field]: value,
          },
        },
      };
      persistGuideAssets(next);
      return next;
    });
  };

  const handleResetSlot = (path) => {
    const { suiteKey, slotKey } = parseGuideAssetPath(path);
    setGuideAssets((prev) => {
      const next = { ...prev };
      if (next[suiteKey]) {
        const suiteCopy = { ...next[suiteKey] };
        delete suiteCopy[slotKey];
        if (Object.keys(suiteCopy).length) {
          next[suiteKey] = suiteCopy;
        } else {
          delete next[suiteKey];
        }
      }
      persistGuideAssets(next);
      return next;
    });
    setStatusMessage('✓ Slot cleared — using system defaults');
  };

  const handleExport = () => {
    try {
      const json = exportGuideAssetsJSON(guideAssets);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `matrix-guide-assets-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatusMessage('✓ Guide assets exported');
    } catch (err) {
      setStatusMessage(`⚠ Export failed: ${err.message}`);
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importGuideAssetsJSON(reader.result);
        setGuideAssets(next);
        persistGuideAssets(next);
        setStatusMessage('✓ Guide assets imported');
      } catch (err) {
        setStatusMessage(`⚠ ${err.message || 'Import failed'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="w-full min-w-0 p-4 md:p-5 bg-slate-900/40 border border-slate-700/50 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.28em]">
            // Telemetry Guide Asset Uplink
          </p>
          {!expanded ? (
            <p className="text-[11px] text-slate-400 mt-1">
              {guideSlots.length} assessment slots · panel URLs &amp; protocol text
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-3xl">
              Broadcast custom hologram panel URLs, execution directives, and camera alignment
              envelopes to live assessment terminals.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={toggleExpanded}
          className="shrink-0 self-start px-3 py-2 rounded border border-purple-700/50 bg-purple-950/20 text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 hover:bg-purple-950/40 hover:border-purple-500/60 transition-colors"
        >
          {expanded ? '[ COLLAPSE GUIDE UPLINK // ]' : '[ EXPAND GUIDE UPLINK // ]'}
        </button>
      </div>

      {expanded ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1 border-t border-slate-800/80">
            <div className="flex flex-wrap gap-2">
              {PACKAGE_FILTER_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPackageFilter(id)}
                  className={`px-2.5 py-1.5 rounded-lg border font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer ${filterButtonClass(id, packageFilter === id)}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-1.5 rounded border border-slate-700 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-purple-300 hover:border-purple-700 transition-colors"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-1.5 rounded border border-slate-700 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-purple-300 hover:border-purple-700 transition-colors"
              >
                Import JSON
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {statusMessage ? (
            <p
              className={`text-[10px] font-mono uppercase tracking-wider ${
                statusMessage.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {statusMessage}
            </p>
          ) : null}

          <div className="max-h-[min(560px,60vh)] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pr-1">
              {filteredSlots.map(({ path, label, packageKey }) => {
                const protocol = resolveGuideProtocolByPath(path, guideAssets);
                const theme = getPackageDeckTheme(packageKey);

                return (
                  <div
                    key={path}
                    className={`min-w-0 flex flex-col gap-2 p-3.5 rounded-lg border ${theme.cardBorder} ${theme.cardBg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[11px] font-mono font-bold uppercase tracking-wide leading-snug break-words ${theme.label}`}
                      >
                        {label}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleResetSlot(path)}
                        className="shrink-0 text-[8px] font-mono uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    <label className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                        Panel Image URL
                      </span>
                      <input
                        type="url"
                        value={protocol.imageUrl}
                        onChange={(e) => updateProtocolField(path, 'imageUrl', e.target.value)}
                        placeholder="https://…"
                        className={`w-full bg-slate-950/90 border ${theme.selectBorder} ${theme.selectFocus} text-slate-100 text-[11px] rounded px-2.5 py-2 outline-none font-mono`}
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                        Execution Protocol
                      </span>
                      <textarea
                        rows={3}
                        value={protocol.execution}
                        onChange={(e) => updateProtocolField(path, 'execution', e.target.value)}
                        className={`w-full bg-slate-950/90 border ${theme.selectBorder} ${theme.selectFocus} text-slate-200 text-[11px] rounded px-2.5 py-2 outline-none font-mono resize-y min-h-[72px]`}
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                        Camera Alignment Envelope
                      </span>
                      <textarea
                        rows={2}
                        value={protocol.alignment}
                        onChange={(e) => updateProtocolField(path, 'alignment', e.target.value)}
                        className={`w-full bg-slate-950/90 border ${theme.selectBorder} ${theme.selectFocus} text-slate-200 text-[11px] rounded px-2.5 py-2 outline-none font-mono resize-y min-h-[56px]`}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
