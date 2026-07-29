import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import {
  User,
  Users,
  FolderKanban,
  Mail,
  Phone,
  ClipboardList,
  FileText,
  CheckSquare,
  Upload,
} from 'lucide-react';
import CenterSphere from './CenterSphere';
import ClientBiometricArtBox from './ClientBiometricArtBox';
import { AssessmentMorphScene } from './AssessmentMorphScene';
import { GUIDE_TRACK_OPTIONS, DEFAULT_GUIDE_ASSETS, DEFAULT_PANEL_DRAFT_URL, parseGuideAssetPath, normalizeGuideProtocolLeaf } from '../constants/guideAssets';

/** Color-coded terminal status badges for Secure System Database Archives rows */
function ArchiveStatusBadge({ status }) {
  const value = String(status || 'AWAITING SCAN').toUpperCase();

  // Pure monospace cyberpunk badge rendering — string-matched signal states
  if (value === 'AWAITING UPLINK' || value === 'AWAITING SCAN') {
    return (
      <span className="text-[#00FFFF] font-bold whitespace-nowrap">
        [ 🔵 AWAITING UPLINK ]
      </span>
    );
  }

  if (value === 'COMPILING BLU') {
    return (
      <span className="text-[#FFCC00] font-bold whitespace-nowrap">
        [ 🟡 COMPILING BLU ]
      </span>
    );
  }

  if (value === 'STREAM LOCKED' || value === 'STREAM CALIBRATED') {
    return (
      <span className="text-[#00FF66] font-bold whitespace-nowrap">
        [ 🟢 STREAM LOCKED ]
      </span>
    );
  }

  return null;
}

/**
 * Annual liability waiver lifecycle — force re-sign every 365 days.
 * Accepts "YYYY-MM-DD HH:mm:ss" or ISO-ish timestamps from the client dossier.
 */
function getWaiverLifecycleBadge(signedTimestampStr) {
  if (!signedTimestampStr) {
    return {
      tone: 'muted',
      label: '[ 🔵 NO WAIVER RECORD FOUND ]',
    };
  }

  try {
    const normalized = String(signedTimestampStr).trim().replace(' ', 'T');
    const signedDate = new Date(normalized);
    if (Number.isNaN(signedDate.getTime())) {
      // Fallback: Streamlit-style "YYYY-MM-DD HH:MM:SS"
      const m = String(signedTimestampStr).match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
      );
      if (!m) throw new Error('unparseable');
      const parsed = new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6])
      );
      return evaluateWaiverAge(parsed);
    }
    return evaluateWaiverAge(signedDate);
  } catch {
    return {
      tone: 'muted',
      label: '[ 🔵 NO WAIVER RECORD FOUND ]',
    };
  }
}

function evaluateWaiverAge(signedDate) {
  const daysElapsed = Math.floor((Date.now() - signedDate.getTime()) / (1000 * 60 * 60 * 24));
  const stamped = signedDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  if (daysElapsed >= 365) {
    return {
      tone: 'expired',
      label: `[ ⚠️ WAIVER EXPIRED: RE-LOCK NEEDED (${stamped}) ]`,
    };
  }

  return {
    tone: 'secure',
    label: `[ 🟢 CONTRACT SECURE: ${stamped} ]`,
  };
}

function WaiverLifecycleBadge({ signedTimestamp }) {
  const badge = getWaiverLifecycleBadge(signedTimestamp);
  const toneClass =
    badge.tone === 'expired'
      ? 'text-[#FFCC00]'
      : badge.tone === 'secure'
        ? 'text-[#00FF66]'
        : 'text-slate-500';

  return <span className={`${toneClass} font-bold whitespace-nowrap`}>{badge.label}</span>;
}

function archiveTierClass(tier) {
  const value = String(tier || '').toUpperCase();
  if (value.includes('INFINITE')) return 'text-cyan-300';
  if (value.includes('TENSEGRITY')) return 'text-cyan-400';
  if (value.includes('VECTOR')) return 'text-indigo-300';
  return 'text-cyan-400';
}

/** Normalize streamStatus values for archive filter matching */
function normalizeArchiveSignal(status) {
  const value = String(status || 'AWAITING SCAN').toUpperCase();
  if (value === 'STREAM LOCKED' || value === 'STREAM CALIBRATED') return 'STREAM LOCKED';
  if (value === 'COMPILING BLU') return 'COMPILING BLU';
  return 'AWAITING UPLINK';
}

const ARCHIVE_GROUP_ROWS = [
  {
    id: 'group_alpha',
    name: 'KINETIC YOUTH TEAM ALPHA',
    subtext: '18 Active Athlete Tokens',
    tag: 'TEAM BLUEPRINT ACTIVE',
    tagClass: 'text-cyan-400',
    Icon: Users,
    tokenLabel: '18 TOKENS ACTIVE',
    nextCodeBase: 333105,
    roster: [
      { code: '333101', name: 'Alex Rivera', status: 'AWAITING UPLINK' },
      { code: '333102', name: 'Jordan Cruz', status: 'STREAM LOCKED' },
      { code: '333103', name: 'Chloe Zhang', status: 'STREAM LOCKED' },
      { code: '333104', name: 'Ryan Martinez', status: 'COMPILING BLU' },
    ],
  },
  {
    id: 'group_lab_b',
    name: 'WORKSPACE DECOMPRESSION LAB B',
    subtext: '10 Employee Telemetry Profiles',
    tag: 'CORPORATE CONTRACT',
    tagClass: 'text-indigo-400',
    Icon: FolderKanban,
    tokenLabel: '10 TOKENS ACTIVE',
    nextCodeBase: 444105,
    roster: [
      { code: '444101', name: 'Priya Shah', status: 'STREAM LOCKED' },
      { code: '444102', name: 'Noah Keller', status: 'AWAITING UPLINK' },
      { code: '444103', name: 'Sam Ortiz', status: 'COMPILING BLU' },
      { code: '444104', name: 'Elena Cho', status: 'AWAITING UPLINK' },
    ],
  },
];

const ARCHIVE_FILTERS = [
  { id: 'ALL', label: '📁 ALL ARCHIVES' },
  { id: 'AWAITING UPLINK', label: '🔵 AWAITING UPLINK' },
  { id: 'COMPILING BLU', label: '🟡 COMPILING BLU' },
  { id: 'GROUPS', label: '👥 VIEW GROUPS ONLY' },
];

