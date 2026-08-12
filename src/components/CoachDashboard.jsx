import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clientHasMovementVideo } from '../utils/clientVideoService';
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
import ClientDossierPremiumLayout from './ClientDossierPremiumLayout';
import AccessCodeGenerator from './AccessCodeGenerator';
import CoachGeminiChatDeck from './CoachGeminiChatDeck';
import TacticalWorkflowButtonStack from './TacticalWorkflowButtonStack';
import { AssessmentMorphScene } from './AssessmentMorphScene';
import { DEFAULT_GUIDE_ASSETS } from '../constants/guideAssets';
import { getLabEngineMetrics } from '../data/assessmentLibrary';
import {
  applyPipelineResultsToClient,
  clientHasLongevityReport,
  buildPdfPlanFromClient,
  normalizeClientDossier,
  buildGeminiMetricsPayload,
  extractPremiumBlockFromGemini,
  applyPremiumBlockToClient,
} from '../utils/longevityReportData';
import { saveClientRecord } from '../constants/labDatabase';
import {
  COACH_PERSONA_OPTIONS,
  COACH_VOICE_GREETINGS,
  getCoachPersonaLabel,
  getCoachVoiceEngineLabel,
  isLegacyCoachFeedbackPlaceholder,
  normalizeCoachPersonaKey,
  speakCoachText,
} from '../constants/coachPersonas';

const YOLO_API_BASE = 'http://localhost:8001';
const GEMINI_API_BASE = 'http://localhost:8000';

function getCoPilotMatrixTag(coachKey) {
  const key = normalizeCoachPersonaKey(coachKey);
  const tags = {
    gideon: 'GIDEON_MATRIX_V3.5',
    combat_coach: 'COMBAT_COACH_MATRIX_V3.5',
    yoga_spirit: 'YOGA_SPIRIT_MATRIX_V3.5',
  };
  return tags[key] || `${key.toUpperCase()}_MATRIX_V3.5`;
}

/** Pull joint angles + asymmetry from YOLO dashboard JSON for coach terminal display */
function extractYoloTelemetry(results) {
  if (!results || results.error || typeof results !== 'object') return null;

  const jointAngles = results.angles || {};
  if (!Object.keys(jointAngles).length && !results.scores) return null;

  const symmetryScore = results.scores?.symmetry_score;
  const asymmetryIndex =
    symmetryScore != null
      ? Math.max(0, Math.round((100 - symmetryScore) * 10) / 10)
      : null;

  return {
    jointAngles,
    asymmetryIndex,
    meta: {
      testName: results.header?.test_name || 'YOLO Lab Scan',
      overallScore: results.header?.overall_score,
      grade: results.header?.grade,
      framesAnalyzed: results.frames_analyzed,
    },
  };
}

