import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, Camera, HelpCircle, ArrowLeft, Send, CheckCircle2, Search } from 'lucide-react';
import LiveYoloPreview, { VERTICAL_BODY_VIEWPORT_CLASS } from './components/LiveYoloPreview';
import CoachGeminiChatDeck from './components/CoachGeminiChatDeck';
import TacticalWorkflowButtonStack from './components/TacticalWorkflowButtonStack';
import CyberPageScrollSlider from './components/CyberPageScrollSlider';
import {
  COACH_PERSONA_OPTIONS,
  COACH_VOICE_GREETINGS,
  getCoachVoiceEngineLabel,
  isLegacyCoachFeedbackPlaceholder,
  normalizeCoachPersonaKey,
  speakCoachText,
} from './constants/coachPersonas';
import { staticAssessmentLibrary } from './data/assessmentLibrary';
import { applyGeminiCoachPlanToClient, applyPipelineResultsToClient, normalizeClientDossier, initialClientDossierTemplate } from './utils/longevityReportData';
import { saveClientRecord } from './constants/labDatabase';

/** Map Master Terminal library row → upload lab movement shape */
const mapLibraryTrackToBlueprintMovement = (track) => ({
  id: track.id,
  title: track.name,
  instructions: track.execution_text || '',
  setup: track.alignment_text || '',
  metrics: track.packages?.length ? track.packages.join(' · ') : 'Main Terminal',
  duration: 'Upload Lab',
  category: track.category,
  packages: track.packages || [],
  biometricPhotoUrl: track.biometric_photo_url || '',
});

const YOLO_API_BASE = 'http://localhost:8001';
const GEMINI_API_BASE = 'http://localhost:8000';
const TRIM_DEBOUNCE_MS = 650;
const MIN_TRIM_CLIP_SECONDS = 0.3;
const VIDEO_ACCEPT =
  'video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.mov,.webm,.avi,.mkv,.m4v';

const isVideoUploadFile = (file) => {
  if (!file) return false;
  if (file.type?.startsWith('video/')) return true;
  return /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(file.name || '');
};

/** Normalize Gemini tier payloads (string, list, or legacy block object) */
const normalizeTierContent = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'object') {
    const lines = [];
    if (value.phase_objective) lines.push(String(value.phase_objective));
    [
      ...(value.weekly_mobility_directives || []),
      ...(value.weekly_strength_stability_directives || []),
      ...(value.weekly_mindfulness_breathwork || []),
    ].forEach((item) => {
      if (item) lines.push(String(item));
    });
    return lines;
  }
  return String(value)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
};

const extractPlanTiers = (plan) => ({
  rightNow: normalizeTierContent(plan?.right_now_adjustment),
  twoWeek: normalizeTierContent(plan?.two_week_protocol ?? plan?.two_week_activation_strategy),
  fourWeek: normalizeTierContent(plan?.four_week_protocol ?? plan?.four_week_adaptation_strategy),
  longTerm: normalizeTierContent(plan?.long_term_vision ?? plan?.long_term_longevity_vision),
});

const formatTrimSeconds = (value) => {
  if (!Number.isFinite(value)) return '0.0';
  return value.toFixed(1);
};

/** Normalize Gemini JSON — summary key can vary slightly by model/persona */
const extractGeminiSummary = (plan) => {
  if (!plan) return '';
  if (typeof plan === 'string') return plan.trim();
  return (
    plan.gideon_assessment_summary ||
    plan.assessment_summary ||
    plan.coach_plan_text ||
    plan.summary ||
    ''
  )
    .toString()
    .trim();
};

/** Read persisted coach copy from dossier tracking row */
const readCoachPlanFromClient = (client) => {
  if (!client) return { summary: '', plan: null };
  const nested = client.longevityReport?.coachPlan || client.longevityReport?.geminiPlan;
  const summary =
    extractGeminiSummary(nested) ||
    (client.coach_plan_text || '').toString().trim();
  return {
    summary,
    plan: nested || (summary
      ? {
          gideon_assessment_summary: summary,
          right_now_adjustment: client.right_now_adjustment || [],
          two_week_protocol: client.two_week_protocol || [],
          four_week_protocol: client.four_week_protocol || [],
          long_term_vision: client.long_term_vision || [],
          two_week_activation_strategy: client.two_week_protocol || {},
          four_week_adaptation_strategy: client.four_week_protocol || {},
          long_term_longevity_vision: client.long_term_protocol || {},
          retesting_comparison_benchmarks: client.retest_benchmarks || {},
        }
      : null),
  };
};

