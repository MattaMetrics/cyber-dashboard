import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, FileText } from 'lucide-react';
import {
  DOSSIER_CARD_LABELS,
  DOSSIER_TEXTAREA_CLASS,
  buildImmediateCoachPlanBlock,
  getAnatomicalArtworkUrl,
  getPremiumBlockText,
} from '../utils/longevityReportData';
import DossierCyberSidebar from './DossierCyberSidebar';

function CompileButton({ block, isCoachMode, compiling, onCompile }) {
  if (!isCoachMode) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCompile(block);
      }}
      disabled={!!compiling}
      className="shrink-0 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/50 text-purple-200 font-mono font-bold text-[8px] uppercase tracking-[0.14em] rounded transition-all disabled:opacity-50"
    >
      {compiling === block ? 'COMPILING...' : '[ COMPILE MATRIX ]'}
    </button>
  );
}

function DossierAccordionRow({
  index,
  activeCardIndex,
  onToggle,
  title,
  accentClass,
  borderClass,
  headerRight = null,
  preview = '',
  children,
}) {
  const isOpen = activeCardIndex === index;

  return (
    <div
      className={`dossier-accordion-row ${borderClass} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        className="dossier-accordion-header"
        onClick={() => onToggle(index)}
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span
            className={`text-[10px] font-black uppercase tracking-[0.16em] font-mono truncate ${accentClass}`}
          >
            {title}
          </span>
          {!isOpen && preview ? (
            <span className="hidden sm:block text-[10px] font-mono text-slate-500 truncate max-w-[42%]">
              {preview}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight}
          <ChevronDown size={16} className="dossier-accordion-chevron" />
        </div>
      </button>

      <div className={`dossier-accordion-panel ${isOpen ? 'is-open' : ''}`}>
        <div className="dossier-accordion-panel-inner">
          <div className="dossier-accordion-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

function previewLine(text, max = 56) {
  const line = (text || '').trim().replace(/\s+/g, ' ');
  if (!line) return '';
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export default function ClientDossierPremiumLayout({
  activeClientProfile,
  accessCode,
  isCoachMode,
  isEditMode,
  editDesc,
  setEditDesc,
  editCoachPlanText,
  setEditCoachPlanText,
  editNotes,
  setEditNotes,
  editPhase1Program,
  setEditPhase1Program,
  editPhase2Program,
  setEditPhase2Program,
  editSomaticTips,
  setEditSomaticTips,
  editClientAge,
  setEditClientAge,
  editClientGender,
  setEditClientGender,
  editClientHeight,
  setEditClientHeight,
  editClientWeight,
  setEditClientWeight,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editTier,
  setEditTier,
  editReportUrl,
  setEditReportUrl,
  editAssessmentPhoto,
  handleAssessmentPhotoUrlChange,
  onOpenClientReport,
  onCompileMatrix,
  compilingPremiumBlock,
  compileMatrixStatus,
}) {
  const [activeCardIndex, setActiveCardIndex] = useState(null);

  const artworkUrl =
    getAnatomicalArtworkUrl(activeClientProfile) ||
    getAnatomicalArtworkUrl({ biometricPhotoUrl: editAssessmentPhoto, assessmentPhoto: editAssessmentPhoto });

  const coachPlanDisplay = isEditMode
    ? editCoachPlanText
    : buildImmediateCoachPlanBlock(activeClientProfile) ||
      activeClientProfile.coach_plan_text ||
      '';

  const phase1Display = isEditMode ? editPhase1Program : getPremiumBlockText(activeClientProfile, 'phase1');
  const phase2Display = isEditMode ? editPhase2Program : getPremiumBlockText(activeClientProfile, 'phase2');
  const somaticDisplay = isEditMode ? editSomaticTips : getPremiumBlockText(activeClientProfile, 'somatic');
  const notesDisplay = isEditMode ? editNotes : activeClientProfile.notes || '';

  const canEditFields = isCoachMode && isEditMode;
  const archetypeBaseline = (activeClientProfile.desc || editDesc || '').trim();
  const archetypeValue = canEditFields ? editDesc : archetypeBaseline;

  const handleToggleCard = (index) => {
    setActiveCardIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* Left — 25% Identity Specifications */}
      <div className="xl:col-span-3 space-y-4">
        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl shrink-0">
          <div className="mb-2 text-xs font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-0.5 bg-slate-950 rounded-full border border-slate-800 inline-block">
            {activeClientProfile.archetype}
          </div>
          <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider mb-1">
            CURRENT MATRIX SUBSCRIPTION
          </span>
          {canEditFields ? (
            <select
              value={editTier}
              onChange={(e) => setEditTier(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-400 font-mono text-xs rounded px-2 py-1.5 outline-none tracking-wide cursor-pointer font-bold uppercase"
            >
              <option value="Vector Tier">Vector Tier</option>
              <option value="Tensegrity Tier">Tensegrity Tier</option>
              <option value="Infinite Matrix Tier">Infinite Matrix Tier</option>
              <option value="INFINITE APEX MATRIX ENGINE">INFINITE APEX MATRIX ENGINE</option>
            </select>
          ) : (
            <span className="text-sm font-black tracking-wide uppercase font-mono block mt-0.5 text-cyan-400">
              {activeClientProfile.matrixTier || 'Vector Tier'}
            </span>
          )}
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 text-xs font-medium text-slate-300">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-950 pb-1.5">
            // IDENTITY SPECIFICATIONS
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Client Age', value: editClientAge, set: setEditClientAge, type: 'number', placeholder: '62' },
              { label: 'Height', value: editClientHeight, set: setEditClientHeight, type: 'text', placeholder: '5ft 10in' },
              { label: 'Weight', value: editClientWeight, set: setEditClientWeight, type: 'text', placeholder: '185 lbs' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label} className="space-y-1 font-mono">
                <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">{label}</span>
                {canEditFields ? (
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-200">{value || '—'}</div>
                )}
              </div>
            ))}
            <div className="space-y-1 font-mono col-span-2">
              <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">Gender</span>
              {canEditFields ? (
                <select
                  value={editClientGender}
                  onChange={(e) => setEditClientGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              ) : (
                <div className="text-sm font-semibold text-slate-200">
                  {activeClientProfile.clientGender || '—'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold tracking-wider uppercase">Email Contact</span>
            </div>
            {canEditFields ? (
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="name@email.com"
              />
            ) : (
              <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.email}</div>
            )}
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold tracking-wider uppercase">Phone Terminal</span>
            </div>
            {canEditFields ? (
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="(555) 000-0000"
              />
            ) : (
              <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.phone}</div>
            )}
          </div>

          <div className="space-y-1 font-mono pt-2 border-t border-slate-900/60">
            <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
              Assessment Photo URL
            </span>
            {canEditFields ? (
              <input
                type="url"
                value={editAssessmentPhoto}
                onChange={(e) => handleAssessmentPhotoUrlChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="https://..."
              />
            ) : (
              <div className="text-sm font-semibold text-slate-200 truncate">{artworkUrl || '—'}</div>
            )}
          </div>

          <div className="space-y-1 font-mono">
            <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
              Cloud Report URL
            </span>
            {canEditFields ? (
              <input
                type="url"
                value={editReportUrl}
                onChange={(e) => setEditReportUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="Google Drive / Aikynetix link"
              />
            ) : (
              <div className="text-sm font-semibold text-slate-200 truncate">
                {activeClientProfile.reportUrl || '—'}
              </div>
            )}
          </div>

          {onOpenClientReport ? (
            <button
              type="button"
              onClick={onOpenClientReport}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
            >
              <FileText className="w-4 h-4" /> Open Report Viewer
            </button>
          ) : null}

          <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-slate-400 font-mono">
            <span className="font-bold text-[10px] tracking-wider text-slate-500 uppercase">SYS_ACCESS_PIN:</span>
            <span className="text-sm font-black text-cyan-400 tracking-widest">{accessCode}</span>
          </div>
        </div>
      </div>

      {/* Center — 50% collapsible program accordion */}
      <div className="xl:col-span-6 min-w-0">
        {compileMatrixStatus ? (
          <p
            className={`text-[10px] font-mono uppercase tracking-wider px-2 mb-3 ${
              compileMatrixStatus.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {compileMatrixStatus}
          </p>
        ) : null}

        <div className="dossier-accordion-stack">
          <DossierAccordionRow
            index={0}
            activeCardIndex={activeCardIndex}
            onToggle={handleToggleCard}
            title={DOSSIER_CARD_LABELS.archetype}
            accentClass="text-cyan-400"
            borderClass="border-cyan-500/25"
            preview={previewLine(archetypeValue)}
          >
            <textarea
              readOnly={!canEditFields}
              value={archetypeValue}
              onChange={(e) => canEditFields && setEditDesc(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="No baseline archetype vector logged."
            />
          </DossierAccordionRow>

          <DossierAccordionRow
            index={1}
            activeCardIndex={activeCardIndex}
            onToggle={handleToggleCard}
            title={DOSSIER_CARD_LABELS.coachCues}
            accentClass="text-amber-300"
            borderClass="border-amber-500/25"
            preview={previewLine(coachPlanDisplay || notesDisplay)}
          >
            <div className="space-y-4">
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2 font-mono">
                  {DOSSIER_CARD_LABELS.kineticDirectives}
                </div>
                <textarea
                  readOnly={!canEditFields}
                  value={notesDisplay}
                  onChange={(e) => canEditFields && setEditNotes(e.target.value)}
                  className={DOSSIER_TEXTAREA_CLASS}
                  placeholder="Log asymmetry drops, re-test dates, and compensation targets."
                />
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2 font-mono">
                  {DOSSIER_CARD_LABELS.coachCues}
                </div>
                <textarea
                  readOnly={!canEditFields}
                  value={coachPlanDisplay}
                  onChange={(e) => canEditFields && setEditCoachPlanText(e.target.value)}
                  className={DOSSIER_TEXTAREA_CLASS}
                  placeholder="Coach analysis and right-now adjustment cues."
                />
              </div>
            </div>
          </DossierAccordionRow>

          <DossierAccordionRow
            index={2}
            activeCardIndex={activeCardIndex}
            onToggle={handleToggleCard}
            title={DOSSIER_CARD_LABELS.period1}
            accentClass="text-purple-300"
            borderClass="border-purple-500/25"
            preview={previewLine(phase1Display)}
            headerRight={
              <CompileButton
                block="phase1"
                isCoachMode={isCoachMode}
                compiling={compilingPremiumBlock}
                onCompile={onCompileMatrix}
              />
            }
          >
            <textarea
              readOnly={!canEditFields}
              value={phase1Display}
              onChange={(e) => canEditFields && setEditPhase1Program(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="Two-week activation program schedule."
            />
          </DossierAccordionRow>

          <DossierAccordionRow
            index={3}
            activeCardIndex={activeCardIndex}
            onToggle={handleToggleCard}
            title={DOSSIER_CARD_LABELS.period2}
            accentClass="text-purple-300"
            borderClass="border-purple-500/25"
            preview={previewLine(phase2Display)}
            headerRight={
              <CompileButton
                block="phase2"
                isCoachMode={isCoachMode}
                compiling={compilingPremiumBlock}
                onCompile={onCompileMatrix}
              />
            }
          >
            <textarea
              readOnly={!canEditFields}
              value={phase2Display}
              onChange={(e) => canEditFields && setEditPhase2Program(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="Four-week stabilization program schedule."
            />
          </DossierAccordionRow>

          <DossierAccordionRow
            index={4}
            activeCardIndex={activeCardIndex}
            onToggle={handleToggleCard}
            title={DOSSIER_CARD_LABELS.somatic}
            accentClass="text-emerald-400"
            borderClass="border-emerald-500/25"
            preview={previewLine(somaticDisplay)}
            headerRight={
              <CompileButton
                block="somatic"
                isCoachMode={isCoachMode}
                compiling={compilingPremiumBlock}
                onCompile={onCompileMatrix}
              />
            }
          >
            <textarea
              readOnly={!canEditFields}
              value={somaticDisplay}
              onChange={(e) => canEditFields && setEditSomaticTips(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="Massage, mobility, and daily life therapeutic strategies."
            />
          </DossierAccordionRow>
        </div>
      </div>

      {/* Right — 25% cyber animation + telemetry rail */}
      <div className="xl:col-span-3 min-w-0">
        <DossierCyberSidebar
          clientName={activeClientProfile.name}
          accessCode={accessCode}
          activeClientProfile={activeClientProfile}
        />
      </div>
    </div>
  );
}
