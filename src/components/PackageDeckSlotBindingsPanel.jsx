import React, { useMemo, useRef, useState } from 'react';
import {
  buildDefaultSlotBindings,
  exportSlotBindingsJSON,
  getLibraryTrackOptions,
  getPackageDeckTheme,
  importSlotBindingsJSON,
  listBindableDeckSlots,
  PACKAGE_FILTER_OPTIONS,
  persistBindingsPanelExpanded,
  persistSlotBindings,
  readBindingsPanelExpanded,
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
 * Coach Dashboard — reassign which master library track fills each package deck slot.
 * Bindings persist to localStorage (MATRIX_PACKAGE_SLOT_BINDINGS).
 */
export default function PackageDeckSlotBindingsPanel({ slotBindings, setSlotBindings }) {
  const libraryOptions = useMemo(() => getLibraryTrackOptions(), []);
  const bindableSlots = useMemo(() => listBindableDeckSlots(), []);
  const defaults = useMemo(() => buildDefaultSlotBindings(), []);
  const importInputRef = useRef(null);

  const [expanded, setExpanded] = useState(() => readBindingsPanelExpanded());
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState('');

  const filteredSlots = useMemo(() => {
    if (packageFilter === 'ALL') return bindableSlots;
    return bindableSlots.filter(({ packageKey }) => packageKey === packageFilter);
  }, [bindableSlots, packageFilter]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      persistBindingsPanelExpanded(next);
      return next;
    });
  };

  const handleSlotChange = (packageKey, slot, libraryId) => {
    const nextId = Number(libraryId);
    if (!Number.isFinite(nextId)) return;

    setSlotBindings((prev) => {
      const next = {
        ...prev,
        [packageKey]: {
          ...(prev[packageKey] || {}),
          [slot]: nextId,
        },
      };
      persistSlotBindings(next);
      return next;
    });
  };

  const handleResetDefaults = () => {
    const next = buildDefaultSlotBindings();
    setSlotBindings(next);
    persistSlotBindings(next);
    setStatusMessage('✓ Restored system default slot bindings');
  };

  const handleExport = () => {
    try {
      const json = exportSlotBindingsJSON(slotBindings);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `matrix-deck-bindings-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatusMessage('✓ Deck bindings exported');
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
        const next = importSlotBindingsJSON(reader.result);
        setSlotBindings(next);
        persistSlotBindings(next);
        setStatusMessage('✓ Deck bindings imported');
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
            // Package Deck Slot Bindings
          </p>
          {!expanded ? (
            <p className="text-[11px] text-slate-400 mt-1">
              {bindableSlots.length} deck slots · configure library track swaps
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-3xl">
              Swap which master library movement fills each package slot without editing terminal
              code.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={toggleExpanded}
          className="shrink-0 self-start px-3 py-2 rounded border border-cyan-700/50 bg-cyan-950/20 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 hover:bg-cyan-950/40 hover:border-cyan-500/60 transition-colors"
        >
          {expanded ? '[ COLLAPSE DECK BINDINGS // ]' : '[ EXPAND DECK BINDINGS // ]'}
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
                className="px-3 py-1.5 rounded border border-slate-700 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-300 hover:border-cyan-700 transition-colors"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-1.5 rounded border border-slate-700 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-300 hover:border-cyan-700 transition-colors"
              >
                Import JSON
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded border border-slate-700 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-300 hover:border-cyan-700 transition-colors"
              >
                Reset Defaults
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

          <div className="max-h-[min(520px,55vh)] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-1">
              {filteredSlots.map(({ packageKey, slot, label }) => {
                const currentId =
                  slotBindings?.[packageKey]?.[slot] ?? defaults?.[packageKey]?.[slot] ?? '';
                const selectedOption = libraryOptions.find((opt) => opt.value === currentId);
                const theme = getPackageDeckTheme(packageKey);

                return (
                  <div
                    key={`${packageKey}-${slot}`}
                    className={`min-w-0 flex flex-col gap-2 p-3.5 rounded-lg border ${theme.cardBorder} ${theme.cardBg}`}
                  >
                    <p
                      className={`text-[11px] font-mono font-bold uppercase tracking-wide leading-snug break-words ${theme.label}`}
                    >
                      {label}
                    </p>
                    <select
                      value={currentId}
                      title={selectedOption?.label || 'Select library track'}
                      onChange={(e) => handleSlotChange(packageKey, slot, e.target.value)}
                      className={`w-full min-w-0 bg-slate-950/90 border ${theme.selectBorder} ${theme.selectFocus} text-slate-100 text-[11px] rounded px-2.5 py-2 outline-none font-mono`}
                    >
                      <option value="">— unassigned —</option>
                      {libraryOptions.map(({ value, label: optLabel }) => (
                        <option key={value} value={value}>
                          {optLabel}
                        </option>
                      ))}
                    </select>
                    {selectedOption ? (
                      <p className={`text-[10px] font-mono leading-snug break-words ${theme.labelMuted}`}>
                        {selectedOption.label}
                      </p>
                    ) : null}
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