export default function CoachDashboard({
  viewState,
  renderSystemHeader,
  handleReturnToCore,
  activeClientProfile,
  accessCode,
  isCoachMode,
  isEditMode,
  setIsEditMode,
  editNotes,
  setEditNotes,
  editDesc,
  setEditDesc,
  editMetrics,
  setEditMetrics,
  editBirthdate,
  setEditBirthdate,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editTier,
  setEditTier,
  editJoinedDate,
  setEditJoinedDate,
  editReportUrl,
  setEditReportUrl,
  editAssessmentPhoto,
  setEditAssessmentPhoto,
  handleAssessmentPhotoUrlChange, // App.jsx: normalize Drive ID + persist to localDatabase immediately
  activeFocusField,
  setActiveFocusField,
  handleSaveProfileChanges,
  handleTransmitCloudVideo,
  handleChangeClientCode,
  handleDeleteClientRecord,
  localDatabase,
  setLocalDatabase,
  handleSelectClientFromMenu,
  handleDeleteClientFromRoster,
  newClientName,
  setNewClientName,
  newClientCode,
  setNewClientCode,
  newClientArchetype,
  setNewClientArchetype,
  handleCreateNewClient,
  selectedAnalysis,
  bootProgress,
  clientList,
  currentIdx,
  displayClientName,
  guideAssets,
  setGuideAssets,
}) {
  const [cloudVideoInput, setCloudVideoInput] = useState('');
  const [assetPath, setAssetPath] = useState('vital_flow.neck_mobility');
  const [assetDraftUrl, setAssetDraftUrl] = useState(DEFAULT_PANEL_DRAFT_URL);
  const [assetDraftExecution, setAssetDraftExecution] = useState('');
  const [assetDraftAlignment, setAssetDraftAlignment] = useState('');
  const [pipelineRecipientCode, setPipelineRecipientCode] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState('AWAITING UPLINK');
  const [archiveFilter, setArchiveFilter] = useState('ALL');
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [groupRosters, setGroupRosters] = useState(() =>
    Object.fromEntries(ARCHIVE_GROUP_ROWS.map((g) => [g.id, g.roster.map((m) => ({ ...m }))]))
  );
  const [groupNextCodes, setGroupNextCodes] = useState(() =>
    Object.fromEntries(ARCHIVE_GROUP_ROWS.map((g) => [g.id, g.nextCodeBase]))
  );
  const [groupMemberName, setGroupMemberName] = useState('');
  const [groupMemberRole, setGroupMemberRole] = useState('');
  const [groupBatchStatus, setGroupBatchStatus] = useState('AWAITING UPLINK');
  const [groupPanelFlash, setGroupPanelFlash] = useState('');
  const [groupExpandAdd, setGroupExpandAdd] = useState(false);
  const [groupExpandBatch, setGroupExpandBatch] = useState(false);
  const [groupExpandManifest, setGroupExpandManifest] = useState(true);
  const [assetBroadcastPhase, setAssetBroadcastPhase] = useState(''); // '' | 'transmitting' | 'success'

  const activeGroup = ARCHIVE_GROUP_ROWS.find((g) => g.id === activeGroupId) || null;
  const activeGroupRoster = activeGroupId ? groupRosters[activeGroupId] || [] : [];
  const activeGeneratedCode = activeGroupId
    ? String(groupNextCodes[activeGroupId] || activeGroup?.nextCodeBase || 333111)
    : '333111';

  const handleSelectGroup = (groupId) => {
    setActiveGroupId(groupId);
    setArchiveFilter('GROUPS');
    setGroupPanelFlash('');
    setGroupExpandAdd(false);
    setGroupExpandBatch(false);
    setGroupExpandManifest(true);
  };

  const handleAppendGroupMember = () => {
    if (!activeGroupId || !groupMemberName.trim()) {
      setGroupPanelFlash('[ ERROR // ATHLETE FULL NAME REQUIRED ]');
      return;
    }
    const code = String(groupNextCodes[activeGroupId] || 333111);
    const role = groupMemberRole.trim() || 'UNASSIGNED ROLE';
    setGroupRosters((prev) => ({
      ...prev,
      [activeGroupId]: [
        ...(prev[activeGroupId] || []),
        {
          code,
          name: groupMemberName.trim(),
          role,
          status: 'AWAITING UPLINK',
        },
      ],
    }));
    setGroupNextCodes((prev) => ({
      ...prev,
      [activeGroupId]: Number(code) + 1,
    }));
    setGroupPanelFlash(
      `[ SUCCESS // ${groupMemberName.trim().toUpperCase()} INJECTED INTO ${activeGroup?.name || 'GROUP'} ]`
    );
    setGroupMemberName('');
    setGroupMemberRole('');
  };

  const handleBroadcastGroupBatchStatus = () => {
    if (!activeGroupId) return;
    setGroupRosters((prev) => ({
      ...prev,
      [activeGroupId]: (prev[activeGroupId] || []).map((member) => {
        const signal = normalizeArchiveSignal(member.status);
        if (signal === 'STREAM LOCKED') return member;
        return { ...member, status: groupBatchStatus };
      }),
    }));
    setGroupPanelFlash(
      `[ WARNING // INCOMPLETE TEAM TOKENS MOVED TO: ${groupBatchStatus} ]`
    );
  };

  // Keep recipient selector pointed at a live archive row
  useEffect(() => {
    const codes = Object.keys(localDatabase || {});
    if (!codes.length) {
      setPipelineRecipientCode('');
      return;
    }
    if (!pipelineRecipientCode || !localDatabase[pipelineRecipientCode]) {
      setPipelineRecipientCode(codes[0]);
    }
  }, [localDatabase, pipelineRecipientCode]);

  // Sync draft fields when coach switches suite.slot path or parent guideAssets updates
  useEffect(() => {
    const { suiteKey, slotKey } = parseGuideAssetPath(assetPath);
    const suite = guideAssets?.[suiteKey] || DEFAULT_GUIDE_ASSETS[suiteKey];
    const protocol = normalizeGuideProtocolLeaf(suite?.[slotKey]);
    setAssetDraftUrl(protocol.imageUrl || DEFAULT_PANEL_DRAFT_URL);
    setAssetDraftExecution(protocol.execution || '');
    setAssetDraftAlignment(protocol.alignment || '');
  }, [assetPath, guideAssets]);

  // Mirror selected athlete's current stream badge into the override dropdown
  useEffect(() => {
    if (!pipelineRecipientCode || !localDatabase?.[pipelineRecipientCode]) return;
    const raw = String(localDatabase[pipelineRecipientCode].streamStatus || 'AWAITING SCAN').toUpperCase();
    if (raw === 'STREAM CALIBRATED' || raw === 'STREAM LOCKED') {
      setPipelineStatus('STREAM LOCKED');
    } else if (raw === 'COMPILING BLU') {
      setPipelineStatus('COMPILING BLU');
    } else {
      setPipelineStatus('AWAITING UPLINK');
    }
  }, [pipelineRecipientCode, localDatabase]);

  const handleDeployGuideAssets = () => {
    if (!setGuideAssets || !assetPath || assetBroadcastPhase) return;
    const { suiteKey, slotKey } = parseGuideAssetPath(assetPath);
    if (!suiteKey || !slotKey) return;
    const priorSuite = {
      ...(DEFAULT_GUIDE_ASSETS[suiteKey] || {}),
      ...(guideAssets?.[suiteKey] || {}),
    };
    const protocolPacket = {
      imageUrl: String(assetDraftUrl || '').trim(),
      execution: String(assetDraftExecution || '').trim(),
      alignment: String(assetDraftAlignment || '').trim(),
    };
    const updatedAssets = {
      ...(guideAssets || DEFAULT_GUIDE_ASSETS),
      [suiteKey]: {
        ...priorSuite,
        [slotKey]: protocolPacket,
      },
    };
    setGuideAssets(updatedAssets);
    try {
      window.localStorage.setItem('MATRIX_GLOBAL_GUIDE_ASSETS', JSON.stringify(updatedAssets));
    } catch {
      /* storage may be blocked */
    }

    // Force live visual update on the central archive column for the selected recipient
    if (typeof setLocalDatabase === 'function' && pipelineRecipientCode) {
      setLocalDatabase((prev) => {
        if (!prev?.[pipelineRecipientCode]) return prev;
        return {
          ...prev,
          [pipelineRecipientCode]: {
            ...prev[pipelineRecipientCode],
            streamStatus: pipelineStatus,
          },
        };
      });
    }

    setAssetBroadcastPhase('transmitting');
    window.setTimeout(() => {
      setAssetBroadcastPhase('success');
      window.setTimeout(() => setAssetBroadcastPhase(''), 2000);
    }, 1500);
  };

  // SYSTEM FRAME B: Premium Biometric Client Profile Portal Hub
  if (viewState === 'client_profile' && activeClientProfile) {
    return (
      <div className="w-full h-full bg-[#020617]/95 text-white font-mono flex flex-col overflow-hidden relative backdrop-blur-xl">
        {renderSystemHeader(`CLIENT_DOSSIER // ${activeClientProfile.name.toUpperCase()}`)}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          {/* Your main active card panel framework remains perfectly safe inside here */}
          <div className="w-full max-w-7xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl backdrop-blur-xl p-6 md:p-8 shadow-2xl relative">

            {/* Dossier Header — centered biometric profile system title */}
            <div className="border-b border-slate-900 pb-6 mb-6 text-center">
              <h2 className="font-mono text-2xl font-black text-white tracking-widest uppercase text-center w-full block">
                {activeClientProfile.name}
              </h2>
              <p className="font-mono text-sm font-black text-cyan-400 tracking-wider uppercase mt-2 animate-[pulse_4s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                // ACTIVE BIOMETRIC PROFILE SYSTEM //
              </p>
            </div>

            {/* Grid Separation Layout — matched left art / middle notes / right globe symmetry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Left Column: Blueprint Art (matches globe height) + subscription banners */}
              <div className="flex flex-col gap-4 h-full min-h-[460px]">
                <div className="flex-1 min-h-[400px]">
                  <ClientBiometricArtBox clientData={activeClientProfile} />
                </div>

                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl shrink-0">
                  <div className="mb-3 text-xs font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-0.5 bg-slate-950 rounded-full border border-slate-800 inline-block">
                    {activeClientProfile.archetype}
                  </div>
                  <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider mb-1">
                    CURRENT MATRIX SUBSCRIPTION
                  </span>
                  {isEditMode && isCoachMode ? (
                    <select
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-400 font-mono text-xs rounded px-2 py-1.5 outline-none tracking-wide cursor-pointer font-bold uppercase shadow-inner"
                    >
                      <option value="Vector Tier">Vector Tier</option>
                      <option value="Tensegrity Tier">Tensegrity Tier</option>
                      <option value="Infinite Matrix Tier">Infinite Matrix Tier</option>
                      <option value="INFINITE APEX MATRIX ENGINE">INFINITE APEX MATRIX ENGINE</option>
                    </select>
                  ) : (
                    <span
                      className={`text-sm font-black tracking-wide uppercase font-mono block mt-0.5
                        ${activeClientProfile.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400' : ''}
                        ${activeClientProfile.matrixTier === 'INFINITE APEX MATRIX ENGINE' ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]' : ''}
                        ${activeClientProfile.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                        ${activeClientProfile.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                      `}
                    >
                      {activeClientProfile.matrixTier || 'Vector Tier'}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Column: Case logs (top) → Identity Specs (bottom) */}
              <div className="space-y-4 flex flex-col justify-start h-full min-h-[460px]">
                <div
                  onClick={() => isEditMode && setActiveFocusField('desc')}
                  className={`p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-200
                    ${isEditMode ? 'hover:bg-slate-900 hover:border-cyan-500/50 cursor-zoom-in group shadow-lg shadow-cyan-950/20' : ''}
                  `}
                >
                  <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Biomechanical Archetype Vector
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] text-cyan-500 font-black animate-pulse tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                        ⛶ CLICK TO EXPAND
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-6">
                    {isEditMode ? editDesc || 'No narrative logged yet.' : activeClientProfile.desc}
                  </p>
                </div>

                <div
                  onClick={() => isEditMode && setActiveFocusField('notes')}
                  className={`p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-200
                    ${isEditMode ? 'hover:bg-slate-900 hover:border-indigo-500/50 cursor-zoom-in group shadow-lg shadow-indigo-950/20' : ''}
                  `}
                >
                  <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4" /> Kinetic Directives & Case Log
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] text-indigo-500 font-black animate-pulse tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                        ⛶ CLICK TO EXPAND
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-6">
                    {isEditMode ? editNotes || 'No directives logged yet.' : activeClientProfile.notes}
                  </p>
                </div>

                {Array.isArray(activeClientProfile.diagnosticBlocks) &&
                  activeClientProfile.diagnosticBlocks.length > 0 && (
                    <div className="p-5 bg-slate-900/40 border border-amber-500/25 rounded-xl space-y-3 shadow-[0_0_24px_rgba(245,158,11,0.08)]">
                      <div className="text-[11px] text-amber-300 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <span>🧬 System Diagnostics // PROTOCOL_0X-BA</span>
                      </div>
                      {activeClientProfile.diagnosticBlocks.map((block) => (
                        <div
                          key={block.label}
                          className="border border-slate-800/80 rounded-lg bg-slate-950/50 px-3 py-2.5 space-y-1"
                        >
                          <p className="text-[10px] font-black tracking-wider text-cyan-400 uppercase font-mono">
                            {block.label}
                          </p>
                          <p className="text-xs font-mono text-amber-200/90 tracking-wide uppercase">
                            {block.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="border-t border-slate-800 pt-4 mt-auto">
                  <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 text-xs font-medium text-slate-300">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-950 pb-1.5">
                      // IDENTITY SPECIFICATIONS
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Email Contact</span>
                      </div>
                      {!isCoachMode || (isEditMode && isCoachMode) ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans truncate"
                          placeholder="name@email.com"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-slate-200 pl-5 truncate max-w-full font-sans">
                          {activeClientProfile.email}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Phone Terminal</span>
                      </div>
                      {!isCoachMode || (isEditMode && isCoachMode) ? (
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

                    {isCoachMode && (
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
                            Google Drive Report URL
                          </span>
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editReportUrl}
                            onChange={(e) => setEditReportUrl(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-cyan-400 text-xs outline-none font-sans shadow-inner"
                            placeholder="Paste Google Drive share link here..."
                          />
                        ) : activeClientProfile.reportUrl && activeClientProfile.reportUrl !== '' ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(activeClientProfile.reportUrl, '_blank', 'noopener,noreferrer')
                            }
                            className="inline-flex items-center gap-1.5 mt-0.5 px-3 py-1.5 bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-cyan-300 rounded-full text-[9px] font-black tracking-[0.16em] uppercase transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95"
                          >
                            [ OPEN CLIENT MOVEMENT REEL ↗ ]
                          </button>
                        ) : (
                          <div className="text-xs text-slate-400 font-sans pl-5 truncate max-w-full italic">
                            No link connected // Compiling state
                          </div>
                        )}
                      </div>
                    )}

                    {isCoachMode && (
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Upload className="w-3.5 h-3.5 text-cyan-500" />
                          <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
                            🧬 [ UPDATE CORE BIOMETRIC PHOTO URL ]
                          </span>
                        </div>
                        {isEditMode ? (
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
                            onBlur={(e) => {
                              if (typeof handleAssessmentPhotoUrlChange === 'function') {
                                handleAssessmentPhotoUrlChange(e.target.value);
                              }
                            }}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-cyan-400 text-xs outline-none font-sans shadow-inner"
                            placeholder="Paste direct PNG/JPEG/Imgur image URL..."
                          />
                        ) : (
                          <div className="text-xs text-slate-400 font-sans pl-5 truncate max-w-full italic">
                            {activeClientProfile.biometricPhotoUrl ||
                              activeClientProfile.assessmentPhoto ||
                              'No art linked // awaiting coach transmission'}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-slate-400 font-mono">
                      <span className="font-bold text-[10px] tracking-wider text-slate-500 uppercase">SYS_ACCESS_PIN:</span>
                      <span className="text-sm font-black text-cyan-400 tracking-widest bg-slate-950 px-2 py-0.5 border border-slate-900 rounded">
                        {accessCode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Core Vector Deck — always mounts spinning CenterSphere globe */}
              <div className="flex flex-col h-full min-h-[460px] relative">
                <div className="w-full h-full min-h-[460px] bg-slate-950/70 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-xl flex flex-col shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2.5 shrink-0">
                    <div>
                      <p className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">// TENSEGRITY LAYER</p>
                      <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase">CORE VECTOR DECK</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono block text-slate-500 uppercase tracking-widest">ACTIVE ARCHIVE</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {activeClientProfile.name.split(' ')[0].toUpperCase()}_SYS
                      </span>
                    </div>
                  </div>

                  <div
                    data-rodin-biometric-slot="standing-back"
                    className="flex-1 w-full bg-[#030d1e]/40 border border-cyan-950/60 rounded-lg overflow-hidden relative inner-shadow min-h-[300px] flex flex-col"
                  >
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <span className="text-[8px] font-mono font-bold tracking-[0.18em] uppercase text-slate-600 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded">
                        // CORE VECTOR DECK // GEOMETRIC TERMINAL GLOBE
                      </span>
                    </div>
                    <div className="relative flex-1 w-full min-h-[300px] overflow-hidden">
                      <CenterSphere viewState="landing" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier Actions Terminal */}
            <div className="pt-5 border-t border-slate-900 mt-5 flex flex-wrap justify-between items-center gap-4">
              {isCoachMode ? (
                <div className="flex flex-wrap gap-2 animate-fade-in ml-auto">
                  <button
                    onClick={() => {
                      const reportText = `==================================================\nLONGEVITY BLUEPRINT OBJECTIVE BIOMETRIC REPORT\n==================================================\nATHLETE DOSSIER: ${activeClientProfile.name.toUpperCase()}\nARCHETYPE:       ${activeClientProfile.archetype.toUpperCase()}\nPASSCODE KEY:    [ ${accessCode} ]\nRECORDED DOB:    ${activeClientProfile.birthdate}\nCONTACT LINE:    ${activeClientProfile.email}\n--------------------------------------------------\n BIOMECHANICAL ARCHETYPE VECTOR LOG:\n${editDesc}\n KINETIC DIRECTIVES & CASE COACH NOTES:\n${editNotes}\n-------------------------------------------------- VERIFIED METRIC CALIBRATION RATINGS:\n- Deep Squat Mobility Matrix:    ${editMetrics.squat}\n- Single-Leg Land Stability:     ${editMetrics.land}\n- Kinetic Power Extension (CMJ): ${editMetrics.cmj}\n- Multi-Plane Deceleration (505): ${editMetrics.agility}\n==================================================\nSECURE BLUEPRINT GENERATION // SYSTEMS ENGINE v4.8\n==================================================`;
                      const element = document.createElement('a');
                      const file = new Blob([reportText], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = `${activeClientProfile.name.replace(/\s+/g, '_')}_Biometric_Blueprint.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="px-3 py-1.5 bg-slate-950 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    📥 Export Data
                  </button>
                  <button
                    onClick={handleChangeClientCode}
                    className="px-3 py-1.5 bg-slate-950 text-indigo-400 border border-indigo-500/40 hover:border-indigo-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    🔑 Change Code
                  </button>
                  <button
                    onClick={() => (isEditMode ? handleSaveProfileChanges() : setIsEditMode(true))}
                    className={`px-3 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer border ${
                      isEditMode
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-cyan-400 border-cyan-500/40'
                    }`}
                  >
                    {isEditMode ? '✓ Save Changes' : '⚙ Modify Record'}
                  </button>
                  <button
                    onClick={handleDeleteClientRecord}
                    className="px-3 py-1.5 bg-slate-950/40 text-rose-500 border border-rose-900/50 hover:border-rose-500 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    🗑️ Delete Client
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 w-full font-mono animate-fade-in">
                  <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 min-w-[280px] max-w-xl">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest shrink-0">
                      // CLOUD TELEMETRY UPLINK PIPELINE
                    </span>
                    <input
                      type="text"
                      value={cloudVideoInput}
                      onChange={(e) => setCloudVideoInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-900 rounded p-2 text-xs text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[180px]"
                      placeholder="Paste Google Drive or Dropbox video link..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleTransmitCloudVideo?.(cloudVideoInput);
                        setCloudVideoInput('');
                      }}
                      className="text-[9px] font-bold tracking-[0.18em] uppercase text-indigo-400/80 hover:text-cyan-300 transition-colors cursor-pointer bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg shrink-0"
                    >
                      [ TRANSMIT RAW VIDEO VECTORS // ]
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      // Pull the shared folder path string directly from memory
                      const destinationUrl = activeClientProfile.reportUrl;

                      if (destinationUrl && destinationUrl !== '') {
                        // Launches their Dropbox/Drive folder in a clean separate window tab
                        window.open(destinationUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        // Fallback warning if you haven't assigned a cloud path yet
                        alert(
                          '⚡ TELEMETRY COMPILING // COACH IS REFINING YOUR OBJECTIVE BIOMECHANICAL REPORT. REGISTRATION LINK COMING SOON.'
                        );
                      }
                    }}
                    className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-bold rounded text-[10px] tracking-widest uppercase transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                    📥 Download Report
                  </button>
                  <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase bg-slate-950 px-3 py-1.5 border border-emerald-900/40 rounded shadow-md">
                    ✓ SECURE CLIENT READ-ONLY PATHWAY ENFORCED
                  </div>
                  </div>
                  {activeClientProfile.reportUrl ? (
                    <div className="w-full text-[9px] text-emerald-400/80 tracking-wider uppercase truncate">
                      ✓ UPLINK STAGED // LINK LOCKED TO DOSSIER
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* High-Art Secure Document Status Footer Bar */}
            <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>OFFICIAL BIOMETRIC BLUEPRINT SECURED // VALID ACCESS PATH</span>
              </div>
              <div>STATION RECOVERY ENGINE: v4.8_STABLE</div>
            </div>

          </div>
        </div>

        {/* Dynamic Focus Pad Overlay Area Component */}
        {activeFocusField && (
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in font-mono">
            <div
              className={`w-full max-w-5xl h-[90vh] bg-slate-950 border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                activeFocusField === 'desc' ? 'border-cyan-500/40' : 'border-indigo-500/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">// HIGH-CAPACITY TEXT FOCUS WRITER</span>
                    <h3
                      className={`text-lg font-black uppercase mt-0.5 ${
                        activeFocusField === 'desc' ? 'text-cyan-400' : 'text-indigo-400'
                      }`}
                    >
                      {activeFocusField === 'desc'
                        ? 'Biomechanical Archetype Editor'
                        : 'Kinetic Directives Case Logger'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveFocusField(null)}
                    className="px-3.5 py-1.5 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 text-xs bg-slate-900 font-bold tracking-widest uppercase cursor-pointer active:scale-95"
                  >
                    ✕ Close Pad [ESC]
                  </button>
                </div>
                <textarea
                  autoFocus
                  readOnly={!isCoachMode}
                  value={activeFocusField === 'desc' ? editDesc : editNotes}
                  onChange={(e) =>
                    isCoachMode &&
                    (activeFocusField === 'desc' ? setEditDesc(e.target.value) : setEditNotes(e.target.value))
                  }
                  className={`w-full h-[62vh] bg-[#030712] border border-slate-900 rounded-xl p-6 text-base text-slate-200 font-sans focus:outline-none resize-none ${
                    activeFocusField === 'desc' ? 'focus:border-cyan-500/60' : 'focus:border-indigo-500/60'
                  }`}
                />
              </div>
              <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
                <div className="text-[11px] text-slate-600">MATRIX CELL: {activeFocusField.toUpperCase()}_LOG_BUFFER</div>
                <button
                  onClick={() => setActiveFocusField(null)}
                  className={`px-5 py-2.5 rounded-lg text-slate-950 font-bold text-xs tracking-widest uppercase cursor-pointer active:scale-95 ${
                    activeFocusField === 'desc' ? 'bg-cyan-400' : 'bg-indigo-400'
                  }`}
                >
                  ✓ Close & Minimize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SYSTEM FRAME C: Master Coach Roster & Onboarding Console Menu
  if (viewState === 'coach_menu') {
    return (
      <div className="w-full h-full bg-[#01040a]/95 text-white font-mono flex flex-col overflow-hidden select-none backdrop-blur-xl">
        {renderSystemHeader('COACH_TERMINAL')}
        <div className="flex-1 overflow-y-auto">
          <div className="coach-dashboard-widescreen">
            {/* Master Control Board Title Section — full-bleed across columns */}
            <div className="dashboard-span-all border-b border-slate-900/80 pb-4">
              <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase">
                // CONTROL TERMINAL ARCHIVES
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight uppercase">
                Coach Intelligence Dashboard
              </h2>
              <div className="flex flex-wrap gap-4 text-[9px] font-mono tracking-widest uppercase mt-2">
                <span className="text-cyan-400">[ ARCHIVE CAPACITY: 05 / 256 CHANNELS ]</span>
                <span className="text-indigo-400">[ PIPELINE ENCRYPTION: SHA-256 ACTIVE ]</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  [ TELEMETRY SERVER UPLINK: ONLINE ]
                </span>
              </div>
            </div>

            {/* Column 1: Onboard a New Client Form */}
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 min-w-0">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-slate-950 pb-2 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Onboard New Athlete Matrix
              </div>
              <form onSubmit={handleCreateNewClient} className="space-y-4 font-mono text-sm">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-200 outline-none font-sans text-base transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    ASSIGN 6-DIGIT PASSCODE
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 444444"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-400 focus:text-cyan-400 tracking-[0.25em] text-center font-black text-lg outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Movement Specialization Archetype
                  </label>
                  <select
                    value={newClientArchetype}
                    onChange={(e) => setNewClientArchetype(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-200 outline-none text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    <option value="Acrobatics & Hand Balance">Acrobatics & Hand Balance</option>
                    <option value="Jiu-Jitsu / Combat Athlete">Jiu-Jitsu / Combat Athlete</option>
                    <option value="Advanced Yoga Practitioner">Advanced Yoga Practitioner</option>
                    <option value="MMA / Muay Thai Striking">MMA / Muay Thai Striking</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full text-center py-2.5 bg-cyan-500 text-slate-950 font-bold border border-cyan-400 rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-[0.98] mt-2"
                >
                  ➕ Initialize Client Portal
                </button>
              </form>

              <div className="mt-6 border border-slate-900 bg-slate-950/40 p-4 rounded-xl font-mono text-left space-y-2.5">
                <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block">
                  // LAB OPERATIONAL LEDGER
                </p>
                <p className="text-slate-300 text-[10px]">• ACTIVE SUBSCRIPTIONS: $2,394 / MO</p>
                <p className="text-slate-300 text-[10px]">• HIGH-INTENSIVE TRAJECTORIES: 3 RUNNING</p>
                <p className="text-emerald-400 text-[10px]">• SYSTEM RETENTION RATE: 98.4% CALIBRATED</p>
              </div>
            </div>

            {/* Column 2: Secure System Database Archives */}
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 min-w-0 flex flex-col">
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest border-b border-slate-950 pb-2 shrink-0">
                // SECURE SYSTEM DATABASE ARCHIVES
              </div>

              {/* Horizontal filter reticle row */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
                {ARCHIVE_FILTERS.map((filter) => {
                  const active = archiveFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setArchiveFilter(filter.id)}
                      className={`px-2 py-2 rounded-lg border font-mono text-[9px] tracking-widest uppercase transition-all cursor-pointer active:scale-[0.98] ${
                        active
                          ? 'border-cyan-400/50 bg-cyan-950/40 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.12)]'
                          : 'border-slate-900 bg-slate-950/60 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase shrink-0">
                {`[ ACTIVE VIEWER RETICLE: FILTERING BY ${archiveFilter} ]`}
              </p>

              <div className="secure-system-archives flex flex-col gap-3 w-full pr-1">
                {archiveFilter !== 'GROUPS' &&
                  Object.entries(localDatabase)
                    .filter(([, client]) => {
                      if (archiveFilter === 'ALL') return true;
                      return normalizeArchiveSignal(client.streamStatus) === archiveFilter;
                    })
                    .map(([code, client]) => (
                  <div
                    key={code}
                    onClick={() => {
                      setActiveGroupId(null);
                      handleSelectClientFromMenu(code);
                    }}
                    className="p-4 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl transition-all flex flex-col md:flex-row md:items-center gap-4 cursor-pointer group active:scale-[0.99] w-full"
                  >
                    {/* Left info — identity (≈ 2.3fr) */}
                    <div className="flex items-center gap-3.5 min-w-0 md:flex-[2.3]">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                          👤 {client.name}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide mt-0.5 truncate">
                          {client.archetype}
                        </div>
                      </div>
                    </div>

                    {/* Right telemetry — enrolled / tier / access / waiver (≈ 1.7fr) */}
                    <div className="flex items-start md:items-center justify-between md:justify-end gap-3 md:flex-[1.7] min-w-0">
                      <div className="text-left md:text-right font-mono text-[11px] leading-relaxed text-slate-400 min-w-0 w-full">
                        <div className="truncate">
                          ENROLLED: {client.joinedDate || 'PENDING'}{' '}
                          <span className="text-slate-600">|</span> LEVEL:{' '}
                          <span className={`font-bold uppercase ${archiveTierClass(client.matrixTier)}`}>
                            {client.matrixTier || 'Vector Tier'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 md:justify-end">
                          <span>
                            ACCESS CODE:{' '}
                            <span className="text-[#00FFFF] font-bold tracking-widest">{code}</span>
                          </span>
                          <span className="text-slate-600">|</span>
                          <WaiverLifecycleBadge
                            signedTimestamp={client.waiverSigned || client.waiver_signed}
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 md:justify-end">
                          <ArchiveStatusBadge status={client.streamStatus} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `CRITICAL SYSTEM WARNING // PERMANENTLY SCRUB ${client.name.toUpperCase()} FROM LOG ARCHIVES?\n\nTHIS OPERATION CANNOT BE UNDONE.`
                            )
                          ) {
                            handleDeleteClientFromRoster(code);
                          }
                        }}
                        className="p-2 bg-slate-900/60 border border-slate-900 hover:border-rose-900 text-slate-600 hover:text-rose-500 rounded-lg transition-all cursor-pointer active:scale-90 font-sans text-xs font-bold shrink-0"
                        title="Scrub Client Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {(archiveFilter === 'ALL' || archiveFilter === 'GROUPS') &&
                  ARCHIVE_GROUP_ROWS.map((group) => {
                  const GroupIcon = group.Icon;
                  const isActiveGroup = activeGroupId === group.id;
                  return (
                    <div
                      key={group.id}
                      onClick={() => handleSelectGroup(group.id)}
                      className={`p-4 bg-slate-950 hover:bg-slate-900 border rounded-xl transition-all flex items-center justify-between group active:scale-[0.99] w-full cursor-pointer ${
                        isActiveGroup
                          ? 'border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.15)]'
                          : 'border-slate-900 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0">
                          <GroupIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate uppercase tracking-wide">
                            {group.name}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide mt-0.5 truncate">
                            {group.subtext}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right font-mono shrink-0 ml-4">
                        <div className="min-w-[120px]">
                          <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">
                            NODE CLASS
                          </span>
                          <span className={`text-xs font-black tracking-wide uppercase ${group.tagClass}`}>
                            {group.tag}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.confirm(
                              `CRITICAL SYSTEM WARNING // SCRUB COLLECTIVE NODE ${group.name}?\n\nTHIS OPERATION IS ARCHIVAL ONLY.`
                            );
                          }}
                          className="p-2 bg-slate-900/60 border border-slate-900 hover:border-rose-900 text-slate-600 hover:text-rose-500 rounded-lg transition-all cursor-pointer active:scale-90 font-sans text-xs font-bold"
                          title="Scrub Group Record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Telemetry uplink OR Group Integrity Management */}
            {activeGroup ? (
              <div className="p-5 bg-slate-900/40 border border-indigo-500/25 rounded-xl space-y-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-300 tracking-widest uppercase">
                      👥 // GROUP INTEGRITY MANAGEMENT PANEL
                    </div>
                    <p className="mt-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                      {`TARGET SYSTEM: ${activeGroup.name} // ${activeGroup.tokenLabel}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveGroupId(null)}
                    className="px-2.5 py-1 border border-slate-800 hover:border-cyan-500/40 rounded text-[9px] font-mono tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    [ EXIT GROUP MODE ]
                  </button>
                </div>

                {groupPanelFlash ? (
                  <p
                    className={`text-[10px] font-mono tracking-widest uppercase px-3 py-2 rounded border ${
                      groupPanelFlash.includes('WARNING')
                        ? 'border-amber-500/40 text-amber-300 bg-amber-950/20'
                        : groupPanelFlash.includes('ERROR')
                          ? 'border-rose-500/40 text-rose-300 bg-rose-950/20'
                          : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                    }`}
                  >
                    {groupPanelFlash}
                  </p>
                ) : null}

                {/* ADD NEW ROSTER MEMBER */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGroupExpandAdd((v) => !v)}
                    className="w-full px-3 py-2.5 bg-slate-950/80 text-left text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 hover:bg-slate-900 cursor-pointer"
                  >
                    {groupExpandAdd ? '▾' : '▸'} ➕ ADD NEW ROSTER MEMBER TO THIS GROUP
                  </button>
                  {groupExpandAdd && (
                    <div className="p-3 space-y-3 border-t border-slate-900">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                          Athlete Full Name
                        </label>
                        <input
                          type="text"
                          value={groupMemberName}
                          onChange={(e) => setGroupMemberName(e.target.value)}
                          placeholder="e.g. Liam Henderson"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2 text-slate-200 font-sans text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                          Position / Role Assignment
                        </label>
                        <input
                          type="text"
                          value={groupMemberRole}
                          onChange={(e) => setGroupMemberRole(e.target.value)}
                          placeholder="e.g. Lead Tumbler / Base"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2 text-slate-200 font-sans text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                          Generated Assignment Code
                        </label>
                        <input
                          type="text"
                          value={`${activeGeneratedCode} (AUTO)`}
                          disabled
                          className="w-full bg-slate-950/70 border border-slate-900 rounded p-2 text-cyan-400/80 font-mono text-sm tracking-widest cursor-not-allowed"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAppendGroupMember}
                        className="w-full px-3 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-[10px] tracking-widest uppercase rounded transition-all cursor-pointer active:scale-[0.98]"
                      >
                        ⚡ APPEND TO TEAM ROSTER MATRIX
                      </button>
                    </div>
                  )}
                </div>

                {/* BATCH UPDATE OPERATIONS */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGroupExpandBatch((v) => !v)}
                    className="w-full px-3 py-2.5 bg-slate-950/80 text-left text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 hover:bg-slate-900 cursor-pointer"
                  >
                    {groupExpandBatch ? '▾' : '▸'} 📝 BATCH UPDATE OPERATIONS
                  </button>
                  {groupExpandBatch && (
                    <div className="p-3 space-y-3 border-t border-slate-900">
                      <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                        [ GLOBAL SELECTION STATE OVERRIDE ]
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                          Set Status For All Unfinished Team Tokens
                        </label>
                        <select
                          value={groupBatchStatus}
                          onChange={(e) => setGroupBatchStatus(e.target.value)}
                          className="w-full bg-slate-950 border border-amber-500/30 text-amber-200 font-mono text-[11px] p-2 rounded outline-none cursor-pointer"
                        >
                          <option value="AWAITING UPLINK">AWAITING UPLINK</option>
                          <option value="COMPILING BLU">COMPILING BLU</option>
                          <option value="STREAM LOCKED">STREAM LOCKED</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleBroadcastGroupBatchStatus}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-400 font-mono font-bold text-[10px] tracking-widest uppercase rounded transition-all cursor-pointer active:scale-[0.98]"
                      >
                        📡 BROADCAST MASS RE-CALIBRATION VECTOR
                      </button>
                    </div>
                  )}
                </div>

                {/* ACTIVE TEAM MANIFEST */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGroupExpandManifest((v) => !v)}
                    className="w-full px-3 py-2.5 bg-slate-950/80 text-left text-[10px] font-mono font-bold tracking-widest uppercase text-indigo-300 hover:bg-slate-900 cursor-pointer"
                  >
                    {groupExpandManifest ? '▾' : '▸'} 📋 ACTIVE TEAM MANIFEST (QUICK REVIEW)
                  </button>
                  {groupExpandManifest && (
                    <div className="p-3 space-y-2 border-t border-slate-900 max-h-[280px] overflow-y-auto">
                      {activeGroupRoster.map((member) => (
                        <div
                          key={member.code}
                          className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300"
                        >
                          <span className="truncate">
                            • [CODE: {member.code}] {member.name}
                            {member.role ? ` // ${member.role}` : ''}
                          </span>
                          <ArchiveStatusBadge status={member.status} />
                        </div>
                      ))}
                      {!activeGroupRoster.length && (
                        <p className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">
                          [ EMPTY ROSTER // AWAITING FIRST APPEND ]
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-900/40 border border-amber-500/20 rounded-xl space-y-4 min-w-0">
                <div className="text-xs font-mono font-bold text-amber-500 mb-4 tracking-widest">
                  📡 // TELEMETRY UPLINK MODULATOR
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                    Target Assessment Track
                  </label>
                  <select
                    value={assetPath}
                    onChange={(e) => setAssetPath(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] p-2 rounded w-full focus:border-amber-500/40 outline-none cursor-pointer"
                  >
                    {GUIDE_TRACK_OPTIONS.map((opt) => (
                      <option key={opt.path} value={opt.path}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

              <div className="border-t border-slate-900 pt-3 space-y-3">
                <p className="text-[10px] font-mono tracking-widest text-amber-500/70 uppercase">
                  [ EDIT DATA STREAM CONFIGURATION ]
                </p>

                <div className="space-y-1.5">
                  <label className="text-amber-500/80 text-[10px] font-bold uppercase tracking-wider block">
                    Panel Image URL
                  </label>
                  <input
                    type="text"
                    value={assetDraftUrl}
                    onChange={(e) => setAssetDraftUrl(e.target.value)}
                    placeholder="https://i.imgur.com/m0UrRMJ.png"
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] p-2 rounded w-full focus:border-amber-500/40 outline-none"
                  />
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-3">
                  <p className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                    [ OVERRIDE ATHLETE DATASTREAM PROFILE STATE ]
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                      Recipient Athlete Matrix
                    </label>
                    <select
                      value={pipelineRecipientCode}
                      onChange={(e) => setPipelineRecipientCode(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] p-2 rounded w-full focus:border-cyan-500/40 outline-none cursor-pointer"
                    >
                      {Object.entries(localDatabase || {}).map(([code, client]) => (
                        <option key={code} value={code}>
                          {client.name} // {code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                      Update Recipient Operational Status
                    </label>
                    <select
                      value={pipelineStatus}
                      onChange={(e) => setPipelineStatus(e.target.value)}
                      className="bg-slate-950 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] p-2 rounded w-full focus:border-cyan-400 outline-none cursor-pointer"
                    >
                      <option value="AWAITING UPLINK">AWAITING UPLINK</option>
                      <option value="COMPILING BLU">COMPILING BLU</option>
                      <option value="STREAM LOCKED">STREAM LOCKED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-amber-500/80 text-[10px] font-bold uppercase tracking-wider block">
                    📝 BOX 1: Movement Execution Instructions
                  </label>
                  <textarea
                    value={assetDraftExecution}
                    onChange={(e) => setAssetDraftExecution(e.target.value)}
                    rows={4}
                    placeholder="Enter client instructions here..."
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-sans text-[12px] p-2.5 rounded w-full focus:border-amber-500/40 outline-none resize-y min-h-[96px] leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-amber-500/80 text-[10px] font-bold uppercase tracking-wider block">
                    📷 BOX 2: Camera Angle & Alignment
                  </label>
                  <textarea
                    value={assetDraftAlignment}
                    onChange={(e) => setAssetDraftAlignment(e.target.value)}
                    rows={4}
                    placeholder="Enter setup and distance requirements here..."
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-sans text-[12px] p-2.5 rounded w-full focus:border-amber-500/40 outline-none resize-y min-h-[96px] leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDeployGuideAssets}
                  disabled={Boolean(assetBroadcastPhase)}
                  className={`w-full px-4 py-2.5 bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-400 font-mono font-bold text-[10px] tracking-widest uppercase rounded transition-all cursor-pointer active:scale-[0.98] ${
                    assetBroadcastPhase === 'transmitting'
                      ? 'animate-pulse cursor-wait opacity-90'
                      : assetBroadcastPhase === 'success'
                        ? 'border-emerald-500/40 text-emerald-400 cursor-default'
                        : ''
                  }`}
                >
                  {assetBroadcastPhase === 'transmitting'
                    ? '[ TRANSMITTING INJECTED PACKETS... SUCCESS ]'
                    : assetBroadcastPhase === 'success'
                      ? '[ TARGET MATRIX STREAM UPDATED // GLOBAL TERMINAL ROWS SYNCED ]'
                      : '⚡ BROADCAST NEW ASSET VECTOR //'}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME B: Telemetry Sync Calibration Bar Loader
  if (viewState === 'loading') {
    return (
      <div className="w-full h-full bg-[#02050d]/90 text-white flex flex-col items-center justify-center font-mono p-6 select-none relative overflow-hidden backdrop-blur-md">
        <div className="w-[440px] bg-slate-950/90 border border-cyan-500/20 p-8 rounded-xl shadow-[0_0_60px_rgba(6,182,212,0.05)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 border-b border-cyan-950/60 pb-4">
            <span className="text-[12px] tracking-widest text-cyan-400 uppercase font-bold">SYSTEM CALIBRATION</span>
            <span className="text-[10px] text-slate-500 font-bold">LN_V4.8</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm tracking-wider text-slate-300 mb-2">
                <span className="uppercase">COMPILING {selectedAnalysis}...</span>
                <span className="text-cyan-400 font-bold">{Math.min(bootProgress, 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 border border-cyan-950 rounded-full overflow-hidden p-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  style={{ width: `${Math.min(bootProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME C: High-Art Studio Preview Deck View
  if (viewState === 'dashboard') {
    return (
      <div className="w-full h-full bg-[#020813]/95 text-white flex flex-col font-sans select-none overflow-hidden backdrop-blur-xl">
        {renderSystemHeader('ASSESSMENT_DECK')}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            {/* Upgraded Larger Viewport Container Card */}
            <div className="w-[640px] h-[680px] bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
                <div>
                  <p className="text-[11px] tracking-widest text-cyan-400 font-mono uppercase">Biomechanical Target</p>
                  <h2 className="text-lg font-bold tracking-wider text-slate-200 uppercase">{selectedAnalysis}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono block text-slate-500 uppercase tracking-widest">Active Matrix</span>
                  <span className="text-[12px] font-mono text-cyan-400 font-bold">{displayClientName}</span>
                </div>
              </div>

              <div className="flex-1 w-full bg-[#030d1e]/90 border border-cyan-950/60 rounded-xl overflow-hidden relative inner-shadow">
                <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Suspense fallback={null}>
                    <AssessmentMorphScene clientImagePath={clientList[currentIdx]} />
                  </Suspense>
                  <Grid
                    renderOrder={-1}
                    position={[0, -1.35, 0]}
                    args={[10.5, 10.5]}
                    cellSize={0.25}
                    cellThickness={0.7}
                    cellColor="#082f49"
                    sectionSize={1.25}
                    sectionThickness={1.2}
                    sectionColor="#0e7490"
                    fadeDistance={6}
                  />
                  <OrbitControls enableZoom maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 4} />
                </Canvas>
              </div>

              <div className="mt-4 flex flex-col gap-2 pointer-events-auto">
                <div className="flex gap-2 w-full pointer-events-auto">
                  <a href="/report.pdf" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-slate-900 border border-cyan-400/60 text-cyan-300 text-[12px] font-mono font-bold tracking-wider rounded-lg uppercase shadow-[0_0_12px_rgba(0,242,254,0.35)] transition-all duration-200 hover:border-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60 hover:shadow-[0_0_22px_rgba(0,242,254,0.65)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Open Report
                    </button>
                  </a>
                  <button
                    onClick={handleReturnToCore}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-[12px] font-mono font-bold tracking-wider rounded-lg uppercase"
                  >
                    ↩ Return To Core
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return null;
}