/** Build ReportLab payload from active client dossier (delegates to longevityReportData) */
function buildCoachPdfPlanFromClient(client) {
  return buildPdfPlanFromClient(client);
}

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
  editReportNarrativeLayout,
  setEditReportNarrativeLayout,
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
  editCoachPlanText,
  setEditCoachPlanText,
  editAssessmentPhoto,
  setEditAssessmentPhoto,
  handleAssessmentPhotoUrlChange, // App.jsx: normalize Drive ID + persist to localDatabase immediately
  activeFocusField,
  setActiveFocusField,
  handleSaveProfileChanges,
  handleTransmitCloudVideo,
  handleDownloadMovementVideo,
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
  onNavigate,
  setCurrentScreen,
  onOpenClientReport,
  setActiveClientProfile,
}) {
  const [cloudVideoInput, setCloudVideoInput] = useState('');
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
  const [yoloJointAngles, setYoloJointAngles] = useState({});
  const [yoloAsymmetryIndex, setYoloAsymmetryIndex] = useState(null);
  const [yoloLabMeta, setYoloLabMeta] = useState(null);
  const [yoloLoadStatus, setYoloLoadStatus] = useState('');
  const [isLoadingYolo, setIsLoadingYolo] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [compilingPremiumBlock, setCompilingPremiumBlock] = useState(null);
  const [compileMatrixStatus, setCompileMatrixStatus] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('gideon');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const voiceEnabledRef = useRef(false);
  const speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const speakAsCoach = useCallback(
    (text, coachKey = 'gideon', { force = false } = {}) => {
      speakCoachText(speechSynth, text, coachKey, {
        force,
        voiceEnabled: voiceEnabledRef.current,
      });
    },
    [speechSynth]
  );

  useEffect(() => {
    const storedPersona =
      activeClientProfile?.longevityReport?.coachPlan?.coach_persona ||
      activeClientProfile?.longevityReport?.geminiPlan?.coach_persona;
    if (storedPersona) {
      setSelectedCoach(normalizeCoachPersonaKey(storedPersona));
    }
  }, [accessCode, activeClientProfile]);

  useEffect(() => {
    if (!speechSynth) return;
    const loadVoices = () => speechSynth.getVoices();
    loadVoices();
    speechSynth.addEventListener('voiceschanged', loadVoices);
    return () => speechSynth.removeEventListener('voiceschanged', loadVoices);
  }, [speechSynth]);

  const dossierCoachFeedback = useMemo(() => {
    const raw =
      activeClientProfile?.longevityReport?.coachPlan?.gideon_assessment_summary ||
      activeClientProfile?.coach_plan_text ||
      '';
    const text = (raw || '').trim();
    if (!text || isLegacyCoachFeedbackPlaceholder(text)) return '';
    return text;
  }, [activeClientProfile]);

  const coachFeedbackDisplay = isCompilingPdf ? '' : dossierCoachFeedback;

  const dossierChatContext = useMemo(() => {
    const dossier = normalizeClientDossier(activeClientProfile || {}, accessCode);
    const plan =
      activeClientProfile?.longevityReport?.coachPlan ||
      activeClientProfile?.longevityReport?.geminiPlan ||
      {};

    return {
      client_dossier: {
        access_code: accessCode || dossier.accessCode,
        name: activeClientProfile?.name || dossier.name,
        client_age: dossier.clientAge,
        client_gender: dossier.clientGender,
        client_height: dossier.clientHeight,
        client_weight: dossier.clientWeight,
        archetype: activeClientProfile?.archetype || activeClientProfile?.desc,
        coach_plan_text: dossier.coach_plan_text || dossierCoachFeedback,
        training_log_phase1: dossier.trainingLogPhase1,
        training_log_phase2: dossier.trainingLogPhase2,
        somatic_health_tips: dossier.somaticHealthTips,
        kinetic_notes: activeClientProfile?.notes,
        matrix_tier: activeClientProfile?.matrixTier,
      },
      coach_summary: dossierCoachFeedback,
      joint_angles: yoloJointAngles,
      asymmetry_index: yoloAsymmetryIndex,
      yolo_meta: yoloLabMeta,
      right_now_adjustment: plan.right_now_adjustment || [],
      two_week_protocol: plan.two_week_protocol || {},
      four_week_protocol: plan.four_week_protocol || {},
      long_term_vision: plan.long_term_vision || [],
      somatic_health_tips: plan.somatic_health_tips || dossier.somaticHealthTips,
    };
  }, [
    activeClientProfile,
    accessCode,
    dossierCoachFeedback,
    yoloJointAngles,
    yoloAsymmetryIndex,
    yoloLabMeta,
  ]);

  useEffect(() => {
    if (!accessCode) {
      setChatMessages([]);
      setChatInput('');
      return;
    }

    const client = localDatabase?.[accessCode] || activeClientProfile || {};
    const thread =
      client?.longevityReport?.coachPlan?.chat_thread ||
      client?.longevityReport?.geminiPlan?.chat_thread;
    const raw =
      client?.longevityReport?.coachPlan?.gideon_assessment_summary ||
      client?.coach_plan_text ||
      '';
    const summary =
      (raw || '').trim() && !isLegacyCoachFeedbackPlaceholder(raw) ? raw.trim() : '';

    if (Array.isArray(thread) && thread.length) {
      setChatMessages(
        thread.map((m, i) => ({
          id: `${accessCode}-${i}`,
          role: m.role,
          content: m.content,
        }))
      );
    } else if (summary) {
      setChatMessages([
        { id: `${accessCode}-seed`, role: 'assistant', content: summary },
      ]);
    } else {
      setChatMessages([]);
    }
    setChatInput('');
  }, [accessCode]);

  const handleSendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/api/coach/chat?coach=${selectedCoach}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatMessages.map(({ role, content }) => ({ role, content })),
            metrics_context: dossierChatContext,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Chat uplink failed');
      }

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: data.reply },
      ]);
      speakAsCoach(data.reply, selectedCoach);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: `Uplink error: ${err.message}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, chatMessages, selectedCoach, dossierChatContext, speakAsCoach]);

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

  /** Function A — informational fetch: YOLO numeric telemetry only (port 8001) */
  const handleLoadYoloResults = async () => {
    setIsLoadingYolo(true);
    setYoloLoadStatus('Fetching latest YOLO telemetry from port 8001...');

    try {
      const response = await fetch(`${YOLO_API_BASE}/api/yolo/results/latest`);
      if (!response.ok) throw new Error('YOLO telemetry out of sync.');

      const latestMetrics = await response.json();
      if (!latestMetrics || latestMetrics.error || !Object.keys(latestMetrics).length) {
        throw new Error('No YOLO results cached yet. Run the live lab or process an uploaded video first.');
      }

      const telemetry = extractYoloTelemetry(latestMetrics);
      if (!telemetry) throw new Error('YOLO payload has no angle or score data.');

      setYoloJointAngles(telemetry.jointAngles);
      setYoloAsymmetryIndex(telemetry.asymmetryIndex);
      setYoloLabMeta(telemetry.meta);

      if (accessCode && setLocalDatabase) {
        const client = localDatabase[accessCode] || {};
        const updated = applyPipelineResultsToClient(client, accessCode, latestMetrics);
        setLocalDatabase((prev) => ({ ...prev, [accessCode]: updated }));
        saveClientRecord(accessCode, updated);
      }

      setYoloLoadStatus(
        `✓ ${Object.keys(telemetry.jointAngles).length} joint angles synced · asymmetry ${telemetry.asymmetryIndex ?? '—'}%`
      );
    } catch (error) {
      console.error('Failed to load local laboratory file caches:', error);
      setYoloLoadStatus(error.message || 'YOLO load failed');
    } finally {
      setIsLoadingYolo(false);
    }
  };

  /** Function B — document stream: Gemini/ReportLab PDF compile only (port 8000) */
  const handleCompilePDFReport = async () => {
    const client = activeClientProfile || localDatabase[accessCode] || {};
    const recipientName = client.name || displayClientName || 'Client';
    const suiteNum = accessCode ? `#${accessCode}` : '#000000';
    const googleDriveLink = client.reportUrl || editReportUrl || cloudVideoInput || '';

    setIsCompilingPdf(true);

    try {
      const pdfPayload = {
        recipient_name: recipientName,
        suite_num: suiteNum,
        google_drive_link: googleDriveLink,
        plan_data: buildCoachPdfPlanFromClient(client),
      };

      const response = await fetch(`${GEMINI_API_BASE}/api/generate-report-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `PDF compile failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Life_Longevity_Report_${recipientName.replace(/\s+/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF engine matrix compile failure:', error);
      alert(
        `PDF compile failed: ${error.message}. Start Gemini server on port 8000 (uvicorn main:app --reload --port 8000).`
      );
    } finally {
      setIsCompilingPdf(false);
    }
  };

  /** Generate a single premium block (phase1 | phase2 | somatic) via port 8000 and persist */
  const handleCompileMatrix = useCallback(
    async (block) => {
      if (!accessCode || !isCoachMode) return;

      setCompilingPremiumBlock(block);
      setCompileMatrixStatus('');
      setIsEditMode(true);

      try {
        let jointAngles = { ...yoloJointAngles };
        let asymmetryIndex = yoloAsymmetryIndex;

        if (!Object.keys(jointAngles).length) {
          try {
            const yoloRes = await fetch(`${YOLO_API_BASE}/api/yolo/results/latest`);
            if (yoloRes.ok) {
              const latest = await yoloRes.json();
              const telemetry = extractYoloTelemetry(latest);
              if (telemetry) {
                jointAngles = telemetry.jointAngles;
                asymmetryIndex = telemetry.asymmetryIndex;
                setYoloJointAngles(telemetry.jointAngles);
                setYoloAsymmetryIndex(telemetry.asymmetryIndex);
                setYoloLabMeta(telemetry.meta);
              }
            }
          } catch {
            /* YOLO lab optional — dossier baseline still compiles */
          }
        }

        const metricsPayload = buildGeminiMetricsPayload(activeClientProfile, accessCode, {
          jointAngles,
          asymmetryIndex: asymmetryIndex ?? 0,
          request_two_week_plan: block === 'phase1',
          request_four_week_plan: block === 'phase2',
          request_health_tips: block === 'somatic',
        });

        const response = await fetch(
          `${GEMINI_API_BASE}/api/analyze-biometrics?coach=${selectedCoach}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metricsPayload),
          }
        );

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || 'Premium matrix compile failed on port 8000.');
        }

        const plan = await response.json();
        const blockText = extractPremiumBlockFromGemini(plan, block);
        if (!blockText.trim()) {
          throw new Error('Gemini returned an empty block — check API key and port 8000 logs.');
        }

        if (block === 'phase1') setEditPhase1Program(blockText);
        if (block === 'phase2') setEditPhase2Program(blockText);
        if (block === 'somatic') setEditSomaticTips(blockText);

        const savedClient = applyPremiumBlockToClient(activeClientProfile, block, blockText);
        setLocalDatabase((prev) => ({ ...prev, [accessCode]: savedClient }));
        setActiveClientProfile?.(savedClient);
        saveClientRecord(accessCode, savedClient);
        setCompileMatrixStatus(`✓ ${block.toUpperCase()} matrix compiled and saved to dossier #${accessCode}`);
      } catch (err) {
        setCompileMatrixStatus(`⚠ ${err.message || 'Matrix compile uplink severed.'}`);
      } finally {
        setCompilingPremiumBlock(null);
      }
    },
    [
      accessCode,
      isCoachMode,
      yoloJointAngles,
      yoloAsymmetryIndex,
      activeClientProfile,
      selectedCoach,
      setEditPhase1Program,
      setEditPhase2Program,
      setEditSomaticTips,
      setLocalDatabase,
      setActiveClientProfile,
      setIsEditMode,
    ]
  );

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

  // SYSTEM FRAME B: Premium Biometric Client Profile Portal Hub
  if (viewState === 'client_profile' && activeClientProfile) {
    return (
      <>
      <div className="w-full h-full bg-[#020617]/95 text-white font-mono flex flex-col overflow-hidden relative backdrop-blur-xl">
        {renderSystemHeader(`CLIENT_DOSSIER // ${activeClientProfile.name.toUpperCase()}`)}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-full mx-auto bg-slate-950/90 border border-cyan-500/20 rounded-2xl backdrop-blur-xl p-5 md:p-7 shadow-2xl">

            {/* --- THE ADVANCED CYBERNETIC SPECIFICATION TITLE BAR --- */}
            <div className="relative w-full bg-slate-950 border-b-2 border-purple-500/50 p-4 overflow-hidden mb-6 rounded-t-xl shadow-[0_0_20px_rgba(168,85,247,0.15)] -mx-5 -mt-5 md:-mx-7 md:-mt-7">
              {/* The Live Pulse Monitor Backdrop Vector */}
              <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center">
                <svg
                  className="w-full h-12 stroke-current text-blue-500/40"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,10 L30,10 L33,4 L36,16 L39,10 L45,10 L48,2 L51,18 L54,10 L70,10 L73,6 L76,14 L79,10 L100,10"
                    strokeWidth="0.5"
                    fill="none"
                  />
                </svg>
                {/* Animated laser tracker sweeping across the EKG wave */}
                <div className="absolute inset-0 glowing-ekg-line h-full w-1/3 blur-sm" aria-hidden="true" />
              </div>

              {/* Main Header Container Content */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-y-3">
                {/* Left Side: Biometric Geometry Badge + Name Profile */}
                <div className="flex items-center space-x-4">
                  {/* Dynamic Geometric Identity Badge */}
                  <div className="relative w-12 h-12 flex items-center justify-between border-2 border-blue-400 rotate-45 bg-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0">
                    <span className="text-purple-400 font-mono text-xs font-bold -rotate-45 m-auto">🧬</span>
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-500" />
                  </div>

                  {/* Profile Specifications */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white neon-cyber-text uppercase truncate">
                        {activeClientProfile.name}
                      </h1>
                      <span className="bg-purple-950 border border-purple-500 text-purple-400 font-mono text-xs px-2 py-0.5 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.5)] shrink-0">
                        ID//{accessCode}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-blue-400/80 tracking-widest mt-0.5 uppercase">
                      // STATUS:{' '}
                      {(compilingPremiumBlock
                        ? 'COMPILING_DOSSIER'
                        : activeClientProfile.streamStatus || 'DOSSIER_ACTIVE'
                      )
                        .replace(/\s+/g, '_')
                        .toUpperCase()}{' '}
                      // ACCESS_TIER:{' '}
                      {(isEditMode ? editTier : activeClientProfile.matrixTier) || 'Vector Tier'}
                    </p>
                  </div>
                </div>

                {/* Right Side: Master Fleet / Core Workspace Connectivity Specs */}
                <div className="text-right font-mono text-[10px] sm:text-xs text-slate-500 space-y-0.5 shrink-0 ml-4">
                  <p className="text-purple-400/80 tracking-wide">// CO-PILOT: {getCoPilotMatrixTag(selectedCoach)}</p>
                  <p className="text-emerald-400/80 tracking-wide">// CLOUD_LINK: SUPABASE_ONLINE</p>
                  <p className="text-blue-400/80 tracking-wide">// SYS_INTEGRITY: PRO_LEGION_4080</p>
                </div>
              </div>
            </div>

            <ClientDossierPremiumLayout
              activeClientProfile={activeClientProfile}
              accessCode={accessCode}
              isCoachMode={isCoachMode}
              isEditMode={isEditMode}
              editDesc={editDesc}
              setEditDesc={setEditDesc}
              editCoachPlanText={editCoachPlanText}
              setEditCoachPlanText={setEditCoachPlanText}
              editNotes={editNotes}
              setEditNotes={setEditNotes}
              editPhase1Program={editPhase1Program}
              setEditPhase1Program={setEditPhase1Program}
              editPhase2Program={editPhase2Program}
              setEditPhase2Program={setEditPhase2Program}
              editSomaticTips={editSomaticTips}
              setEditSomaticTips={setEditSomaticTips}
              editClientAge={editClientAge}
              setEditClientAge={setEditClientAge}
              editClientGender={editClientGender}
              setEditClientGender={setEditClientGender}
              editClientHeight={editClientHeight}
              setEditClientHeight={setEditClientHeight}
              editClientWeight={editClientWeight}
              setEditClientWeight={setEditClientWeight}
              editEmail={editEmail}
              setEditEmail={setEditEmail}
              editPhone={editPhone}
              setEditPhone={setEditPhone}
              editTier={editTier}
              setEditTier={setEditTier}
              editReportUrl={editReportUrl}
              setEditReportUrl={setEditReportUrl}
              editAssessmentPhoto={editAssessmentPhoto}
              setEditAssessmentPhoto={setEditAssessmentPhoto}
              editReportNarrativeLayout={editReportNarrativeLayout}
              setEditReportNarrativeLayout={setEditReportNarrativeLayout}
              handleAssessmentPhotoUrlChange={handleAssessmentPhotoUrlChange}
              onOpenClientReport={onOpenClientReport}
              onCompileMatrix={handleCompileMatrix}
              compilingPremiumBlock={compilingPremiumBlock}
              compileMatrixStatus={compileMatrixStatus}
            />

            {isCoachMode && (
              <div className="mt-6 pt-6 border-t border-purple-900/30">
                <p className="text-[10px] font-mono text-purple-400 uppercase tracking-[0.22em] mb-4">
                  // COACH COMMAND WORKSPACE — FULL WIDTH UPLINK //
                </p>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                  <div className="xl:col-span-4 space-y-4 min-w-0">
                    <div className="p-4 bg-slate-900/40 border border-purple-500/25 rounded-xl space-y-2">
                      <div className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">
                        🤖 Active Coach Persona (port 8000)
                      </div>
                      <select
                        value={selectedCoach}
                        onChange={(e) => {
                          const nextCoach = normalizeCoachPersonaKey(e.target.value);
                          setSelectedCoach(nextCoach);
                          if (voiceEnabledRef.current) {
                            speakAsCoach(
                              COACH_VOICE_GREETINGS[nextCoach] || COACH_VOICE_GREETINGS.gideon,
                              nextCoach,
                              { force: true }
                            );
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded-lg p-2 outline-none focus:border-purple-500"
                      >
                        {COACH_PERSONA_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!voiceEnabled) {
                            voiceEnabledRef.current = true;
                            setVoiceEnabled(true);
                            speakAsCoach(
                              COACH_VOICE_GREETINGS[selectedCoach] || COACH_VOICE_GREETINGS.gideon,
                              selectedCoach,
                              { force: true }
                            );
                          } else {
                            voiceEnabledRef.current = false;
                            setVoiceEnabled(false);
                            speechSynth?.cancel();
                          }
                        }}
                        className={`w-full text-[9px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider ${
                          voiceEnabled
                            ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.45)]'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        🎤 {getCoachVoiceEngineLabel(selectedCoach)} Voice: {voiceEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl">
                      <TacticalWorkflowButtonStack
                        onMasterDirectory={() => setCurrentScreen('MASTER_ASSESSMENT_DIRECTORY_TERMINAL')}
                        onOpenReportViewer={() => onOpenClientReport?.(accessCode)}
                        onUploadLab={() =>
                          (onNavigate || setCurrentScreen)?.('BLUEPRINT_ASSESSMENTS_VIEW')
                        }
                        onFetchYolo={handleLoadYoloResults}
                        onCompilePdf={handleCompilePDFReport}
                        isFetchingYolo={isLoadingYolo}
                        isCompilingPdf={isCompilingPdf}
                        yoloTelemetryPanel={
                          Object.keys(yoloJointAngles).length > 0 || yoloLoadStatus ? (
                            <div className="p-3 bg-slate-950/80 border border-purple-500/25 rounded-lg space-y-2 text-[10px] font-mono">
                              <div className="text-purple-400 uppercase tracking-widest font-bold">
                                // YOLO TELEMETRY CACHE
                              </div>
                              {yoloLabMeta && (
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400">
                                  <span className="text-cyan-400">{yoloLabMeta.testName}</span>
                                  {yoloLabMeta.overallScore != null && (
                                    <span>Score: {Number(yoloLabMeta.overallScore).toFixed(1)}%</span>
                                  )}
                                  {yoloLabMeta.grade && <span>Grade: {yoloLabMeta.grade}</span>}
                                  {yoloAsymmetryIndex != null && (
                                    <span className="text-amber-400">Asymmetry: {yoloAsymmetryIndex}%</span>
                                  )}
                                </div>
                              )}
                              {Object.keys(yoloJointAngles).length > 0 && (
                                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto text-[9px]">
                                  {Object.entries(yoloJointAngles).slice(0, 8).map(([key, val]) => (
                                    <div key={key} className="text-slate-500 truncate">
                                      <span className="text-purple-400/90">{key}:</span>{' '}
                                      {typeof val === 'number' ? val.toFixed(1) : val}°
                                    </div>
                                  ))}
                                </div>
                              )}
                              {yoloLoadStatus && (
                                <p
                                  className={`text-[9px] uppercase tracking-wider ${yoloLoadStatus.startsWith('✓') ? 'text-emerald-400' : 'text-slate-500'}`}
                                >
                                  {yoloLoadStatus}
                                </p>
                              )}
                            </div>
                          ) : null
                        }
                      />
                    </div>
                  </div>

                  <div className="xl:col-span-8 min-w-0">
                    <CoachGeminiChatDeck
                      expanded
                      messages={chatMessages}
                      chatInput={chatInput}
                      onChatInputChange={setChatInput}
                      onSubmit={handleSendChatMessage}
                      isChatLoading={isChatLoading}
                      isAnalyzing={isCompilingPdf}
                      seedAssistantMessage={coachFeedbackDisplay}
                      selectedCoach={selectedCoach}
                      voiceEnabled={voiceEnabled}
                      onReplayLast={(text) => speakAsCoach(text, selectedCoach)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dossier Actions Terminal */}
            <div className="pt-5 border-t border-slate-900 mt-5 flex flex-wrap justify-between items-center gap-4">
              {isCoachMode ? (
                <div className="flex flex-wrap gap-2 animate-fade-in ml-auto">
                  <button
                    type="button"
                    onClick={() => onOpenClientReport?.(accessCode)}
                    className="px-3 py-1.5 bg-indigo-950 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    📋 View Longevity Report
                  </button>
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
                  {handleDownloadMovementVideo && clientHasMovementVideo(activeClientProfile) ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadMovementVideo(accessCode)}
                      className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-bold rounded text-[10px] tracking-widest uppercase transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                    >
                      ⬇ Download Movement Video
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onOpenClientReport?.(accessCode)}
                    className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-bold rounded text-[10px] tracking-widest uppercase transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                    📥 Download Longevity Report
                  </button>
                  <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase bg-slate-950 px-3 py-1.5 border border-emerald-900/40 rounded shadow-md">
                    ✓ SECURE CLIENT READ-ONLY PATHWAY ENFORCED
                  </div>
                  </div>
                  <div className="w-full text-[9px] text-emerald-400/80 tracking-wider uppercase">
                    ✓ LONGEVITY LAB REPORT LINKED TO DOSSIER // USE EXPORT PDF IN REPORT VIEW
                  </div>
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
      </div>
      </>
    );
  }

  // SYSTEM FRAME C: Master Coach Roster & Onboarding Console Menu
  if (viewState === 'coach_menu') {
    const labMetrics = getLabEngineMetrics();
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

              {/* ADD THIS COMPONENT BOX DIRECTLY INTO YOUR DASHBOARD REGISTER LEFT TIER */}
              <div className="w-full bg-[#030712] border border-slate-900 rounded-lg p-5 font-mono text-left mt-6">
                <div className="text-[#00FFFF] text-[10px] font-bold tracking-widest uppercase mb-4 flex items-center space-x-2">
                  <span>📊</span>{' '}
                  <span>// LAB ENGINE METRIC METADATA OVERVIEW</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-950 p-3 rounded">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">
                      TOTAL ACTIVE ASSESSMENTS:
                    </span>
                    <span className="text-white text-base font-bold tracking-wide">
                      {labMetrics.totalActiveAssessments} Modules
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-950 p-3 rounded">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">
                      PREMIUM BLUEPRINT VAULT VALUE:
                    </span>
                    <span className="text-[#00FFFF] text-base font-bold tracking-wide">
                      ${labMetrics.premiumBlueprintVaultValue}.00 Base
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-950 p-3 rounded">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">
                      SYSTEM SERVER LATENCY:
                    </span>
                    <span className="text-[#00FF66] text-base font-bold tracking-wide">
                      {labMetrics.systemServerLatency}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-950 p-3 rounded">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">
                      CORE ENCRYPTION INTEGRITY:
                    </span>
                    <span className="text-[#00FFFF] text-base font-bold tracking-wide">
                      {labMetrics.coreEncryptionIntegrity}
                    </span>
                  </div>
                </div>
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
                          {clientHasLongevityReport(client) ? (
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                              | REPORT READY
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenClientReport?.(code);
                        }}
                        className="p-2 bg-indigo-950/60 border border-indigo-900/80 hover:border-indigo-400 text-indigo-300 hover:text-indigo-200 rounded-lg transition-all cursor-pointer active:scale-90 shrink-0"
                        title="Open Longevity Report"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

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
              <div className="flex flex-col min-w-0 min-h-full">
                <div className="space-y-4 min-w-0 flex-1">
                {/* Command rail — tactical buttons first, DNA matrix graphic below */}
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
                  <div className="p-3 bg-slate-950/60 border border-purple-500/25 rounded-lg space-y-2">
                    <div className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">
                      🤖 Active Coach Persona (port 8000)
                    </div>
                    <select
                      value={selectedCoach}
                      onChange={(e) => {
                        const nextCoach = normalizeCoachPersonaKey(e.target.value);
                        setSelectedCoach(nextCoach);
                        if (voiceEnabledRef.current) {
                          speakAsCoach(
                            COACH_VOICE_GREETINGS[nextCoach] || COACH_VOICE_GREETINGS.gideon,
                            nextCoach,
                            { force: true }
                          );
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded-lg p-2 outline-none focus:border-purple-500"
                    >
                      {COACH_PERSONA_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!voiceEnabled) {
                          voiceEnabledRef.current = true;
                          setVoiceEnabled(true);
                          speakAsCoach(
                            COACH_VOICE_GREETINGS[selectedCoach] || COACH_VOICE_GREETINGS.gideon,
                            selectedCoach,
                            { force: true }
                          );
                        } else {
                          voiceEnabledRef.current = false;
                          setVoiceEnabled(false);
                          speechSynth?.cancel();
                        }
                      }}
                      className={`w-full text-[9px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider ${
                        voiceEnabled
                          ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.45)]'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      🎤 {getCoachVoiceEngineLabel(selectedCoach)} Voice:{' '}
                      {voiceEnabled ? 'ON' : 'OFF'}
                    </button>
                    <p className="text-[9px] text-slate-500 font-mono tracking-wide">
                      API key: <span className="text-cyan-400">?coach={selectedCoach}</span>
                      {activeClientProfile?.longevityReport?.coachPlan?.coach_persona ? (
                        <>
                          {' '}
                          · dossier:{' '}
                          {getCoachPersonaLabel(
                            activeClientProfile.longevityReport.coachPlan.coach_persona
                          )}
                        </>
                      ) : null}
                    </p>
                  </div>

                  {accessCode && (
                    <div className="p-3 bg-slate-950/60 border border-cyan-500/25 rounded-lg space-y-2">
                      <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
                        📋 Client Physical Baseline
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                            Age
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={editClientAge}
                            onChange={(e) => setEditClientAge(e.target.value)}
                            placeholder="62"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-[11px] outline-none font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                            Gender
                          </label>
                          <select
                            value={editClientGender}
                            onChange={(e) => setEditClientGender(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-[11px] outline-none font-sans"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                            Height
                          </label>
                          <input
                            type="text"
                            value={editClientHeight}
                            onChange={(e) => setEditClientHeight(e.target.value)}
                            placeholder="5ft 10in"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-[11px] outline-none font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                            Weight
                          </label>
                          <input
                            type="text"
                            value={editClientWeight}
                            onChange={(e) => setEditClientWeight(e.target.value)}
                            placeholder="185 lbs"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-[11px] outline-none font-sans"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveProfileChanges}
                        className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[9px] uppercase tracking-widest rounded-lg transition-all"
                      >
                        💾 Save Baseline to Dossier
                      </button>
                      <p className="text-[8px] text-slate-600 font-mono tracking-wide">
                        Feeds Gemini demographic benchmarks · dossier #{accessCode}
                      </p>
                    </div>
                  )}

                  <CoachGeminiChatDeck
                    expanded
                    messages={chatMessages}
                    chatInput={chatInput}
                    onChatInputChange={setChatInput}
                    onSubmit={handleSendChatMessage}
                    isChatLoading={isChatLoading}
                    isAnalyzing={isCompilingPdf}
                    seedAssistantMessage={coachFeedbackDisplay}
                    selectedCoach={selectedCoach}
                    voiceEnabled={voiceEnabled}
                    onReplayLast={(text) => speakAsCoach(text, selectedCoach)}
                  />

                  <TacticalWorkflowButtonStack
                    onMasterDirectory={() => setCurrentScreen('MASTER_ASSESSMENT_DIRECTORY_TERMINAL')}
                    onOpenReportViewer={() => onOpenClientReport?.(accessCode)}
                    onUploadLab={() =>
                      (onNavigate || setCurrentScreen)?.('BLUEPRINT_ASSESSMENTS_VIEW')
                    }
                    onFetchYolo={handleLoadYoloResults}
                    onCompilePdf={handleCompilePDFReport}
                    isFetchingYolo={isLoadingYolo}
                    isCompilingPdf={isCompilingPdf}
                    yoloTelemetryPanel={
                      Object.keys(yoloJointAngles).length > 0 || yoloLoadStatus ? (
                        <div className="p-3 bg-slate-950/80 border border-purple-500/25 rounded-lg space-y-2 text-[10px] font-mono">
                          <div className="text-purple-400 uppercase tracking-widest font-bold">
                            // YOLO TELEMETRY CACHE
                          </div>
                          {yoloLabMeta && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400">
                              <span className="text-cyan-400">{yoloLabMeta.testName}</span>
                              {yoloLabMeta.overallScore != null && (
                                <span>Score: {Number(yoloLabMeta.overallScore).toFixed(1)}%</span>
                              )}
                              {yoloLabMeta.grade && <span>Grade: {yoloLabMeta.grade}</span>}
                              {yoloAsymmetryIndex != null && (
                                <span className="text-amber-400">Asymmetry: {yoloAsymmetryIndex}%</span>
                              )}
                            </div>
                          )}
                          {Object.keys(yoloJointAngles).length > 0 && (
                            <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto text-[9px]">
                              {Object.entries(yoloJointAngles).slice(0, 8).map(([key, val]) => (
                                <div key={key} className="text-slate-500 truncate">
                                  <span className="text-purple-400/90">{key}:</span>{' '}
                                  {typeof val === 'number' ? val.toFixed(1) : val}°
                                </div>
                              ))}
                            </div>
                          )}
                          {yoloLoadStatus && (
                            <p
                              className={`text-[9px] uppercase tracking-wider ${yoloLoadStatus.startsWith('✓') ? 'text-emerald-400' : 'text-slate-500'}`}
                            >
                              {yoloLoadStatus}
                            </p>
                          )}
                        </div>
                      ) : null
                    }
                  />
                </div>
                </div>

                <div className="mt-auto pt-3 shrink-0">
                  <AccessCodeGenerator variant="statusBar" />
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