const BlueprintAssessments = ({
  accessCode: accessCodeProp = '',
  onClientCodeChange,
  localDatabase = {},
  setLocalDatabase,
  onNavigate,
  onOpenClientReport,
}) => {
  const [clientCode, setClientCode] = useState(accessCodeProp || '');
  const accessCode = clientCode;
  const activeClient = accessCode ? localDatabase[accessCode] : null;

  const clientRoster = useMemo(
    () =>
      Object.entries(localDatabase)
        .map(([code, client]) => ({
          code,
          name: (client?.name || 'Unknown Client').trim(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [localDatabase]
  );

  const [selectedMovementRoom, setSelectedMovementRoom] = useState(null);
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [linkSaved, setLinkSaved] = useState({});
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [recipientName, setRecipientName] = useState(activeClient?.name || 'Alex Rivera');
  const [suiteNum, setSuiteNum] = useState(accessCode ? `#${accessCode}` : '#111111');

  // AI coach insights from Gemini biometrics engine (port 8000)
  const [gideonFeedback, setGideonFeedback] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [rightNowAdjustment, setRightNowAdjustment] = useState([]);
  const [twoWeekProtocol, setTwoWeekProtocol] = useState([]);
  const [fourWeekProtocol, setFourWeekProtocol] = useState([]);
  const [longTermVision, setLongTermVision] = useState([]);
  const [coachPlanRaw, setCoachPlanRaw] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isExportingDossier, setIsExportingDossier] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingYolo, setIsFetchingYolo] = useState(false);
  const [yoloFetchStatus, setYoloFetchStatus] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('gideon');
  const [mainStreamSource, setMainStreamSource] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [yoloVideoResults, setYoloVideoResults] = useState(null);
  const [sourceDuration, setSourceDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimStatus, setTrimStatus] = useState('');
  const [dossierSaveStatus, setDossierSaveStatus] = useState('');
  const [yoloScanStatus, setYoloScanStatus] = useState('');
  const [liveCameraIndex, setLiveCameraIndex] = useState(0);
  const [annotatedFrameIndex, setAnnotatedFrameIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [requestTwoWeekPlan, setRequestTwoWeekPlan] = useState(true);
  const [requestFourWeekPlan, setRequestFourWeekPlan] = useState(true);
  const [requestHealthTips, setRequestHealthTips] = useState(true);

  const mainStreamRef = useRef('');
  const originalFileRef = useRef(null);
  const trimDebounceRef = useRef(null);
  const trimTouchedRef = useRef(false);
  const processedCanvasRef = useRef(null);
  const centralVideoRef = useRef(null);
  const frameAnimRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const voiceEnabledRef = useRef(false);

  const [voiceEnabled, setVoiceEnabled] = useState(false);
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
    if (!speechSynth) return undefined;
    const loadVoices = () => {
      speechSynth.getVoices();
    };
    speechSynth.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      speechSynth.onvoiceschanged = null;
    };
  }, [speechSynth]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const probeSourceDuration = useCallback((file) => {
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      if (Number.isFinite(duration) && duration > 0) {
        setSourceDuration(duration);
        setTrimStart(0);
        setTrimEnd(parseFloat(duration.toFixed(2)));
      }
      URL.revokeObjectURL(url);
    };
    probe.onerror = () => URL.revokeObjectURL(url);
    probe.src = url;
  }, []);

  const onVideoUpload = useCallback((file, { preserveTrim = false } = {}) => {
    if (!isVideoUploadFile(file)) {
      setYoloScanStatus('Please upload a video file (.mp4, .mov, .webm).');
      return;
    }

    if (mainStreamRef.current) {
      URL.revokeObjectURL(mainStreamRef.current);
    }

    const localVideoUrl = URL.createObjectURL(file);
    mainStreamRef.current = localVideoUrl;
    setMainStreamSource(localVideoUrl);
    setUploadedFile(file);
    setYoloVideoResults(null);
    setYoloScanStatus('');
    setAnnotatedFrameIndex(0);
    setIsVideoPlaying(false);
    setPlaybackRate(1);

    if (!preserveTrim) {
      originalFileRef.current = file;
      trimTouchedRef.current = false;
      setSourceDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      setTrimStatus('');
      probeSourceDuration(file);
    }
  }, [probeSourceDuration]);

  useEffect(() => {
    return () => {
      if (mainStreamRef.current) {
        URL.revokeObjectURL(mainStreamRef.current);
      }
    };
  }, []);

  /** Stop OS/browser from opening dropped files externally (e.g. refocusing Cursor IDE) */
  useEffect(() => {
    const blockWindowFileDrop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('dragover', blockWindowFileDrop);
    window.addEventListener('drop', blockWindowFileDrop);

    return () => {
      window.removeEventListener('dragover', blockWindowFileDrop);
      window.removeEventListener('drop', blockWindowFileDrop);
    };
  }, []);

  const openVideoFilePicker = useCallback(() => {
    const input = videoFileInputRef.current;
    if (!input) return;
    input.value = '';
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.click();
  }, []);

  useEffect(() => {
    if (accessCodeProp) setClientCode(accessCodeProp);
  }, [accessCodeProp]);

  const handleClientDossierSelect = useCallback(
    (code) => {
      setClientCode(code);
      onClientCodeChange?.(code);
      const client = localDatabase[code];
      if (client) {
        setRecipientName(client.name || '');
        setSuiteNum(`#${code}`);
        if (client.reportUrl) setGoogleDriveLink(client.reportUrl);
      }
    },
    [localDatabase, onClientCodeChange]
  );

  useEffect(() => {
    if (!accessCode) return;
    const client = localDatabase[accessCode];
    if (!client) return;

    setRecipientName((prev) => client.name || prev);
    setSuiteNum(`#${accessCode}`);
    if (client.reportUrl) setGoogleDriveLink(client.reportUrl);

    const { summary, plan } = readCoachPlanFromClient(client);
    const safeSummary = isLegacyCoachFeedbackPlaceholder(summary) ? '' : summary;
    if (plan) {
      const tiers = extractPlanTiers(plan);
      setRightNowAdjustment(tiers.rightNow);
      setTwoWeekProtocol(tiers.twoWeek);
      setFourWeekProtocol(tiers.fourWeek);
      setLongTermVision(tiers.longTerm);
    }
    if (safeSummary) {
      setGideonFeedback(safeSummary);
    }
  }, [accessCode, localDatabase]);

  const applyTiersToState = useCallback((structuredPlan) => {
    const tiers = extractPlanTiers(structuredPlan);
    setRightNowAdjustment(tiers.rightNow);
    setTwoWeekProtocol(tiers.twoWeek);
    setFourWeekProtocol(tiers.fourWeek);
    setLongTermVision(tiers.longTerm);
  }, []);

  /** Feedback card: session Gemini payload only (no dossier / voice-placeholder fallbacks) */
  const coachFeedbackDisplay = useMemo(() => {
    const live = (gideonFeedback || '').trim();
    if (!live || isLegacyCoachFeedbackPlaceholder(live)) return '';
    return live;
  }, [gideonFeedback]);

  /** Export / chat context: session first, then persisted dossier summary */
  const resolvedCoachFeedback = useMemo(() => {
    if (coachFeedbackDisplay) return coachFeedbackDisplay;
    const dossierSummary = readCoachPlanFromClient(activeClient).summary;
    if (!dossierSummary || isLegacyCoachFeedbackPlaceholder(dossierSummary)) return '';
    return dossierSummary;
  }, [coachFeedbackDisplay, activeClient]);

  const applyGeminiResponseToState = useCallback((structuredPlan) => {
    const summary = extractGeminiSummary(structuredPlan);
    setGideonFeedback(summary);
    setCoachPlanRaw(structuredPlan);
    applyTiersToState(structuredPlan);
    if (summary) {
      setChatMessages([{ id: Date.now(), role: 'assistant', content: summary }]);
    }
    return summary;
  }, [applyTiersToState]);

  const handleVideoPlay = useCallback(() => {
    const video = centralVideoRef.current;
    if (!video) return;
    clearInterval(frameAnimRef.current);
    frameAnimRef.current = null;
    video.loop = false;
    video.playbackRate = 1;
    setPlaybackRate(1);
    video
      .play()
      .then(() => setIsVideoPlaying(true))
      .catch((err) => {
        console.warn('Video play blocked:', err);
        setIsVideoPlaying(false);
      });
  }, []);

  const handleVideoPause = useCallback(() => {
    const video = centralVideoRef.current;
    if (!video) return;
    video.pause();
    clearInterval(frameAnimRef.current);
    frameAnimRef.current = null;
    setIsVideoPlaying(false);
  }, []);

  const handleVideoSlowMo = useCallback(() => {
    const video = centralVideoRef.current;
    if (!video) return;
    clearInterval(frameAnimRef.current);
    frameAnimRef.current = null;
    video.loop = false;
    video.playbackRate = 0.5;
    setPlaybackRate(0.5);
    video
      .play()
      .then(() => setIsVideoPlaying(true))
      .catch((err) => {
        console.warn('Video slow-mo play blocked:', err);
        setIsVideoPlaying(false);
      });
  }, []);

  const handleVideoReset = useCallback(() => {
    const video = centralVideoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.playbackRate = 1;
    setPlaybackRate(1);
    clearInterval(frameAnimRef.current);
    frameAnimRef.current = null;
    setIsVideoPlaying(false);
    setAnnotatedFrameIndex(0);
  }, []);

  const syncSkeletonFrameToVideo = useCallback(() => {
    const video = centralVideoRef.current;
    const frames = yoloVideoResults?.annotated_frames;
    if (!video || !frames?.length) return;

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const progress = Math.min(1, Math.max(0, video.currentTime / duration));
    const idx =
      frames.length === 1 ? 0 : Math.min(frames.length - 1, Math.round(progress * (frames.length - 1)));
    setAnnotatedFrameIndex((prev) => (prev === idx ? prev : idx));
  }, [yoloVideoResults]);

  const handleAnnotatedFrameScrub = useCallback(
    (rawIndex) => {
      const frames = yoloVideoResults?.annotated_frames;
      const video = centralVideoRef.current;
      const idx = Number(rawIndex);
      if (!frames?.length || !Number.isFinite(idx)) return;

      const clamped = Math.min(Math.max(0, idx), frames.length - 1);
      video?.pause();
      setIsVideoPlaying(false);

      if (video && Number.isFinite(video.duration) && video.duration > 0 && frames.length > 1) {
        video.currentTime = (clamped / (frames.length - 1)) * video.duration;
      }

      setAnnotatedFrameIndex(clamped);
    },
    [yoloVideoResults]
  );

  const handleVideoLoadedMetadata = useCallback(
    (event) => {
      const duration = event.currentTarget.duration;
      if (Number.isFinite(duration) && duration > 0) {
        setSourceDuration((prev) => prev || duration);
        setTrimEnd((prev) => (prev > 0 ? prev : parseFloat(duration.toFixed(2))));
      }
    },
    []
  );

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
  }, []);

  const handleSendChatMessage = useCallback(async (movement) => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const dossier = normalizeClientDossier(activeClient || {}, accessCode);
      const metricsContext = {
        client_dossier: {
          access_code: accessCode || dossier.accessCode,
          name: dossier.name || recipientName,
          client_age: dossier.clientAge,
          client_gender: dossier.clientGender,
          client_height: dossier.clientHeight,
          client_weight: dossier.clientWeight,
          coach_plan_text: resolvedCoachFeedback,
          training_log_phase1: dossier.trainingLogPhase1,
          training_log_phase2: dossier.trainingLogPhase2,
          somatic_health_tips: dossier.somaticHealthTips,
          kinetic_notes: activeClient?.notes,
        },
        test_activity: movement?.title || '',
        coach_summary: resolvedCoachFeedback || gideonFeedback,
        joint_angles: yoloVideoResults?.angles || {},
        scores: yoloVideoResults?.scores || {},
        right_now_adjustment: rightNowAdjustment,
        two_week_protocol: twoWeekProtocol,
        four_week_protocol: fourWeekProtocol,
        long_term_vision: longTermVision,
        coach_plan_raw: coachPlanRaw,
        protocol_flags: {
          request_two_week_plan: requestTwoWeekPlan,
          request_four_week_plan: requestFourWeekPlan,
          request_health_tips: requestHealthTips,
        },
      };

      const response = await fetch(
        `${GEMINI_API_BASE}/api/coach/chat?coach=${selectedCoach}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatMessages.map(({ role, content }) => ({ role, content })),
            metrics_context: metricsContext,
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
  }, [
    chatInput,
    isChatLoading,
    chatMessages,
    selectedCoach,
    resolvedCoachFeedback,
    gideonFeedback,
    yoloVideoResults,
    rightNowAdjustment,
    twoWeekProtocol,
    fourWeekProtocol,
    longTermVision,
    speakAsCoach,
    activeClient,
    accessCode,
    recipientName,
    coachPlanRaw,
    requestTwoWeekPlan,
    requestFourWeekPlan,
    requestHealthTips,
  ]);

  /** Persist Gemini structured plan into active client dossier + localStorage vault */
  const saveAnalysisToClientDossier = useCallback(
    (
      clientId,
      geminiPlanOutput,
      movementTitle = '',
      chatThread = [],
      exportFlags = {}
    ) => {
      if (!clientId || !setLocalDatabase) {
        setDossierSaveStatus('No active client code — analysis kept in session only.');
        return null;
      }

      const {
        includeTwoWeekPlan = requestTwoWeekPlan,
        includeFourWeekPlan = requestFourWeekPlan,
        includeHealthTips = requestHealthTips,
      } = exportFlags;

      let savedClient = null;

      setLocalDatabase((prevDossier) => {
        const existing = prevDossier[clientId] || {};
        savedClient = applyGeminiCoachPlanToClient(existing, clientId, geminiPlanOutput, {
          coachPersona: selectedCoach,
          movementTitle,
          chatMessages: chatThread,
          includeTwoWeekPlan,
          includeFourWeekPlan,
          includeHealthTips,
        });
        saveClientRecord(clientId, savedClient);
        return {
          ...prevDossier,
          [clientId]: savedClient,
        };
      });

      const skipped = [
        !includeTwoWeekPlan && '2-wk',
        !includeFourWeekPlan && '4-wk',
        !includeHealthTips && 'health tips',
      ].filter(Boolean);
      const skipNote =
        skipped.length > 0 ? ` (preserved: ${skipped.join(', ')})` : '';
      setDossierSaveStatus(`✓ Training directive exported to dossier #${clientId}${skipNote}`);
      return savedClient;
    },
    [
      setLocalDatabase,
      selectedCoach,
      requestTwoWeekPlan,
      requestFourWeekPlan,
      requestHealthTips,
    ]
  );

  const handleExportToDossier = useCallback(
    (movement) => {
      const clientId = (clientCode || accessCode || suiteNum.replace(/^#/, '')).trim();
      if (!clientId) {
        setDossierSaveStatus('Select a client dossier from the dropdown before exporting.');
        return;
      }
      if (!coachPlanRaw && !resolvedCoachFeedback) {
        setDossierSaveStatus('Run Get Coach Analysis before exporting to dossier.');
        return;
      }

      setIsExportingDossier(true);
      try {
        const exportPlan = {
          ...(coachPlanRaw || {}),
          gideon_assessment_summary:
            resolvedCoachFeedback || coachPlanRaw?.gideon_assessment_summary || '',
        };
        saveAnalysisToClientDossier(clientId, exportPlan, movement?.title, chatMessages, {
          includeTwoWeekPlan: requestTwoWeekPlan,
          includeFourWeekPlan: requestFourWeekPlan,
          includeHealthTips: requestHealthTips,
        });
      } finally {
        setIsExportingDossier(false);
      }
    },
    [
      clientCode,
      accessCode,
      suiteNum,
      coachPlanRaw,
      resolvedCoachFeedback,
      chatMessages,
      saveAnalysisToClientDossier,
      requestTwoWeekPlan,
      requestFourWeekPlan,
      requestHealthTips,
    ]
  );

  const handleDropZoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDropZoneDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDropZoneDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDropZoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onVideoUpload(file);
  };

  const handleFileInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) onVideoUpload(file);
    e.target.value = '';
  };

  const requestVideoTrim = useCallback(async (start, end, duration) => {
    const source = originalFileRef.current;
    if (!source || !duration) return;

    const isFullClip = start <= 0.05 && end >= duration - 0.05;
    if (isFullClip) {
      if (uploadedFile !== source) {
        onVideoUpload(source, { preserveTrim: true });
      }
      setTrimStatus('Full clip ready for YOLO');
      return;
    }

    if (end - start < MIN_TRIM_CLIP_SECONDS) {
      setTrimStatus(`Select at least ${MIN_TRIM_CLIP_SECONDS}s of footage`);
      return;
    }

    setIsTrimming(true);
    setTrimStatus('Trimming clip on server...');

    try {
      const formData = new FormData();
      formData.append('video', source);
      formData.append('start_time', String(start));
      formData.append('end_time', String(end));

      const response = await fetch(`${YOLO_API_BASE}/api/yolo/trim-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let detail = `Trim failed (${response.status})`;
        try {
          const errJson = await response.json();
          detail = errJson.detail || errJson.error || detail;
        } catch {
          // non-JSON error body
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      const baseName = source.name.replace(/\.[^.]+$/, '') || 'clip';
      const trimmedFile = new File([blob], `${baseName}_trim.mp4`, {
        type: blob.type || 'video/mp4',
      });

      onVideoUpload(trimmedFile, { preserveTrim: true });
      setTrimStatus(
        `Trimmed ${formatTrimSeconds(start)}s → ${formatTrimSeconds(end)}s (${formatTrimSeconds(end - start)}s clip)`
      );
    } catch (err) {
      console.error('Video trim failed:', err);
      setTrimStatus(err.message || 'Trim failed');
    } finally {
      setIsTrimming(false);
    }
  }, [uploadedFile, onVideoUpload]);

  useEffect(() => {
    if (!trimTouchedRef.current || !sourceDuration || !originalFileRef.current) {
      return undefined;
    }

    clearTimeout(trimDebounceRef.current);
    trimDebounceRef.current = setTimeout(() => {
      requestVideoTrim(trimStart, trimEnd, sourceDuration);
    }, TRIM_DEBOUNCE_MS);

    return () => clearTimeout(trimDebounceRef.current);
  }, [trimStart, trimEnd, sourceDuration, requestVideoTrim]);

  const handleTrimStartChange = (rawValue) => {
    trimTouchedRef.current = true;
    const parsed = parseFloat(rawValue);
    const next = Math.max(0, Math.min(Number.isFinite(parsed) ? parsed : 0, trimEnd - 0.1));
    setTrimStart(parseFloat(next.toFixed(2)));
  };

  const handleTrimEndChange = (rawValue) => {
    trimTouchedRef.current = true;
    const parsed = parseFloat(rawValue);
    const next = Math.min(
      sourceDuration || 0,
      Math.max(Number.isFinite(parsed) ? parsed : 0, trimStart + 0.1)
    );
    setTrimEnd(parseFloat(next.toFixed(2)));
  };

  const trimSelectionSeconds = Math.max(0, trimEnd - trimStart);
  const trimStartPercent = sourceDuration ? (trimStart / sourceDuration) * 100 : 0;
  const trimEndPercent = sourceDuration ? (trimEnd / sourceDuration) * 100 : 100;
  const showSkeletonOverlay = Boolean(yoloVideoResults?.annotated_frames?.length);

  const drawAnnotatedFrame = useCallback((results, frameIndex = 0) => {
    const canvas = processedCanvasRef.current;
    const frames = results?.annotated_frames;
    if (!canvas || !frames?.length) return;

    const idx = Math.min(Math.max(0, frameIndex), frames.length - 1);
    const img = new Image();
    img.onload = () => {
      const container = canvas.parentElement;
      const displayW = container?.clientWidth || img.width;
      const displayH = container?.clientHeight || img.height;

      canvas.width = displayW;
      canvas.height = displayH;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, displayW, displayH);

      const scale = Math.min(displayW / img.width, displayH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (displayW - drawW) / 2;
      const offsetY = (displayH - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    };
    img.src = `data:image/jpeg;base64,${frames[idx]}`;
  }, []);

  useEffect(() => {
    if (yoloVideoResults?.annotated_frames?.length) {
      drawAnnotatedFrame(yoloVideoResults, annotatedFrameIndex);
    }
  }, [yoloVideoResults, annotatedFrameIndex, drawAnnotatedFrame]);

  useEffect(() => {
    if (!showSkeletonOverlay || !processedCanvasRef.current) return undefined;

    const canvas = processedCanvasRef.current;
    const container = canvas.parentElement;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (yoloVideoResults?.annotated_frames?.length) {
        drawAnnotatedFrame(yoloVideoResults, annotatedFrameIndex);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [showSkeletonOverlay, yoloVideoResults, annotatedFrameIndex, drawAnnotatedFrame]);

  const processUploadedFileWithYolo = async (file, returnAnnotatedFrames = true) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('return_annotated_frames', returnAnnotatedFrames ? 'true' : 'false');

    const response = await fetch(`${YOLO_API_BASE}/api/yolo/process-video`, {
      method: 'POST',
      body: formData,
    });

    const results = await response.json();
    if (!response.ok || results?.error) {
      throw new Error(results?.error || `YOLO processing failed (${response.status})`);
    }

    return results;
  };

  const enrichYoloResults = (results, movement, file) => ({
    ...results,
    header: {
      ...(results.header || {}),
      test_name: movement?.title || results.header?.test_name,
    },
    metadata: {
      ...(results.metadata || {}),
      source_filename: file?.name || '',
      analysis_mode: 'upload',
    },
  });

  const runYoloLabScan = async (movement) => {
    if (!uploadedFile) {
      setYoloScanStatus('Upload a movement video first.');
      return;
    }
    if (isTrimming) {
      setYoloScanStatus('Wait for trim to finish before YOLO scan.');
      return;
    }

    setIsProcessingVideo(true);
    setYoloScanStatus(`Scanning "${uploadedFile.name}" through YOLO pose engine...`);
    setYoloVideoResults(null);

    try {
      let results = await processUploadedFileWithYolo(uploadedFile, true);
      results = enrichYoloResults(results, movement, uploadedFile);
      setYoloVideoResults(results);
      setAnnotatedFrameIndex(0);

      if (accessCode && setLocalDatabase) {
        const client = localDatabase[accessCode] || {};
        const updated = applyPipelineResultsToClient(client, accessCode, results);
        setLocalDatabase((prev) => ({ ...prev, [accessCode]: updated }));
        saveClientRecord(accessCode, updated);
      }

      setYoloScanStatus(
        `✓ YOLO scan complete — ${results.frames_analyzed ?? '—'} frames · grade ${results.header?.grade ?? '—'}`
      );
    } catch (err) {
      console.error('YOLO lab scan failed:', err);
      setYoloScanStatus(
        `${err.message}. Start: python yolo_stream_server.py (port 8001).`
      );
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleApplyTrim = () => {
    if (!sourceDuration) return;
    trimTouchedRef.current = true;
    requestVideoTrim(trimStart, trimEnd, sourceDuration);
  };

  const mainTerminalAssessments = useMemo(
    () =>
      staticAssessmentLibrary
        .filter((track) => track.category === 'Main Terminal')
        .sort((a, b) => a.id - b.id)
        .map(mapLibraryTrackToBlueprintMovement),
    []
  );

  const filteredAssessments = useMemo(() => {
    const query = assessmentSearch.trim().toLowerCase();
    if (!query) return mainTerminalAssessments;
    return mainTerminalAssessments.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        String(item.id).includes(query) ||
        item.metrics.toLowerCase().includes(query) ||
        item.packages.some((pkg) => pkg.toLowerCase().includes(query))
    );
  }, [mainTerminalAssessments, assessmentSearch]);

  const handleLinkSubmit = (id) => {
    if (!googleDriveLink) return;
    setLinkSaved(prev => ({ ...prev, [id]: googleDriveLink }));
    alert('✓ FOOTAGE LINK INTEGRATED // DATA STAGED FOR COACH EVALUATION');
  };

  const compileYoloLabData = (latestResults, movement) => {
    const angles = latestResults?.angles || {};
    const leaks = latestResults?.enhanced_metrics?.energy_analysis?.energy_leaks || [];
    const symmetryScore = latestResults?.scores?.symmetry_score;
    const dossier = normalizeClientDossier(activeClient || {}, accessCode);
    const template = initialClientDossierTemplate;

    const clientAge = Number(dossier.clientAge);
    const parsedAge = Number.isFinite(clientAge) && clientAge > 0 ? clientAge : template.clientAge;

    return {
      client_age: parsedAge,
      client_gender: dossier.clientGender || template.clientGender,
      client_height: dossier.clientHeight || template.clientHeight,
      client_weight: dossier.clientWeight || template.clientWeight,
      client_demographic: `${parsedAge}y/o ${dossier.clientGender || template.clientGender} — ${dossier.clientHeight || template.clientHeight} / ${dossier.clientWeight || template.clientWeight}`,
      test_activity:
        movement?.title ||
        latestResults?.header?.test_name ||
        `YOLO Live Stream Biomechanics Lab — ${movement?.title || 'Movement Assessment'}`,
      joint_angles_measured: Object.keys(angles).length ? angles : {},
      asymmetry_index_percentage:
        symmetryScore != null
          ? Math.max(0, Math.round((100 - symmetryScore) * 10) / 10)
          : 0,
      postural_compensation_notes:
        leaks.map((l) => l.message).join('. ') ||
        'No compensation patterns detected in uploaded clip.',
      request_two_week_plan: requestTwoWeekPlan,
      request_four_week_plan: requestFourWeekPlan,
      request_health_tips: requestHealthTips,
    };
  };

  const handleGetCoachAnalysis = async (movement) => {
    setIsLoading(true);
    setGideonFeedback('');
    setAnalysisStatus('');
    setChatMessages([]);
    setChatInput('');

    try {
      let latestResults = yoloVideoResults;

      if (!latestResults && uploadedFile) {
        setIsProcessingVideo(true);
        setAnalysisStatus(`No YOLO cache — scanning "${uploadedFile.name}" first...`);
        try {
          latestResults = enrichYoloResults(
            await processUploadedFileWithYolo(uploadedFile, true),
            movement,
            uploadedFile
          );
          setYoloVideoResults(latestResults);
          setAnnotatedFrameIndex(0);
        } catch (yoloError) {
          console.error('YOLO video processing failed:', yoloError);
          setAnalysisStatus(
            `YOLO scan failed: ${yoloError.message}. Run YOLO Scan first or start port 8001.`
          );
          return;
        } finally {
          setIsProcessingVideo(false);
        }
      } else if (!latestResults) {
        try {
          const yoloRes = await fetch(`${YOLO_API_BASE}/api/yolo/results/latest`);
          if (yoloRes.ok) {
            latestResults = await yoloRes.json();
            if (latestResults?.error) latestResults = null;
          }
        } catch {
          // YOLO lab offline
        }
      }

      if (!latestResults?.angles || !Object.keys(latestResults.angles).length) {
        setAnalysisStatus('Run YOLO Biomechanics Scan on your trimmed clip before coach analysis.');
        return;
      }

      const yoloLabData = compileYoloLabData(latestResults, movement);

      const response = await fetch(
        `http://localhost:8000/api/analyze-biometrics?coach=${selectedCoach}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(yoloLabData),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Data transmission failed.');
      }

      const structuredPlan = await response.json();
      const summary = applyGeminiResponseToState(structuredPlan);

      if (!summary) {
        setAnalysisStatus('Gemini returned an empty assessment summary. Check port 8000 logs.');
        return;
      }

      setAnalysisStatus('');

      setDossierSaveStatus('✓ Analysis ready — click Export Directive to push to client dossier.');
      speakAsCoach(summary, selectedCoach);
    } catch (error) {
      console.error('Telemetry Array Failure:', error);
      setAnalysisStatus(
        error.message || 'Uplink severed. Unable to parse biomechanical telemetry matrix.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfPayload = {
        recipient_name: recipientName,
        suite_num: suiteNum,
        google_drive_link: googleDriveLink || linkSaved[selectedMovementRoom] || '',
        plan_data: {
          gideon_assessment_summary: resolvedCoachFeedback || gideonFeedback,
          right_now_adjustment: rightNowAdjustment,
          two_week_protocol: twoWeekProtocol,
          four_week_protocol: fourWeekProtocol,
          long_term_vision: longTermVision,
        },
      };

      const response = await fetch('http://localhost:8000/api/generate-report-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      });

      if (!response.ok) throw new Error('Could not compile document matrix.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Life_Longevity_Report_${recipientName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('PDF compiling failed:', error);
      alert('PDF export failed. Run coach analysis first and ensure port 8000 is online.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFetchLatestYoloData = async (movement) => {
    setIsFetchingYolo(true);
    setYoloFetchStatus('Fetching latest YOLO telemetry from port 8001...');

    try {
      const response = await fetch(`${YOLO_API_BASE}/api/yolo/results/latest`);
      if (!response.ok) throw new Error('YOLO telemetry out of sync.');

      const latest = await response.json();
      if (!latest || latest.error || !Object.keys(latest).length) {
        throw new Error('No YOLO results cached yet. Run YOLO Scan or process a video first.');
      }
      if (!latest.angles || !Object.keys(latest.angles).length) {
        throw new Error('YOLO payload has no angle data.');
      }

      const enriched = enrichYoloResults(latest, movement, uploadedFile);
      setYoloVideoResults(enriched);
      setAnnotatedFrameIndex(0);

      if (accessCode && setLocalDatabase) {
        const client = localDatabase[accessCode] || {};
        const updated = applyPipelineResultsToClient(client, accessCode, latest);
        setLocalDatabase((prev) => ({ ...prev, [accessCode]: updated }));
        saveClientRecord(accessCode, updated);
      }

      setYoloFetchStatus(
        `✓ ${Object.keys(latest.angles).length} joint angles synced from lab cache`
      );
    } catch (error) {
      console.error('YOLO lab fetch failed:', error);
      setYoloFetchStatus(error.message || 'YOLO fetch failed');
    } finally {
      setIsFetchingYolo(false);
    }
  };

  // =========================================================================
  // DYNAMIC SUB-PAGE: SIMPLIFIED SPLIT LAB SCANNING ROOM
  // =========================================================================
  if (selectedMovementRoom) {
    const movement = mainTerminalAssessments.find((a) => a.id === selectedMovementRoom);
    if (!movement) {
      setSelectedMovementRoom(null);
      return null;
    }
    const hasSavedLink = linkSaved[movement.id];

    return (
      <CyberPageScrollSlider theme="purple" className="w-full h-full">
      <div className="w-full min-h-full max-w-full mx-auto p-3 md:p-4 bg-slate-950 border border-cyan-500/20 rounded-2xl shadow-2xl font-mono text-white animate-fade-in flex flex-col">

        {/* Compact header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSelectedMovementRoom(null);
                setGoogleDriveLink('');
                if (mainStreamRef.current) {
                  URL.revokeObjectURL(mainStreamRef.current);
                  mainStreamRef.current = '';
                }
                setMainStreamSource('');
                setUploadedFile(null);
                setYoloVideoResults(null);
                originalFileRef.current = null;
                trimTouchedRef.current = false;
                setSourceDuration(0);
                setTrimStart(0);
                setTrimEnd(0);
                setTrimStatus('');
                setYoloScanStatus('');
                setAnnotatedFrameIndex(0);
                setChatMessages([]);
                setChatInput('');
              }}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400 text-slate-400 hover:text-cyan-400 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase">
                // ASSESSMENT PORTAL
              </span>
              <h2 className="text-base md:text-lg font-black text-slate-100 uppercase tracking-tight truncate">
                {movement.title}
              </h2>
            </div>
          </div>
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest border border-indigo-900/40 bg-slate-950 px-2.5 py-1 rounded-full hidden sm:block shrink-0">
            NODE_{String(movement.id).padStart(2, '0')}
          </span>
        </div>

        {/* TOP DECK — full-width live YOLO practice viewport */}
        <div className="w-full shrink-0 mb-4">
          <LiveYoloPreview
            variant="topDeck"
            cameraIndex={liveCameraIndex}
            onCameraIndexChange={setLiveCameraIndex}
            defaultCameraIndex={0}
          />
        </div>

        {/* BOTTOM DECK — 50/50 upload lab + cyber-coaching split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">

          {/* LEFT 50% — upload, trim, telemetry */}
          <div className="flex flex-col gap-3 min-w-0 pb-2">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0">
              <Camera className="w-3.5 h-3.5" /> Upload Lab Feed
            </div>

            <div className="flex justify-start w-full">
              <div
                className={`${VERTICAL_BODY_VIEWPORT_CLASS} ${
                  isDragOver ? 'border-cyan-400' : 'border-cyan-900/40'
                }`}
                onDragEnter={handleDropZoneDragEnter}
                onDragOver={handleDropZoneDragOver}
                onDragLeave={handleDropZoneDragLeave}
                onDrop={handleDropZoneDrop}
              >
              <input
                ref={videoFileInputRef}
                type="file"
                accept={VIDEO_ACCEPT}
                className="hidden"
                onChange={handleFileInputChange}
              />
              {!mainStreamSource ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 p-4 text-center">
                  <Camera className={`w-10 h-10 mb-3 shrink-0 ${isDragOver ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <h3 className="text-sm font-bold text-white mb-1">YOLO Biomechanics Feed</h3>
                  <p className="text-[11px] text-slate-400 mb-4 max-w-[220px] leading-relaxed">
                    Drop a full-body vertical movement video here
                  </p>
                  <button
                    type="button"
                    onClick={openVideoFilePicker}
                    className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-400/50"
                  >
                    Choose Video File
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={centralVideoRef}
                    key={mainStreamSource}
                    src={mainStreamSource}
                    controls={false}
                    playsInline
                    preload="metadata"
                    loop={false}
                    muted
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onTimeUpdate={syncSkeletonFrameToVideo}
                    onEnded={handleVideoEnded}
                    onPause={() => setIsVideoPlaying(false)}
                    onPlay={() => setIsVideoPlaying(true)}
                    className={`absolute inset-0 w-full h-full object-contain bg-black ${
                      showSkeletonOverlay ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                  />
                  {showSkeletonOverlay && (
                    <canvas
                      ref={processedCanvasRef}
                      className="absolute inset-0 z-10 w-full h-full"
                    />
                  )}
                  <div className="absolute top-2 left-2 z-20 font-mono text-[9px] text-cyan-400/90 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {showSkeletonOverlay ? 'SKELETON_OVERLAY' : 'UPLOAD_LOCK'}
                  </div>
                  {uploadedFile && (
                    <div className="absolute top-2 right-2 z-20 font-mono text-[9px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 max-w-[45%] truncate">
                      {uploadedFile.name}
                    </div>
                  )}
                  {showSkeletonOverlay && yoloVideoResults?.annotated_frames?.length > 1 && (
                    <div className="absolute bottom-12 left-2 right-2 z-20">
                      <input
                        type="range"
                        min={0}
                        max={yoloVideoResults.annotated_frames.length - 1}
                        value={annotatedFrameIndex}
                        onChange={(e) => handleAnnotatedFrameScrub(e.target.value)}
                        className="w-full h-1 bg-slate-800/80 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={openVideoFilePicker}
                    className="absolute bottom-2 right-2 z-20 text-[9px] font-mono uppercase tracking-wider bg-slate-900/90 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg"
                  >
                    Replace
                  </button>
                  {(isProcessingVideo || isTrimming) && (
                    <div className="absolute inset-0 z-30 bg-slate-950/75 flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full" />
                      <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
                        {isTrimming ? 'Trimming...' : 'YOLO scanning...'}
                      </p>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>

            {mainStreamSource && (
              <div className="grid grid-cols-4 gap-2 shrink-0">
                {[
                  { label: 'PLAY', action: handleVideoPlay, mode: 'play' },
                  { label: 'PAUSE', action: handleVideoPause, mode: 'pause' },
                  { label: 'SLOW-MO (0.5x)', action: handleVideoSlowMo, mode: 'slow' },
                  { label: 'RESET', action: handleVideoReset, mode: 'reset' },
                ].map(({ label, action, mode }) => {
                  const isActive =
                    (mode === 'play' && isVideoPlaying && playbackRate === 1) ||
                    (mode === 'slow' && isVideoPlaying && playbackRate === 0.5);
                  return (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all border ${
                      isActive
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-950 border-cyan-500/50 text-cyan-300 hover:bg-cyan-950'
                    }`}
                  >
                    {label}
                  </button>
                  );
                })}
              </div>
            )}

            {mainStreamSource && sourceDuration > 0 && (
              <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 shrink-0">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider">
                  <span className="text-cyan-400">Clip Trim</span>
                  <span className="text-slate-500">
                    {formatTrimSeconds(trimSelectionSeconds)}s · {formatTrimSeconds(sourceDuration)}s
                  </span>
                </div>
                <div className="relative h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="absolute inset-y-0 bg-cyan-500/35 border-x border-cyan-400/50"
                    style={{ left: `${trimStartPercent}%`, right: `${100 - trimEndPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Start (s)</span>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, trimEnd - 0.1)}
                      step={0.1}
                      value={trimStart}
                      disabled={isTrimming}
                      onChange={(e) => handleTrimStartChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-[11px] outline-none text-slate-200 font-mono"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">End (s)</span>
                    <input
                      type="number"
                      min={trimStart + 0.1}
                      max={sourceDuration}
                      step={0.1}
                      value={trimEnd}
                      disabled={isTrimming}
                      onChange={(e) => handleTrimEndChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-[11px] outline-none text-slate-200 font-mono"
                    />
                  </label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={sourceDuration}
                  step={0.1}
                  value={trimStart}
                  disabled={isTrimming}
                  onChange={(e) => handleTrimStartChange(e.target.value)}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
                />
                <input
                  type="range"
                  min={0}
                  max={sourceDuration}
                  step={0.1}
                  value={trimEnd}
                  disabled={isTrimming}
                  onChange={(e) => handleTrimEndChange(e.target.value)}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
                />
                {(isTrimming || trimStatus) && (
                  <p className={`text-[9px] font-mono uppercase ${isTrimming ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {isTrimming ? 'Trimming on server...' : trimStatus}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyTrim}
                    disabled={isTrimming || !sourceDuration}
                    className="flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider bg-slate-950 border border-cyan-500/40 text-cyan-300 rounded-lg hover:bg-cyan-950 disabled:opacity-40"
                  >
                    Apply Trim
                  </button>
                  <button
                    type="button"
                    onClick={() => runYoloLabScan(movement)}
                    disabled={isProcessingVideo || isTrimming || isLoading}
                    className="flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider bg-green-600/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-600/30 disabled:opacity-40"
                  >
                    {isProcessingVideo ? 'Scanning...' : 'Run YOLO Scan'}
                  </button>
                </div>
              </div>
            )}

            {yoloVideoResults && !yoloVideoResults.error && (
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[9px] shrink-0">
                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-lg py-1.5">
                  <p className="text-slate-500 uppercase">Score</p>
                  <p className="text-emerald-400 font-bold text-xs">
                    {yoloVideoResults.header?.overall_score?.toFixed?.(1) ?? '—'}%
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-cyan-500/20 rounded-lg py-1.5">
                  <p className="text-slate-500 uppercase">Grade</p>
                  <p className="text-cyan-400 font-bold text-xs">{yoloVideoResults.header?.grade ?? '—'}</p>
                </div>
                <div className="bg-slate-900/60 border border-indigo-500/20 rounded-lg py-1.5">
                  <p className="text-slate-500 uppercase">Symmetry</p>
                  <p className="text-indigo-400 font-bold text-xs">
                    {yoloVideoResults.scores?.symmetry_score?.toFixed?.(1) ?? '—'}%
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-amber-500/20 rounded-lg py-1.5">
                  <p className="text-slate-500 uppercase">Efficiency</p>
                  <p className="text-amber-400 font-bold text-xs">
                    {yoloVideoResults.enhanced_metrics?.energy_analysis?.total_efficiency?.toFixed?.(1) ?? '—'}%
                  </p>
                </div>
              </div>
            )}

            {yoloScanStatus && (
              <p
                className={`text-[9px] font-mono uppercase tracking-wider shrink-0 ${
                  yoloScanStatus.startsWith('✓') ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {yoloScanStatus}
              </p>
            )}

            <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 shrink-0">
              <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5" /> Forward Video Cloud Link
              </label>
              {hasSavedLink ? (
                <div className="p-2 bg-slate-950 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">STAGED: {linkSaved[movement.id]}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Google Drive link..."
                    value={googleDriveLink}
                    onChange={(e) => setGoogleDriveLink(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2 text-[11px] outline-none text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleLinkSubmit(movement.id)}
                    className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {yoloVideoResults && Object.keys(yoloVideoResults.angles || {}).length > 0 ? (
              <div className="p-3 bg-slate-900/60 border border-green-500/20 rounded-xl space-y-2 shrink-0">
                <p className="text-[10px] font-mono text-green-400 uppercase tracking-widest font-bold">
                  // Joint Angle Telemetry
                </p>
                <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto text-sm font-mono custom-scrollbar">
                  {Object.entries(yoloVideoResults.angles).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between bg-slate-950/60 border border-slate-800 rounded px-2 py-1.5"
                    >
                      <span className="text-green-300 truncate mr-2 font-semibold">{key.replace(/_/g, ' ')}</span>
                      <span className="text-cyan-200 shrink-0 font-bold text-base">
                        {typeof val === 'number' ? val.toFixed(1) : val}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 shrink-0">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-950 pb-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Execution Instructions
              </div>
              <p className="text-base font-sans font-semibold text-slate-100 leading-relaxed whitespace-pre-wrap max-h-[100px] overflow-y-auto custom-scrollbar">
                {movement.instructions}
              </p>
            </div>
          </div>

          {/* RIGHT 50% — cyber-coaching engine + chat deck */}
          <div className="flex flex-col pl-1 space-y-3 pb-2">
            <div className="p-3 bg-slate-900/60 border border-purple-500/30 rounded-xl space-y-3 shrink-0">
              <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                🤖 Cyber-Coaching Biometrics Engine
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lab-client-dossier-select"
                  className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-cyan-400"
                >
                  // Active Client Dossier Uplink
                </label>
                <select
                  id="lab-client-dossier-select"
                  value={clientCode}
                  onChange={(e) => handleClientDossierSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/50 focus:border-purple-400 text-purple-100 text-[11px] rounded-lg px-3 py-2.5 outline-none shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
                >
                  <option value="">— Select client dossier —</option>
                  {clientRoster.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name} (#{code})
                    </option>
                  ))}
                </select>
                {clientCode && activeClient ? (
                  <p className="text-[9px] font-mono text-emerald-400/90 uppercase tracking-wider">
                    ✓ Pipeline bound to {activeClient.name} · #{clientCode}
                  </p>
                ) : (
                  <p className="text-[9px] font-mono text-amber-400/80 uppercase tracking-wider">
                    ⚠ Select a dossier to bind export pipeline
                  </p>
                )}
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
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg p-2 outline-none focus:border-purple-500"
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
                className={`w-full text-[10px] font-bold py-2.5 rounded-lg transition-all uppercase tracking-wider ${
                  voiceEnabled
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.45)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                🎤 {getCoachVoiceEngineLabel(selectedCoach)} Voice: {voiceEnabled ? 'ON' : 'OFF'}
              </button>

              <div className="flex flex-col gap-1.5">
                {[
                  {
                    label: '[ INCLUDE 2-WEEK PROTOCOL ]',
                    active: requestTwoWeekPlan,
                    onToggle: () => setRequestTwoWeekPlan((v) => !v),
                  },
                  {
                    label: '[ INCLUDE 4-WEEK PROTOCOL ]',
                    active: requestFourWeekPlan,
                    onToggle: () => setRequestFourWeekPlan((v) => !v),
                  },
                  {
                    label: '[ INCLUDE DAILY HEALTH TIPS ]',
                    active: requestHealthTips,
                    onToggle: () => setRequestHealthTips((v) => !v),
                  },
                ].map(({ label, active, onToggle }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onToggle}
                    className={`w-full py-2.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-[0.12em] border transition-all ${
                      active
                        ? 'bg-purple-600/35 border-purple-400 text-purple-100 shadow-[0_0_18px_rgba(168,85,247,0.55)] ring-1 ring-purple-400/50'
                        : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleGetCoachAnalysis(movement)}
                  disabled={isLoading || isProcessingVideo || isTrimming}
                  className="py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider"
                >
                  {isTrimming
                    ? 'TRIMMING...'
                    : isProcessingVideo
                      ? 'SCANNING...'
                      : isLoading
                        ? 'GEMINI...'
                        : 'Get Coach Analysis'}
                </button>
              </div>

              <CoachGeminiChatDeck
                messages={chatMessages}
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onSubmit={() => handleSendChatMessage(movement)}
                isChatLoading={isChatLoading}
                isAnalyzing={isLoading || isProcessingVideo}
                analysisStatus={analysisStatus}
                seedAssistantMessage={coachFeedbackDisplay}
                selectedCoach={selectedCoach}
                voiceEnabled={voiceEnabled}
                onReplayLast={(text) => speakAsCoach(text, selectedCoach)}
              />

              <button
                type="button"
                onClick={() => handleExportToDossier(movement)}
                disabled={isExportingDossier || (!coachPlanRaw && !resolvedCoachFeedback)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.14em] shadow-[0_0_18px_rgba(16,185,129,0.25)]"
              >
                {isExportingDossier
                  ? 'SYNCING DOSSIER...'
                  : '[ EXPORT DIRECTIVE TO CLIENT DOSSIER // ]'}
              </button>

              {dossierSaveStatus && (
                <p
                  className={`text-[9px] font-mono uppercase ${
                    dossierSaveStatus.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {dossierSaveStatus}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl shrink-0">
              <TacticalWorkflowButtonStack
                onMasterDirectory={() => onNavigate?.('MASTER_ASSESSMENT_DIRECTORY_TERMINAL')}
                onOpenReportViewer={() => onOpenClientReport?.(accessCode)}
                onUploadLab={() => setSelectedMovementRoom(null)}
                onFetchYolo={() => handleFetchLatestYoloData(movement)}
                onCompilePdf={handleExportPDF}
                isFetchingYolo={isFetchingYolo}
                isCompilingPdf={isExporting}
                uploadLabActive
                yoloTelemetryPanel={
                  yoloFetchStatus ? (
                    <p
                      className={`text-[9px] font-mono uppercase tracking-wider px-0.5 ${
                        yoloFetchStatus.startsWith('✓') ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {yoloFetchStatus}
                    </p>
                  ) : null
                }
              />
            </div>

            <a
              href="mailto:reports@://lifelongevitylab.com"
              className="block text-center py-2 bg-gradient-to-r from-cyan-500/80 to-indigo-600/80 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-lg text-[9px] uppercase tracking-widest shrink-0 mb-1"
            >
              ✉ Route Raw Video To Coach Terminal
            </a>
          </div>
        </div>
      </div>
      </CyberPageScrollSlider>
    );
  }

  // =========================================================================
  // MAIN TERMINAL DIRECTORY — all library assessment IDs
  // =========================================================================
  return (
    <div className="h-full overflow-y-auto custom-scrollbar max-w-5xl mx-auto p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-md font-mono">
      <div className="mb-5 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Longevity Blueprint Upload Lab
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Select any Main Terminal assessment node — same {mainTerminalAssessments.length} IDs as the Master Directory.
          </p>
        </div>
        <div className="text-right text-[10px] text-slate-500 uppercase tracking-widest">
          Terminal Nodes:{' '}
          <span className="text-cyan-400 font-bold">{mainTerminalAssessments.length}</span>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={assessmentSearch}
          onChange={(e) => setAssessmentSearch(e.target.value)}
          placeholder="Search by name, ID, or package deck..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="max-h-[min(62vh,640px)] overflow-y-auto border border-slate-900/60 rounded-xl bg-slate-950/30 divide-y divide-slate-900/50 custom-scrollbar">
        {filteredAssessments.length === 0 ? (
          <p className="p-6 text-center text-slate-500 text-sm">
            No assessments match &quot;{assessmentSearch}&quot;
          </p>
        ) : (
          filteredAssessments.map((item) => {
            const staged = linkSaved[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedMovementRoom(item.id)}
                className={`w-full text-left flex items-center justify-between gap-4 p-4 hover:bg-cyan-500/5 transition-colors group ${
                  staged ? 'bg-emerald-950/10' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-cyan-500/50 group-hover:text-cyan-400 text-[10px] shrink-0 font-bold">
                    // NODE_{String(item.id).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-slate-600 text-[9px] uppercase tracking-widest mt-0.5 truncate">
                      {item.metrics}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-[9px] font-bold uppercase tracking-widest">
                  {staged ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Staged
                    </span>
                  ) : (
                    <span className="text-slate-500 group-hover:text-cyan-400">Open Upload Lab →</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BlueprintAssessments;
