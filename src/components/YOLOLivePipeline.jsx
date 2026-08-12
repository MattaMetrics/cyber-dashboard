import React, { useState, useRef, useEffect } from 'react';
import { Activity, Zap, Target, Camera, Download, Upload } from 'lucide-react';

const VOICE_PROFILES = {
  'Coach Kai': {
    gender: 'female',
    lang: 'en-GB',
    rate: 0.88,
    pitch: 1.08,
    description: 'British female - calm, analytical, precise',
  },
  'Coach Marina': {
    gender: 'female',
    lang: 'en-US',
    rate: 1.05,
    pitch: 1.02,
    description: 'American female - direct, intense, Vegas-tough',
  },
  'Coach Rogan': {
    gender: 'male',
    lang: 'en-US',
    rate: 1.15,
    pitch: 0.92,
    description: 'American male - technical, pressure-tested',
  },
  'Coach Gable': {
    gender: 'male',
    lang: 'en-US',
    rate: 1.1,
    pitch: 0.95,
    description: 'American male - grinding, relentless, loud',
  },
  'Dr. Sarah': {
    gender: 'female',
    lang: 'en-US',
    rate: 0.85,
    pitch: 1.1,
    description: 'American female - therapeutic, warm, patient',
  },
  'Coach Lotus': {
    gender: 'female',
    lang: 'en-GB',
    rate: 0.75,
    pitch: 1.05,
    description: 'British female - nurturing, mindful, soothing',
  },
  'Coach Cirque': {
    gender: 'female',
    lang: 'en-GB',
    rate: 0.9,
    pitch: 1.15,
    description: 'British female - artistic, expressive, graceful',
  },
  'Coach Speed': {
    gender: 'male',
    lang: 'en-US',
    rate: 1.08,
    pitch: 1.0,
    description: 'American male - explosive, technical, fast',
  },
};

const gideonGreeting = 'Good evening. I am Gideon. Your biomechanical analysis is ready.';

const COACH_GREETINGS = {
  'Coach Kai': 'I am Coach Kai. The data reveals your body\'s story.',
  'Coach Marina': 'Coach Marina here. Your movement scan is complete. Let\'s see what we\'re working with.',
  'Coach Rogan': 'Oss. Coach Rogan. Your body doesn\'t lie to me.',
  'Coach Gable': 'Coach Gable. Wrestling exposes every weakness. Your scan is up.',
  'Dr. Sarah': 'Hello, I\'m Dr. Sarah. Let\'s look at your movement together.',
  'Coach Lotus': 'Welcome. I\'m Coach Lotus. Take a breath. Let\'s explore your practice.',
  'Coach Cirque': 'Bonjour! Coach Cirque here. Your body is an instrument. Let\'s discover its range.',
  'Coach Speed': 'Coach Speed. Every millisecond counts. Let\'s find your speed leaks.',
};

