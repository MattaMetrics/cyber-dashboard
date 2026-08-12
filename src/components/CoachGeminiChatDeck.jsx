import React, { useEffect, useRef } from 'react';
import {
  COACH_FEEDBACK_IDLE_TEXT,
  COACH_FEEDBACK_LOADING_TEXT,
  getCoachPersonaLabel,
  normalizeCoachPersonaKey,
} from '../constants/coachPersonas';

/**
 * Live Coach–Gemini chat deck: scrollable white log + cyberpunk transmit input.
 */
export default function CoachGeminiChatDeck({
  messages = [],
  chatInput = '',
  onChatInputChange,
  onSubmit,
  isChatLoading = false,
  isAnalyzing = false,
  analysisStatus = '',
  seedAssistantMessage = '',
  idleText = COACH_FEEDBACK_IDLE_TEXT,
  loadingText = COACH_FEEDBACK_LOADING_TEXT,
  selectedCoach = 'gideon',
  voiceEnabled = false,
  onReplayLast,
  headerLabel = '🤖 GIDEON COACH FEEDBACK',
  placeholder = '// TRANSMIT DIRECTIVE TO GIDEON CO-PILOT...',
  expanded = false,
}) {
  const scrollRef = useRef(null);
  const coachLabel = getCoachPersonaLabel(selectedCoach);
  const userRoleLabel =
    normalizeCoachPersonaKey(selectedCoach) === 'gideon' ? 'Captain Directive' : 'Coach Directive';

  const displayMessages =
    messages.length > 0
      ? messages
      : isAnalyzing
        ? [{ id: 'loading', role: 'system', content: loadingText }]
        : seedAssistantMessage
          ? [{ id: 'seed', role: 'assistant', content: seedAssistantMessage }]
          : analysisStatus
            ? [{ id: 'status', role: 'system', content: analysisStatus }]
            : [];

  const lastAssistant =
    [...displayMessages].reverse().find((m) => m.role === 'assistant')?.content || '';

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayMessages.length, isChatLoading, isAnalyzing]);

  return (
    <div className="mt-2 p-3 rounded-lg bg-slate-900 border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] space-y-2">
      <div className="flex items-center justify-between mb-1 px-0.5">
        <span className="text-purple-300 text-[10px] font-mono tracking-[0.22em] uppercase font-bold">
          {headerLabel}
        </span>
        <div className="flex items-center gap-2">
          {displayMessages.length > 0 && !isAnalyzing ? (
            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-[0.18em]">
              ● Live Deck
            </span>
          ) : null}
          {lastAssistant && voiceEnabled && onReplayLast ? (
            <button
              type="button"
              onClick={() => onReplayLast(lastAssistant)}
              className="text-[9px] font-mono text-purple-300 hover:text-purple-100 uppercase tracking-[0.14em] border border-purple-500/40 px-2 py-0.5 rounded"
              title="Replay coach voice"
            >
              🔊 Replay
            </button>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`bg-white/95 text-slate-900 font-sans p-3 md:p-4 rounded-md leading-relaxed shadow-[inset_0_2px_12px_rgba(15,23,42,0.08)] overflow-y-auto custom-scrollbar space-y-3 ${
          expanded
            ? 'min-h-[220px] max-h-[min(480px,55vh)]'
            : 'min-h-[140px] max-h-[240px]'
        }`}
      >
        {displayMessages.length === 0 && !isAnalyzing && !analysisStatus ? (
          <p className="text-base md:text-lg text-slate-500 font-mono italic text-center py-4 tracking-wide leading-relaxed">
            {idleText}
          </p>
        ) : (
          displayMessages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.role === 'user'
                  ? 'border-l-2 border-cyan-500 pl-3'
                  : msg.role === 'system'
                    ? 'text-cyan-800 font-mono text-sm animate-pulse'
                    : 'border-l-2 border-purple-400 pl-3'
              }
            >
              <span className="text-[9px] uppercase tracking-widest block mb-1 opacity-60 font-mono">
                {msg.role === 'user'
                  ? userRoleLabel
                  : msg.role === 'system'
                    ? 'System'
                    : `${coachLabel} Response`}
              </span>
              <p className="text-sm md:text-base font-medium whitespace-pre-wrap tracking-wide leading-relaxed text-slate-800">
                {msg.content}
              </p>
            </div>
          ))
        )}
        {isChatLoading && (
          <p className="text-sm text-purple-700 animate-pulse font-mono tracking-wide px-1">
            {coachLabel} is processing follow-up telemetry...
          </p>
        )}
      </div>

      <form
        className="flex gap-2 pt-0.5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChatInputChange?.(e.target.value)}
          disabled={isChatLoading || isAnalyzing}
          placeholder={placeholder}
          className="flex-1 bg-slate-950 border border-purple-500/50 focus:border-purple-400 focus:shadow-[0_0_10px_rgba(168,85,247,0.25)] text-slate-100 text-sm rounded-lg px-3 py-2.5 outline-none placeholder:text-slate-600 font-mono tracking-wide transition-all"
        />
        <button
          type="submit"
          disabled={isChatLoading || isAnalyzing || !chatInput.trim()}
          className="px-4 py-2 bg-purple-600/80 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider border border-purple-400/30 transition-all"
        >
          Send
        </button>
      </form>
    </div>
  );
}
