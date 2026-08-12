import React from 'react';
import { Eye, Layout } from 'lucide-react';

export default function ReportViewModeToggle({ viewMode, onChange, className = '' }) {
  return (
    <div
      className={`flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange('blueprint')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
          viewMode === 'blueprint'
            ? 'bg-white text-slate-950 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Layout size={14} className="text-cyan-500" /> CYBER BLUEPRINT
      </button>
      <button
        type="button"
        onClick={() => onChange('original_aikynetix')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
          viewMode === 'original_aikynetix'
            ? 'bg-slate-950 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Eye size={14} className="text-amber-500" /> ORIGINAL AIKYNETIX
      </button>
    </div>
  );
}