export default function YOLOLivePipeline({ onNavigate, accessCode, setLocalDatabase, localDatabase, saveClientRecord, applyPipelineResultsToClient }) {
  const [streaming, setStreaming] = useState(false);
  const [metrics, setMetrics] = useState({ efficiency: 0, symmetry: 0, grade: 'N/A' });
  const [status, setStatus] = useState('idle');
  const [coach, setCoach] = useState('Coach Kai');
  const [coachAnalysis, setCoachAnalysis] = useState('');
  const [selectedTest, setSelectedTest] = useState('LL001');
  const [assessments, setAssessments] = useState([]);
  const [testScore, setTestScore] = useState(null);
  const [coaches, setCoaches] = useState([
    'Coach Kai',
    'Coach Marina',
    'Coach Rogan',
    'Coach Gable',
    'Dr. Sarah',
    'Coach Lotus',
    'Coach Cirque',
    'Coach Speed',
  ]);
  // Video upload state
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [videoResults, setVideoResults] = useState(null);
  const wsRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const voiceEnabledRef = useRef(false);

  const startStream = () => {
    setStreaming(true);
    setStatus('connecting');
    
    wsRef.current = new WebSocket('ws://localhost:8001/ws/yolo-stream');
    
    wsRef.current.onopen = () => setStatus('streaming');
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.frame && imgRef.current) {
        imgRef.current.src = 'data:image/jpeg;base64,' + data.frame;
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    };
    
    wsRef.current.onerror = () => setStatus('error');
    
    wsRef.current.onclose = () => {
      setStreaming(false);
      setStatus('disconnected');
    };
  };

  const stopStream = () => {
    if (wsRef.current) wsRef.current.close();
    setStreaming(false);
    setStatus('idle');
  };

  /** Merge YOLO telemetry into client dossier and open blueprint report viewer (not PDF compile) */
  const loadIntoReport = async (customData = null) => {
    try {
      let results;
      if (customData) {
        results = customData;
      } else {
        const response = await fetch('http://localhost:8001/api/yolo/results/latest');
        results = await response.json();
      }

      if (applyPipelineResultsToClient && accessCode) {
        const client = localDatabase?.[accessCode] || {};
        const updated = applyPipelineResultsToClient(client, accessCode, results);
        setLocalDatabase?.(prev => ({ ...prev, [accessCode]: updated }));
        saveClientRecord?.(accessCode, updated);
      }

      onNavigate?.('REPORT_PDF_GENERATOR_VIEW');
    } catch (err) {
      alert('YOLO server not running. Start: python yolo_stream_server.py');
    }
  };

  useEffect(() => {
    fetch('http://localhost:8001/api/coach/list')
      .then((r) => r.json())
      .then((d) => {
        const names = (d.coaches || []).map((c) => c.name).filter(Boolean);
        if (names.length) setCoaches(names);
      })
      .catch(() => {});

    fetch('http://localhost:8001/api/assessments/list')
      .then((r) => r.json())
      .then((d) => {
        setAssessments(d.assessments || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  // ============================================
  // MULTI-VOICE COACH SYSTEM
  // ============================================
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const speakAsCoach = (text, coachName = 'Coach Kai') => {
    if (!voiceEnabledRef.current || !speechSynth) return;

    speechSynth.cancel();

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[#*_~`>]/g, '')
      .replace(/[🔴🟡🟢✅⚠️🤖]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    const profile = VOICE_PROFILES[coachName] || VOICE_PROFILES['Coach Kai'];

    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = 0.9;

    const voices = speechSynth.getVoices();
    let bestVoice = null;

    if (profile.gender === 'female') {
      if (profile.lang === 'en-GB') {
        bestVoice = voices.find(v =>
          v.lang.startsWith('en-GB') &&
          (v.name.includes('Female') || v.name.includes('Fiona') || v.name.includes('Kate') || v.name.includes('Amy'))
        );
      }
      if (!bestVoice) {
        bestVoice = voices.find(v =>
          v.lang.startsWith('en-US') &&
          (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen'))
        );
      }
      if (!bestVoice) {
        bestVoice = voices.find(v => v.name.includes('Female'));
      }
    } else {
      if (profile.lang === 'en-GB') {
        bestVoice = voices.find(v =>
          v.lang.startsWith('en-GB') &&
          (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Oliver'))
        );
      }
      if (!bestVoice) {
        bestVoice = voices.find(v =>
          v.lang.startsWith('en-US') &&
          (v.name.includes('Male') || v.name.includes('Tom'))
        );
      }
    }

    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    speechSynth.speak(utterance);
  };

  // Process uploaded video through YOLO
  const processUploadedVideo = async (file) => {
    setProcessingVideo(true);
    setVideoResults(null);

    // Show video while processing
    const objectUrl = URL.createObjectURL(file);
    setUploadedVideo(objectUrl);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.src = objectUrl;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('return_annotated_frames', 'true');

    try {
      const response = await fetch('http://localhost:8001/api/yolo/process-video', {
        method: 'POST',
        body: formData,
      });

      const results = await response.json();
      setVideoResults(results);

      // Show annotated frames if available
      if (results.annotated_frames && results.annotated_frames.length > 0) {
        const canvas = processedCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = 'data:image/jpeg;base64,' + results.annotated_frames[0];
        }
      }

      // Auto-analyze
      if (results && !results.error) {
        const coachResponse = await fetch('http://localhost:8001/api/coach/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yolo_data: results, context: 'video analysis' }),
        });
        const coachData = await coachResponse.json();
        setCoachAnalysis(coachData.analysis);
        speakAsCoach(coachData.analysis, coach);
      }
    } catch (err) {
      console.error('Video processing failed:', err);
    } finally {
      setProcessingVideo(false);
    }
  };

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

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'g' && e.ctrlKey) {
        e.preventDefault();
        setVoiceEnabled((v) => {
          voiceEnabledRef.current = !v;
          return !v;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-cyan-900/50 p-4 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${streaming ? 'bg-green-500' : 'bg-slate-600'}`} />
          <span className="text-cyan-400 font-mono text-sm tracking-widest">
            🧬 YOLO LIVE BIOMECHANICS
          </span>
          <span className="text-slate-500 text-xs">|</span>
          <span className="text-slate-400 text-xs">DeepSeek Master Data Coach</span>
        </div>
        
        <button
          onClick={() => onNavigate?.('coach_menu')}
          className="text-slate-400 hover:text-white text-sm border border-slate-700 px-4 py-2 rounded-lg hover:border-cyan-500 transition-all"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden min-h-0">
        {/* Left column: live feed + video upload */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Video Feed — live stream always mounted for frame delivery */}
          <div className="flex-1 min-h-0 bg-black rounded-xl border border-cyan-900/30 overflow-hidden relative flex items-center justify-center">
            <img
              ref={imgRef}
              className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
                streaming ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0 m-auto'
              }`}
              alt="YOLO Feed"
            />
            {!streaming && (
              <div className="text-center p-8 relative z-10">
                <Camera size={64} className="mx-auto mb-4 text-slate-600" />
                <h2 className="text-xl font-bold text-white mb-2">YOLO Live Feed</h2>
                <p className="text-slate-400 mb-6">Real-time biomechanical analysis with glowing skeleton overlay</p>
                <button
                  onClick={startStream}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-cyan-500/25"
                >
                  🎬 Start Live Stream
                </button>
                <p className="text-xs text-slate-600 mt-4">Requires yolo_stream_server.py on port 8001</p>
              </div>
            )}

            {streaming && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={stopStream} className="bg-red-600/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
                  ⏹ Stop
                </button>
                <button onClick={() => loadIntoReport()} className="bg-green-600/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Download size={16} />
                  Send to Report
                </button>
              </div>
            )}
          </div>

          {/* VIDEO UPLOAD SECTION */}
          <div className="flex-none bg-slate-900 border border-cyan-500/30 rounded-xl p-4 max-h-[42%] overflow-y-auto">
            <h3 className="text-cyan-400 font-mono text-xs tracking-widest mb-3 flex items-center gap-2">
              <Upload size={14} />
              PRE-RECORDED VIDEO ANALYSIS
            </h3>

            {!uploadedVideo ? (
              <label className="block border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg p-6 text-center cursor-pointer transition-all group">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      processUploadedVideo(file);
                    }
                  }}
                />
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📹</div>
                <p className="text-sm text-slate-400 group-hover:text-cyan-300">Drop video or click to upload</p>
                <p className="text-xs text-slate-600 mt-1">MP4, MOV, AVI • Max 500MB</p>
              </label>
            ) : (
              <div className="space-y-3">
                {/* Video player */}
                <video
                  ref={videoRef}
                  src={uploadedVideo}
                  controls
                  className="w-full rounded-lg border border-slate-700 max-h-40 object-contain bg-black"
                />

                {/* Annotated frame preview */}
                {(processingVideo || videoResults?.annotated_frames?.length > 0) && (
                  <canvas
                    ref={processedCanvasRef}
                    className="w-full rounded-lg border border-cyan-500/30"
                  />
                )}

                {/* Processing status */}
                {processingVideo && (
                  <div className="flex items-center gap-3 bg-cyan-900/20 rounded-lg p-3">
                    <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full" />
                    <div>
                      <p className="text-sm text-cyan-300">Processing video through YOLO...</p>
                      <p className="text-xs text-cyan-500">Extracting biomechanics data frame by frame</p>
                    </div>
                  </div>
                )}

                {/* Results summary */}
                {videoResults && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-green-300 text-sm font-bold">Analysis Complete</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          {videoResults.header?.overall_score?.toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-xs text-green-600">Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          {videoResults.header?.grade || 'N/A'}
                        </div>
                        <div className="text-xs text-green-600">Grade</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          {videoResults.enhanced_metrics?.energy_analysis?.total_efficiency?.toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-xs text-green-600">Efficiency</div>
                      </div>
                    </div>

                    {/* Send to report button */}
                    <button
                      type="button"
                      onClick={() => loadIntoReport(videoResults)}
                      className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      Send to Blueprint Report
                    </button>
                  </div>
                )}

                {/* Re-upload */}
                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideo(null);
                    setVideoResults(null);
                    const canvas = processedCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 py-2"
                >
                  Upload different video
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Panel — coach feedback prioritized */}
        <div className="bg-slate-900 rounded-xl border border-cyan-900/30 flex flex-col gap-3 p-4 overflow-y-auto min-h-0">

          {/* Live Metrics - Compact */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-cyan-400">{metrics.efficiency?.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">Efficiency</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-400">{metrics.symmetry?.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">Symmetry</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-2xl font-bold text-yellow-400">{metrics.grade}</div>
              <div className="text-[10px] text-slate-500">Grade</div>
            </div>
          </div>

          {/* Coach Selector */}
          <select
            value={coach}
            onChange={async (e) => {
              setCoach(e.target.value);
              await fetch('http://localhost:8001/api/coach/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coach_name: e.target.value }),
              });
              speakAsCoach(COACH_GREETINGS[e.target.value] || gideonGreeting, e.target.value);
            }}
            className="w-full bg-slate-800 text-white text-xs rounded-lg p-2.5 border border-slate-700"
          >
            {Object.keys(VOICE_PROFILES).map((c) => (
              <option key={c} value={c}>
                {VOICE_PROFILES[c].gender === 'female' ? '👩' : '👨'} {c}
              </option>
            ))}
          </select>

          {/* Voice Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!voiceEnabled) {
                voiceEnabledRef.current = true;
                setVoiceEnabled(true);
                speakAsCoach(COACH_GREETINGS[coach] || gideonGreeting, coach);
              } else {
                voiceEnabledRef.current = false;
                setVoiceEnabled(false);
                speechSynth?.cancel();
              }
            }}
            className={`w-full text-xs font-bold py-2 rounded-lg transition-all ${
              voiceEnabled ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            🎤 Gideon Voice: {voiceEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={async () => {
              const r = await fetch('http://localhost:8001/api/coach/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: selectedTest }),
              });
              const d = await r.json();
              setCoachAnalysis(d.analysis);
              speakAsCoach(d.analysis, coach);
            }}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 rounded-lg"
          >
            🤖 Get Coach Analysis
          </button>

          {/* Assessment Scorer */}
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="w-full bg-slate-800 text-white text-xs rounded-lg p-2.5 border border-slate-700"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              const r = await fetch('http://localhost:8001/api/assessments/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test_id: selectedTest }),
              });
              const d = await r.json();
              setTestScore(d);
              const grade = d.overall_score;
              const comment =
                grade >= 90
                  ? 'Exceptional performance.'
                  : grade >= 70
                    ? 'Adequate. Room for optimization.'
                    : 'Attention required.';
              speakAsCoach(comment, coach);
            }}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-lg"
          >
            📊 Auto-Score: {selectedTest}
          </button>

          {testScore && (
            <div className="bg-cyan-900/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">{testScore.overall_score?.toFixed(0)}%</div>
              <div className="text-[10px] text-cyan-300">{testScore.test_name}</div>
            </div>
          )}

          {/* Merge telemetry + open blueprint viewer (PDF compile lives on Coach Dashboard) */}
          <button
            type="button"
            onClick={() => loadIntoReport(videoResults || null)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl text-sm"
          >
            📊 Open Blueprint Report Viewer
          </button>

          {/* ============================================ */}
          {/* LARGE COACH FEEDBACK BOX - TAKES REMAINING SPACE */}
          {/* ============================================ */}
          <div className="flex-1 flex flex-col min-h-[300px] bg-slate-950 border border-purple-500/30 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-purple-900/30 px-3 py-2 border-b border-purple-500/20 flex-none">
              <span className="text-purple-300 text-[10px] font-mono tracking-widest">
                🤖 GIDEON COACH FEEDBACK
              </span>
              {coachAnalysis && (
                <button
                  type="button"
                  onClick={() => speakAsCoach(coachAnalysis, coach)}
                  className="text-[10px] bg-purple-600/50 hover:bg-purple-500 text-white px-2 py-0.5 rounded"
                >
                  🔊
                </button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {coachAnalysis || (
                <div className="h-full flex items-center justify-center text-slate-700 text-center">
                  <div>
                    <div className="text-4xl mb-3">🤖</div>
                    <p className="text-sm">Coach analysis appears here</p>
                    <p className="text-[10px] mt-1 text-slate-600">Click &quot;Get Coach Analysis&quot; to begin</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-900/50 px-3 py-1.5 border-t border-slate-800 flex-none text-[10px] text-slate-600">
              {coach} • DeepSeek Master Data Coach • RTX 4080
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
