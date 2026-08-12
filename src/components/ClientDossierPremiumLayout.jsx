import React from 'react';
import { Mail, Phone, Upload, FileText } from 'lucide-react';
import {
  DOSSIER_CARD_LABELS,
  DOSSIER_TEXTAREA_CLASS,
  PREMIUM_LOCK_BANNER,
  getPremiumBlockText,
  buildImmediateCoachPlanBlock,
  getAnatomicalArtworkUrl,
} from '../utils/longevityReportData';

function PremiumCompileButton({ block, isCoachMode, compiling, onCompile }) {
  if (!isCoachMode) return null;
  return (
    <button
      type="button"
      onClick={() => onCompile(block)}
      disabled={!!compiling}
      className="shrink-0 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/50 text-purple-200 font-mono font-bold text-[8px] uppercase tracking-[0.14em] rounded transition-all disabled:opacity-50"
    >
      {compiling === block ? 'COMPILING...' : '[ COMPILE MATRIX ]'}
    </button>
  );
}

function PremiumLockBanner() {
  return (
    <div className="min-h-[140px] flex items-center justify-center p-6 bg-slate-950/60 border border-purple-900/30 rounded-lg">
      <p className="text-sm md:text-base text-slate-500 font-mono text-center leading-relaxed tracking-wide max-w-md">
        {PREMIUM_LOCK_BANNER}
      </p>
    </div>
  );
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
  setEditAssessmentPhoto,
  editReportNarrativeLayout,
  setEditReportNarrativeLayout,
  handleAssessmentPhotoUrlChange,
  onOpenClientReport,
  onCompileMatrix,
  compilingPremiumBlock,
  compileMatrixStatus,
}) {
  const artworkUrl =
    getAnatomicalArtworkUrl(activeClientProfile) ||
    getAnatomicalArtworkUrl({ biometricPhotoUrl: editAssessmentPhoto, assessmentPhoto: editAssessmentPhoto });

  const coachPlanDisplay = isEditMode
    ? editCoachPlanText
    : buildImmediateCoachPlanBlock(activeClientProfile) ||
      getPremiumBlockText(activeClientProfile, 'coachPlan') ||
      activeClientProfile.coach_plan_text ||
      '';

  const phase1Display = isEditMode ? editPhase1Program : getPremiumBlockText(activeClientProfile, 'phase1');
  const phase2Display = isEditMode ? editPhase2Program : getPremiumBlockText(activeClientProfile, 'phase2');
  const somaticDisplay = isEditMode ? editSomaticTips : getPremiumBlockText(activeClientProfile, 'somatic');

  const phase1Locked = !phase1Display.trim();
  const phase2Locked = !phase2Display.trim();
  const somaticLocked = !somaticDisplay.trim();

  const canEditFields = isCoachMode && isEditMode;
  const archetypeBaseline = (activeClientProfile.desc || editDesc || '').trim();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* Left — Identity Specifications */}
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
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="(555) 000-0000"
              />
            ) : (
              <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.phone}</div>
            )}
          </div>

          {isCoachMode && canEditFields && (
            <div className="space-y-1 font-mono">
              <div className="flex items-center gap-2 text-slate-500">
                <Upload className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
                  Anatomical Artwork URL
                </span>
              </div>
              <input
                type="text"
                value={editAssessmentPhoto ?? ''}
                onChange={(e) => {
                  const pasted = e.target.value;
                  if (typeof handleAssessmentPhotoUrlChange === 'function') {
                    handleAssessmentPhotoUrlChange(pasted);
                    return;
                  }
                  setEditAssessmentPhoto?.(pasted);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-cyan-400 text-xs outline-none font-sans"
                placeholder="Paste direct PNG/JPEG image URL..."
              />
            </div>
          )}

          {artworkUrl ? (
            <a
              href={artworkUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex w-full justify-center px-3 py-2.5 bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 rounded-lg text-[9px] font-black tracking-[0.16em] uppercase transition-all"
            >
              [ DOWNLOAD CUSTOM ANATOMICAL ARTWORK // ]
            </a>
          ) : (
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider text-center py-2">
              No anatomical artwork uploaded
            </p>
          )}

          {isCoachMode && canEditFields ? (
            <div className="space-y-1 font-mono">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] font-bold tracking-wider uppercase text-indigo-400">
                  Google Drive Report URL
                </span>
              </div>
              <input
                type="url"
                value={editReportUrl ?? ''}
                onChange={(e) => setEditReportUrl?.(e.target.value)}
                className="w-full bg-slate-950 border border-indigo-500/30 focus:border-indigo-400 rounded p-1.5 text-indigo-300 text-xs outline-none font-sans"
                placeholder="https://drive.google.com/..."
              />
            </div>
          ) : (activeClientProfile.reportUrl || editReportUrl) ? (
            <a
              href={activeClientProfile.reportUrl || editReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full justify-center px-3 py-2 bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 rounded-lg text-[9px] font-black tracking-[0.14em] uppercase transition-all"
            >
              [ OPEN LINKED REPORT // ]
            </a>
          ) : null}

          {isCoachMode && canEditFields && (
            <div className="space-y-1 font-mono">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] font-bold tracking-wider uppercase text-indigo-400">
                  Report Narrative Layout
                </span>
              </div>
              <select
                value={editReportNarrativeLayout || 'separate'}
                onChange={(e) => setEditReportNarrativeLayout?.(e.target.value)}
                className="w-full bg-slate-950 border border-indigo-500/30 text-indigo-300 font-mono text-xs rounded px-2 py-1.5 outline-none"
              >
                <option value="separate">Separate — Archetype + Case Log</option>
                <option value="combined">Combined — Single narrative block</option>
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-slate-400 font-mono">
            <span className="font-bold text-[10px] tracking-wider text-slate-500 uppercase">SYS_ACCESS_PIN:</span>
            <span className="text-sm font-black text-cyan-400 tracking-widest">{accessCode}</span>
          </div>
        </div>
      </div>

      {/* Center — 6-card premium stack (expanded — helix column removed) */}
      <div className="xl:col-span-9 space-y-4">
        {compileMatrixStatus && (
          <p
            className={`text-[10px] font-mono uppercase tracking-wider px-2 ${
              compileMatrixStatus.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {compileMatrixStatus}
          </p>
        )}

        {/* CARD 1 */}
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
          <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest mb-3">
            {DOSSIER_CARD_LABELS.archetype}
          </div>
          <textarea
            readOnly
            value={archetypeBaseline}
            className={`${DOSSIER_TEXTAREA_CLASS} opacity-90 cursor-default`}
            placeholder="No baseline archetype vector logged."
          />
        </div>

        {/* CARD 2 */}
        <div className="p-4 bg-slate-900/40 border border-purple-500/20 rounded-xl">
          <div className="text-[11px] text-purple-400 font-bold uppercase tracking-widest mb-3">
            {DOSSIER_CARD_LABELS.coachPlan}
          </div>
          <textarea
            readOnly={!canEditFields}
            value={coachPlanDisplay}
            onChange={(e) => canEditFields && setEditCoachPlanText(e.target.value)}
            className={DOSSIER_TEXTAREA_CLASS}
            placeholder="Export from Upload Lab or compile coach analysis to populate."
          />
        </div>

        {/* CARD 3 */}
        <div className="p-4 bg-slate-900/40 border border-indigo-500/20 rounded-xl">
          <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mb-3">
            {DOSSIER_CARD_LABELS.kinetic}
          </div>
          <textarea
            readOnly={!canEditFields}
            value={isEditMode ? editNotes : activeClientProfile.notes || ''}
            onChange={(e) => canEditFields && setEditNotes(e.target.value)}
            className={DOSSIER_TEXTAREA_CLASS}
            placeholder="Log asymmetry drops, re-test dates, and global kinetic directives."
          />
        </div>

        {/* CARD 4 */}
        <div className="p-4 bg-slate-900/40 border border-purple-500/25 rounded-xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="text-[11px] text-purple-300 font-bold uppercase tracking-widest leading-snug">
              {DOSSIER_CARD_LABELS.phase1}
            </div>
            <PremiumCompileButton
              block="phase1"
              isCoachMode={isCoachMode}
              compiling={compilingPremiumBlock}
              onCompile={onCompileMatrix}
            />
          </div>
          {phase1Locked ? (
            <PremiumLockBanner />
          ) : (
            <textarea
              readOnly={!canEditFields}
              value={phase1Display}
              onChange={(e) => canEditFields && setEditPhase1Program(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="Two-week activation program will appear here after COMPILE MATRIX."
            />
          )}
        </div>

        {/* CARD 5 */}
        <div className="p-4 bg-slate-900/40 border border-purple-500/25 rounded-xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="text-[11px] text-purple-300 font-bold uppercase tracking-widest leading-snug">
              {DOSSIER_CARD_LABELS.phase2}
            </div>
            <PremiumCompileButton
              block="phase2"
              isCoachMode={isCoachMode}
              compiling={compilingPremiumBlock}
              onCompile={onCompileMatrix}
            />
          </div>
          {phase2Locked ? (
            <PremiumLockBanner />
          ) : (
            <textarea
              readOnly={!canEditFields}
              value={phase2Display}
              onChange={(e) => canEditFields && setEditPhase2Program(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="Four-week stabilization program will appear here after COMPILE MATRIX."
            />
          )}
        </div>

        {/* CARD 6 */}
        <div className="p-4 bg-slate-900/40 border border-emerald-500/20 rounded-xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest leading-snug">
              {DOSSIER_CARD_LABELS.somatic}
            </div>
            <PremiumCompileButton
              block="somatic"
              isCoachMode={isCoachMode}
              compiling={compilingPremiumBlock}
              onCompile={onCompileMatrix}
            />
          </div>
          {somaticLocked ? (
            <PremiumLockBanner />
          ) : (
            <textarea
              readOnly={!canEditFields}
              value={somaticDisplay}
              onChange={(e) => canEditFields && setEditSomaticTips(e.target.value)}
              className={DOSSIER_TEXTAREA_CLASS}
              placeholder="Somatic health strategies will appear here after COMPILE MATRIX."
            />
          )}
        </div>
      </div>
    </div>
  );
}
