import React from 'react';
import { buildUnifiedReportCards } from '../utils/longevityReportData';

const CARD_ACCENTS = {
  archetype: 'border-cyan-500/40 text-cyan-700',
  quickResults: 'border-indigo-500/40 text-indigo-700',
  awareness: 'border-amber-500/40 text-amber-800',
  periodization: 'border-purple-500/40 text-purple-700',
  somatic: 'border-emerald-500/40 text-emerald-700',
};

const CARD_ACCENTS_DARK = {
  archetype: 'border-cyan-500/30 text-cyan-400',
  quickResults: 'border-indigo-500/30 text-indigo-300',
  awareness: 'border-amber-500/30 text-amber-300',
  periodization: 'border-purple-500/30 text-purple-300',
  somatic: 'border-emerald-500/30 text-emerald-400',
};

function CardShell({ card, variant, index }) {
  const isDark = variant === 'dark';
  const accent = isDark ? CARD_ACCENTS_DARK[card.key] : CARD_ACCENTS[card.key];
  const body = (card.body || '').trim();
  const placeholder =
    card.key === 'archetype'
      ? 'No baseline archetype vector logged.'
      : card.key === 'quickResults'
        ? 'Awaiting YOLO lab telemetry sync.'
        : '—';

  return (
    <section
      className={`report-unified-card break-inside-avoid ${
        isDark
          ? 'p-4 bg-slate-900/40 border border-slate-800 rounded-xl'
          : 'p-5 bg-white border border-slate-200 rounded-2xl shadow-sm'
      }`}
      aria-labelledby={`unified-card-${card.key}`}
    >
      <header
        id={`unified-card-${card.key}`}
        className={`text-[11px] font-black uppercase tracking-[0.18em] font-mono mb-3 pb-2 border-b ${
          isDark ? `border-slate-800 ${accent}` : `border-slate-100 ${accent}`
        }`}
      >
        {String(index + 1).padStart(2, '0')} // {card.title}
      </header>
      <div
        className={`whitespace-pre-wrap leading-relaxed ${
          isDark
            ? 'text-base md:text-[17px] font-sans font-medium text-slate-100'
            : 'text-sm md:text-[15px] font-sans text-slate-800'
        }`}
      >
        {body || (
          <span className={isDark ? 'text-slate-500 italic' : 'text-slate-400 italic'}>
            {placeholder}
          </span>
        )}
      </div>
    </section>
  );
}

export default function UnifiedReportCards({
  client,
  cards: cardsProp,
  variant = 'light',
  className = '',
}) {
  const cards = cardsProp || buildUnifiedReportCards(client);

  return (
    <div className={`space-y-5 ${className}`}>
      {cards.map((card, index) => (
        <CardShell key={card.key} card={card} variant={variant} index={index} />
      ))}
    </div>
  );
}
